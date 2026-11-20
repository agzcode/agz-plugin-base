import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import { describe, it } from "node:test";
import start, { readSettings, usableBaseUrl } from "../src/engine.mjs";

/** @import { PluginModelProvider } from "@agz-yazilim/plugin-sdk" */
/** @import { PluginEngineAPI } from "@agz-yazilim/plugin-sdk/unstable" */

const root = join(import.meta.dirname, "..");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const manifest = packageJson.agzPlugin;
const secretFields = new Set(
	manifest.settings.filter((/** @type {{ type: string }} */ field) => field.type === "secret").map((/** @type {{ key: string }} */ field) => field.key),
);

const settings = (overrides = {}) => ({
	baseUrl: "https://llm.acme.example/v1",
	apiKey: "sk-not-a-real-key",
	models: "acme-mini-1, acme-large-1",
	contextWindow: 65_536,
	...overrides,
});

/**
 * A port that records what was registered, with the host's rules: one registration per provider id, and the
 * `secretSetting` must be a declared secret field of the manifest.
 *
 * @param {Record<string, unknown>} initial
 * @param {{ port?: "recording" | "refusing" | "none" }} [options]
 */
function createEngine(initial, { port = "recording" } = {}) {
	/** @type {string[]} */
	const events = [];
	/** @type {Map<string, PluginModelProvider>} */
	const contributed = new Map();
	const listeners = new Set();
	/** @type {string[]} */
	const logs = [];
	let current = initial;
	const recording = {
		/** @param {PluginModelProvider} provider */
		register(provider) {
			if (!secretFields.has(provider.secretSetting)) throw new Error(`${provider.secretSetting} is not a declared secret field`);
			if (contributed.has(provider.id)) throw new Error(`Plugin ${manifest.id} already contributes the model provider "${provider.id}"`);
			events.push("register");
			contributed.set(provider.id, provider);
			return () => {
				// A disposer removes its own registration only, as in the host.
				if (contributed.get(provider.id) !== provider) return;
				contributed.delete(provider.id);
				events.push("unregister");
			};
		},
	};
	const refusing = {
		register() {
			throw new Error("the plugin does not declare the permission providers");
		},
	};
	const providers = port === "none" ? undefined : port === "refusing" ? refusing : recording;
	// The members the module uses; `sessions`, `spawn` and the rest of the host are left out on purpose.
	const engine = /** @type {PluginEngineAPI} */ (
		/** @type {unknown} */ ({
			pluginId: manifest.id,
			paths: { data: "/data", cache: "/cache", logs: "/logs" },
			signal: new AbortController().signal,
			getSettings: () => current,
			/** @param {(settings: Readonly<Record<string, unknown>>) => void} listener */
			onSettingsChange(listener) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			},
			/** @param {string} message */
			log: (message) => logs.push(message),
			host: { version: "0.0.0", stats: () => ({ sessions: 0, clients: 0, framesSent: 0, bytesSent: 0, backgroundProcesses: [] }) },
			...(providers === undefined ? {} : { providers }),
		})
	);
	return {
		engine,
		events,
		logs,
		/** The registrations that were not removed again. */
		live: () => [...contributed.values()],
		/** @param {Record<string, unknown>} next */
		setSettings(next) {
			current = next;
			for (const listener of listeners) listener(next);
		},
		stopped: () => listeners.size,
	};
}

/** Starts the module and hands back its stop, which the host calls and the test calls here. @param {ReturnType<typeof createEngine>} app */
function startProvider(app) {
	const stop = start(app.engine);
	assert.equal(typeof stop, "function", "the factory returns its stop function");
	return /** @type {() => void} */ (stop);
}

describe("the base URL the engine may use", () => {
	it("takes https and drops a trailing slash", () => {
		const problems = /** @type {string[]} */ ([]);
		assert.equal(usableBaseUrl(" https://llm.acme.example/v1/ ", problems), "https://llm.acme.example/v1");
		assert.deepEqual(problems, []);
	});

	it("takes http only to a server on this machine", () => {
		for (const url of ["http://127.0.0.1:8080/v1", "http://localhost:11434/v1", "http://[::1]:9000/v1"]) {
			const problems = /** @type {string[]} */ ([]);
			assert.equal(usableBaseUrl(url, problems), url, url);
			assert.deepEqual(problems, [], url);
		}
		const problems = /** @type {string[]} */ ([]);
		assert.equal(usableBaseUrl("http://192.168.1.5:8080/v1", problems), undefined);
		assert.match(problems[0], /not https, and not a server on this machine: http:\/\/192\.168\.1\.5:8080/);
	});

	it("refuses a key kept in the URL instead of the secret store", () => {
		const withCredentials = /** @type {string[]} */ ([]);
		assert.equal(usableBaseUrl("https://user:sk-not-a-real-key@llm.acme.example/v1", withCredentials), undefined);
		// The reason reaches the log, so it must not repeat what the user pasted.
		assert.match(withCredentials[0], /a base URL with credentials is not used: https:\/\/llm\.acme\.example$/);
		assert.ok(!withCredentials[0].includes("sk-not-a-real-key"));

		const withQuery = /** @type {string[]} */ ([]);
		assert.equal(usableBaseUrl("https://llm.acme.example/v1?api_key=sk-not-a-real-key", withQuery), undefined);
		assert.match(withQuery[0], /a base URL with a query or a fragment is not used/);
		assert.ok(!withQuery[0].includes("sk-not-a-real-key"));
	});

	it("refuses what is not a URL at all", () => {
		const problems = /** @type {string[]} */ ([]);
		assert.equal(usableBaseUrl("llm.acme.example/v1", problems), undefined);
		assert.deepEqual(problems, ["baseUrl is not a URL"]);
	});
});

describe("the module registers the endpoint of the settings", () => {
	it("registers one provider with exactly the fields of the contract", () => {
		const app = createEngine(settings());
		const stop = startProvider(app);
		const [registration, ...rest] = app.live();
		assert.equal(rest.length, 0);
		assert.equal(registration.id, "example-gateway");
		assert.equal(registration.name, "Example Gateway");
		assert.equal(registration.baseUrl, "https://llm.acme.example/v1");
		// The key itself is never passed: only the setting the engine reads it from.
		assert.equal(registration.secretSetting, "apiKey");
		assert.ok(!JSON.stringify(registration).includes("sk-not-a-real-key"));
		// The port carries no cost, input or reasoning: the engine ignores what the type does not declare.
		assert.deepEqual(Object.keys(registration).sort(), ["baseUrl", "id", "models", "name", "secretSetting"]);
		assert.deepEqual(
			registration.models.map((model) => model.id),
			["acme-mini-1", "acme-large-1"],
		);
		assert.deepEqual(Object.keys(registration.models[0]).sort(), ["contextWindow", "id", "maxTokens", "name"]);
		assert.equal(registration.models[0].name, "acme-mini-1");
		assert.equal(registration.models[0].contextWindow, 65_536);
		assert.equal(registration.models[0].maxTokens, 4096);
		assert.deepEqual(app.logs, ["registered example-gateway at https://llm.acme.example/v1 with 2 model id(s)"]);
		stop();
	});

	it("keeps the answer inside the context window", () => {
		for (const [contextWindow, maxTokens] of [
			[1024, 1024],
			[3000, 3000],
			[65_536, 4096],
		]) {
			const app = createEngine(settings({ contextWindow }));
			const stop = startProvider(app);
			const [model] = app.live()[0].models;
			assert.equal(model.contextWindow, contextWindow);
			assert.equal(model.maxTokens, maxTokens);
			assert.ok(model.maxTokens <= model.contextWindow);
			stop();
		}
	});

	it("keeps a design figure when the settings hold a value outside its range", () => {
		const app = createEngine(settings({ contextWindow: 10 }));
		const stop = startProvider(app);
		const [model] = app.live()[0].models;
		assert.equal(model.contextWindow, 1024);
		assert.equal(model.maxTokens, 1024);
		stop();
	});

	it("registers nothing for a base URL that is refused, and logs why", () => {
		const app = createEngine(settings({ baseUrl: "http://192.168.1.5:8080/v1" }));
		const stop = startProvider(app);
		assert.deepEqual(app.live(), []);
		assert.match(app.logs[0], /not https, and not a server on this machine/);
		assert.match(app.logs[1], /no model provider is registered/);
		stop();
	});

	it("registers nothing without a model id", () => {
		const app = createEngine(settings({ models: " , " }));
		const stop = startProvider(app);
		assert.deepEqual(app.live(), []);
		assert.deepEqual(app.logs, ["no model provider is registered until the base URL and at least one model id are usable"]);
		stop();
	});

	it("keeps the registration when only the key changes", () => {
		const app = createEngine(settings());
		const stop = startProvider(app);
		const [before] = app.live();
		// The engine reads the key for each request and checks availability again when the settings were saved, so a
		// rotated or cleared key changes nothing the module registered.
		app.setSettings(settings({ apiKey: "sk-rotated" }));
		app.setSettings(settings({ apiKey: "" }));
		assert.deepEqual(app.events, ["register"]);
		assert.equal(app.live()[0], before);
		assert.deepEqual(app.logs, ["registered example-gateway at https://llm.acme.example/v1 with 2 model id(s)"]);
		stop();
	});

	it("registers again when the endpoint or the models change", () => {
		const app = createEngine(settings());
		const stop = startProvider(app);
		app.setSettings(settings({ models: "acme-large-1", baseUrl: "http://127.0.0.1:11434/v1" }));
		assert.deepEqual(app.events, ["register", "unregister", "register"]);
		const [registration, ...rest] = app.live();
		assert.equal(rest.length, 0);
		assert.equal(registration.baseUrl, "http://127.0.0.1:11434/v1");
		assert.deepEqual(
			registration.models.map((model) => model.id),
			["acme-large-1"],
		);
		stop();
	});

	it("removes the provider when the engine stops, and stays stopped", () => {
		const app = createEngine(settings());
		const stop = startProvider(app);
		assert.equal(app.stopped(), 1);
		stop();
		assert.deepEqual(app.events, ["register", "unregister"]);
		assert.equal(app.stopped(), 0);
		// A listener that outlived the stop would register the provider again.
		app.setSettings(settings({ models: "acme-large-1" }));
		assert.deepEqual(app.events, ["register", "unregister"]);
	});

	it("says so and registers nothing where the engine has no provider port", () => {
		const app = createEngine(settings(), { port: "none" });
		assert.equal(start(app.engine), undefined);
		assert.deepEqual(app.logs, ["this engine has no provider port: no model provider was registered"]);
		assert.equal(app.stopped(), 0);
	});

	it("survives an engine that refuses the registration", () => {
		const app = createEngine(settings(), { port: "refusing" });
		const stop = startProvider(app);
		assert.deepEqual(app.live(), []);
		assert.match(app.logs[0], /the engine refused the provider: the plugin does not declare the permission providers/);
		stop();
	});

	it("sends a request to a local server with the key of the secret setting", async () => {
		/** @type {Array<{ url: string | undefined, authorization: string | undefined, body: unknown }>} */
		const requests = [];
		const server = createServer((request, response) => {
			let body = "";
			request.on("data", (chunk) => {
				body += chunk;
			});
			request.on("end", () => {
				requests.push({ url: request.url, authorization: request.headers.authorization, body: JSON.parse(body) });
				response.writeHead(200, { "content-type": "application/json" });
				response.end(
					JSON.stringify({
						id: "chatcmpl-local",
						object: "chat.completion",
						choices: [{ index: 0, message: { role: "assistant", content: "Local answer." }, finish_reason: "stop" }],
					}),
				);
			});
		});
		await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
		const { port } = /** @type {import("node:net").AddressInfo} */ (server.address());
		const app = createEngine(settings({ baseUrl: `http://127.0.0.1:${port}/v1`, apiKey: "local-placeholder" }));
		const stop = startProvider(app);
		try {
			const [registration] = app.live();
			// What the engine does for a request: the key of the secret setting it was given, sent to the registered address.
			const key = String(app.engine.getSettings()[registration.secretSetting]);
			const response = await fetch(`${registration.baseUrl}/chat/completions`, {
				method: "POST",
				headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
				body: JSON.stringify({ model: registration.models[0].id, messages: [{ role: "user", content: "Hello" }] }),
			});
			const answer = /** @type {{ choices: Array<{ message: { content: string } }> }} */ (await response.json());
			assert.equal(response.status, 200);
			assert.equal(answer.choices[0].message.content, "Local answer.");
			assert.deepEqual(requests, [
				{
					url: "/v1/chat/completions",
					authorization: "Bearer local-placeholder",
					body: { model: "acme-mini-1", messages: [{ role: "user", content: "Hello" }] },
				},
			]);
		} finally {
			stop();
			await new Promise((resolve) => server.close(resolve));
		}
	});
});

describe("the manifest", () => {
	it("declares the engine module, the permissions and the secret the code names", () => {
		assert.equal(manifest.engine, "src/engine.mjs");
		assert.deepEqual(manifest.permissions, ["providers", "network", "secrets"]);
		const secret = manifest.settings.find((/** @type {{ type: string }} */ field) => field.type === "secret");
		assert.equal(secret.key, "apiKey");
	});

	it("targets the SDK version that has the provider port", () => {
		// SDK 1.3.0 is the first release that has the port, so a host before it refuses
		// the plugin by its range instead of loading it without models.
		assert.equal(packageJson.engines["agz-plugin-sdk"], "^1.3.0");
	});

	it("gives every setting the module reads a field, and no price the contract cannot carry", () => {
		const keys = manifest.settings.map((/** @type {{ key: string }} */ field) => field.key);
		for (const key of ["baseUrl", "models", "contextWindow"]) {
			assert.ok(keys.includes(key), `${key} is read by the module but not declared`);
		}
		assert.ok(!keys.includes("inputPricePerMillion") && !keys.includes("outputPricePerMillion"));
	});
});

describe("the settings as the module reads them", () => {
	it("drops repeated ids and reports the ones it cannot use", () => {
		const read = readSettings({ baseUrl: "https://llm.acme.example/v1", models: "a-1, a-1, /b-2, c:3, meta-llama/Llama-3.1-8B" });
		// A slash is a model id character in the SDK's rule, as the local servers name their models.
		assert.deepEqual(read.models, ["a-1", "c:3", "meta-llama/Llama-3.1-8B"]);
		assert.match(read.problems.join("\n"), /not a model id .*: \/b-2/);
	});

	it("stops at eight model ids", () => {
		const ids = Array.from({ length: 10 }, (_, index) => `model-${index}`);
		const read = readSettings({ baseUrl: "https://llm.acme.example/v1", models: ids.join(",") });
		assert.equal(read.models.length, 8);
		assert.match(read.problems.join("\n"), /more than 8 model ids: model-8 is not registered/);
	});
});
