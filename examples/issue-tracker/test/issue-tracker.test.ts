import assert from "node:assert/strict";
import { join } from "node:path";
import { afterEach, describe, it, mock } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../src/index.ts";

const ENDPOINT = "https://issues.example.test/repos/acme/app/issues";

const ISSUES = [
	{ number: 12, title: "Crash on start", state: "open", html_url: "https://issues.example.test/12", user: { login: "ada" }, labels: [{ name: "bug" }] },
	{ number: 13, title: "Add dark theme", state: "open", html_url: "https://issues.example.test/13", user: { login: "lin" }, labels: [] },
	{ number: 14, title: "Fix crash in docs build", state: "open", html_url: "https://issues.example.test/14", pull_request: {} },
	{ not: "an issue" },
];

interface Seen {
	url: URL;
	authorization: string | undefined;
}

/** Replaces fetch for one test: records each request and answers with `body` and `status`. */
function stubFetch(body: unknown, status = 200): Seen[] {
	const seen: Seen[] = [];
	mock.method(globalThis, "fetch", async (input: URL, init?: RequestInit) => {
		const headers = new Headers(init?.headers);
		seen.push({ url: new URL(input), authorization: headers.get("authorization") ?? undefined });
		return new Response(JSON.stringify(body), { status, statusText: status === 200 ? "OK" : "Nope" });
	});
	return seen;
}

async function loaded(settings: Record<string, unknown> = { endpoint: ENDPOINT, token: "tok-secret-9" }) {
	const host = createMockHost({ dir: join(import.meta.dirname, ".."), settings });
	const result = await host.load(plugin);
	assert.deepEqual(result, { ok: true }, host.describeIssues());
	return host;
}

afterEach(() => mock.restoreAll());

describe("issue_tracker_search", () => {
	it("registers its tool and its panel view without issues", async () => {
		const host = await loaded();
		assert.deepEqual(host.tools.map((tool) => tool.name), ["issue_tracker_search"]);
		assert.deepEqual(host.views.map((view) => view.id), ["issues"]);
		assert.equal(host.describeIssues(), "");
	});

	it("asks the endpoint with the token, the state and the page size, and lists issues without pull requests", async () => {
		const seen = stubFetch(ISSUES);
		const host = await loaded();
		const run = await host.runTool("issue_tracker_search", {});
		assert.equal(run.isError, false);
		assert.equal(
			run.content[0]?.type === "text" ? run.content[0].text : "",
			[
				"#12 (open) Crash on start [bug] by ada - https://issues.example.test/12",
				"#13 (open) Add dark theme by lin - https://issues.example.test/13",
			].join("\n"),
		);
		assert.deepEqual(run.details, { count: 2 });
		assert.equal(seen.length, 1);
		assert.equal(seen[0]?.url.origin + seen[0]?.url.pathname, ENDPOINT);
		assert.equal(seen[0]?.url.searchParams.get("state"), "open");
		assert.equal(seen[0]?.url.searchParams.get("per_page"), "20");
		assert.equal(seen[0]?.authorization, "Bearer tok-secret-9");
	});

	it("passes the state and label on and filters titles by the query, ignoring case", async () => {
		const seen = stubFetch(ISSUES);
		const host = await loaded({ endpoint: ENDPOINT, pageSize: 5 });
		const run = await host.runTool("issue_tracker_search", { query: "CRASH", state: "all", label: "bug" });
		assert.equal(run.isError, false);
		assert.match(JSON.stringify(run.content), /#12 \(open\) Crash on start/);
		assert.doesNotMatch(JSON.stringify(run.content), /dark theme/);
		assert.equal(seen[0]?.url.searchParams.get("state"), "all");
		assert.equal(seen[0]?.url.searchParams.get("labels"), "bug");
		assert.equal(seen[0]?.url.searchParams.get("per_page"), "5");
		assert.equal(seen[0]?.authorization, undefined, "no token was set, so none is sent");
	});

	it("says so when nothing matches", async () => {
		stubFetch([]);
		const host = await loaded();
		const run = await host.runTool("issue_tracker_search", { query: "nothing" });
		assert.equal(run.isError, false);
		assert.deepEqual(run.content, [{ type: "text", text: "No issues match." }]);
	});

	it("refuses a state outside open, closed and all before any request is made", async () => {
		const seen = stubFetch(ISSUES);
		const host = await loaded();
		const run = await host.runTool("issue_tracker_search", { state: "merged" });
		assert.equal(run.isError, true);
		assert.equal(seen.length, 0);
	});

	it("fails with a readable error when the endpoint is not set", async () => {
		const seen = stubFetch(ISSUES);
		const host = await loaded({});
		const run = await host.runTool("issue_tracker_search", {});
		assert.equal(run.isError, true);
		assert.match(JSON.stringify(run.content), /issues API URL is not set/);
		assert.equal(seen.length, 0);
	});

	it("refuses an endpoint that is not http(s) or carries credentials", async () => {
		const seen = stubFetch(ISSUES);
		for (const [endpoint, reason] of [
			["file:///etc/passwd", /must start with https/],
			["https://user:pass@issues.example.test/x", /must not contain credentials/],
			["not a url", /not a valid URL/],
		] as const) {
			const host = await loaded({ endpoint });
			const run = await host.runTool("issue_tracker_search", {});
			assert.equal(run.isError, true);
			assert.match(JSON.stringify(run.content), reason);
		}
		assert.equal(seen.length, 0);
	});

	it("reports an error status with a hint for a rejected token, and never echoes the token", async () => {
		stubFetch({ message: "Bad credentials" }, 401);
		const host = await loaded();
		const run = await host.runTool("issue_tracker_search", {});
		assert.equal(run.isError, true);
		const text = JSON.stringify(run.content);
		assert.match(text, /answered 401 Nope\. Check the access token setting/);
		assert.doesNotMatch(text, /tok-secret-9/);
	});

	it("reports an answer that is not a list, and an endpoint that cannot be reached", async () => {
		stubFetch({ message: "hello" });
		const host = await loaded();
		const notList = await host.runTool("issue_tracker_search", {});
		assert.match(JSON.stringify(notList.content), /did not answer with a list of issues/);

		mock.restoreAll();
		mock.method(globalThis, "fetch", async () => {
			throw new TypeError("getaddrinfo ENOTFOUND issues.example.test");
		});
		const unreachable = await host.runTool("issue_tracker_search", {});
		assert.equal(unreachable.isError, true);
		assert.match(JSON.stringify(unreachable.content), /could not be reached: getaddrinfo ENOTFOUND/);
	});

	it("stops when the call is cancelled", async () => {
		mock.method(globalThis, "fetch", async (_input: URL, init?: RequestInit) => {
			await new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
		});
		const host = await loaded();
		const controller = new AbortController();
		const pending = host.runTool("issue_tracker_search", {}, { signal: controller.signal });
		controller.abort();
		const run = await pending;
		assert.equal(run.isError, true);
		assert.match(JSON.stringify(run.content), /cancelled|aborted/i);
	});
});

describe("the issues panel", () => {
	const table = (view: { sections: { blocks: { kind: string; rows?: unknown[] }[] }[] }) =>
		view.sections.flatMap((section) => section.blocks).find((block) => block.kind === "table");

	it("asks to configure the plugin while no endpoint is set", async () => {
		const seen = stubFetch(ISSUES);
		const host = await loaded({});
		const rendered = await host.renderView("issues");
		assert.ok(rendered.ok, JSON.stringify(rendered));
		assert.equal(rendered.view.sections[0]?.blocks[0]?.kind, "alert");
		assert.equal(seen.length, 0);
	});

	it("lists the open issues in a table, in the client's language", async () => {
		stubFetch(ISSUES);
		const host = await loaded();
		const rendered = await host.renderView("issues", { locale: "tr" });
		assert.ok(rendered.ok, JSON.stringify(rendered));
		assert.deepEqual(table(rendered.view)?.rows, [
			{ number: 12, title: "Crash on start", state: "open", author: "ada" },
			{ number: 13, title: "Add dark theme", state: "open", author: "lin" },
		]);
	});

	it("shows the failure as an alert and keeps the filter form", async () => {
		stubFetch({}, 500);
		const host = await loaded();
		const rendered = await host.renderView("issues");
		assert.ok(rendered.ok, JSON.stringify(rendered));
		const blocks = rendered.view.sections.flatMap((section) => section.blocks);
		assert.deepEqual(blocks.map((block) => block.kind), ["form", "alert"]);
		assert.match(JSON.stringify(blocks[1]), /answered 500/);
	});

	it("the filter form changes the state the next render asks for, and the view is rendered again", async () => {
		const seen = stubFetch(ISSUES);
		const host = await loaded();
		const done = await host.runViewAction("issues", "filter", { blockId: "filter", values: { state: "closed" } });
		assert.deepEqual(done, { ok: true });
		assert.deepEqual(host.invalidations.map((entry) => entry.viewId), ["issues"]);
		await host.renderView("issues");
		assert.equal(seen.at(-1)?.url.searchParams.get("state"), "closed");

		const refused = await host.runViewAction("issues", "filter", { blockId: "filter", values: { state: "merged" } });
		assert.deepEqual(refused, { ok: false, error: "State must be open, closed or all." });
	});

	it("is rendered again when the user saves the settings", async () => {
		const host = await loaded({});
		await host.setSettings({ endpoint: ENDPOINT });
		assert.deepEqual(host.invalidations.map((entry) => entry.viewId), ["issues"]);
	});
});
