// What the engine module and the extension code agree on. The two are loaded apart and share no variables, so they
// meet in a file of the plugin's data folder.

/** The file in the plugin's data folder that the engine module writes and the tool reads. */
export const HEARTBEAT_FILE = "heartbeat.json";

export interface Heartbeat {
	/** When the engine module started, in milliseconds since 1970. */
	startedAt: number;
	/** How often it has run since then. */
	beats: number;
	/** When it last ran. */
	lastBeatAt: number;
}

/** The interval setting as a number of seconds, whatever the saved value is. */
export function intervalOf(settings: Readonly<Record<string, unknown>>): number {
	const value = settings.intervalSeconds;
	return typeof value === "number" && value >= 1 ? value : 60;
}
