import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Execute the real proxy.ts with mocked Next/Supabase boundaries. The mock
// getClaims invokes cookies.setAll to simulate a token refresh, exactly the
// situation where a redirect must carry the refreshed/cleared cookies.
function loadModule(relativePath, imports = {}) {
  const filename = new URL(relativePath, import.meta.url);
  const { outputText, diagnostics } = ts.transpileModule(
    readFileSync(filename, "utf8"),
    {
      fileName: filename.pathname,
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  assert.equal(diagnostics.length, 0, "TypeScript transpilation diagnostics");
  const module = { exports: {} };
  const context = vm.createContext({
    module,
    exports: module.exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
    URL,
    console,
  });
  new vm.Script(outputText, { filename: filename.pathname }).runInContext(
    context,
  );
  return module.exports;
}

class CookieJar {
  constructor() {
    this.map = new Map();
  }
  set(nameOrCookie, value, options) {
    if (typeof nameOrCookie === "object") {
      this.map.set(nameOrCookie.name, { ...nameOrCookie });
    } else {
      this.map.set(nameOrCookie, { name: nameOrCookie, value, ...options });
    }
    return this;
  }
  getAll() {
    return [...this.map.values()];
  }
  get(name) {
    return this.map.get(name);
  }
}

const NextResponse = {
  next: () => ({ kind: "next", cookies: new CookieJar() }),
  redirect: (url) => ({
    kind: "redirect",
    location: url.toString(),
    cookies: new CookieJar(),
  }),
};

const state = { claims: null, refreshCookies: null };

const { updateSession } = loadModule("../src/shared/server/proxy.ts", {
  "@supabase/ssr": {
    createServerClient: (_url, _key, { cookies }) => ({
      auth: {
        getClaims: async () => {
          if (state.refreshCookies) cookies.setAll(state.refreshCookies);
          return { data: { claims: state.claims } };
        },
      },
    }),
  },
  "next/server": { NextResponse },
  "@/shared/utils": { hasEnvVars: true },
  "@/shared/lib/supabase-env": {
    getSupabaseUrl: () => "https://example.supabase.co",
    getSupabasePublishableKey: () => "publishable-key",
  },
  "@/shared/model": {},
});

const makeRequest = (pathname) => ({
  cookies: { getAll: () => [], set: () => {} },
  nextUrl: {
    pathname,
    clone() {
      return {
        pathname: this.pathname,
        toString() {
          return "http://localhost" + this.pathname;
        },
      };
    },
  },
});

const refreshed = [
  { name: "sb-token", value: "refreshed", options: { path: "/" } },
];
const cleared = [
  { name: "sb-token", value: "", options: { path: "/", maxAge: 0 } },
];

test("root redirect for a signed-in user carries refreshed cookies", async () => {
  state.claims = { sub: "user-1" };
  state.refreshCookies = refreshed;
  const response = await updateSession(makeRequest("/"));
  assert.equal(response.kind, "redirect");
  assert.equal(response.location, "http://localhost/dashboard");
  assert.equal(response.cookies.get("sb-token")?.value, "refreshed");
  assert.equal(response.cookies.get("sb-token")?.path, "/");
});

test("login redirect for a signed-out user carries cleared cookies", async () => {
  state.claims = null;
  state.refreshCookies = cleared;
  const response = await updateSession(makeRequest("/dashboard"));
  assert.equal(response.kind, "redirect");
  assert.equal(response.location, "http://localhost/auth/login");
  assert.equal(response.cookies.get("sb-token")?.value, "");
  assert.equal(response.cookies.get("sb-token")?.maxAge, 0);
});

test("root redirect for a signed-out user goes to login with cookies", async () => {
  state.claims = null;
  state.refreshCookies = cleared;
  const response = await updateSession(makeRequest("/"));
  assert.equal(response.kind, "redirect");
  assert.equal(response.location, "http://localhost/auth/login");
  assert.equal(response.cookies.get("sb-token")?.value, "");
});

test("non-redirect response still carries refreshed cookies", async () => {
  state.claims = { sub: "user-1" };
  state.refreshCookies = refreshed;
  const response = await updateSession(makeRequest("/dashboard"));
  assert.equal(response.kind, "next");
  assert.equal(response.cookies.get("sb-token")?.value, "refreshed");
});

test("redirect without a refresh has no auth cookie and still redirects", async () => {
  state.claims = null;
  state.refreshCookies = null;
  const response = await updateSession(makeRequest("/"));
  assert.equal(response.kind, "redirect");
  assert.equal(response.location, "http://localhost/auth/login");
  assert.equal(response.cookies.get("sb-token"), undefined);
});

test("auth pages are not redirected for signed-out users", async () => {
  state.claims = null;
  state.refreshCookies = null;
  const response = await updateSession(makeRequest("/auth/login"));
  assert.equal(response.kind, "next");
});
