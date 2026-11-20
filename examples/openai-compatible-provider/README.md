# OpenAI-Compatible Provider

An AGZ Code plugin that registers an OpenAI-compatible endpoint as a model provider: an address, a model list, a
context window, and the name of the secret setting that holds the endpoint's key. The plugin never reads that key and
never starts a process. Its module is written against the SDK's own types, so there is no local copy of the contract to
keep in step.

Türkçe: [README.tr.md](./README.tr.md)

## SDK 1.3.0

The published SDK 1.3.0 includes `engine.providers.register()` and the `providers` permission. Use an AGZ Code host
that provides an SDK in the `^1.3.0` range declared in `engines["agz-plugin-sdk"]`. An older host rejects the plugin.
If a host loads the module without the provider API, it logs the reason and registers nothing.

The contract is in `@agz-yazilim/plugin-sdk`: `PluginModelProvider` and `PluginModelProviderModel` from the main entry
point, `PluginEngineAPI`, `PluginEngineFactory` and `PluginProviders` from `unstable`. A model is `id`, `name`,
`contextWindow` and `maxTokens`; the port has no field for a price, an input kind or a reasoning switch, so a value
there would be ignored.

## Files

- `src/engine.mjs`: the engine module (`agzPlugin.engine`). It reads the settings, registers the provider, follows the
  settings while the plugin runs, and removes the provider when the engine stops. It has no runtime dependencies.
- `test/openai-compatible-provider.test.mjs`: runs the module over a hand-made engine whose port has the host's rules,
  and sends one chat request to a local server the test starts.

## How the registration follows the settings

`engine.providers.register({ id, name, baseUrl, models, secretSetting })` contributes the endpoint; the engine derives
the provider id from the plugin's id and `id`, so these models appear under *Example Gateway* and never take another
provider's slot. The registration holds no key: `secretSetting` names the secret field of this plugin, and the engine
reads its value for each request.

- **The answer fits the context window.** `maxTokens` is 4096, or the context window when that is smaller: the
  contract requires that an answer is never longer than the window.
- **A change to the endpoint, the model ids or the window registers again.** The old registration goes first, because
  the engine refuses a second provider with the same id.
- **A change to the key alone registers nothing.** The engine reads the key for each request and checks the provider's
  availability again after the settings were saved, so a new or a cleared key takes effect on the registration that is
  already there. An empty key makes the provider unavailable; the engine does not send the request without one.

## Settings

| Setting | What it does |
|---|---|
| Endpoint base URL | `https`, or `http` to a server on this machine (`127.0.0.1`, `[::1]`, `localhost`). A URL with credentials, a query or a fragment is refused, because a key belongs in the secret store, not in an address. |
| API key | A `secret` field. The module hands its name to the engine as `secretSetting` and never reads the value. An empty value leaves the provider unavailable, so a server that asks for no key needs a placeholder such as `local`. |
| Model ids | The ids the endpoint answers to, comma-separated, at most 8, each 1 to 128 letters, digits, `.`, `_`, `:`, `/` or `-`, starting with a letter or digit. |
| Context window | Tokens one request may hold, for every model in the list. The longest answer is 4096 tokens, or this value when it is smaller. |

The values a new install starts with are design values: the endpoint `https://llm.acme.example/v1`, the model id
`acme-mini-1`, and a context window of 32768. Replace them with the ones the endpoint names.

## A server on this machine

A local OpenAI-compatible server (llama.cpp, vLLM, LM Studio, Ollama) needs no cloud account and no token:

- Endpoint base URL: `http://127.0.0.1:8080/v1` (the port of your server).
- Model ids: the ones it lists, for example `qwen2.5-coder-7b-instruct` or `meta-llama/Llama-3.1-8B-Instruct`.
- API key: any placeholder, for example `local`. An empty secret leaves the provider unavailable, even when the
  server asks for no key.
- Context window: what the model was started with.

## Permissions

| Permission | Why |
|---|---|
| `providers` | The plugin registers a model provider. The engine refuses `register` without it. |
| `network` | The models it registers are reached at a host outside the app. The engine makes the requests; the plugin only names the address. |
| `secrets` | The API key lives in the plugin's secret settings. |

The list is what the user reads before installing; apart from `providers`, the plugin's code is not restricted by it.

## Test

```sh
npm install --ignore-scripts
npm test          # node --test
npx agz plugin check
```

The test needs no account or real token: the only endpoint it talks to is a local
`node:http` server it starts itself. It covers the URL rule (https anywhere, http only to this machine, no key in the
URL), a provider with exactly the contract's fields, `maxTokens` at or under the context window (also a window of
1024), nothing registered for a bad URL or without a model id, the design figures kept when a setting is out of range,
the same registration when only the key changes, a new registration when the endpoint or the models change, removal
when the engine stops, the log line where a host has no provider port, a refused registration, the manifest fields
including `engines`, and one chat request to the local server with the key of the secret setting. It asserts that the
key the test puts in the settings never appears in the registration or in a log line.
