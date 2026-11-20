import assert from "node:assert/strict";
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
