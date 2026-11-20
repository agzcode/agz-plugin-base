import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

// What the engine module and the extension code share: the settings as they read them, one check, and the status file in
// the plugin's data folder. The two parts are loaded apart, so the file is where they meet.

const STATUS_FILE = "status.json";
const MAX_URLS = 20;

export interface MonitorSettings {
	urls: string[];
	intervalSeconds: number;
	timeoutSeconds: number;
	/** What was left out of `urls`, and why. */
	problems: string[];
}

export interface Check {
	url: string;
	ok: boolean;
	/** The HTTP status, when the server answered. */
	status?: number;
	/** Why there was no answer. */
	error?: string;
	/** How long the check took, in milliseconds. */
	ms: number;
}

export interface Status {
	/** When the checks finished, in milliseconds since 1970. */
	checkedAt: number;
	checks: Check[];
}

const numberIn = (value: unknown, fallback: number, min: number, max: number): number =>
	typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

/** The plugin's settings, checked: only http and https addresses without credentials, each once, at most 20. */
export function readSettings(settings: Readonly<Record<string, unknown>>): MonitorSettings {
	const urls: string[] = [];
	const problems: string[] = [];
	const entries = typeof settings.urls === "string" ? settings.urls.split(/[\s,]+/).filter((entry) => entry !== "") : [];
	for (const entry of entries) {
		if (!URL.canParse(entry)) {
			problems.push(`not a URL: ${entry.slice(0, 100)}`);
			continue;
		}
		const url = new URL(entry);
		if (url.protocol !== "http:" && url.protocol !== "https:") problems.push(`not an http or https URL: ${url.protocol}//${url.host}`);
		// The address is written to a file and shown to the agent: one with credentials is never used, and never printed.
		else if (url.username !== "" || url.password !== "") problems.push(`a URL with credentials is not checked: ${url.protocol}//${url.host}`);
		else if (urls.includes(url.href)) continue;
		else if (urls.length >= MAX_URLS) problems.push(`more than ${MAX_URLS} URLs: ${url.href} is not checked`);
		else urls.push(url.href);
	}
	return {
		urls,
		intervalSeconds: numberIn(settings.intervalSeconds, 300, 30, 86_400),
		timeoutSeconds: numberIn(settings.timeoutSeconds, 10, 1, 60),
		problems,
	};
}

/** Asks one address and reports what came back. It never rejects: no answer is a check that failed. */
export async function checkUrl(url: string, timeoutMs: number, signal: AbortSignal): Promise<Check> {
	const started = Date.now();
	try {
		const response = await fetch(url, { redirect: "follow", signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) });
		// Only the status matters; the body is dropped without reading it.
		await response.body?.cancel();
		return { url, ok: response.ok, status: response.status, ms: Date.now() - started };
	} catch (error) {
		const reason = error instanceof Error && error.name === "TimeoutError" ? `no answer within ${timeoutMs} ms` : error instanceof Error ? error.message : String(error);
		return { url, ok: false, error: reason, ms: Date.now() - started };
	}
}

/** Replaces the status file in one step, so a session never reads half a file. */
export async function writeStatus(dataDir: string, status: Status): Promise<void> {
	const file = join(dataDir, STATUS_FILE);
	await writeFile(`${file}.tmp`, JSON.stringify(status, null, 2));
	await rename(`${file}.tmp`, file);
}

/** The last status the engine module wrote; undefined when it has written none. */
export async function readStatus(dataDir: string): Promise<Status | undefined> {
	try {
		const status = JSON.parse(await readFile(join(dataDir, STATUS_FILE), "utf8")) as Status;
		return typeof status.checkedAt === "number" && Array.isArray(status.checks) ? status : undefined;
	} catch {
		// No file yet, or a damaged one: the tool says that no check has run.
		return undefined;
	}
}

/** One line per address, the ones that are down first. */
export function formatStatus(status: Status): string {
	const line = (check: Check): string =>
		`${check.ok ? "UP  " : "DOWN"} ${check.status ?? "-"} ${check.ms} ms ${check.url}${check.error === undefined ? "" : ` (${check.error})`}`;
	const down = status.checks.filter((check) => !check.ok);
	const up = status.checks.filter((check) => check.ok);
	return [`checked ${new Date(status.checkedAt).toISOString()}: ${up.length} up, ${down.length} down`, ...down.map(line), ...up.map(line)].join("\n");
}
