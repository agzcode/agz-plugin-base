import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { createMockEngine, createMockHost } from "@agz-yazilim/plugin-kit/testing";
import type { PluginEngineAPI } from "@agz-yazilim/plugin-sdk/unstable";
import { readSettings } from "../src/checks.ts";
import start, { createMonitor } from "../src/engine.ts";
import plugin from "../src/index.ts";

const root = join(import.meta.dirname, "..");
const URLS = "https://up.example.test/health, https://down.example.test/health";
let storage: string;
const engines: ReturnType<typeof createMockEngine>[] = [];

beforeEach(() => {
	storage = mkdtempSync(join(tmpdir(), "uptime-monitor-"));
});
afterEach(async () => {
	for (const engine of engines.splice(0)) await engine.stop();
	mock.restoreAll();
	rmSync(storage, { recursive: true, force: true });
});

/** Replaces fetch: `up.` answers 200, `down.` 503, `slow.` only when its signal aborts, anything else fails to connect. */
function stubFetch(): string[] {
	const asked: string[] = [];
	mock.method(globalThis, "fetch", async (input: string | URL, init?: RequestInit) => {
		const url = new URL(input);
		asked.push(url.href);
		if (url.hostname.startsWith("up.")) return new Response("ok", { status: 200 });
		if (url.hostname.startsWith("down.")) return new Response("no", { status: 503 });
		if (url.hostname.startsWith("slow.")) {
			return new Promise<Response>((_resolve, reject) => {
				const signal = init?.signal;
				assert.ok(signal);
				// A real HTTP request keeps Node alive; AbortSignal.timeout on its own does not.
				const guard = setTimeout(() => reject(new Error("The request was never aborted")), 5000);
				signal.addEventListener("abort", () => {
					clearTimeout(guard);
					reject(signal.reason);
				}, { once: true });
			});
		}
		throw new Error("connect ECONNREFUSED");
	});
	return asked;
}

/** The engine API as the host passes it, over the folders of this test; the mock host puts `data` in the same place. */
async function engineApi(initial: Record<string, unknown>) {
	const host = createMockEngine({ dir: root, storageDir: storage, settings: initial });
	engines.push(host);
	const listeners = new Set<(settings: Readonly<Record<string, unknown>>) => void>();
	let api: PluginEngineAPI | undefined;
	await host.start((base) => {
		api = {
			...base,
			onSettingsChange: (listener) => {
				listeners.add(listener);
				const unsubscribe = base.onSettingsChange(listener);
				return () => {
					listeners.delete(listener);
					unsubscribe();
				};
			},
		};
	});
	assert.ok(api);
	return { api, host, listeners };
}

async function statusText(settings: Record<string, unknown>) {
	const host = createMockHost({ dir: root, settings, storageDir: storage });
	assert.deepEqual(await host.load(plugin), { ok: true }, host.describeIssues());
	const run = await host.runTool("uptime_status", {});
	return { isError: run.isError, text: run.content[0]?.type === "text" ? run.content[0].text : "" };
}

describe("settings", () => {
	it("keeps http and https URLs once each and reports the rest", () => {
		const read = readSettings({ urls: "https://a.example.test, https://a.example.test ftp://b.example.test nonsense https://user:pw@c.example.test/x" });
		assert.deepEqual(read.urls, ["https://a.example.test/"]);
		assert.deepEqual(read.problems, ["not an http or https URL: ftp://b.example.test", "not a URL: nonsense", "a URL with credentials is not checked: https://c.example.test"]);
		assert.ok(!read.problems.join(" ").includes("pw"), "a password is never printed");
	});

	it("holds the interval and the timeout to their ranges", () => {
		assert.deepEqual({ ...readSettings({ intervalSeconds: 1, timeoutSeconds: 900 }), urls: 0, problems: 0 }, { urls: 0, intervalSeconds: 30, timeoutSeconds: 60, problems: 0 });
		assert.equal(readSettings({}).intervalSeconds, 300);
	});
});

describe("the engine module", () => {
	it("checks every URL, writes the status into the data folder and a line into the log", async () => {
		const asked = stubFetch();
		const { api } = await engineApi({ urls: URLS });
		await createMonitor(api).check();

		assert.deepEqual(asked, ["https://up.example.test/health", "https://down.example.test/health"]);
		const status = JSON.parse(readFileSync(join(api.paths.data, "status.json"), "utf8"));
		assert.deepEqual(
			status.checks.map((check: { url: string; ok: boolean; status?: number }) => [check.url, check.ok, check.status]),
			[
				["https://up.example.test/health", true, 200],
				["https://down.example.test/health", false, 503],
			],
		);
		assert.match(readFileSync(join(api.paths.logs, "checks.log"), "utf8"), / 1\/2 up; down: https:\/\/down\.example\.test\/health\n$/);
	});

	it("reports a server that does not answer in time, and one that refuses the connection", async () => {
		stubFetch();
		const { api } = await engineApi({ urls: "https://slow.example.test https://gone.example.test", timeoutSeconds: 1 });
		await createMonitor(api).check();
		const status = JSON.parse(readFileSync(join(api.paths.data, "status.json"), "utf8"));
		assert.deepEqual(
			status.checks.map((check: { error?: string }) => check.error),
			["no answer within 1000 ms", "connect ECONNREFUSED"],
		);
	});

	it("logs a bad setting once, not on every round", async () => {
		stubFetch();
		const { api, host } = await engineApi({ urls: "https://up.example.test nonsense" });
		const monitor = createMonitor(api);
		await monitor.check();
		await monitor.check();
		assert.deepEqual(host.logs, ["setting ignored: not a URL: nonsense"]);
	});

	it("writes nothing once the engine has asked it to stop", async () => {
		stubFetch();
		const { api, host } = await engineApi({ urls: URLS });
		await host.stop();
		await createMonitor(api).check();
		assert.throws(() => readFileSync(join(api.paths.data, "status.json")));
	});

	it("starts with a check, checks again when the settings are saved, and removes its listener when it stops", async () => {
		const asked = stubFetch();
		const { api, host, listeners } = await engineApi({ urls: "https://up.example.test" });
		const stop = await start(api);
		try {
			assert.equal(listeners.size, 1);
			// Saved while the first round is still running: the new list must not wait for the next interval.
			host.setSettings({ urls: "https://down.example.test" });
			// The checks are not awaited by the module; give the two rounds a moment to finish.
			await new Promise((resolve) => setTimeout(resolve, 50));
			assert.deepEqual(asked, ["https://up.example.test/", "https://down.example.test/"]);
			assert.equal(JSON.parse(readFileSync(join(api.paths.data, "status.json"), "utf8")).checks[0].url, "https://down.example.test/");
		} finally {
			// Also after a failed assertion: a timer left running would keep the test process alive.
			assert.equal(typeof stop, "function");
			if (typeof stop === "function") await stop();
		}
		assert.equal(listeners.size, 0);
	});
});

describe("uptime_status", () => {
	it("lists the URLs that are down first, from what the engine module wrote", async () => {
		stubFetch();
		const { api } = await engineApi({ urls: URLS });
		await createMonitor(api).check();

		const { isError, text } = await statusText({ urls: URLS });
		assert.equal(isError, false);
		const lines = text.split("\n");
		assert.match(lines[0] ?? "", /: 1 up, 1 down$/);
		assert.match(lines[1] ?? "", /^DOWN 503 \d+ ms https:\/\/down\.example\.test\/health$/);
		assert.match(lines[2] ?? "", /^UP {3}200 \d+ ms https:\/\/up\.example\.test\/health$/);
	});

	it("fails with what to do when no URL is configured or no check has finished", async () => {
		assert.match((await statusText({})).text, /no URL is configured/);
		assert.match((await statusText({ urls: URLS })).text, /no check has finished yet/);
	});
});
