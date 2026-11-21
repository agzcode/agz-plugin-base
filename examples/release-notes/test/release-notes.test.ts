import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import type { PluginManifest, PluginSystemPrompt } from "@agz-yazilim/plugin-sdk";

const root = join(import.meta.dirname, "..");
const skill = join(root, "skills", "release-notes");
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const manifest = (readJson(join(root, "package.json")) as { agzPlugin: PluginManifest }).agzPlugin;

function groupCommits(subjects: unknown): { status: number | null; stdout: string; stderr: string } {
	const run = spawnSync(process.execPath, [join(skill, "scripts", "group_commits.mjs")], {
		input: JSON.stringify({ subjects }),
		encoding: "utf8",
	});
	return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

/** `expected` is a part of `actual`: every key it names is there with an equal value; arrays are compared whole. */
function contains(expected: unknown, actual: unknown): boolean {
	if (typeof expected === "object" && expected !== null && !Array.isArray(expected)) {
		return (
			typeof actual === "object" &&
			actual !== null &&
			Object.entries(expected).every(([key, value]) => key in actual && contains(value, (actual as Record<string, unknown>)[key]))
		);
	}
	if (Array.isArray(expected)) {
		return Array.isArray(actual) && actual.length === expected.length && expected.every((item, index) => contains(item, actual[index]));
	}
	return expected === actual;
}

describe("the plugin as the host sees it", () => {
	it("is a plugin without extension code: nothing registers and nothing is reported", async () => {
		const host = createMockHost({ dir: root });
		assert.equal(host.pluginId, "release-notes");
		assert.deepEqual([host.tools, host.commands, host.views, host.mcpServers], [[], [], [], []]);
		assert.equal(host.describeIssues(), "");
		assert.deepEqual(manifest.extensions, undefined);
	});
});

describe("the group_commits tool", () => {
	const examples = readdirSync(join(skill, "examples")).filter((name) => name.endsWith(".json"));

	it("has three examples", () => {
		assert.equal(examples.length, 3);
	});

	for (const name of examples) {
		it(`matches its example ${name}`, () => {
			const example = readJson(join(skill, "examples", name)) as { input: { subjects: unknown }; expected: unknown };
			const run = groupCommits(example.input.subjects);
			assert.equal(run.status, 0, run.stderr);
			assert.ok(contains(example.expected, JSON.parse(run.stdout)), run.stdout);
		});
	}

	it("writes Markdown with one heading per section and one bullet per item", () => {
		const run = groupCommits(["feat(ui): dark theme", "fix: typo", "chore: x"]);
		assert.equal(run.status, 0, run.stderr);
		assert.equal(JSON.parse(run.stdout).markdown, "### Added\n\n- **ui:** dark theme\n\n### Fixed\n\n- typo\n");
	});

	it("treats a BREAKING CHANGE subject without a Conventional Commit type as breaking", () => {
		const run = groupCommits(["BREAKING CHANGE: new config format"]);
		assert.deepEqual(JSON.parse(run.stdout).sections, [{ title: "Breaking changes", items: ["BREAKING CHANGE: new config format"] }]);
	});

	it("gives an empty list an empty result", () => {
		const run = groupCommits([]);
		assert.deepEqual(JSON.parse(run.stdout), { markdown: "", sections: [], ignored: 0 });
	});

	it("exits non-zero for input that is not a list of strings", () => {
		for (const subjects of ["fix: x", [1], undefined]) {
			const run = groupCommits(subjects);
			assert.equal(run.status, 1);
			assert.match(run.stderr, /subjects must be an array of at most 2000 strings/);
		}
	});
});

describe("the system prompt edit", () => {
	const file = readJson(join(root, manifest.systemPrompt ?? "missing")) as PluginSystemPrompt;

	it("adds one block, named after the plugin, to the working section for every agent", () => {
		assert.equal(file.agents, undefined);
		assert.equal(file.all?.length, 1);
		const [op] = file.all ?? [];
		assert.ok(op?.op === "add");
		assert.equal(op.section, "working");
		assert.match(op.id, /^release-notes\./);
		assert.match(op.text, /release-notes skill/);
	});
});

describe("the bot template", () => {
	it("names a brief file that exists and tells the bot to use the skill", () => {
		const templates = manifest.contributes?.["agz/bots/templates"] as Array<{ name: string; suggestedApproval: string; brief: { $file: string } }>;
		assert.equal(templates.length, 1);
		const [template] = templates;
		assert.ok(template !== undefined);
		assert.match(template.name, /^[a-z][a-z0-9-]{1,47}$/);
		assert.equal(template.suggestedApproval, "report");
		const brief = readFileSync(join(root, template.brief.$file), "utf8");
		assert.ok(brief.trim().length > 0 && brief.length <= 20_000);
		assert.match(brief, /group_commits/);
	});
});
