import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Execute the actual TypeScript pure functions, not a copy. Type-only imports
// are erased by transpilation; the only runtime import is the local-date helper.
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
    Date,
    Math,
    Number,
    String,
  });
  new vm.Script(outputText, { filename: filename.pathname }).runInContext(
    context,
  );
  return module.exports;
}

const localDate = loadModule("../src/shared/lib/local-date.ts");
const { getExpiryProgress, isExpiringSoon, EXPIRING_SOON_DAYS } = loadModule(
  "../src/entities/product/lib/expiry.ts",
  { "@/shared/lib/local-date": localDate },
);
const { isSpentInYear } = loadModule("../src/entities/product/lib/spending.ts");

// Fixed local dates keep assertions timezone-independent: product fields are
// YYYY-MM-DD calendar strings and `now` is built from local date parts.
const now = new Date(2026, 2, 1, 15, 30, 0); // 1 Mar 2026, 15:30 local
const product = (fields) => ({
  expiry_date: null,
  opened_at: null,
  finished_at: null,
  created_at: "2026-01-01",
  year: 2026,
  actual_price: null,
  ...fields,
});

test("EXPIRING_SOON_DAYS aligns with the product-list filter (30)", () => {
  assert.equal(EXPIRING_SOON_DAYS, 30);
});

test("getExpiryProgress: product added after expiry shows 0%, not 100%", () => {
  // created_at after expiry_date => degenerate (negative) period.
  assert.equal(
    getExpiryProgress(
      product({ expiry_date: "2026-01-01", created_at: "2026-02-01" }),
      now,
    ),
    0,
  );
});

test("getExpiryProgress: expired product shows 0%", () => {
  assert.equal(
    getExpiryProgress(
      product({ expiry_date: "2026-02-01", created_at: "2025-11-01" }),
      now,
    ),
    0,
  );
});

test("getExpiryProgress: expiry today shows 0% (calendar day, not time)", () => {
  assert.equal(
    getExpiryProgress(product({ expiry_date: "2026-03-01" }), now),
    0,
  );
});

test("getExpiryProgress: fresh full period shows 100%", () => {
  assert.equal(
    getExpiryProgress(
      product({ expiry_date: "2026-06-01", created_at: "2026-03-01" }),
      now,
    ),
    100,
  );
});

test("getExpiryProgress: halfway through the period shows 50%", () => {
  // 1 Jan -> 31 Jan = 30 days total; at 16 Jan, 15 days remain.
  assert.equal(
    getExpiryProgress(
      product({ expiry_date: "2026-01-31", created_at: "2026-01-01" }),
      new Date(2026, 0, 16, 12, 0, 0),
    ),
    50,
  );
});

test("getExpiryProgress: opened_at starts the period, not created_at", () => {
  // Opened 1 Mar, expiry 1 Apr => full period remaining at 1 Mar.
  assert.equal(
    getExpiryProgress(
      product({
        expiry_date: "2026-04-01",
        opened_at: "2026-03-01",
        created_at: "2026-01-01",
      }),
      now,
    ),
    100,
  );
});

test("getExpiryProgress: created_at timestamp uses its local calendar day", () => {
  assert.equal(
    getExpiryProgress(
      product({
        expiry_date: "2026-03-01",
        created_at: "2026-01-01T00:00:00",
      }),
      new Date(2026, 0, 1, 12, 0, 0),
    ),
    100,
  );
});

test("getExpiryProgress: no expiry_date shows 0%", () => {
  assert.equal(getExpiryProgress(product({ expiry_date: null }), now), 0);
});

test("isExpiringSoon: expiry today counts even in the afternoon", () => {
  assert.equal(
    isExpiringSoon(product({ expiry_date: "2026-03-01" }), now),
    true,
  );
});

test("isExpiringSoon: expiry on the 30-day boundary counts", () => {
  assert.equal(
    isExpiringSoon(product({ expiry_date: "2026-03-31" }), now),
    true,
  );
});

test("isExpiringSoon: expiry beyond the window does not count", () => {
  assert.equal(
    isExpiringSoon(product({ expiry_date: "2026-04-01" }), now),
    false,
  );
});

test("isExpiringSoon: already expired does not count", () => {
  assert.equal(
    isExpiringSoon(product({ expiry_date: "2026-02-28" }), now),
    false,
  );
});

test("isExpiringSoon: finished product does not count", () => {
  assert.equal(
    isExpiringSoon(
      product({ expiry_date: "2026-03-10", finished_at: "2026-02-01" }),
      now,
    ),
    false,
  );
});

test("isExpiringSoon: no expiry_date does not count", () => {
  assert.equal(isExpiringSoon(product({ expiry_date: null }), now), false);
});

test("isExpiringSoon: window crosses the year boundary", () => {
  const newYearEve = new Date(2026, 11, 31, 12, 0, 0);
  assert.equal(
    isExpiringSoon(product({ expiry_date: "2027-01-15" }), newYearEve),
    true,
  );
});

test("isExpiringSoon: custom window (90 days) matches the 'expiring' filter", () => {
  const p = product({ expiry_date: "2026-05-01" });
  assert.equal(isExpiringSoon(p, now, 90), true);
  assert.equal(isExpiringSoon(p, now), false);
});

test("isSpentInYear: counts by accounting year, regardless of opening", () => {
  // New unopened purchase this year counts.
  assert.equal(
    isSpentInYear(product({ year: 2026, opened_at: null }), 2026),
    true,
  );
  // Old purchase opened this year does NOT count toward this year.
  assert.equal(
    isSpentInYear(product({ year: 2020, opened_at: "2026-03-01" }), 2026),
    false,
  );
});

test("isSpentInYear: year change boundary", () => {
  assert.equal(isSpentInYear(product({ year: 2026 }), 2026), true);
  assert.equal(isSpentInYear(product({ year: 2026 }), 2027), false);
  assert.equal(isSpentInYear(product({ year: 2025 }), 2026), false);
});

test("year spending aggregation sums only this-year purchases", () => {
  const products = [
    product({ year: 2026, actual_price: 100, opened_at: null }), // unopened, counts
    product({ year: 2026, actual_price: 250, opened_at: "2026-02-01" }), // counts
    product({ year: 2025, actual_price: 999, opened_at: "2026-03-01" }), // old, opened now: excluded
    product({ year: 2026, actual_price: null }), // null price contributes 0
  ];
  const year = 2026;
  const spentYear = products.reduce(
    (sum, p) => (isSpentInYear(p, year) ? sum + (p.actual_price ?? 0) : sum),
    0,
  );
  assert.equal(spentYear, 350);
});
