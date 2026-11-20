import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../src/index.ts";
import { checkMessage, commitMessageOf, rulesOf } from "../src/rules.ts";

const dir = join(import.meta.dirname, "..");
const defaults = rulesOf({});

async function session(settings: Record<string, unknown>) {
	const host = createMockHost({ dir, settings });
	assert.deepEqual(await host.load(plugin), { ok: true }, host.describeIssues());
	return host;
}

describe("the rules", () => {
	it("fall back to the defaults for missing and unusable values", () => {
		assert.deepEqual(defaults, { format: "conventional", types: ["feat", "fix", "docs", "refactor", "test", "chore"], maxSubjectLength: 72 });
		assert.deepEqual(rulesOf({ format: "plain", types: " feat , Fix!, ", maxSubjectLength: 5 }), { format: "plain", types: ["feat"], maxSubjectLength: 72 });
	});

	it("accept a conventional subject, with a scope, a breaking mark and a body", () => {
		assert.deepEqual(checkMessage("feat: add the export command", defaults), []);
		assert.deepEqual(checkMessage("fix(parser)!: reject empty input\n\nAn empty file used to crash the parser.", defaults), []);
	});

	it("name each problem of a subject", () => {
		assert.deepEqual(checkMessage("Add the export command.", defaults), [
			"The subject ends with a period.",
			'The subject must read "type(scope): subject" or "type: subject", with one of the types feat, fix, docs, refactor, test, chore.',
		]);
		assert.deepEqual(checkMessage("perf: speed up the parser", defaults), ['The type "perf" is not allowed here; use one of feat, fix, docs, refactor, test, chore.']);
		assert.deepEqual(checkMessage("fix: one\ntwo", defaults), ["The second line must be empty: a blank line separates the subject from the body."]);
		assert.deepEqual(checkMessage("  \n\nbody", defaults), ["The message has no subject line."]);
	});

	it("count the subject in characters, not UTF-16 units", () => {
		const rules = { ...defaults, format: "plain" as const, maxSubjectLength: 20 };
		assert.deepEqual(checkMessage("😀".repeat(20), rules), []);
		assert.deepEqual(checkMessage("😀".repeat(21), rules), ["The subject has 21 characters; the limit is 20."]);
	});

	it("let any one-line subject pass in the plain format", () => {
		assert.deepEqual(checkMessage("Add the export command", { ...defaults, format: "plain" }), []);
	});
});

describe("reading the message of a git commit command", () => {
	it("reads quoted -m values and joins several as paragraphs", () => {
		assert.equal(commitMessageOf('git commit -m "feat: add export"'), "feat: add export");
		assert.equal(commitMessageOf("cd repo && git -C . commit -am 'fix: typo' -m 'More detail.'"), "fix: typo\n\nMore detail.");
		assert.equal(commitMessageOf('git commit --message="say \\"hi\\""'), 'say "hi"');
	});

	it("reads nothing from a command it cannot read without a shell, or that is no commit", () => {
		assert.equal(commitMessageOf('git commit -m "$(cat msg.txt)"'), undefined);
		assert.equal(commitMessageOf("git commit -F msg.txt"), undefined);
		assert.equal(commitMessageOf('git log --grep "commit -m"'), undefined);
		assert.equal(commitMessageOf('echo "git commit" -m "x"'), undefined);
	});
});

describe("the plugin", () => {
	it("checks a message against the rules that apply to the session's project", async () => {
		// The mock host holds one set of values. In the app, a project's own value of a project-scoped field wins over the
		// user's in that project's sessions; the plugin reads whichever applies.
		const host = await session({ format: "plain", maxSubjectLength: 30 });
		const run = await host.runTool("commit_style_check", { message: "Add the export command for the yearly report" });
		assert.deepEqual(run.details, {
			ok: false,
			problems: ["The subject has 44 characters; the limit is 30."],
			rules: { format: "plain", types: defaults.types, maxSubjectLength: 30 },
		});
	});

	it("uses rules saved while the session runs", async () => {
		const host = await session({});
		assert.equal(((await host.runTool("commit_style_check", { message: "Add export" })).details as { ok: boolean }).ok, false);
		await host.setSettings({ format: "plain" });
		assert.equal(((await host.runTool("commit_style_check", { message: "Add export" })).details as { ok: boolean }).ok, true);
	});

	it("leaves git commit alone unless the guard is on", async () => {
		const host = await session({});
		assert.equal(await host.emit("tool_call", { toolName: "bash", input: { command: 'git commit -m "bad message."' } }), undefined);
	});

	it("with the guard on, refuses a bad message with the reason and lets a good one pass", async () => {
		const host = await session({ guardGitCommit: true });
		const bad = await host.emit("tool_call", { toolName: "bash", input: { command: 'git commit -m "bad message."' } });
		assert.equal(bad?.block, true);
		assert.match(bad?.reason ?? "", /^The commit message breaks this project's rules: The subject ends with a period\./);

		assert.equal(await host.emit("tool_call", { toolName: "bash", input: { command: 'git commit -m "fix: handle empty input"' } }), undefined);
		// A message the guard cannot read without a shell passes rather than being guessed.
		assert.equal(await host.emit("tool_call", { toolName: "bash", input: { command: "git commit -F message.txt" } }), undefined);
	});
});
