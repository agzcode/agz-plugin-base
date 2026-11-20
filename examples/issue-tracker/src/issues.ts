/** What the plugin needs from the settings form, read from the untyped `getPluginSettings()` record. */
export interface TrackerSettings {
	/** The issues endpoint; `undefined` until the user sets it. */
	endpoint: string | undefined;
	/** The bearer token; `undefined` for a public repository. */
	token: string | undefined;
	/** Issues per request, 1 to 100. */
	pageSize: number;
}

export type IssueState = "open" | "closed" | "all";

export interface Issue {
	number: number;
	title: string;
	state: string;
	url: string;
	author: string | undefined;
	labels: string[];
}

export interface IssueQuery {
	state: IssueState;
	/** Only issues that carry this label. */
	label?: string;
	/** Only issues whose title contains this text, ignoring case. */
	text?: string;
}

const DEFAULT_PAGE_SIZE = 20;
const REQUEST_TIMEOUT_MS = 15_000;

export function readSettings(raw: Readonly<Record<string, unknown>>): TrackerSettings {
	const text = (value: unknown): string | undefined => (typeof value === "string" && value.trim() !== "" ? value.trim() : undefined);
	return {
		endpoint: text(raw.endpoint),
		token: text(raw.token),
		pageSize: typeof raw.pageSize === "number" ? raw.pageSize : DEFAULT_PAGE_SIZE,
	};
}

function endpointUrl(endpoint: string | undefined): URL {
	if (endpoint === undefined) throw new Error("The issues API URL is not set. Ask the user to fill it in under Settings > Plugins > Issue Tracker.");
	let url: URL;
	try {
		url = new URL(endpoint);
	} catch {
		throw new Error("The issues API URL setting is not a valid URL.");
	}
	if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("The issues API URL setting must start with https:// or http://.");
	if (url.username !== "" || url.password !== "") throw new Error("The issues API URL must not contain credentials; use the access token setting.");
	return url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** One entry of a GitHub-style issue list; pull requests (they carry `pull_request`) and malformed entries are left out. */
function toIssue(entry: unknown): Issue | undefined {
	if (!isRecord(entry) || "pull_request" in entry) return undefined;
	const { number, title, state, html_url: url, user, labels } = entry;
	if (typeof number !== "number" || typeof title !== "string" || typeof state !== "string" || typeof url !== "string") return undefined;
	return {
		number,
		title,
		state,
		url,
		author: isRecord(user) && typeof user.login === "string" ? user.login : undefined,
		labels: Array.isArray(labels)
			? labels.flatMap((label) => {
					const name = isRecord(label) ? label.name : label;
					return typeof name === "string" ? [name] : [];
				})
			: [],
	};
}

/**
 * Asks the issues endpoint for one page and returns its issues. A failure throws an Error whose text is safe to show the
 * model: it never contains the token.
 */
export async function fetchIssues(settings: TrackerSettings, query: IssueQuery, signal: AbortSignal | undefined): Promise<Issue[]> {
	const url = endpointUrl(settings.endpoint);
	url.searchParams.set("state", query.state);
	url.searchParams.set("per_page", String(settings.pageSize));
	if (query.label !== undefined) url.searchParams.set("labels", query.label);
	const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
	if (settings.token !== undefined) headers.Authorization = `Bearer ${settings.token}`;
	const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

	let response: Response;
	try {
		response = await fetch(url, { headers, signal: signal === undefined ? timeout : AbortSignal.any([signal, timeout]) });
	} catch (error) {
		if (signal?.aborted) throw new Error("The issue request was cancelled.");
		const reason = timeout.aborted ? `no answer within ${REQUEST_TIMEOUT_MS / 1000} seconds` : error instanceof Error ? error.message : String(error);
		throw new Error(`The issues API could not be reached: ${reason}`);
	}
	if (!response.ok) {
		const hint = response.status === 401 || response.status === 403 ? " Check the access token setting." : "";
		throw new Error(`The issues API answered ${response.status} ${response.statusText}.${hint}`);
	}
	const body: unknown = await response.json().catch(() => undefined);
	if (!Array.isArray(body)) throw new Error("The issues API did not answer with a list of issues.");
	const needle = query.text?.toLowerCase();
	return body.flatMap((entry) => {
		const issue = toIssue(entry);
		return issue !== undefined && (needle === undefined || issue.title.toLowerCase().includes(needle)) ? [issue] : [];
	});
}

/** One line per issue, for the model. */
export function formatIssues(issues: readonly Issue[]): string {
	if (issues.length === 0) return "No issues match.";
	return issues
		.map((issue) => {
			const labels = issue.labels.length > 0 ? ` [${issue.labels.join(", ")}]` : "";
			const author = issue.author === undefined ? "" : ` by ${issue.author}`;
			return `#${issue.number} (${issue.state}) ${issue.title}${labels}${author} - ${issue.url}`;
		})
		.join("\n");
}
