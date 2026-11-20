import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../extensions/index.ts";

test("my_plugin_echo returns the text it was given", async () => {
	const host = createMockHost();
	await host.load(plugin);
	const run = await host.runTool("my_plugin_echo", { text: "hello" });
	assert.equal(run.isError, false);
	assert.deepEqual(run.content, [{ type: "text", text: "hello" }]);
});

test("my_plugin_echo refuses an empty text with the reason its tool_call hook gives", async () => {
	const host = createMockHost();
	await host.load(plugin);
	const run = await host.runTool("my_plugin_echo", { text: "" });
	assert.equal(run.isError, true);
	assert.match(JSON.stringify(run.content), /needs a non-empty text/);
});

test("count_words counts words, lines and characters", () => {
	const script = join(import.meta.dirname, "..", "skills", "my-plugin", "scripts", "count_words.mjs");
	const run = spawnSync(process.execPath, [script], { input: JSON.stringify({ text: "one two\nthree" }), encoding: "utf8" });
	assert.equal(run.status, 0, run.stderr);
	assert.deepEqual(JSON.parse(run.stdout), { words: 3, lines: 2, characters: 13 });
});
