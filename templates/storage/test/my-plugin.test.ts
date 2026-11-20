import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../extensions/index.ts";

const dir = join(import.meta.dirname, "..");
let storage: string;

beforeEach(() => {
	storage = mkdtempSync(join(tmpdir(), "my-plugin-"));
});
afterEach(() => rmSync(storage, { recursive: true, force: true }));

/** A session of the plugin over the folders of this test. */
async function session() {
	const host = createMockHost({ dir, storageDir: storage });
	assert.deepEqual(await host.load(plugin), { ok: true }, host.describeIssues());
	return host;
}

test("a text kept in one session is recalled in another", async () => {
	const first = await session();
	await first.runTool("my_plugin_remember", { text: "the build needs Node 22" });
	await first.runTool("my_plugin_remember", { text: "tests run with npm test" });

	const second = await session();
	const run = await second.runTool("my_plugin_recall", {});
	assert.deepEqual(run.content, [{ type: "text", text: "the build needs Node 22\ntests run with npm test" }]);
});

test("the data is a file in the plugin's data folder", async () => {
	const host = await session();
	await host.runTool("my_plugin_remember", { text: "hello" });
	assert.deepEqual(JSON.parse(readFileSync(join(storage, "data", "items.json"), "utf8")), ["hello"]);
});

test("a damaged file reads as empty instead of failing the tool", async () => {
	const host = await session();
	await host.runTool("my_plugin_remember", { text: "hello" });
	writeFileSync(join(storage, "data", "items.json"), "{ not json");
	const run = await host.runTool("my_plugin_recall", {});
	assert.equal(run.isError, false);
	assert.deepEqual(run.content, [{ type: "text", text: "" }]);
});

test("an empty text is refused by the schema", async () => {
	const host = await session();
	const run = await host.runTool("my_plugin_remember", { text: "" });
	assert.equal(run.isError, true);
});
