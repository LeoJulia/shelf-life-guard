import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Исполняем реальную функцию getRoutineStatus, а не копию. Единственный
// runtime-импорт — local-date; тип-онли импорты стираются при транспиляции.
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
const { getRoutineStatus } = loadModule(
  "../src/entities/routine/model/routine-status.ts",
  { "@/shared/lib/local-date": localDate },
);

// Фиксированная дата: поля рутин — календарные строки YYYY-MM-DD, «сегодня»
// передаётся явно, поэтому утверждения не зависят от часового пояса.
const today = "2026-11-09";
const routine = (fields) => ({ start_date: "2026-10-20", ...fields });

test("getRoutineStatus: end_date = today — рутина завершена (день окончания включён)", () => {
  assert.equal(
    getRoutineStatus(routine({ end_date: today }), today),
    "finished",
  );
});

test("getRoutineStatus: end_date = завтра — ещё активна (граница не съезжает на день раньше)", () => {
  assert.equal(
    getRoutineStatus(routine({ end_date: "2026-11-10" }), today),
    "active",
  );
});

test("getRoutineStatus: end_date = вчера — завершена", () => {
  assert.equal(
    getRoutineStatus(routine({ end_date: "2026-11-08" }), today),
    "finished",
  );
});