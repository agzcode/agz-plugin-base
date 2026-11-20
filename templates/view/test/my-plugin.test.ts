import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../extensions/index.ts";

const dir = join(import.meta.dirname, "..");

async function loaded() {
	const host = createMockHost({ dir });
	assert.deepEqual(await host.load(plugin), { ok: true }, host.describeIssues());
	return host;
}

/** The rows of the view's table, after the host's check of the view. */
async function rows(host: Awaited<ReturnType<typeof loaded>>) {
	const rendered = await host.renderView("tasks");
	assert.equal(rendered.ok, true, rendered.ok ? "" : rendered.error);
	if (!rendered.ok) return [];
	const table = rendered.view.sections.flatMap((section) => section.blocks).find((block) => block.kind === "table");
	return table?.kind === "table" ? table.rows : [];
}

test("the plugin registers the declared view and tool without issues", async () => {
	const host = await loaded();
	assert.deepEqual(host.views.map((view) => view.id), ["tasks"]);
	assert.deepEqual(host.tools.map((tool) => tool.name), ["my_plugin_add_task"]);
	assert.equal(host.describeIssues(), "");
});

test("a task the tool adds shows in the view, and the view is asked to render again", async () => {
	const host = await loaded();
	const run = await host.runTool("my_plugin_add_task", { title: "write the docs" });
	assert.deepEqual(run.structuredContent, { id: 1, open: 1 });
	assert.deepEqual(await rows(host), [{ id: 1, title: "write the docs", done: false }]);
	assert.deepEqual(host.invalidations.map((entry) => entry.viewId), ["tasks"]);
});

test("the form adds a task and the button finishes it", async () => {
	const host = await loaded();
	assert.deepEqual(await host.runViewAction("tasks", "add", { blockId: "new-task", values: { title: "  ship it  " } }), { ok: true });
	assert.deepEqual(await host.runViewAction("tasks", "done", { blockId: "done-1", payload: { id: 1 } }), { ok: true });
	assert.deepEqual(await rows(host), [{ id: 1, title: "ship it", done: true }]);
});

test("an empty title and an unknown task are failures the app shows", async () => {
	const host = await loaded();
	assert.deepEqual(await host.runViewAction("tasks", "add", { blockId: "new-task", values: { title: " " } }), { ok: false, error: "A task needs a title." });
	assert.deepEqual(await host.runViewAction("tasks", "done", { blockId: "done-9", payload: { id: 9 } }), { ok: false, error: "That task is gone." });
});
