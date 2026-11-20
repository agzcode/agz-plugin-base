import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { test } from "node:test";

const root = join(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).agzPlugin;

/** Starts the declared server the way the host does (`${pluginDir}` is the package folder) and returns a request function. */
function startServer() {
	const [name, config] = Object.entries(manifest.mcpServers)[0];
	const expand = (value) => value.replaceAll("${pluginDir}", root);
	const child = spawn(expand(config.command), config.args.map(expand), { cwd: root, stdio: ["pipe", "pipe", "inherit"] });
	const waiting = new Map();
	createInterface({ input: child.stdout }).on("line", (line) => {
		const message = JSON.parse(line);
		waiting.get(message.id)?.(message);
		waiting.delete(message.id);
	});
	let nextId = 1;
	const request = (method, params) =>
		new Promise((resolve) => {
			const id = nextId++;
			waiting.set(id, resolve);
			child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
		});
	const notify = (method) => child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method })}\n`);
	const stop = () => new Promise((resolve) => child.once("exit", resolve).stdin.end());
	return { name, request, notify, stop };
}

test("the manifest declares a server whose file is in the package", () => {
	const [, config] = Object.entries(manifest.mcpServers)[0];
	const file = config.args.find((arg) => arg.startsWith("${pluginDir}/"));
	assert.ok(file, "the server file is named through ${pluginDir}");
	assert.ok(existsSync(join(root, file.slice("${pluginDir}/".length))));
});

test("the server answers initialize, lists its tool and runs it", async () => {
	const server = startServer();
	try {
		const init = await server.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
		assert.equal(init.result.protocolVersion, "2025-06-18");
		assert.deepEqual(init.result.capabilities, { tools: {} });
		server.notify("notifications/initialized");

		const list = await server.request("tools/list", {});
		assert.deepEqual(list.result.tools.map((tool) => tool.name), ["count"]);

		const call = await server.request("tools/call", { name: "count", arguments: { text: "one two\nthree" } });
		assert.deepEqual(call.result.structuredContent, { words: 3, lines: 2, characters: 13 });
	} finally {
		await server.stop();
	}
});

test("a bad argument is an error result and an unknown tool a protocol error", async () => {
	const server = startServer();
	try {
		const bad = await server.request("tools/call", { name: "count", arguments: { text: 5 } });
		assert.equal(bad.result.isError, true);
		assert.match(bad.result.content[0].text, /text must be a string/);

		const unknown = await server.request("tools/call", { name: "nope", arguments: {} });
		assert.equal(unknown.error.code, -32602);
	} finally {
		await server.stop();
	}
});
