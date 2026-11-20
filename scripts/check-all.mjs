// Installs, tests and checks every template and example of this repository, one after another, the way a developer
// would: `npm install --ignore-scripts`, `npm test`, `agz plugin check`. One PASS or FAIL line per step; exit 1 when a
// step fails.
//
// Usage: node scripts/check-all.mjs [--tarballs <dir>] [name ...]
//   name          only the templates and examples of these folder names (default: all)
//   --tarballs    install the SDK and the kit from the two .tgz files in <dir> instead of the npm registry
//                 (for trying an SDK that is not published yet)
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const tarballsAt = args.indexOf("--tarballs");
const tarballDir = tarballsAt === -1 ? undefined : resolve(args[tarballsAt + 1] ?? "");
const only = args.filter((arg, index) => arg !== "--tarballs" && index !== tarballsAt + 1);

let tarballs = [];
if (tarballDir !== undefined) {
	const files = existsSync(tarballDir) ? readdirSync(tarballDir) : [];
	const pick = (name) => files.filter((file) => file.startsWith(`agz-yazilim-${name}-`) && file.endsWith(".tgz")).sort().at(-1);
	const sdk = pick("plugin-sdk");
	const kit = pick("plugin-kit");
	if (sdk === undefined || kit === undefined) {
		console.error(`--tarballs: ${tarballDir} must hold agz-yazilim-plugin-sdk-<version>.tgz and agz-yazilim-plugin-kit-<version>.tgz`);
		process.exit(2);
	}
	tarballs = [join(tarballDir, sdk), join(tarballDir, kit)];
}

const env = { ...process.env, npm_config_update_notifier: "false", npm_config_fund: "false", npm_config_audit: "false" };
// A test runner that started this script would make the nested `node --test` skip its files.
delete env.NODE_TEST_CONTEXT;

let failures = 0;
function step(label, command, commandArgs, cwd) {
	const run = spawnSync(command, commandArgs, { cwd, env, encoding: "utf8", timeout: 600_000 });
	if (run.status === 0) {
		console.log(`PASS ${label}`);
		return true;
	}
	failures += 1;
	console.log(`FAIL ${label}: exit ${run.status ?? run.signal ?? run.error?.message}`);
	const tail = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim().split("\n").slice(-25);
	console.log(tail.map((line) => `     ${line}`).join("\n"));
	return false;
}

const packages = ["templates", "examples"].flatMap((group) =>
	readdirSync(join(root, group), { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && existsSync(join(root, group, entry.name, "package.json")))
		.map((entry) => ({ name: `${group}/${entry.name}`, folder: entry.name, dir: join(root, group, entry.name) })),
);
const chosen = only.length === 0 ? packages : packages.filter((entry) => only.includes(entry.folder) || only.includes(entry.name));
if (chosen.length === 0) {
	console.error(`no template or example named ${only.join(", ")}`);
	process.exit(2);
}

for (const { name, dir } of chosen) {
	const install = tarballs.length === 0 ? ["install", "--ignore-scripts"] : ["install", "--ignore-scripts", "--no-save", ...tarballs];
	if (!step(`${name}: npm install`, "npm", install, dir)) continue;
	step(`${name}: npm test`, "npm", ["test"], dir);
	step(`${name}: agz plugin check`, process.execPath, [join(dir, "node_modules", ".bin", "agz"), "plugin", "check"], dir);
}

console.log(failures === 0 ? `check-all: ${chosen.length} package(s) passed` : `check-all: ${failures} step(s) failed`);
process.exit(failures === 0 ? 0 : 1);
