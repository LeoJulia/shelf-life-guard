import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Execute the real scanner.ts with mocked browser camera APIs. getUserMedia and
// decodeFromVideoDevice resolve only when the test releases them, reproducing a
// permission prompt that is granted after the scanner was already closed.
function loadModule(relativePath, imports = {}, globals = {}) {
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
  const mod = { exports: {} };
  const context = vm.createContext({
    module: mod,
    exports: mod.exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
    Promise,
    Map,
    Set,
    setTimeout,
    clearTimeout,
    console,
    ...globals,
  });
  new vm.Script(outputText, { filename: filename.pathname }).runInContext(
    context,
  );
  return mod.exports;
}

const BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const makeStream = () => {
  const tracks = [
    {
      stopped: false,
      stop() {
        this.stopped = true;
      },
    },
  ];
  return { stream: { getTracks: () => tracks }, tracks };
};

// Native path: window.BarcodeDetector present, getUserMedia controllable.
function nativeEnv({ detect = async () => [] } = {}) {
  let releaseGetUserMedia;
  const gumPromise = new Promise((resolve) => {
    releaseGetUserMedia = resolve;
  });
  class MockDetector {
    static async getSupportedFormats() {
      return BARCODE_FORMATS;
    }
    async detect(source) {
      return detect(source);
    }
  }
  const globals = {
    window: { BarcodeDetector: MockDetector },
    navigator: { mediaDevices: { getUserMedia: () => gumPromise } },
  };
  const mod = loadModule(
    "../src/pages/product/lib/scanner.ts",
    { "../config/barcode": { BARCODE_FORMATS } },
    globals,
  );
  return { ...mod, releaseGetUserMedia };
}

test("native: closing during pending permission stops the late stream", async () => {
  const { createScanner, releaseGetUserMedia } = nativeEnv();
  const scanner = await createScanner();
  const { stream, tracks } = makeStream();
  const video = { srcObject: null, play: async () => {} };
  let codeCalled = false;

  const starting = scanner.startLive(video, () => {
    codeCalled = true;
  });
  // Permission still pending — user closes the scanner.
  scanner.stop();
  releaseGetUserMedia(stream);
  await starting;

  assert.equal(tracks[0].stopped, true, "late tracks must be stopped");
  assert.equal(video.srcObject, null, "late stream must not attach to video");
  assert.equal(codeCalled, false, "no detection loop after close");
});

test("native: normal start attaches stream and stop releases tracks", async () => {
  const { createScanner, releaseGetUserMedia } = nativeEnv({
    detect: async () => [{ rawValue: "4600000000017" }],
  });
  const scanner = await createScanner();
  const { stream, tracks } = makeStream();
  const video = { srcObject: null, play: async () => {} };
  const codes = [];

  const starting = scanner.startLive(video, (r) => codes.push(r.code));
  releaseGetUserMedia(stream);
  await starting;
  await flush();

  assert.equal(video.srcObject, stream);
  assert.deepEqual(codes, ["4600000000017"]);
  assert.equal(tracks[0].stopped, false);
  scanner.stop();
  assert.equal(tracks[0].stopped, true, "stop releases the camera");
});

test("native: play() failure releases the acquired stream", async () => {
  const { createScanner, releaseGetUserMedia } = nativeEnv();
  const scanner = await createScanner();
  const { stream, tracks } = makeStream();
  const video = {
    srcObject: null,
    play: async () => {
      throw new Error("autoplay blocked");
    },
  };

  const starting = scanner.startLive(video, () => {});
  releaseGetUserMedia(stream);
  await assert.rejects(starting, /autoplay blocked/);
  assert.equal(tracks[0].stopped, true, "stream released on play failure");
});

// ZXing path: no BarcodeDetector, decodeFromVideoDevice controllable.
function zxingEnv() {
  let releaseDecode;
  const decodePromise = new Promise((resolve) => {
    releaseDecode = resolve;
  });
  class MockReader {
    decodeFromVideoDevice() {
      return decodePromise;
    }
  }
  const imports = {
    "../config/barcode": { BARCODE_FORMATS },
    "@zxing/browser": { BrowserMultiFormatReader: MockReader },
    "@zxing/library": {
      BarcodeFormat: { EAN_13: 1, EAN_8: 2, UPC_A: 3, UPC_E: 4 },
      DecodeHintType: { POSSIBLE_FORMATS: 1, TRY_HARDER: 2 },
    },
  };
  const globals = { window: {}, navigator: { mediaDevices: {} } };
  const mod = loadModule(
    "../src/pages/product/lib/scanner.ts",
    imports,
    globals,
  );
  return { ...mod, releaseDecode };
}

test("zxing: closing during pending decode stops the late controls", async () => {
  const { createScanner, releaseDecode } = zxingEnv();
  const scanner = await createScanner();
  const video = { srcObject: null, play: async () => {} };
  let codeCalled = false;

  const starting = scanner.startLive(video, () => {
    codeCalled = true;
  });
  await flush(); // let getReader() resolve and decodeFromVideoDevice start
  scanner.stop(); // closed while decode (camera acquisition) is pending
  const controls = {
    stopped: false,
    stop() {
      this.stopped = true;
    },
  };
  releaseDecode(controls);
  await starting;

  assert.equal(controls.stopped, true, "late controls must be stopped");
  assert.equal(codeCalled, false);
});

test("zxing: normal start keeps controls and stop releases them", async () => {
  const { createScanner, releaseDecode } = zxingEnv();
  const scanner = await createScanner();
  const video = { srcObject: null, play: async () => {} };

  const starting = scanner.startLive(video, () => {});
  await flush();
  const controls = {
    stopped: false,
    stop() {
      this.stopped = true;
    },
  };
  releaseDecode(controls);
  await starting;

  assert.equal(controls.stopped, false);
  scanner.stop();
  assert.equal(controls.stopped, true, "stop releases the camera");
});
