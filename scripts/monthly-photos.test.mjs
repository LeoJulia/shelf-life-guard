import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Execute the actual TypeScript fetcher against a mocked Supabase builder, not a
// copy. Type-only imports are erased; the runtime imports are mocked below.
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

// Mutable so each test installs its own rows/count before calling the fetcher.
let current;

const { getMonthlyPhotos } = loadModule(
  "../src/pages/profile/api/get-monthly-photos.ts",
  {
    "@/shared/server": { createServerClient: async () => current.client },
    "@/shared/lib/signed-image-url": {
      fetchSignedImageUrl: async (_client, _bucket, path) => `signed:${path}`,
    },
    "@/shared/lib/buckets": { ROUTINE_PHOTOS_BUCKET: "routine-photos" },
    "../lib/format-month-label": { formatMonthLabel: (key) => key },
  },
);

// Round-trip through JSON so vm-realm arrays/objects compare equal to Node ones
// under deepStrictEqual (cross-realm prototypes otherwise differ).
const run = async (params, opts) =>
  JSON.parse(JSON.stringify(await getMonthlyPhotos(params, opts)));

// The builder is a thenable: awaiting it directly resolves the head/count query
// (no rows); .range() returns a separate thenable resolving the page rows. This
// mirrors supabase-js and lets us assert the count-first clamp never ranges on
// the head query (which would make PostgREST answer 416).
function makeSupabase(rows, { count = rows.length, failCount, failData } = {}) {
  const selectCalls = [];
  const orderCalls = [];
  const rangeCalls = [];
  const client = {
    from(table) {
      assert.equal(table, "routines");
      const builder = {
        select(cols, opts) {
          selectCalls.push({ cols, opts: { ...opts } });
          return builder;
        },
        order(col, opts) {
          orderCalls.push({ col, opts: { ...opts } });
          return builder;
        },
        range(from, to) {
          rangeCalls.push({ from, to });
          return {
            then(resolve) {
              resolve({
                data: failData ? null : rows.slice(from, to + 1),
                error: failData ? { message: "data boom" } : null,
              });
            },
          };
        },
        then(resolve) {
          resolve({
            data: null,
            error: failCount ? { message: "count boom" } : null,
            count: failCount ? null : count,
          });
        },
      };
      return builder;
    },
  };
  return { client, selectCalls, orderCalls, rangeCalls };
}

const photo = (series, slot, path = `${series}-${slot}.jpg`) => ({
  id: `${series}-${slot}`,
  series,
  slot,
  image_path: path,
});

const routine = (id, startDate, photos, endDate = null) => ({
  id,
  name: `routine-${id}`,
  start_date: startDate,
  end_date: endDate,
  routine_photos: photos,
});

// 14 routines already ordered start_date desc: 8 in Nov, then 6 in Oct.
const fourteen = [
  ...Array.from({ length: 8 }, (_, i) =>
    routine(`nov-${i}`, `2026-11-${String(8 - i).padStart(2, "0")}`, [
      photo("start", "front"),
    ]),
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    routine(`oct-${i}`, `2026-10-${String(6 - i).padStart(2, "0")}`, [
      photo("start", "front"),
    ]),
  ),
];

test("page 1: exact total, month groups desc, head count then a single range", async () => {
  current = makeSupabase(fourteen);
  const result = await run({ page: "1" }, { pageSize: 12 });

  assert.equal(result.total, 14);
  assert.equal(result.pageCount, 2);
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 12);
  assert.deepEqual(
    result.groups.map((g) => [g.monthKey, g.routines.length]),
    [
      ["2026-11", 8],
      ["2026-10", 4],
    ],
  );
  // head query first (count only, no range), then exactly one data range.
  assert.deepEqual(current.selectCalls[0].opts, { count: "exact", head: true });
  assert.deepEqual(current.selectCalls[1].opts, {
    count: "exact",
    head: false,
  });
  assert.deepEqual(current.rangeCalls, [{ from: 0, to: 11 }]);
  assert.deepEqual(
    current.orderCalls.map((o) => o.col),
    ["start_date", "created_at", "start_date", "created_at"],
  );
});

test("page 2: remaining routines, correct range", async () => {
  current = makeSupabase(fourteen);
  const result = await run({ page: "2" }, { pageSize: 12 });

  assert.equal(result.page, 2);
  assert.deepEqual(current.rangeCalls, [{ from: 12, to: 23 }]);
  assert.deepEqual(
    result.groups.map((g) => [g.monthKey, g.routines.length]),
    [["2026-10", 2]],
  );
  assert.deepEqual(
    result.groups[0].routines.map((r) => r.routineId),
    ["oct-4", "oct-5"],
  );
});

test("out-of-range page clamps to the last page before ranging (no 416)", async () => {
  current = makeSupabase(fourteen);
  const result = await run({ page: "99" }, { pageSize: 12 });

  assert.equal(result.page, 2);
  assert.equal(result.pageCount, 2);
  // Only the data query ranges; the head count never does.
  assert.deepEqual(current.rangeCalls, [{ from: 12, to: 23 }]);
  assert.equal(result.groups[0].routines.length, 2);
});

test("empty gallery: total 0, no data range query, no groups", async () => {
  current = makeSupabase([], { count: 0 });
  const result = await run({ page: "3" }, { pageSize: 12 });

  assert.equal(result.total, 0);
  assert.equal(result.pageCount, 0);
  assert.equal(result.page, 1);
  assert.deepEqual(result.groups, []);
  assert.deepEqual(current.rangeCalls, []);
});

test("invalid page falls back to the first page", async () => {
  current = makeSupabase(fourteen);
  const result = await run({ page: "abc" }, { pageSize: 12 });

  assert.equal(result.page, 1);
  assert.deepEqual(current.rangeCalls, [{ from: 0, to: 11 }]);
});

test("thumb prefers end/front, then start/front, then the first photo", async () => {
  const rows = [
    routine("r1", "2026-11-03", [
      photo("start", "front", "s-front.jpg"),
      photo("end", "side", "e-side.jpg"),
      photo("end", "front", "e-front.jpg"),
    ]),
    routine("r2", "2026-11-02", [
      photo("start", "side", "s-side.jpg"),
      photo("start", "front", "s-front.jpg"),
    ]),
    routine("r3", "2026-11-01", [
      photo("start", "side", "first.jpg"),
      photo("end", "side", "second.jpg"),
    ]),
  ];
  current = makeSupabase(rows);
  const result = await run({}, { pageSize: 12 });

  const byId = Object.fromEntries(
    result.groups[0].routines.map((r) => [r.routineId, r]),
  );
  assert.equal(byId.r1.thumbUrl, "signed:e-front.jpg");
  assert.equal(byId.r2.thumbUrl, "signed:s-front.jpg");
  assert.equal(byId.r3.thumbUrl, "signed:first.jpg");
  assert.equal(byId.r1.photoCount, 3);
  assert.equal(byId.r3.photoCount, 2);
});

test("routines within a month are sorted by start date descending", async () => {
  const rows = [
    routine("a", "2026-11-01", [photo("start", "front")]),
    routine("b", "2026-11-03", [photo("start", "front")]),
    routine("c", "2026-11-02", [photo("start", "front")]),
  ];
  current = makeSupabase(rows);
  const result = await run({}, { pageSize: 12 });

  assert.deepEqual(
    result.groups[0].routines.map((r) => r.routineId),
    ["b", "c", "a"],
  );
});

test("count query error throws", async () => {
  current = makeSupabase(fourteen, { failCount: true });
  await assert.rejects(
    () => getMonthlyPhotos({}, { pageSize: 12 }),
    /Error on get monthly photos/,
  );
  assert.deepEqual(current.rangeCalls, []);
});

test("data query error throws", async () => {
  current = makeSupabase(fourteen, { failData: true });
  await assert.rejects(
    () => getMonthlyPhotos({}, { pageSize: 12 }),
    /Error on get monthly photos/,
  );
});
