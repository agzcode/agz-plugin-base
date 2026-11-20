import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";
import { HEARTBEAT_FILE, type Heartbeat } from "../shared.ts";

// Extension code runs in every session. It reads what the engine module wrote into the plugin's data folder.
export default function (agz: PluginAPI) {
	agz.registerTool(
		defineTool({
			name: "my_plugin_status",
			label: "My Plugin status",
			description:
				"Report whether the plugin's engine module runs: when it started, how many beats it made and when the last one was. Fails when the engine module has not written its state yet.",
			parameters: Type.Object({}),
			exposure: "codemode",
			annotations: { readOnlyHint: true },
			execute: async () => {
				const file = join(agz.getPluginPaths().data, HEARTBEAT_FILE);
				let state: Heartbeat;
				try {
					state = JSON.parse(await readFile(file, "utf8")) as Heartbeat;
				} catch {
					throw new Error("my_plugin_status: the engine module has not written its state yet");
				}
				const text = `started ${new Date(state.startedAt).toISOString()}, ${state.beats} beat(s), last ${new Date(state.lastBeatAt).toISOString()}`;
				return { content: [{ type: "text", text }], details: state };
			},
		}),
	);
}
