import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";
import { formatStatus, readSettings, readStatus } from "./checks.ts";

// Runs in every session. It does not check anything itself: it reads what the engine module wrote.
export default function (agz: PluginAPI) {
	agz.registerTool(
		defineTool({
			name: "uptime_status",
			label: "Uptime status",
			description:
				"Report the last background check of the URLs the user configured: one line per URL with UP or DOWN, the HTTP status, the time the answer took and, for a failure, the reason; URLs that are down come first. The check runs in the background at the configured interval, so the answer can be that old. Fails when no URL is configured or no check has finished yet.",
			parameters: Type.Object({}),
			annotations: { readOnlyHint: true },
			execute: async () => {
				const { urls } = readSettings(agz.getPluginSettings());
				if (urls.length === 0) throw new Error("uptime_status: no URL is configured; add URLs in the plugin's settings");
				const status = await readStatus(agz.getPluginPaths().data);
				if (status === undefined) throw new Error("uptime_status: no check has finished yet; the first one runs when the plugin is turned on");
				return {
					content: [{ type: "text", text: formatStatus(status) }],
					details: { checkedAt: status.checkedAt, down: status.checks.filter((check) => !check.ok).length },
				};
			},
		}),
	);
}
