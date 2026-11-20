// Mirrors files from AGZ Code, preserving public-release overrides, and records the resulting hashes in synced.json.
//
// Usage:
//   node scripts/sync-from-source.mjs [--source <checkout>]          copy, and record hashes without source metadata
//   node scripts/sync-from-source.mjs --check [--source <checkout>]  check that the non-overridden files match
//   node scripts/sync-from-source.mjs --verify                       verify the hashes without a source checkout (CI)
//   node scripts/sync-from-source.mjs --record-overrides             refresh only the hashes of local overrides
//
// The default source is ../../agz-code beside this repository, or $AGZ_CODE_SOURCE.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const mode = args.includes("--check") ? "check" : args.includes("--verify") ? "verify" : args.includes("--record-overrides") ? "record-overrides" : "sync";
const sourceAt = args.indexOf("--source");
const source = resolve(sourceAt === -1 ? (process.env.AGZ_CODE_SOURCE ?? join(root, "..", "..", "agz-code")) : (args[sourceAt + 1] ?? ""));

/** Source folder (in the AGZ Code checkout) to the folder here that mirrors it. */
const MIRRORS = [
	["agz-code/skills/plugin-dev/references", "docs"],
	["agz-code/skills/plugin-dev/assets/template/extension", "templates/extension"],
	["agz-code/skills/plugin-dev/assets/template/skill", "templates/skill"],
	["agz-code/skills/plugin-dev/assets/template/skill-extension", "templates/skill-extension"],
	["packages/plugin-kit/examples/command-guard", "examples/command-guard"],
	["packages/plugin-kit/examples/issue-tracker", "examples/issue-tracker"],
	["packages/plugin-kit/examples/release-notes", "examples/release-notes"],
];
// Keep these public versions until the corresponding source fixes are in place.
const OVERRIDES = new Set(["en", "tr"].flatMap((lang) =>
	["cli", "manifest", "overview", "quickstart", "skill-plugins", "testing-packaging"].map((page) => `docs/${lang}/${page}.md`),
));

/** Never copied, and never counted as part of a mirror: what an install leaves behind. */
const SKIPPED = new Set(["node_modules", "package-lock.json"]);
const RECORD = join(root, "synced.json");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const writeRecord = (files) => writeFileSync(RECORD, `${JSON.stringify({ files }, null, "\t")}\n`);

function recordOverrides(recorded) {
	for (const file of OVERRIDES) {
		if (!existsSync(join(root, file))) throw new Error(`missing public override: ${file}`);
		recorded[file] = sha256(readFileSync(join(root, file)));
	}
}

/** The files under `dir`, as sorted paths relative to it. */
function filesOf(dir, prefix = "") {
	if (!existsSync(dir)) return [];
	const files = [];
	for (const entry of readdirSync(dir).sort()) {
		if (SKIPPED.has(entry) || entry.endsWith(".tgz")) continue;
		const relative = prefix === "" ? entry : `${prefix}/${entry}`;
		if (statSync(join(dir, entry)).isDirectory()) files.push(...filesOf(join(dir, entry), relative));
		else files.push(relative);
	}
	return files;
}

if (mode === "verify" || mode === "record-overrides") {
	if (!existsSync(RECORD)) {
		console.error("synced.json is missing: run node scripts/sync-from-source.mjs");
		process.exit(1);
	}
	const record = JSON.parse(readFileSync(RECORD, "utf8"));
	const recorded = record.files;
	if (mode === "record-overrides") recordOverrides(recorded);
	const problems = [];
	if (mode === "verify" && Object.keys(record).some((key) => key !== "files")) problems.push("unexpected metadata in synced.json");
	for (const file of OVERRIDES) if (!Object.hasOwn(recorded, file)) problems.push(`unrecorded override: ${file}`);
	for (const [file, hash] of Object.entries(recorded)) {
		if (!existsSync(join(root, file))) problems.push(`deleted here: ${file}`);
		else if (sha256(readFileSync(join(root, file))) !== hash) problems.push(`edited here: ${file}`);
	}
	for (const [, target] of MIRRORS) {
		for (const file of filesOf(join(root, target))) if (!Object.hasOwn(recorded, `${target}/${file}`)) problems.push(`added here: ${target}/${file}`);
	}
	for (const problem of problems) console.error(problem);
	if (problems.length > 0) {
		console.error(`${problems.length} integrity issue(s); see CONTRIBUTING.md for how to update these files.`);
		process.exit(1);
	}
	if (mode === "record-overrides") writeRecord(recorded);
	console.log(`${mode}: ${Object.keys(recorded).length} file hashes checked, including ${OVERRIDES.size} public overrides`);
	process.exit(0);
}

for (const [from] of MIRRORS) {
	if (!existsSync(join(source, from))) {
		console.error(`the source has no ${from}: ${source} (give the AGZ Code checkout with --source or $AGZ_CODE_SOURCE)`);
		process.exit(2);
	}
}

const recorded = {};
const differences = [];
for (const [from, target] of MIRRORS) {
	const sourceFiles = filesOf(join(source, from));
	const targetFiles = filesOf(join(root, target));
	for (const file of targetFiles.filter((entry) => !sourceFiles.includes(entry) && !OVERRIDES.has(`${target}/${entry}`))) {
		differences.push(`not in the source: ${target}/${file}`);
		if (mode === "sync") rmSync(join(root, target, file));
	}
	for (const file of sourceFiles) {
		if (OVERRIDES.has(`${target}/${file}`)) continue;
		const bytes = readFileSync(join(source, from, file));
		const out = join(root, target, file);
		if (!existsSync(out) || !readFileSync(out).equals(bytes)) {
			differences.push(`${existsSync(out) ? "differs" : "missing"}: ${target}/${file}`);
			if (mode === "sync") {
				mkdirSync(dirname(out), { recursive: true });
				writeFileSync(out, bytes);
			}
		}
		recorded[`${target}/${file}`] = sha256(bytes);
	}
}

if (mode === "check") {
	for (const difference of differences) console.error(difference);
	console.log(differences.length === 0 ? `check: ${Object.keys(recorded).length} files match the source (${OVERRIDES.size} overrides excluded)` : `check: ${differences.length} file(s) differ from the source; run the sync`);
	process.exit(differences.length === 0 ? 0 : 1);
}

recordOverrides(recorded);
writeRecord(recorded);
console.log(`sync: ${Object.keys(recorded).length} files including ${OVERRIDES.size} overrides, ${differences.length} changed`);
