import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Проверяем реальный use-routine-items-order.ts: после сбоя сохранения должен
// назначаться повтор, а не только флаг «несохранено». React и use-debounce
// подменены мини-рантаймом, время — управляемые таймеры, server action — мок с
// переключаемым поведением (ошибка/исключение/успех).

function transpile(relativePath) {
  const filename = new URL(relativePath, import.meta.url);
  const { outputText, diagnostics } = ts.transpileModule(
    readFileSync(filename, "utf8"),
    {
      fileName: filename.pathname,
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  );
  assert.equal(diagnostics.length, 0, "TypeScript transpilation diagnostics");
  return { code: outputText, pathname: filename.pathname };
}

function runModule(code, pathname, imports, globals) {
  const mod = { exports: {} };
  const context = vm.createContext({
    module: mod,
    exports: mod.exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
    Object,
    Promise,
    Map,
    Set,
    console,
    ...globals,
  });
  new vm.Script(code, { filename: pathname }).runInContext(context);
  return mod.exports;
}

function createClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  const setTimeout = (fn, delay = 0) => {
    const id = nextId++;
    timers.set(id, { at: now + delay, fn });
    return id;
  };
  const clearTimeout = (id) => {
    timers.delete(id);
  };
  const advance = (ms) => {
    const target = now + ms;
    for (;;) {
      let pick = null;
      for (const [id, t] of timers) {
        if (t.at <= target && (pick === null || t.at < pick.t.at)) {
          pick = { id, t };
        }
      }
      if (!pick) break;
      now = pick.t.at;
      timers.delete(pick.id);
      pick.t.fn();
    }
    now = target;
  };
  return { setTimeout, clearTimeout, advance, pending: () => timers.size };
}

function createHarness(saveBehavior) {
  const clock = createClock();
  const calls = [];
  let onSavedCount = 0;
  let behavior = saveBehavior;

  const setRoutineItemsOrder = (_routineId, ids) => {
    calls.push([...ids]);
    if (behavior === "throw") return Promise.reject(new Error("network"));
    return Promise.resolve(
      behavior === "fail" ? "Не удалось изменить порядок" : null,
    );
  };

  let slots = [];
  let cursor = 0;
  let result;
  let effectQueue = [];
  let unmounted = false;

  const depsEqual = (a, b) =>
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((v, i) => Object.is(v, b[i]));

  function render() {
    if (unmounted) return;
    cursor = 0;
    result = hookFn();
    const queue = effectQueue;
    effectQueue = [];
    for (const i of queue) {
      const slot = slots[i];
      if (slot.cleanup) slot.cleanup();
      slot.cleanup = slot.effect();
    }
  }

  const useState = (initial) => {
    const i = cursor++;
    if (!slots[i]) {
      slots[i] = {
        value: typeof initial === "function" ? initial() : initial,
      };
    }
    const slot = slots[i];
    const set = (next) => {
      const val = typeof next === "function" ? next(slot.value) : next;
      if (!Object.is(val, slot.value)) {
        slot.value = val;
        render();
      }
    };
    return [slot.value, set];
  };
  const useRef = (initial) => {
    const i = cursor++;
    if (!slots[i]) slots[i] = { current: initial };
    return slots[i];
  };
  const useMemo = (fn, deps) => {
    const i = cursor++;
    if (!slots[i] || !depsEqual(slots[i].deps, deps)) {
      slots[i] = { value: fn(), deps };
    }
    return slots[i].value;
  };
  const useEffect = (effect, deps) => {
    const i = cursor++;
    const prev = slots[i];
    const changed = !prev || !depsEqual(prev.deps, deps);
    slots[i] = { deps, effect, cleanup: prev ? prev.cleanup : undefined };
    if (changed) effectQueue.push(i);
  };
  const useDebouncedCallback = (fn, delay) => {
    const i = cursor++;
    if (!slots[i]) {
      let timerId = null;
      let latest = fn;
      const wrapper = () => {
        if (timerId !== null) clock.clearTimeout(timerId);
        timerId = clock.setTimeout(() => {
          timerId = null;
          latest();
        }, delay);
      };
      wrapper.flush = () => {
        if (timerId !== null) {
          clock.clearTimeout(timerId);
          timerId = null;
          latest();
        }
      };
      wrapper.cancel = () => {
        if (timerId !== null) {
          clock.clearTimeout(timerId);
          timerId = null;
        }
      };
      slots[i] = { wrapper, setFn: (f) => (latest = f) };
    }
    slots[i].setFn(fn);
    return slots[i].wrapper;
  };

  const config = runModule(
    transpile("../src/entities/routine/config/order-autosave.ts").code,
    "order-autosave.ts",
    {},
    {},
  );
  const { code, pathname } = transpile(
    "../src/pages/routine/lib/use-routine-items-order.ts",
  );
  const { useRoutineItemsOrder } = runModule(
    code,
    pathname,
    {
      react: { useState, useRef, useMemo, useEffect },
      "use-debounce": { useDebouncedCallback },
      "@/entities/routine": config,
      "../api/set-routine-items-order": { setRoutineItemsOrder },
    },
    {
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
      window: { addEventListener() {}, removeEventListener() {} },
    },
  );

  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
  let hookFn = () =>
    // тестовый рантайм сам вызывает хуки вне React-компонента
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRoutineItemsOrder({
      routineId: "r1",
      items,
      onSaved: () => {
        onSavedCount += 1;
      },
    });
  render();

  const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));
  const unmount = () => {
    unmounted = true;
    for (const slot of slots) {
      if (slot && slot.cleanup) {
        slot.cleanup();
        slot.cleanup = undefined;
      }
    }
  };

  return {
    config,
    get result() {
      return result;
    },
    calls,
    get onSavedCount() {
      return onSavedCount;
    },
    setBehavior: (b) => {
      behavior = b;
    },
    advance: clock.advance,
    pending: clock.pending,
    flushMicrotasks,
    unmount,
  };
}

test("сбой назначенияет автоповтор, который сохраняет порядок после восстановления сети", async () => {
  const h = createHarness("fail");
  const { ROUTINE_ORDER_SAVE_DELAY_MS, ROUTINE_ORDER_RETRY_BASE_DELAY_MS } =
    h.config;

  h.result.move(0, 1);
  h.advance(ROUTINE_ORDER_SAVE_DELAY_MS);
  await h.flushMicrotasks();

  assert.equal(h.calls.length, 1);
  assert.ok(h.result.error, "ошибка показана");
  assert.equal(h.result.isStale, true);
  assert.ok(h.pending() >= 1, "повтор назначен, а не брошен");

  h.setBehavior("ok");
  h.advance(ROUTINE_ORDER_RETRY_BASE_DELAY_MS);
  await h.flushMicrotasks();

  assert.equal(h.calls.length, 2, "повтор действительно выполнился");
  assert.equal(h.result.error, null);
  assert.equal(h.result.isStale, false);
  assert.equal(h.onSavedCount, 1);
  assert.equal(h.pending(), 0);
});

test("исключение сети тоже назначает повтор", async () => {
  const h = createHarness("throw");
  const { ROUTINE_ORDER_SAVE_DELAY_MS, ROUTINE_ORDER_RETRY_BASE_DELAY_MS } =
    h.config;

  h.result.move(0, 1);
  h.advance(ROUTINE_ORDER_SAVE_DELAY_MS);
  await h.flushMicrotasks();

  assert.equal(h.calls.length, 1);
  assert.equal(h.result.error, "Не удалось сохранить порядок");
  assert.ok(h.pending() >= 1);

  h.setBehavior("ok");
  h.advance(ROUTINE_ORDER_RETRY_BASE_DELAY_MS);
  await h.flushMicrotasks();

  assert.equal(h.calls.length, 2);
  assert.equal(h.result.error, null);
  assert.equal(h.onSavedCount, 1);
});

test("автоповторы ограничены, после исчерпания работает кнопка «Повторить»", async () => {
  const h = createHarness("fail");
  const {
    ROUTINE_ORDER_SAVE_DELAY_MS,
    ROUTINE_ORDER_RETRY_BASE_DELAY_MS,
    ROUTINE_ORDER_MAX_RETRIES,
  } = h.config;

  h.result.move(0, 1);
  h.advance(ROUTINE_ORDER_SAVE_DELAY_MS);
  await h.flushMicrotasks();

  for (let i = 0; i < ROUTINE_ORDER_MAX_RETRIES; i++) {
    assert.ok(h.pending() >= 1, `повтор ${i + 1} назначен`);
    h.advance(ROUTINE_ORDER_RETRY_BASE_DELAY_MS * 2 ** i);
    await h.flushMicrotasks();
  }

  assert.equal(h.calls.length, 1 + ROUTINE_ORDER_MAX_RETRIES);
  assert.ok(h.result.error, "ошибка всё ещё видна");
  assert.equal(h.pending(), 0, "бюджет исчерпан — таймеров нет");

  h.result.retry();
  await h.flushMicrotasks();

  assert.equal(h.calls.length, 2 + ROUTINE_ORDER_MAX_RETRIES);
});

test("новая перестановка отменяет ожидающий повтор и сбрасывает бюджет", async () => {
  const h = createHarness("fail");
  const { ROUTINE_ORDER_SAVE_DELAY_MS, ROUTINE_ORDER_RETRY_BASE_DELAY_MS } =
    h.config;

  h.result.move(0, 1);
  h.advance(ROUTINE_ORDER_SAVE_DELAY_MS);
  await h.flushMicrotasks();
  assert.equal(h.calls.length, 1);
  assert.ok(h.pending() >= 1);

  h.result.move(1, 1);
  h.advance(ROUTINE_ORDER_RETRY_BASE_DELAY_MS);
  await h.flushMicrotasks();
  assert.equal(h.calls.length, 1, "старый повтор отменён");

  h.advance(ROUTINE_ORDER_SAVE_DELAY_MS - ROUTINE_ORDER_RETRY_BASE_DELAY_MS);
  await h.flushMicrotasks();
  assert.equal(h.calls.length, 2, "новый порядок ушёл обычным дебаунсом");
});

test("размонтирование очищает таймер повтора", async () => {
  const h = createHarness("fail");
  const { ROUTINE_ORDER_SAVE_DELAY_MS, ROUTINE_ORDER_RETRY_BASE_DELAY_MS } =
    h.config;

  h.result.move(0, 1);
  h.advance(ROUTINE_ORDER_SAVE_DELAY_MS);
  await h.flushMicrotasks();
  assert.ok(h.pending() >= 1);

  h.unmount();
  assert.equal(h.pending(), 0, "таймер повтора не переживает страницу");

  h.advance(ROUTINE_ORDER_RETRY_BASE_DELAY_MS * 10);
  await h.flushMicrotasks();
  assert.equal(h.calls.length, 1, "после unmount повторов нет");
});

test("успешное сохранение с первого раза не назначает повторов", async () => {
  const h = createHarness("ok");
  const { ROUTINE_ORDER_SAVE_DELAY_MS } = h.config;

  h.result.move(0, 1);
  h.advance(ROUTINE_ORDER_SAVE_DELAY_MS);
  await h.flushMicrotasks();

  assert.equal(h.calls.length, 1);
  assert.equal(h.result.error, null);
  assert.equal(h.result.isStale, false);
  assert.equal(h.onSavedCount, 1);
  assert.equal(h.pending(), 0);
});
