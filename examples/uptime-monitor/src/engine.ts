import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import type { PluginEngineAPI, PluginEngineFactory } from "@agz-yazilim/plugin-sdk/unstable";
import { checkUrl, readSettings, writeStatus } from "./checks.ts";

/** The monitor of one engine: `check` runs every address once; `start` repeats it at the interval of the settings. */
export function createMonitor(engine: PluginEngineAPI) {
	let timer: ReturnType<typeof setInterval> | undefined;
	let running = false;
	let again = false;
	let reported = "";

	const round = async (): Promise<void> => {
		try {
			const { urls, timeoutSeconds, problems } = readSettings(engine.getSettings());
			// A bad setting is logged when it changes, not on every round.
			if (problems.join("\n") !== reported) {
				reported = problems.join("\n");
				for (const problem of problems) engine.log(`setting ignored: ${problem}`);
			}
			const checks = await Promise.all(urls.map((url) => checkUrl(url, timeoutSeconds * 1000, engine.signal)));
			// Stopped while the answers were on their way: nothing is written after the stop.
			if (engine.signal.aborted) return;
			const status = { checkedAt: Date.now(), checks };
			await writeStatus(engine.paths.data, status);
			const down = checks.filter((entry) => !entry.ok).map((entry) => entry.url);
			await appendFile(
				join(engine.paths.logs, "checks.log"),
				`${new Date(status.checkedAt).toISOString()} ${checks.length - down.length}/${checks.length} up${down.length === 0 ? "" : `; down: ${down.join(" ")}`}\n`,
			);
		} catch (error) {
			engine.log(`check failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	};

	const check = async (): Promise<void> => {
		// Rounds never overlap. A round asked for while one runs (the settings were saved) follows it, so the new list is
		// checked at once instead of at the next interval.
		if (running) {
			again = true;
			return;
		}
		running = true;
		try {
			do {
				again = false;
				await round();
			} while (again && !engine.signal.aborted);
		} finally {
			running = false;
		}
	};

	const schedule = (settings: Readonly<Record<string, unknown>>): void => {
		clearInterval(timer);
		timer = setInterval(() => void check(), readSettings(settings).intervalSeconds * 1000);
		// Not awaited: the factory must return quickly, and a slow server must not hold the engine's start.
		void check();
	};

	let unsubscribe: (() => void) | undefined;
	return {
		check,
		start(): void {
			schedule(engine.getSettings());
			// The user saved the settings: check at once with the new list, and keep the new interval.
			unsubscribe = engine.onSettingsChange(schedule);
		},
		stop(): void {
			unsubscribe?.();
			clearInterval(timer);
		},
	};
}

// The engine loads this module once while the plugin is enabled. Sessions come and go; the checks keep running.
const start: PluginEngineFactory = (engine) => {
	const monitor = createMonitor(engine);
	monitor.start();
	return () => monitor.stop();
};

export default start;
