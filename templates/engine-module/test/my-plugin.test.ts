import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { createMockEngine, createMockHost } from "@agz-yazilim/plugin-kit/testing";
import start from "../engine/index.ts";
import plugin from "../extensions/index.ts";
import { HEARTBEAT_FILE, type Heartbeat } from "../shared.ts";

const root = join(import.meta.dirname, "..");
let storage: string;

beforeEach(() => {
	storage = mkdtempSync(join(tmpdir(), "my-plugin-"));
});
afterEach(() => rmSync(storage, { recursive: true, force: true }));

test("the engine module writes its state at start and stops cleanly", async () => {
	const engine = createMockEngine({ dir: root, storageDir: storage, settings: { intervalSeconds: 3600 } });
	await engine.start(start);
	try {
		const state = JSON.parse(readFileSync(join(storage, "data", HEARTBEAT_FILE), "utf8")) as Heartbeat;
		assert.equal(state.beats, 1);
	} finally {
		await engine.stop();
	}
	assert.equal(engine.running, false);
});

test("my_plugin_status reads what the engine module wrote", async () => {
	const engine = createMockEngine({ dir: root, storageDir: storage, settings: { intervalSeconds: 3600 } });
	await engine.start(start);
	try {
		const host = createMockHost({ dir: root, storageDir: storage });
		assert.deepEqual(await host.load(plugin), { ok: true }, host.describeIssues());
		const run = await host.runTool("my_plugin_status", {});
		assert.equal(run.isError, false);
		assert.match(JSON.stringify(run.content), /1 beat\(s\)/);
	} finally {
		await engine.stop();
	}
});

test("my_plugin_status fails with a reason while the engine module has written nothing", async () => {
	const host = createMockHost({ dir: root, storageDir: storage });
	await host.load(plugin);
	const run = await host.runTool("my_plugin_status", {});
	assert.equal(run.isError, true);
	assert.match(JSON.stringify(run.content), /has not written its state yet/);
});
