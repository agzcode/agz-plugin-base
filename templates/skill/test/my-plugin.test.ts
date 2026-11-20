import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";

// A skill-only plugin registers no extension code, so its test runs the script tool the way the skill runner does.
const script = join(import.meta.dirname, "..", "skills", "my-plugin", "scripts", "count_words.mjs");

test("count_words counts words, lines and characters", () => {
	const run = spawnSync(process.execPath, [script], { input: JSON.stringify({ text: "one two\nthree" }), encoding: "utf8" });
	assert.equal(run.status, 0, run.stderr);
	assert.deepEqual(JSON.parse(run.stdout), { words: 3, lines: 2, characters: 13 });
});
