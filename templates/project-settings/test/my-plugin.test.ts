import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../extensions/index.ts";

const dir = join(import.meta.dirname, "..");

async function textOf(settings: Record<string, unknown>): Promise<string> {
	const host = createMockHost({ dir, settings });
	assert.deepEqual(await host.load(plugin), { ok: true }, host.describeIssues());
	const run = await host.runTool("my_plugin_test_command", {});
	assert.equal(run.isError, false);
	return run.content[0]?.type === "text" ? run.content[0].text : "";
}

test("without a saved value the tool returns the default", async () => {
	assert.equal(await textOf({}), "npm test");
});

// The mock host has one set of saved values. In the app the value of a project-scoped field is the project's own when the
// session's project is trusted and has one, else the user's: the plugin reads it the same way in both cases.
test("the tool returns the value that applies to the session", async () => {
	assert.equal(await textOf({ testCommand: "make check" }), "make check");
});

test("a setting saved while the session runs is used by the next call", async () => {
	const host = createMockHost({ dir, settings: { testCommand: "make check" } });
	await host.load(plugin);
	await host.setSettings({ testCommand: "cargo test", verbose: true });
	const run = await host.runTool("my_plugin_test_command", {});
	assert.match(JSON.stringify(run.content), /Run the tests of this project with: cargo test/);
});
