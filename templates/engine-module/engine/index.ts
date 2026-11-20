import { rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PluginEngineFactory } from "@agz-yazilim/plugin-sdk/unstable";
import { HEARTBEAT_FILE, type Heartbeat, intervalOf } from "../shared.ts";

// The engine loads this module once while the plugin is enabled, whatever the number of sessions. Replace the beat with
// the plugin's real background work: a poll, an index, a connection.
const start: PluginEngineFactory = async (engine) => {
	const file = join(engine.paths.data, HEARTBEAT_FILE);
	const state: Heartbeat = { startedAt: Date.now(), beats: 0, lastBeatAt: 0 };

	const beat = async (): Promise<void> => {
		state.beats += 1;
		state.lastBeatAt = Date.now();
		// Written to a temporary file and renamed, so a session never reads half a file.
		await writeFile(`${file}.tmp`, JSON.stringify(state));
		await rename(`${file}.tmp`, file);
	};

	let timer: ReturnType<typeof setInterval> | undefined;
	const schedule = (settings: Readonly<Record<string, unknown>>): void => {
		clearInterval(timer);
		timer = setInterval(() => {
			beat().catch((error: unknown) => engine.log(`beat failed: ${String(error)}`));
		}, intervalOf(settings) * 1000);
	};

	await beat();
	schedule(engine.getSettings());
	// The user saved the settings: keep running, with the new interval.
	const unsubscribe = engine.onSettingsChange(schedule);

	// The engine calls this when the plugin is turned off, updated or removed, and when the engine stops.
	return () => {
		unsubscribe();
		clearInterval(timer);
	};
};

export default start;
