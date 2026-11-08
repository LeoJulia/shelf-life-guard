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
let signCalls = [];

const { getProductList } = loadModule(
  "../src/widgets/product-list/api/get-product-list.ts",
  {
    "@/shared/server": { createServerClient: async () => current.client },
    "@/shared/model": {},
    "@/shared/lib/signed-image-url": {
      fetchSignedImageUrl: async (_client, _bucket, path) => {
        signCalls.push(path);
        return `signed:${path}`;
      },
    },
    "@/shared/lib/buckets": { PRODUCT_IMAGES_BUCKET: "product-images" },
  },
);

// Round-trip through JSON so vm-realm arrays/objects compare equal to Node ones
// under deepStrictEqual (cross-realm prototypes otherwise differ).
const run = async (params, opts) =>
  JSON.parse(JSON.stringify(await getProductList(params, opts)));

// The builder is a thenable: awaiting it directly resolves the head/count query
// (no rows); .range() returns a separate thenable resolving that batch. This
// mirrors supabase-js. A range starting at/after the row count models PostgREST
// answering 416 (beyond="error") or an empty 200 (beyond="empty"); maxRows models
// the Data API cap clipping a batch below the requested size.
function makeSupabase(
  rows,
  {
    count = rows.length,
    maxRows = Infinity,
    failCount,
    failData,
    beyond = "error",
  } = {},
) {
  const selectCalls = [];
  const rangeCalls = [];
  const client = {
    from(table) {
      assert.equal(table, "products");
      const builder = {
        select(cols, opts) {
          selectCalls.push({ cols, opts: { ...opts } });
          return builder;
        },
        in() {
          return builder;
        },
        gte() {
          return builder;
        },
        lte() {
          return builder;
        },
        or() {
          return builder;
        },
        order() {
          return builder;
        },
        range(from, to) {
          rangeCalls.push({ from, to });
          return {
            then(resolve) {
              if (failData) {
                resolve({ data: null, error: { message: "data boom" } });
                return;
              }
              if (from >= rows.length) {
                resolve(
                  beyond === "error"
                    ? {
                        data: null,
                        error: { message: "416 Range Not Satisfiable" },
                      }
                    : { data: [], error: null },
                );
                return;
              }
              const end = Math.min(to + 1, from + maxRows, rows.length);
              resolve({ data: rows.slice(from, end), error: null });
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
  return { client, selectCalls, rangeCalls };
}

const products = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `p-${i}`,
    name: `Product ${i}`,
    image_path: `img-${i}.jpg`,
  }));

// Analytics calls getProductList without pageSize (fetch-all) and withImages
// false. The whole point of D3: never silently truncate at the Data API limit.
const fetchAll = (params = {}) => run(params, { withImages: false });

test("accumulates past the 1000 limit: head count, then batches, no probe beyond total", async () => {
  current = makeSupabase(products(2500));
  const result = await fetchAll();

  assert.equal(result.total, 2500);
  assert.equal(result.products.length, 2500);
  assert.equal(result.page, 1);
  assert.equal(result.pageCount, 1);
  assert.equal(result.pageSize, 2500);
  // head count first (no range), then three data batches covering 0..2499.
  assert.deepEqual(current.selectCalls[0].opts, { count: "exact", head: true });
  assert.deepEqual(current.selectCalls[1].opts, {
    count: "exact",
    head: false,
  });
  assert.deepEqual(current.rangeCalls, [
    { from: 0, to: 999 },
    { from: 1000, to: 1999 },
    { from: 2000, to: 2999 },
  ]);
  // Every range starts below total, so PostgREST never answers 416.
  assert.ok(current.rangeCalls.every((r) => r.from < result.total));
  assert.equal(result.products[2499].id, "p-2499");
});

test("exactly 1000 rows: one batch, no out-of-range probe (no 416)", async () => {
  current = makeSupabase(products(1000));
  const result = await fetchAll();

  assert.equal(result.total, 1000);
  assert.equal(result.products.length, 1000);
  assert.deepEqual(current.rangeCalls, [{ from: 0, to: 999 }]);
});

test("exactly 2000 rows: two full batches, no trailing probe", async () => {
  current = makeSupabase(products(2000));
  const result = await fetchAll();

  assert.equal(result.products.length, 2000);
  assert.deepEqual(current.rangeCalls, [
    { from: 0, to: 999 },
    { from: 1000, to: 1999 },
  ]);
});

test("150 rows (production baseline): single batch returns everything", async () => {
  current = makeSupabase(products(150));
  const result = await fetchAll();

  assert.equal(result.total, 150);
  assert.equal(result.products.length, 150);
  assert.deepEqual(current.rangeCalls, [{ from: 0, to: 999 }]);
});

test("empty: total 0, no data range query", async () => {
  current = makeSupabase([], { count: 0 });
  const result = await fetchAll();

  assert.equal(result.total, 0);
  assert.equal(result.pageCount, 0);
  assert.equal(result.page, 1);
  assert.deepEqual(result.products, []);
  assert.deepEqual(current.rangeCalls, []);
});

test("max_rows below batch size: offset advances by rows returned, nothing skipped", async () => {
  // Data API caps each response at 500 even though we request 1000.
  current = makeSupabase(products(1200), { maxRows: 500 });
  const result = await fetchAll();

  assert.equal(result.products.length, 1200);
  assert.deepEqual(current.rangeCalls, [
    { from: 0, to: 999 },
    { from: 500, to: 1499 },
    { from: 1000, to: 1999 },
  ]);
  // Contiguous ids prove no row was skipped between clipped batches.
  assert.deepEqual(
    result.products.map((p) => p.id),
    products(1200).map((p) => p.id),
  );
});

test("deletion race: an empty batch stops the loop instead of spinning", async () => {
  // count said 1200, but rows shrank to 1000 before the data queries ran.
  current = makeSupabase(products(1000), { count: 1200, beyond: "empty" });
  const result = await fetchAll();

  assert.equal(result.products.length, 1000);
  assert.deepEqual(current.rangeCalls, [
    { from: 0, to: 999 },
    { from: 1000, to: 1999 },
  ]);
});

test("count query error throws before any range", async () => {
  current = makeSupabase(products(150), { failCount: true });
  await assert.rejects(() => fetchAll(), /Error on get product list/);
  assert.deepEqual(current.rangeCalls, []);
});

test("data batch error throws", async () => {
  current = makeSupabase(products(150), { failData: true });
  await assert.rejects(() => fetchAll(), /Error on get product list/);
});

test("withImages false signs nothing; withImages true signs each row", async () => {
  signCalls = [];
  current = makeSupabase(products(3));
  const noImages = await fetchAll();
  assert.deepEqual(signCalls, []);
  assert.ok(noImages.products.every((p) => p.imageUrl === null));

  signCalls = [];
  current = makeSupabase(products(3));
  const withImages = await run({}, { withImages: true });
  assert.deepEqual(signCalls, ["img-0.jpg", "img-1.jpg", "img-2.jpg"]);
  assert.equal(withImages.products[0].imageUrl, "signed:img-0.jpg");
});
