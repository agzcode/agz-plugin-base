// The engine module of the plugin (`agzPlugin.engine`): it registers one OpenAI-compatible endpoint as a model provider.
// The contract is the SDK's: `engine.providers.register` takes id, name, baseUrl, models and secretSetting, and a model
// has id, name, contextWindow and maxTokens, nothing else. A plain module on purpose: the engine loads it as it is, and
// the test runs it with node.

/** @import { PluginModelProvider } from "@agz-yazilim/plugin-sdk" */
/** @import { PluginEngineFactory, PluginProviders } from "@agz-yazilim/plugin-sdk/unstable" */

/** The provider's id inside the plugin: the engine builds its own provider id from the plugin's id and this one. */
const PROVIDER_ID = "example-gateway";
const PROVIDER_NAME = "Example Gateway";
/** The secret setting that holds the endpoint's key. The module hands over its name and never reads its value. */
const SECRET_SETTING = "apiKey";
/** The most tokens one answer may use, before a smaller context window caps it. A design value. */
const MAX_OUTPUT_TOKENS = 4096;
/** At most this many model ids come from the setting. */
const MAX_MODELS = 8;
/** The SDK's model id rule: 1 to 128 letters, digits, `.`, `_`, `:`, `/` or `-`, starting with a letter or digit. */
const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
/** http is allowed only to the machine the engine runs on. */
const LOOPBACK_HOST = /^(?:localhost|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|\[::1\])$/i;

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 */
const numberIn = (value, fallback, min, max) =>
	typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

/**
 * The base URL the engine may use, without a trailing slash, or undefined with the reason added to `problems`: https
 * anywhere; http only to a server on this machine; never a URL with credentials, a query or a fragment, which would keep a
 * key somewhere other than the secret store.
 *
 * @param {unknown} value
 * @param {string[]} problems
 * @returns {string | undefined}
 */
export function usableBaseUrl(value, problems) {
	if (typeof value !== "string" || !URL.canParse(value.trim())) {
		problems.push("baseUrl is not a URL");
		return undefined;
	}
	const url = new URL(value.trim());
	// The refused value is printed as protocol and host only: a URL a user pasted may hold their key.
	if (url.username !== "" || url.password !== "") {
		problems.push(`a base URL with credentials is not used: ${url.protocol}//${url.host}`);
		return undefined;
	}
	if (url.search !== "" || url.hash !== "") {
		problems.push(`a base URL with a query or a fragment is not used: ${url.protocol}//${url.host}`);
		return undefined;
	}
	if (url.protocol !== "https:" && !(url.protocol === "http:" && LOOPBACK_HOST.test(url.hostname))) {
		problems.push(`not https, and not a server on this machine: ${url.protocol}//${url.host}`);
		return undefined;
	}
	return url.href.replace(/\/+$/, "");
}

/**
 * The plugin's settings, checked: the base URL the engine may use, the model ids, and the context window every model gets.
 *
 * @param {Readonly<Record<string, unknown>>} settings
 */
export function readSettings(settings) {
	/** @type {string[]} */
	const problems = [];
	const baseUrl = usableBaseUrl(settings.baseUrl, problems);
	/** @type {string[]} */
	const models = [];
	if (typeof settings.models === "string") {
		for (const entry of settings.models.split(/[\s,]+/)) {
			if (entry === "") continue;
			if (!MODEL_ID.test(entry)) problems.push(`not a model id (letters, digits, . _ : / -, 1 to 128): ${entry.slice(0, 128)}`);
			else if (models.includes(entry)) continue;
			else if (models.length >= MAX_MODELS) problems.push(`more than ${MAX_MODELS} model ids: ${entry.slice(0, 128)} is not registered`);
			else models.push(entry);
		}
	}
	return {
		baseUrl,
		models,
		contextWindow: numberIn(settings.contextWindow, 32_768, 1_024, 2_000_000),
		problems,
	};
}

/**
 * Registers the endpoint the settings describe, again only when the endpoint or the models change, and removes it when the
 * engine stops.
 *
 * @type {PluginEngineFactory}
 */
export default function start(engine) {
	// A host before SDK 1.3 refuses this plugin by its SDK range or its permission list. One that loads the module anyway
	// has no port: the check is a safety net, not a branch of the contract.
	const port = /** @type {PluginProviders | undefined} */ (engine.providers);
	if (port === undefined) {
		engine.log("this engine has no provider port: no model provider was registered");
		return;
	}

	/** @type {{ identity: string, dispose: () => void } | undefined} */
	let registered;
	const apply = () => {
		const config = readSettings(engine.getSettings());
		for (const problem of config.problems) engine.log(`setting ignored: ${problem}`);
		const { baseUrl, models, contextWindow } = config;
		if (baseUrl === undefined || models.length === 0) {
			if (registered !== undefined) registered.dispose();
			registered = undefined;
			engine.log("no model provider is registered until the base URL and at least one model id are usable");
			return;
		}
		const identity = JSON.stringify([baseUrl, contextWindow, models]);
		// The same endpoint and the same models: the engine reads the key for each request and checks the provider's
		// availability again when the settings were saved, so a new or cleared key needs no new registration.
		if (identity === registered?.identity) return;
		// Any other change: the old models must not stay selectable next to the new ones.
		if (registered !== undefined) registered.dispose();
		registered = undefined;
		try {
			/** @type {PluginModelProvider} */
			const provider = {
				id: PROVIDER_ID,
				name: PROVIDER_NAME,
				baseUrl,
				secretSetting: SECRET_SETTING,
				models: models.map((id) => ({
					id,
					name: id,
					contextWindow,
					// The contract: an answer is never longer than the context window, so a small window caps it too.
					maxTokens: Math.min(MAX_OUTPUT_TOKENS, contextWindow),
				})),
			};
			registered = { identity, dispose: port.register(provider) };
			engine.log(`registered ${PROVIDER_ID} at ${baseUrl} with ${models.length} model id(s)`);
		} catch (error) {
			// A refused registration leaves the plugin without a provider, not without its engine module.
			engine.log(`the engine refused the provider: ${error instanceof Error ? error.message : String(error)}`);
		}
	};

	apply();
	const stopListening = engine.onSettingsChange(apply);
	return () => {
		// The listener goes first: a settings change during the stop must not register the provider again.
		stopListening();
		if (registered !== undefined) registered.dispose();
		registered = undefined;
	};
}
