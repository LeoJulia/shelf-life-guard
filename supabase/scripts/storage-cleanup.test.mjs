import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const USER_ID = "11000000-0000-4000-8000-000000000001";
const IMAGE_ID = "22000000-0000-4000-8000-000000000001";
const BUCKET = "product-images";
const imagePath = (index) => `${USER_ID}/test/${index}.webp`;

// Execute the actual TypeScript, not a copy of the implementation. Unknown
// imports and network access fail closed; Next/Supabase are never initialized.
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
  const errors = [];
  const context = vm.createContext({
    module,
    exports: module.exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
    console: { error: (...args) => errors.push(args) },
    Error, // Keep instanceof Error meaningful across the VM boundary.
    Blob,
    Uint8Array,
    atob,
    crypto: { randomUUID: () => IMAGE_ID },
    fetch() {
      assert.fail("Tests must not make network requests");
    },
  });
  new vm.Script(outputText, { filename: filename.pathname }).runInContext(context);
  return { ...module.exports, errors };
}

const worker = loadModule("../../src/shared/server/storage-cleanup.ts", {
  "server-only": {},
  "next/server": { after: () => assert.fail("Unexpected background scheduling") },
  "./admin": { createAdminClient: () => assert.fail("Unexpected real admin client") },
});
const uploadHelper = loadModule("../../src/shared/lib/upload-image.ts");

function makeJobs(count) {
  return Array.from({ length: count }, (_, index) => ({
    bucket: index % 2 ? "routine-photos" : BUCKET,
    path: imagePath(index),
  }));
}

// Only the RPC/Storage boundary is modeled. Lease timing and SQL authorization
// are tested in storage-lifecycle.test.sql, not duplicated in this mock.
function cleanupClient({ jobs = [], objects = [], removeFailure, handlers = {} } = {}) {
  const key = ({ bucket, path }) => `${bucket}:${path}`;
  const remaining = new Map(objects.map((job) => [key(job), job]));
  const queue = new Map(jobs.map((job) => [key(job), { ...job, state: "pending" }]));
  const events = [];
  const removals = [];
  const acknowledgements = [];
  const deletedUsers = [];
  const accountFinishes = [];
  let token = 0;
  const admin = {
    async rpc(name, args) {
      const parameters = structuredClone(args);
      events.push([name, parameters]);
      if (Object.hasOwn(handlers, name)) return handlers[name](parameters);
      switch (name) {
        case "claim_image_cleanup": {
          assert.equal(args.p_limit, 100);
          const claimed = [...queue.values()]
            .filter((job) => job.state === "pending")
            .slice(0, args.p_limit);
          for (const job of claimed) {
            job.state = "deleting";
            job.claim_token = `claim-${++token}`;
          }
          return {
            data: claimed.map(({ bucket, path, claim_token }) => ({ bucket, path, claim_token })),
            error: null,
          };
        }
        case "finish_image_cleanup": {
          const job = queue.get(key({ bucket: args.p_bucket, path: args.p_path }));
          assert.ok(job, "Acknowledgement refers to a queued job");
          assert.equal(job.state, "deleting");
          assert.equal(args.p_claim_token, job.claim_token);
          acknowledgements.push(parameters);
          if (Object.hasOwn(args, "p_error")) {
            job.state = "pending";
            job.last_error = args.p_error;
          } else {
            queue.delete(key(job));
          }
          return { error: null };
        }
        case "prepare_account_cleanup": {
          assert.equal(args.p_user_id, USER_ID);
          // Model the SQL's repeated LIMIT 100 discovery, not Storage.list's
          // default 1000-object page. Removed objects disappear between calls.
          const undiscovered = [...remaining.values()]
            .filter((job) => !queue.has(key(job)))
            .slice(0, 100);
          for (const job of undiscovered) queue.set(key(job), { ...job, state: "pending" });
          return { data: remaining.size === 0, error: null };
        }
        case "finish_account_cleanup":
          accountFinishes.push(parameters);
          return { error: null };
        default:
          assert.fail(`Unexpected RPC: ${name}`);
      }
    },
    storage: {
      from(bucket) {
        return {
          async remove(paths) {
            const batch = Array.from(paths);
            assert.ok(batch.length > 0 && batch.length <= 100, "Removal batch is bounded");
            events.push(["remove", { bucket, paths: batch }]);
            removals.push({ bucket, paths: batch });
            if (removeFailure) return removeFailure(bucket, batch);
            for (const path of batch) remaining.delete(key({ bucket, path }));
            return { data: [], error: null };
          },
        };
      },
    },
    auth: {
      admin: {
        async deleteUser(userId) {
          assert.equal(remaining.size, 0, "Auth deletion must follow object removal");
          events.push(["deleteUser", userId]);
          deletedUsers.push(userId);
          return { error: null };
        },
      },
    },
  };
  return { admin, queue, remaining, events, removals, acknowledgements, deletedUsers, accountFinishes };
}

test("cleanup claims at most 100 jobs and removes/acknowledges by bucket", async () => {
  const fixture = cleanupClient({ jobs: makeJobs(237) });
  for (const expected of [100, 100, 37, 0]) {
    assert.equal(await worker.processImageCleanup(fixture.admin), expected);
  }
  assert.equal(fixture.queue.size, 0);
  assert.equal(fixture.acknowledgements.length, 237);
  assert.equal(fixture.removals.reduce((count, batch) => count + batch.paths.length, 0), 237);
  for (const [index, acknowledgement] of fixture.events.entries()) {
    if (acknowledgement[0] !== "finish_image_cleanup") continue;
    const args = acknowledgement[1];
    assert.ok(fixture.events.slice(0, index).some(([name, data]) =>
      name === "remove" && data.bucket === args.p_bucket && data.paths.includes(args.p_path)),
    "Each acknowledgement follows its Storage removal");
    assert.equal(Object.hasOwn(args, "p_error"), false);
  }
});

for (const [label, removeFailure, message] of [
  ["returned error", () => ({ error: new Error("Storage unavailable") }), "Storage unavailable"],
  ["rejected promise", () => Promise.reject(new Error("Network unavailable")), "Network unavailable"],
  ["non-Error rejection", () => Promise.reject({ status: 503 }), "Storage removal failed"],
]) {
  test(`cleanup retains every job on ${label}`, async () => {
    const fixture = cleanupClient({ jobs: makeJobs(3), removeFailure });
    assert.equal(await worker.processImageCleanup(fixture.admin), 3);
    assert.equal(fixture.queue.size, 3);
    assert.equal(fixture.acknowledgements.length, 3);
    for (const job of fixture.queue.values()) {
      assert.equal(job.state, "pending");
      assert.equal(job.last_error, message);
    }
    assert.ok(fixture.acknowledgements.every((args) => args.p_error === message));
  });
}

test("a failed bucket does not prevent a successful bucket from completing", async () => {
  const fixture = cleanupClient({
    jobs: makeJobs(2),
    removeFailure: (bucket) => ({ error: bucket === BUCKET ? new Error("Retry product") : null }),
  });
  assert.equal(await worker.processImageCleanup(fixture.admin), 2);
  assert.equal(fixture.queue.size, 1);
  assert.equal([...fixture.queue.values()][0].bucket, BUCKET);
});

test("claim failure rejects before any Storage removal", async () => {
  const failure = new Error("Claim unavailable");
  const fixture = cleanupClient({
    handlers: { claim_image_cleanup: () => ({ data: null, error: failure }) },
  });
  await assert.rejects(worker.processImageCleanup(fixture.admin), (error) => error === failure);
  assert.equal(fixture.removals.length, 0);
  assert.equal(fixture.acknowledgements.length, 0);
});

for (const [label, prepare] of [
  ["returns an error", () => ({ data: null, error: new Error("Prepare failed") })],
  ["rejects", () => Promise.reject(new Error("Prepare rejected"))],
  ["returns false with no claimable jobs", () => ({ data: false, error: null })],
]) {
  test(`account deletion never deletes auth when prepare ${label}`, async () => {
    const fixture = cleanupClient({ handlers: { prepare_account_cleanup: prepare } });
    assert.equal(await worker.processAccountDeletion(fixture.admin, USER_ID), false);
    assert.equal(fixture.deletedUsers.length, 0);
    assert.equal(fixture.removals.length, 0);
    assert.equal(fixture.accountFinishes.length, 1);
    assert.equal(fixture.accountFinishes[0].p_user_id, USER_ID);
    assert.ok(fixture.accountFinishes[0].p_error);
  });
}

test("an empty account deletes auth before recording completion", async () => {
  const fixture = cleanupClient();
  assert.equal(await worker.processAccountDeletion(fixture.admin, USER_ID), true);
  assert.deepEqual(fixture.events.map(([name]) => name), [
    "prepare_account_cleanup", "deleteUser", "finish_account_cleanup",
  ]);
  assert.deepEqual(fixture.deletedUsers, [USER_ID]);
  assert.deepEqual(fixture.accountFinishes, [{ p_user_id: USER_ID }]);
});

test("account cleanup discovers over 1000 objects across calls of at most four batches", async () => {
  // One bucket makes batch counts explicit; the grouping test covers two buckets.
  const objects = Array.from({ length: 1257 }, (_, index) => ({ bucket: BUCKET, path: imagePath(index) }));
  const fixture = cleanupClient({ objects });
  for (const [invocation, expectedRemaining] of [857, 457, 57, 0].entries()) {
    const previousEvents = fixture.events.length;
    const previousRemovals = fixture.removals.length;
    const completed = await worker.processAccountDeletion(fixture.admin, USER_ID);
    const prepareCount = fixture.events.slice(previousEvents)
      .filter(([name]) => name === "prepare_account_cleanup").length;
    assert.equal(prepareCount, invocation === 3 ? 2 : 4);
    assert.equal(fixture.removals.length - previousRemovals, invocation === 3 ? 1 : 4);
    assert.equal(fixture.remaining.size, expectedRemaining);
    assert.equal(completed, invocation === 3);
    assert.equal(fixture.deletedUsers.length, invocation === 3 ? 1 : 0);
  }
  const removedPaths = fixture.removals.flatMap(({ paths }) => paths);
  assert.equal(removedPaths.length, 1257);
  assert.equal(new Set(removedPaths).size, 1257, "No objects skipped or removed twice");
  assert.equal(fixture.queue.size, 0);
  assert.ok(fixture.accountFinishes.slice(0, 3).every((args) => args.p_error));
  assert.deepEqual(fixture.accountFinishes[3], { p_user_id: USER_ID });
});

test("failed account object removal retains the account and never deletes auth", async () => {
  const fixture = cleanupClient({
    objects: [{ bucket: BUCKET, path: imagePath(0) }],
    removeFailure: () => Promise.reject(new Error("Offline")),
  });
  assert.equal(await worker.processAccountDeletion(fixture.admin, USER_ID), false);
  assert.equal(fixture.remaining.size, 1);
  assert.equal(fixture.queue.size, 1);
  assert.equal(fixture.deletedUsers.length, 0);
  assert.equal(fixture.removals.length, 4, "Request work is bounded even without simulated SQL backoff");
  assert.ok(fixture.accountFinishes[0].p_error);
});

for (const status of [404, 500]) {
  test(`auth deletion status ${status} ${status === 404 ? "completes idempotently" : "keeps the account pending"}`, async () => {
    const fixture = cleanupClient();
    fixture.admin.auth.admin.deleteUser = async () => ({ error: Object.assign(new Error("Auth error"), { status }) });
    assert.equal(await worker.processAccountDeletion(fixture.admin, USER_ID), status === 404);
    assert.equal(Object.hasOwn(fixture.accountFinishes[0], "p_error"), status !== 404);
  });
}

for (const [label, rpc] of [
  ["returned error", async () => ({ error: new Error("Release failed") })],
  ["rejected promise", async () => { throw new Error("Release rejected"); }],
]) {
  test(`release ${label} is logged without throwing or directly removing the image`, async () => {
    const calls = [];
    const previousErrors = worker.errors.length;
    const client = { rpc: async (name, args) => { calls.push([name, structuredClone(args)]); return rpc(); } };
    await assert.doesNotReject(worker.releaseUploadedImage(client, BUCKET, imagePath(0)));
    assert.deepEqual(calls, [["release_image_upload", { p_bucket: BUCKET, p_path: imagePath(0) }]]);
    assert.equal(worker.errors.length, previousErrors + 1);
  });
}

function uploadClient({ reserveFailure, uploadFailure, settleFailure, user = { id: USER_ID } } = {}) {
  const events = [];
  const reservations = new Map();
  const uploads = [];
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    async rpc(name, args) {
      events.push(name);
      assert.equal(args.p_bucket, BUCKET);
      if (name === "reserve_image_upload") {
        if (reserveFailure) return reserveFailure();
        reservations.set(args.p_path, { settled: false });
      } else if (name === "settle_image_upload") {
        if (settleFailure) return settleFailure();
        assert.ok(reservations.has(args.p_path));
        reservations.get(args.p_path).settled = true;
      } else {
        assert.fail(`Unexpected upload RPC: ${name}`);
      }
      return { error: null };
    },
    storage: {
      from(bucket) {
        assert.equal(bucket, BUCKET);
        return {
          async upload(path, blob) {
            events.push("upload");
            assert.ok(reservations.has(path), "Reservation precedes Storage upload");
            if (uploadFailure) return uploadFailure();
            uploads.push({ path, blob });
            return { error: null };
          },
        };
      },
    },
  };
  return { client, events, reservations, uploads };
}

function imageForm(fieldName = "image", value = "data:image/webp;base64,aGVsbG8=") {
  const form = new FormData();
  form.set(fieldName, value);
  return form;
}

test("upload reserves, uploads decoded data, then settles the same nested path", async () => {
  const fixture = uploadClient();
  const path = await uploadHelper.uploadBase64Image(fixture.client, BUCKET, imageForm("photo"), "photo", ["routine", "start"]);
  assert.equal(path, `${USER_ID}/routine/start/${IMAGE_ID}.webp`);
  assert.deepEqual(fixture.events, ["reserve_image_upload", "upload", "settle_image_upload"]);
  assert.equal(fixture.uploads[0].path, path);
  assert.equal(fixture.uploads[0].blob.type, "image/webp");
  assert.equal(await fixture.uploads[0].blob.text(), "hello");
  assert.deepEqual(fixture.reservations.get(path), { settled: true });
});

for (const rejection of [false, true]) {
  test(`reservation ${rejection ? "rejection" : "error"} prevents upload`, async () => {
    const failure = new Error("Cannot reserve");
    const fixture = uploadClient({ reserveFailure: () => rejection ? Promise.reject(failure) : { error: failure } });
    await assert.rejects(uploadHelper.uploadBase64Image(fixture.client, BUCKET, imageForm()), (error) => error === failure);
    assert.deepEqual(fixture.events, ["reserve_image_upload"]);
    assert.equal(fixture.uploads.length, 0);
    assert.equal(fixture.reservations.size, 0);
  });

  test(`upload ${rejection ? "rejection" : "error"} retains an unsettled reservation`, async () => {
    const failure = new Error("Upload failed");
    const fixture = uploadClient({ uploadFailure: () => rejection ? Promise.reject(failure) : { error: failure } });
    await assert.rejects(uploadHelper.uploadBase64Image(fixture.client, BUCKET, imageForm()), (error) => error === failure);
    assert.deepEqual(fixture.events, ["reserve_image_upload", "upload"]);
    assert.deepEqual([...fixture.reservations.values()], [{ settled: false }]);
    assert.equal(fixture.uploads.length, 0);
  });
}

test("settle failure preserves the uploaded object and reservation for recovery", async () => {
  const failure = new Error("Settle failed");
  const fixture = uploadClient({ settleFailure: () => ({ error: failure }) });
  await assert.rejects(uploadHelper.uploadBase64Image(fixture.client, BUCKET, imageForm()), (error) => error === failure);
  assert.deepEqual(fixture.events, ["reserve_image_upload", "upload", "settle_image_upload"]);
  assert.equal(fixture.uploads.length, 1);
  assert.deepEqual([...fixture.reservations.values()], [{ settled: false }]);
});

test("missing or non-image form values do not authenticate, reserve, or upload", async () => {
  for (const value of ["", "plain text", "data:text/plain;base64,aGVsbG8="]) {
    assert.equal(await uploadHelper.uploadBase64Image({}, BUCKET, imageForm("image", value)), null);
  }
  assert.equal(await uploadHelper.uploadBase64Image({}, BUCKET, new FormData()), null);
});

test("an unauthenticated upload fails before reserving or uploading", async () => {
  const fixture = uploadClient({ user: null });
  await assert.rejects(uploadHelper.uploadBase64Image(fixture.client, BUCKET, imageForm()), /not authenticated/);
  assert.deepEqual(fixture.events, []);
});
