# Testing a plugin

Plugin tests run with `node --test` through `agz plugin test`. They use `createMockHost` from `@agz-yazilim/plugin-kit/testing`, which runs a plugin's tools, hooks, commands and views without the app. The mock follows the engine's rules for registration, argument schemas, hook order and views. The engine's own tests load the two example plugins with code, `issue-tracker` and `command-guard`, into the mock and into the real engine, then compare what each registers and what the plugin does when it runs. The skill-only example, `release-notes`, is checked in the engine alone.

## A first test

`create` writes the test as `test/<id>.test.ts`. For the id `my-plugin`, the template's test runs its echo tool and its hook:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../extensions/index.ts";

test("my_plugin_echo returns the text it was given", async () => {
	const host = createMockHost();
	await host.load(plugin);
	const run = await host.runTool("my_plugin_echo", { text: "hello" });
	assert.equal(run.isError, false);
	assert.deepEqual(run.content, [{ type: "text", text: "hello" }]);
});

test("my_plugin_echo refuses an empty text with the reason its tool_call hook gives", async () => {
	const host = createMockHost();
	await host.load(plugin);
	const run = await host.runTool("my_plugin_echo", { text: "" });
	assert.equal(run.isError, true);
	assert.match(JSON.stringify(run.content), /needs a non-empty text/);
});
```

This test passes no `dir`, so the plugin has no manifest id. Pass `dir` as soon as the test covers views or settings.

## Create the host

`createMockHost(options)` takes these options, all optional:

- `dir`: the plugin folder. Its `package.json` gives the plugin id, the declared view ids and the settings form. Without it, `registerView` refuses every view and `getPluginSettings()` returns `{}`, as in the host.
- `settings`: the saved values by field key, secrets included. Only the fields the manifest declares reach `getPluginSettings()`, with their defaults applied.
- `storageDir`: where `getPluginPaths()` puts the plugin's `data`, `cache` and `logs` folders. The default is a temporary folder made on the first call. Give a folder of the test to read what the plugin wrote, or to run a second session over the same data, and delete it afterwards.
- `cwd`: the session's working directory. The default is `process.cwd()`. It is `ctx.cwd` and the default directory of `exec`.
- `sessionId`: the id of the mocked session, which `sessionApi(api).sessionId` and `host.session.sessionId` return. The default is `"mock-session"`.
- `ui`: scripted answers for the dialogs of `ctx.ui`. Without `ui`, `ctx.hasUI` is `false` and the dialogs return their empty answers.
- `exec`: the answer to `api.exec`. Without it, `exec` rejects, because unit tests start no process.

## Load and run

- `await host.load(factory, extensionPath?)` runs the plugin's factory the way the host does. It resolves to `{ ok: true }` or `{ ok: false, error }`; a throw in the factory is reported as `Failed to load extension: <message>`. Loading again replaces the earlier load, as a reload does.
- `host.runTool(name, params, { signal?, toolCallId? })` runs a tool the way a model call does: argument preparation, schema validation, the `tool_call` hooks, `execute`, then the `tool_result` hooks. A failure resolves with `isError: true`; it does not reject. The call throws only when no tool of that name is visible: a tool with exposure `hidden` is unreachable and throws too. The result holds the tool's `content`, `details` and `structuredContent`, and also `isError`, `updates` (the partial results), `toolCallId` and, when the tool ran, `durationMs`.
- `host.runCommand(name, args?)` runs a slash command and resolves to `{ ok: true }`, or to `{ ok: false, error }` when the handler throws. It throws for an unknown name. When two extensions register the same command name, they are called `name:1` and `name:2`.
- `host.emit(event, payload?)` fires an event and resolves to what the host makes of the handlers' results: `tool_call` gives the first block or input change, `turn_end` gives `{ entries, continue }`, and `before_agent_start` gives the custom messages and the replaced system prompt. Fields the host always fills have defaults, so most payloads need only their own fields.
- `host.renderView(id, { locale?, timeoutMs? })` calls the view's `render` and checks the result against the view caps and shape. It resolves to `{ ok: true, view }` or `{ ok: false, error }`. The time limit is 5000 ms for `render`, 30000 ms for an action. It throws for an unregistered id.
- `host.runViewAction(id, action, input?)` calls the view's `action` and resolves to `{ ok: true }` or `{ ok: false, error }`. The view is invalidated afterwards. It throws for an unregistered id.
- `host.setSettings(next)` saves the values and fires `settings_change` with the new `getPluginSettings()`.

## Read what the plugin did

- `host.tools`, `host.commands`, `host.views` and `host.mcpServers` list what was registered, after the host's conflict rules.
- `host.issues` lists what the host would refuse or report, each with its `kind` (`load`, `view`, `tool`, `handler` or `settings`). `host.describeIssues()` prints them as lines. `host.loadErrors` lists the load errors.
- `host.sent` lists the messages and entries that reached the session, in order. `host.uiLog` lists the `ctx.ui` calls with their answers. `host.execs` lists the `api.exec` calls with their working directory. `host.invalidations` lists the view invalidations, and `host.aborts` counts `ctx.abort()` calls.

## Script the answers

`ui` answers a dialog in one of three forms: a single value answers every call; an array answers one call per entry, in order, and a call after the last entry fails; a function decides each call. When `ui` is given, a dialog method without a scripted answer throws in the plugin's code. Inside a tool the throw becomes an error result; inside an event handler it is reported as an issue. Without `ui`, the dialogs return their empty answers.

The `exec` responder receives the command, its arguments and its options, and returns `{ stdout?, stderr?, code?, killed? }`; the fields left out are `""`, `0` and `false`. To mimic a command that could not start, answer `code: 1` with the reason in `stderr`, as the host does. A throw in the responder rejects `exec`.

## Test plugin access

Use an engine and SDK that support the [experimental access API](./extension-api.md#tool-access-and-approval). Pass the plugin folder as `dir` so `createMockHost` reads its manifest and access list (`access` gives one to a plugin without a folder), turn switches on with `host.setAccess(name, enabled)` (a plugin loaded from another folder has its own, `setAccess(name, enabled, pluginId)`), and script the approval dialog with `createMockHost({ ui: {}, approve })`: `"approve"`, `"decline"`, `"timeout"` or a function of the request, where an answer that arrives after the call's signal aborted is a refusal. `createMockEngine` reads the same switches from its `settings` (`access_read`, `access_automations`), returns them read-only in `getSettings()` and `onSettingsChange`, and gates the automation sources: `engine.listAutomationSources()` and `engine.emitAutomationEvent(sourceId, event)` list and deliver only while `access_read` and `access_automations` are on, checked at every call. Use a fake service adapter that records calls, and check the side effect, not just the tool result: a refusal must leave the adapter's send log empty.

Cover these cases in a host that implements the gate:

- With the switches absent or Read off, neither tool runs. In a trusted project with Read on, the read tool runs. An untrusted project is refused even with the switches on.
- With `isSubagent: true` in the mock, a read needs the subagent switch too; a send is refused even when every switch is on. A headless main session cannot send either.
- In a main session with a UI, test both confirmation answers. After a yes, also test changing a switch or the plugin's settings while approval is pending: the ticket's `check()` must stop the send.

A kit that does not implement this gate can still test the service adapter, but cannot prove that the engine refuses a call. Test those refusals in AGZ Code itself, using a trusted test project and a fake service, not a live mailbox.

## Test accounts

Pass `accounts: { mail: { state: "connected", email: "user@example.test", respond: request => new Response("{}") } }` to `createMockHost` or `createMockEngine`, with `dir` naming the plugin whose manifest declares `mail`. The responder receives a `Request` without credentials; it never contacts the provider. Set the Read switch with `host.setAccess("read", true)` or engine `settings: { access_read: true }`. Script 401 and success responses to test the retry, and a 3xx response to test that redirects are not followed. Also test an undeclared id, a wrong origin, an Authorization header, a disconnected or `reconnect_required` account, a write without approval, an invalidated ticket, Graph's read exceptions, and subagent and engine write refusals. The mock cannot verify a real OAuth refresh or browser sign-in; use the engine's integration tests for those.

## Test an engine module

The mock host runs extension code. The mock engine runs the engine module: `createMockEngine({ dir })` reads the plugin's manifest, `start()` loads the module `agzPlugin.engine` names (or runs a factory you pass), and `stop()` aborts its signal and calls the function it returned.

```ts
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createMockEngine } from "@agz-yazilim/plugin-kit/testing";

test("the engine module writes its state, serves its status bar view and stops", async () => {
	const storageDir = mkdtempSync(join(tmpdir(), "my-plugin-"));
	const engine = createMockEngine({ dir: join(import.meta.dirname, ".."), storageDir, settings: { intervalSeconds: 3600 } });
	await engine.start();
	try {
		assert.ok(existsSync(join(storageDir, "data", "heartbeat.json")));
		const rendered = await engine.renderView("queue", { locale: "en", statusOnly: true });
		assert.deepEqual(rendered, { ok: true, view: { status: { items: [{ label: "Queue", value: "0", tone: "neutral" }] }, sections: [] } });
	} finally {
		await engine.stop();
		rmSync(storageDir, { recursive: true, force: true });
	}
});
```

| Member | What it does |
|---|---|
| `start(factory?)`, `stop()`, `running` | Runs and stops the module. `start` rejects when the module has no default export that is a function, or when the factory throws. |
| `views`, `renderView(id, { locale, statusOnly, timeoutMs })`, `runViewAction(id, action, input)` | The status bar views the module registered, checked as the host checks them: the same caps, time limits and error texts. |
| `setSettings(values)` | Saves new settings and calls the module's `onSettingsChange` listeners. |
| `call(method, params?, { timeoutMs })` | Calls a method the module registered with `engine.handle`, as the app does: `{ ok: true, result }` with the JSON the app would get, or `{ ok: false, code, error }` (`not_found` or `failed`) with the host's message. |
| `setSubscribers(topic, count)`, `published` | Says how many clients watch a topic (the module's `onSubscribers` listeners hear it), and lists what the module published on topics that had a subscriber. |
| `notices`, `setQuotas(quotas)` | The notices that reached the user through `engine.notify`, in both languages (one past the limit of 6 a minute is not listed), and the provider quotas `engine.quotas.list()` answers; `setQuotas` also calls the module's `onChange` listeners. The permissions are checked as in the host. |
| `setStats(stats)` | Sets what `engine.host.stats()` answers; the option `stats` sets the first answer and `version` the engine version. |
| `logs`, `invalidations` | The lines the module logged, and the ids of the views that were invalidated. |

Stop the module in a `finally` block: a timer it left running keeps the test process alive after a failed assertion. To test the module together with a tool that reads its files, give the mock host the same `storageDir`; both then use `<storageDir>/data`. The `engine-module` template and the `uptime-monitor` example in `agz-plugin-base` do this.

## Test the session API

A plugin that uses the [unstable session API](./extension-api.md#the-session-api-unstable) gets it from the mock host too: `sessionApi(api)` returns a session, and `host.session` is the controller a test scripts it with. It plays the host's part: it ends runs, moves branches, wakes the plugin and answers its model calls. The `sessionId` option names the session.

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../extensions/index.ts";

test("the plugin delivers three passes, then clears its drive record", async () => {
	const host = createMockHost();
	await host.load(plugin);
	for (let pass = 1; pass <= 3; pass++) {
		await host.session.settle();
		assert.equal(host.session.deliveries.length, pass);
		assert.equal(host.session.state.get("passes"), 3 - pass);
	}
	await host.session.settle();
	assert.equal(host.session.deliveries.length, 3);
	assert.equal(host.session.drive.get(), undefined);
});
```

| Member | What it does |
|---|---|
| `settle(run?)` | Ends a whole run: the fields left out of `run` get the values of a run that completed (`run-<n>`, no tool calls, no tokens, no error, no pending input, no child). The `onSettled` listeners run one at a time in registration order, and a listener that throws is an issue while the rest still run. Resolves to the summary they were called with. |
| `changeBranch(branch?)` | Moves the session to another branch, as a tree navigation or a fork does: the `onBranchChange` listeners run and the plugin reads the state of the new branch. Without an id, a fresh branch starts with no state. |
| `wake(event?)` | Wakes the plugin for its drive record and awaits the `onWake` listeners. `reason` defaults to `"restart"` and `drive` to the plugin's record. It throws when there is no record, because the host wakes only a plugin that drives its session. |
| `setTranscript(entries)` | Sets the active branch's transcript that `transcript()` reads. `id`, `role` and `at` have defaults (`entry-<n>`, `user`, a fixed time). |
| `answerComplete(answer)` | Scripts `complete`: one answer for every call, an array with one answer per call, or a function of the request. A call after the last entry of an array fails the test; a plugin that calls `complete` with nothing scripted gets an `error` answer. To test a failure, answer with an `error`. |
| `deliveries`, `nextDelivery(result)` | The messages `deliver` sent, with their options and the result each resolved to, and a script for what the next `deliver` resolves to (`started`, `queued` or `written`). With nothing scripted `deliver` resolves to `written`, because the mock starts no run. Each message is also in `host.sent`. |
| `state` | The plugin's state per branch: `get(key)`, `set(key, value)`, `all()`, `of(branch)` and the active `branch`. |
| `drive` | The drive record: `get()`, `set(record)` and `clear()`, to read it or to set the starting point without the plugin. |

The mock keeps no time of its own: a drive record's `wakeAt` wakes nothing. Call `wake({ reason: "timer" })` where the host would have woken the plugin at that time.

## What the mock does not do

- The mock host and the mock engine are two objects: the mock host loads extension code only, and the engine module runs in `createMockEngine`. They share no state except the files under one `storageDir`.
- The mock has one set of setting values. Which value of a project-scoped field applies (the project's or the user's) is decided by the host; give the mock the value the test is about.
- `exec` starts no process. You script the answer.
- No MCP server is started, and the `oauth` and `auth` fields of an HTTP server are not checked. A server the manifest declares (`mcpServers`) is not registered by the mock; test the server program itself, as the `mcp-server` template does.
- The mock starts no session and no model, and it has no sandbox and no approval prompt; `host.session` only scripts what the host would do, and it starts no run for a delivered message. A tool that passes here can still be refused in the app.
- Loading an extension again keeps the plugin's session state and drive record but drops the session listeners of the code it replaced, as a reload does.
- Which tools are offered to the model in a session is not simulated: `runTool` runs any visible tool.
- Tool arguments are checked against TypeBox schemas. The coercion the host applies to plain JSON Schema objects is not reproduced.
- The result of a `turn_end` handler is not checked: `entries` and `continue` are taken as the handler returns them.

Before you ship, run the plugin in the app: link its folder in Settings > Plugins and call the tool from a Code Mode script.
