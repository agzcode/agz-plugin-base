import type { PluginView, PluginViewDefinition } from "@agz-yazilim/plugin-sdk";
import { fetchIssues, type IssueState, type TrackerSettings } from "./issues.ts";

const STATES: readonly IssueState[] = ["open", "closed", "all"];

function isState(value: unknown): value is IssueState {
	return STATES.some((state) => state === value);
}

/** The panel: a filter form and a table of the issues the endpoint returns for the chosen state. */
export function createIssuesView(settings: () => TrackerSettings): PluginViewDefinition {
	let state: IssueState = "open";

	return {
		async render(ctx): Promise<PluginView> {
			const filter = {
				kind: "form" as const,
				id: "filter",
				fields: [
					{
						type: "enum" as const,
						key: "state",
						label: { en: "State", tr: "Durum" },
						options: [
							{ value: "open", label: { en: "Open", tr: "Açık" } },
							{ value: "closed", label: { en: "Closed", tr: "Kapalı" } },
							{ value: "all", label: { en: "All", tr: "Tümü" } },
						],
						default: "open",
					},
				],
				values: { state },
				submit: { label: { en: "Show", tr: "Göster" }, action: "filter" },
			};
			const current = settings();
			if (current.endpoint === undefined) {
				return {
					sections: [
						{
							blocks: [
								{
									kind: "alert",
									tone: "warning",
									title: { en: "No issues API configured", tr: "Sorun API'si ayarlanmadı" },
									text: {
										en: "Set the issues API URL in the plugin's settings.",
										tr: "Eklentinin ayarlarında sorun API adresini girin.",
									},
								},
							],
						},
					],
				};
			}
			try {
				const issues = await fetchIssues(current, { state }, ctx.signal);
				return {
					sections: [
						{ blocks: [filter] },
						{
							title: { en: "Issues", tr: "Sorunlar" },
							blocks: [
								{
									kind: "table",
									id: "issues",
									columns: [
										{ key: "number", label: "#" },
										{ key: "title", label: { en: "Title", tr: "Başlık" } },
										{ key: "state", label: { en: "State", tr: "Durum" } },
										{ key: "author", label: { en: "Author", tr: "Yazar" } },
									],
									rows: issues.map((issue) => ({
										number: issue.number,
										title: issue.title,
										state: issue.state,
										author: issue.author ?? null,
									})),
									empty: { en: "No issues.", tr: "Sorun yok." },
								},
							],
						},
					],
				};
			} catch (error) {
				return {
					sections: [
						{
							blocks: [
								filter,
								{ kind: "alert", tone: "danger", text: error instanceof Error ? error.message : String(error) },
							],
						},
					],
				};
			}
		},

		action(name, input) {
			if (name !== "filter") return { error: `Unknown action ${name}.` };
			const next = input.values?.state;
			if (!isState(next)) return { error: "State must be open, closed or all." };
			state = next;
			return undefined;
		},
	};
}
