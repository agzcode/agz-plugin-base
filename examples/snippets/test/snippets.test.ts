import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../src/index.ts";
import { MAX_BYTES, MAX_SNIPPETS, saveSnippet } from "../src/store.ts";

const dir = join(import.meta.dirname, "..");
let storage: string;

beforeEach(() => {
	storage = mkdtempSync(join(tmpdir(), "snippets-"));
});
afterEach(() => rmSync(storage, { recursive: true, force: true }));

/** A session of the plugin over the storage folder of this test. `cwd` stands for the project the session works in. */
async function session(cwd = "/work/project-a") {
	const host = createMockHost({ dir, storageDir: storage, cwd });
	assert.deepEqual(await host.load(plugin), { ok: true }, host.describeIssues());
	return host;
}

const textOf = (run: { content: Array<{ type: string; text?: string }> }): string => run.content.map((part) => part.text ?? "").join("");

describe("snippets", () => {
	it("keeps a snippet for a later session in another project", async () => {
		const first = await session("/work/project-a");
		await first.runTool("snippet_save", { name: "pr-template", text: "## What\n\n## Why\n" });

		const second = await session("/work/project-b");
		const run = await second.runTool("snippet_get", { name: "pr-template" });
		assert.equal(run.isError, false);
		assert.equal(textOf(run), "## What\n\n## Why\n");
	});

	it("writes one file per snippet into the plugin's data folder and leaves no temporary file", async () => {
		const host = await session();
		await host.runTool("snippet_save", { name: "a", text: "one" });
		await host.runTool("snippet_save", { name: "b.v2", text: "two" });
		assert.deepEqual(readdirSync(join(storage, "data", "snippets")).sort(), ["a.txt", "b.v2.txt"]);
		assert.equal(readFileSync(join(storage, "data", "snippets", "a.txt"), "utf8"), "one");
	});

	it("replaces a snippet of the same name and says so", async () => {
		const host = await session();
		assert.equal(textOf(await host.runTool("snippet_save", { name: "a", text: "one" })), "saved a");
		assert.equal(textOf(await host.runTool("snippet_save", { name: "a", text: "two" })), "replaced a");
		assert.equal(textOf(await host.runTool("snippet_get", { name: "a" })), "two");
	});

	it("lists names with sizes in bytes, and says when there are none", async () => {
		const host = await session();
		assert.equal(textOf(await host.runTool("snippet_list", {})), "No snippets are kept.");
		await host.runTool("snippet_save", { name: "b", text: "ğüş" });
		await host.runTool("snippet_save", { name: "a", text: "one" });
		const lines = textOf(await host.runTool("snippet_list", {})).split("\n");
		assert.match(lines[0] ?? "", /^a {2}3 bytes {2}\d{4}-\d{2}-\d{2}$/);
		assert.match(lines[1] ?? "", /^b {2}6 bytes {2}\d{4}-\d{2}-\d{2}$/);
	});

	it("deletes a snippet, and fails for a name that is not kept", async () => {
		const host = await session();
		await host.runTool("snippet_save", { name: "a", text: "one" });
		assert.equal(textOf(await host.runTool("snippet_delete", { name: "a" })), "deleted a");
		assert.equal(existsSync(join(storage, "data", "snippets", "a.txt")), false);

		const again = await host.runTool("snippet_delete", { name: "a" });
		assert.equal(again.isError, true);
		assert.match(textOf(again), /there is no snippet named a/);
		assert.match(textOf(await host.runTool("snippet_get", { name: "a" })), /there is no snippet named a/);
	});

	it("refuses a name that would leave the folder, and writes nothing", async () => {
		const host = await session();
		for (const name of ["../escape", "a/b", ".hidden", "UPPER", "a b"]) {
			const run = await host.runTool("snippet_save", { name, text: "x" });
			assert.equal(run.isError, true, name);
			assert.match(textOf(run), /is not a snippet name/, name);
		}
		assert.equal(existsSync(join(storage, "data", "snippets")), false);
		assert.deepEqual(readdirSync(storage).sort(), ["cache", "data", "logs"]);
	});

	it("refuses a text over the size limit, counted in bytes", async () => {
		const host = await session();
		const run = await host.runTool("snippet_save", { name: "big", text: "ş".repeat(MAX_BYTES / 2 + 1) });
		assert.equal(run.isError, true);
		assert.match(textOf(run), new RegExp(`has ${MAX_BYTES + 2} bytes; a snippet holds at most ${MAX_BYTES}`));
	});

	it("stops at the limit of snippets but still replaces an existing one", async () => {
		const data = join(storage, "data");
		for (let index = 0; index < MAX_SNIPPETS; index++) await saveSnippet(data, `s${index}`, "x");
		const host = await session();
		const over = await host.runTool("snippet_save", { name: "one-more", text: "x" });
		assert.equal(over.isError, true);
		assert.match(textOf(over), /200 snippets are kept already; delete one first/);
		assert.equal(textOf(await host.runTool("snippet_save", { name: "s0", text: "y" })), "replaced s0");
	});
});
