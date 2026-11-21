# API reference

The contract of `@agz-yazilim/plugin-sdk`, version 1.5.0: every name the package exports, with its signature and its TSDoc. Members of the host's own API object that are not listed here are outside the contract; see [compatibility](./compatibility.md).

## Runtime

### PluginModelProvider

An OpenAI chat-completions provider a plugin's engine module contributes. The host derives the provider id from the plugin's full id and `id`, so two plugins never share a provider slot, and registers the provider only after the module's factory returned.

The API key is not part of this object: `secretSetting` names a `secret` field of `agzPlugin.settings`, whose value the host reads for each request. A provider without that key is unavailable, not sent unauthenticated.

```ts
interface PluginModelProvider
```

**Members**

- `id: string`

  Unique within the plugin: 1..64 letters, digits, `.`, `_` or `-`, starting with a letter or digit.

- `name: string`

  The name provider and model lists show: 1..80 characters.

- `baseUrl: string`

  The endpoint: an `https` URL, or `http` on a loopback host (`localhost`, `127.0.0.0/8`, `[::1]`) for a local server. No username, password, query or fragment, at most 2048 characters.

- `models: PluginModelProviderModel[]`

  The models it offers: 1 to 32, each id once.

- `secretSetting: string`

  The key of a `secret` field of `agzPlugin.settings` that holds this provider's API key.

### PluginModelProviderModel

One chat model an OpenAI-compatible provider of a plugin offers.

```ts
interface PluginModelProviderModel
```

**Members**

- `id: string`

  The model id the provider's API expects: 1..128 letters, digits, `.`, `_`, `:`, `/` or `-`, starting with a letter or digit.

- `name: string`

  The name a model list shows: 1..80 characters.

- `contextWindow: number`

  The context window in tokens: 1 to 10,000,000.

- `maxTokens: number`

  The most tokens one answer may use: 1 to 1,000,000, and not more than `contextWindow`.

### SDK_VERSION

The version of this SDK, equal to the `version` of its package.json. A plugin's `engines["agz-plugin-sdk"]` range is checked against it. A new optional member of the contract is a minor version; removing or changing one is a major.

```ts
declare const SDK_VERSION: "1.5.0";
```

### Static

The TypeScript type a TypeBox schema describes: `Static<typeof schema>` is the type of the value the schema accepts.

```ts
type Static<T extends TSchema> = TypeBoxStatic<T>
```

### TSchema

The type of every TypeBox schema, the constraint of a tool's `parameters`.

```ts
type TSchema = TypeBoxSchema
```

### Type

The TypeBox builders (`Type.Object`, `Type.String`, ...) that describe a tool's `parameters`. This is the `Type` of the `typebox` package the SDK depends on; the host validates a tool call's arguments against the schema you build.

```ts
declare const Type: typeof import("typebox");
```

### defineTool

Returns the tool definition it is given and keeps the parameter types: `params` of `execute` is inferred from the TypeBox schema. Use it when you assign a tool to a variable or pass it through an array, where the type of `params` would otherwise widen.

```ts
declare const defineTool: <TParams extends TSchema, TDetails = unknown>(tool: ToolDefinition<TParams, TDetails>) => ToolDefinition<TParams, TDetails>;
```

## Plugin API

### ExecOptions

Options of PluginAPI.exec.

```ts
interface ExecOptions
```

**Members**

- `signal?: AbortSignal`

  Aborts and kills the command.

- `timeout?: number`

  Kills the command after this many milliseconds.

- `cwd?: string`

  Working directory. Default: the session's.

### ExecResult

What PluginAPI.exec resolves to. The command's failure is a non-zero `code`, not a rejection.

```ts
interface ExecResult
```

**Members**

- `stdout: string`

  Everything the command wrote to standard output.

- `stderr: string`

  Everything the command wrote to standard error.

- `code: number`

  The exit code.

- `killed: boolean`

  Whether the command was killed by `timeout` or `signal`.

### McpExposure

How the model reaches the tools of an MCP server; the default is `"codemode"`. See `ToolExposure`.

```ts
type McpExposure = "codemode" | "deferred" | "direct" | "hidden"
```

### McpHttpServerConfig

An MCP server the host reaches over HTTP.

```ts
interface McpHttpServerConfig extends McpServerConfigBase
```

**Members**

- `type?: "http"`

- `url: string`

  The server's URL.

- `headers?: Record<string, string>`

  Request headers. Values may reference variables (`${NAME}`) or commands (`!cmd`).

- `exposure?: McpExposure`

  How the model reaches the server's tools. Default: `"codemode"`.

- `description?: string`

  What the server offers, in a sentence. The system prompt lists the server with it and tool search ranks its tools by it.

- `toolExposure?: Record<string, McpExposure>`

  Exposure of single tools, overriding `exposure`. Keys are tool names as the server offers them, or patterns where `*` matches any characters. An exact name wins over patterns.

- `enabled?: boolean`

  Set to `false` to keep the entry without connecting. Default: `true`.

- `timeout?: number`

  Per-request timeout in seconds. Default: 60.

### McpServerConfig

The configuration of an MCP server, for PluginAPI.registerMcpServer.

```ts
type McpServerConfig = McpStdioServerConfig | McpHttpServerConfig
```

### McpStdioServerConfig

An MCP server the host starts as a child process and talks to over stdio.

```ts
interface McpStdioServerConfig extends McpServerConfigBase
```

**Members**

- `type?: "stdio"`

- `command: string`

  The executable.

- `args?: string[]`

  Its arguments.

- `env?: Record<string, string>`

  Environment variables. Values may reference variables (`${NAME}`) or commands (`!cmd`).

- `cwd?: string`

  Working directory. A relative path resolves against the session's working directory.

- `exposure?: McpExposure`

  How the model reaches the server's tools. Default: `"codemode"`.

- `description?: string`

  What the server offers, in a sentence. The system prompt lists the server with it and tool search ranks its tools by it.

- `toolExposure?: Record<string, McpExposure>`

  Exposure of single tools, overriding `exposure`. Keys are tool names as the server offers them, or patterns where `*` matches any characters. An exact name wins over patterns.

- `enabled?: boolean`

  Set to `false` to keep the entry without connecting. Default: `true`.

- `timeout?: number`

  Per-request timeout in seconds. Default: 60.

### PluginAPI

What the host passes to a plugin's factory: the way to register tools, commands, MCP servers and views, to listen to events and to act on the session. The host's object has more members (providers, virtual models, settings, the event bus); they are not part of this contract, so they can change in any release.

```ts
interface PluginAPI
```

**Members**

- `on: <E extends PluginEventName>(event: E, handler: PluginEventHandlers[E]) => () => void`

  Subscribes to an event. Handlers of one event run in registration order; one that throws is reported and the rest still run.

  - **Parameter** `event`: One of `PluginEventName`; the handler's event and result types follow from it.
  - **Returns**: A function that removes the handler.

- `registerTool: <TParams extends TSchema = TSchema, TDetails = unknown>(tool: ToolDefinition<TParams, TDetails>) => void`

  Registers a tool the model (and Code Mode) can call.

- `registerTools: <TParams extends TSchema = TSchema, TDetails = unknown>(tools: readonly ToolDefinition<TParams, TDetails>[]) => void`

  Registers several tools at once. The session's tool registry is rebuilt once for the list, not once per tool. Nothing is registered when a definition is invalid.

- `registerCommand: (name: string, options: PluginCommand) => void`

  Registers a slash command.

- `getPluginSettings: () => Readonly<Record<string, unknown>>`

  The settings of this plugin (`agzPlugin.settings`): the saved values with defaults applied, secrets included. Only this plugin's; `{}` when the package has no manifest id. Read it when needed: `settings_change` fires after the user saves.

- `getPluginPaths: () => PluginPaths`

  The plugin's own folders: where it keeps its data, its cache and its logs, and where it is installed. Use these instead of a path of your own, so that an uninstall knows what belongs to the plugin.

  - **Throws**: When the package has no manifest id (`agzPlugin.id`): only a plugin has folders.

- `registerView: (id: string, view: PluginViewDefinition) => void`

  Registers a view the app draws for this plugin. Only a plugin with a manifest id can, and the id must be declared in `agzPlugin.ui.views`; an undeclared id is reported and not registered.

- `invalidateView: (id: string) => void`

  Asks the app to render a registered view again. Calls in one tick make one request.

- `registerMcpServer: (name: string, config: McpServerConfig) => void`

  Registers an MCP server for this session, with the config of an `mcpServers` entry in the settings. It connects on `session_start` when registered while the plugin loads, right away when registered later. Registering a name again replaces the plugin's earlier registration. The registration is not saved: register again on every load. A configured server of the same name takes precedence.

  - **Throws**: When the config is invalid or another plugin registered the name.

- `unregisterMcpServer: (name: string) => void`

  Removes an MCP server this plugin registered and closes its connection.

- `sendMessage: <T = unknown>(message: CustomMessageInput<T>, options?: SendMessageOptions | undefined) => void`

  Adds a custom message to the session.

- `sendUserMessage: (content: string | (ImageContent | TextContent)[], options?: SendUserMessageOptions | undefined) => void`

  Sends a user message to the agent. It always starts a turn.

- `appendEntry: <T = unknown>(customType: string, data?: T | undefined) => void`

  Appends a custom entry to the session to keep state. It is not sent to the model.

- `exec: (command: string, args: string[], options?: ExecOptions | undefined) => Promise<ExecResult>`

  Runs a command without a shell. A failing command resolves with a non-zero `code`.

### PluginCommand

A slash command for PluginAPI.registerCommand.

```ts
interface PluginCommand
```

**Members**

- `description?: string`

  Shown in the command list.

- `handler: (args: string, ctx: PluginCommandContext) => Promise<void>`

  Runs when the user invokes the command; `args` is the text after the command name.

- `button?: boolean`

  Lets an agent offer the command as a button in its answer (an explain block's `run /<name> <args>` line). The command runs only when the user presses the button, in the session the answer belongs to.

### PluginFactory

What a plugin's extension file exports as its default: it receives the PluginAPI and registers what it offers.

```ts
type PluginFactory = (api: PluginAPI) => void | Promise<void>
```

### PluginPaths

The folders of a plugin, for PluginAPI.getPluginPaths. All are absolute. `data`, `cache` and `logs` belong to the plugin alone and exist when the call returns; `package` is where the plugin is installed and must not be written to.

```ts
interface PluginPaths
```

**Members**

- `data: string`

  Lasting state. It survives updates and a plain uninstall; "uninstall with its data" deletes it.

- `cache: string`

  What can be built again. The user or the host may delete it at any time.

- `logs: string`

  Log files of the plugin and of the processes it starts.

- `package: string`

  The installed package: read-only, and replaced by another folder on every update.

### SendMessageOptions

Options of PluginAPI.sendMessage.

```ts
interface SendMessageOptions
```

**Members**

- `triggerTurn?: boolean`

  Starts a turn for the message.

- `deliverAs?: "followUp" | "nextTurn" | "steer"`

  While the agent runs: `steer` delivers after the current tool calls, `followUp` after the run, `nextTurn` with the next run.

### SendUserMessageOptions

Options of PluginAPI.sendUserMessage.

```ts
interface SendUserMessageOptions
```

**Members**

- `deliverAs?: "followUp" | "steer"`

  While the agent runs: `steer` delivers after the current tool calls, `followUp` after the run.

- `expandPromptTemplates?: boolean`

  Dispatches extension commands and expands skill commands and prompt templates in the text.

## Tools

### ToolAnnotations

Hints about what a tool does, with the meaning of MCP tool annotations. They are the author's claims and are not verified; permission checks can use them to decide which calls to confirm.

```ts
interface ToolAnnotations
```

**Members**

- `readOnlyHint?: boolean`

  The tool does not modify its environment.

- `destructiveHint?: boolean`

  The tool may delete or overwrite data, rather than only add to it. Meaningful when not read-only.

- `idempotentHint?: boolean`

  Repeating a call with the same arguments has no further effect. Meaningful when not read-only.

- `openWorldHint?: boolean`

  The tool reaches an open world of external entities, such as the web, rather than a closed domain.

### ToolDefinition

A tool the model (and Code Mode) can call, for PluginAPI.registerTool.

```ts
interface ToolDefinition<TParams extends TSchema = TSchema, TDetails = unknown>
```

**Members**

- `name: string`

  The name the model uses in a call. Use letters, digits and underscores, and a prefix of your plugin.

- `label: string`

  Short name shown in the user interface.

- `description: string`

  What the tool does, written for the model that reads it: units, limits, failure modes.

- `promptSnippet?: string`

  One line for the "available tools" list of the system prompt. Without it the tool is not listed there.

- `promptGuidelines?: string[]`

  Guideline bullets added to the system prompt while the tool is active.

- `parameters: TParams`

  The parameters, as a TypeBox schema. Arguments are validated against it before `execute` runs.

- `outputSchema?: TSchema`

  JSON Schema of `structuredContent` in successful results. A tool that declares it always sets `structuredContent`.

- `scope?: "main"`

  Restricts the tool to main sessions when set to `"main"`.

- `ownedSessionsOnly?: boolean`

  > **Experimental: the API may change or be withdrawn in any release**

  Expose and run this tool only in a named session owned by its plugin.

- `exposure?: ToolExposure`

  How the model reaches the tool. Default: `"direct"`.

- `annotations?: ToolAnnotations`

  Hints about what the tool does.

- `access?: readonly ToolAccessName[]`

  > **Experimental: the API may change or be withdrawn in any release**

  Access required by this tool, within the plugin manifest's access list.

- `defaultActive?: boolean`

  Whether registering the tool activates it. Default: `true` for `direct` and `model-only` tools; other exposures are never activated on registration.

- `executionMode?: "parallel" | "sequential"`

  `"sequential"`: never runs next to other tool calls. `"parallel"`: may. Default: the host's setting.

- `stopStepOnError?: boolean`

  When a call fails in an in-order step, the remaining calls of the same assistant message are not run; each gets an error result starting with `skipped: `.

- `prepareArguments?: ((args: unknown) => StaticType<[], "Encode", {}, {}, TParams>)`

  Prepares raw arguments before validation, for example to accept an older argument shape. Must return an object that matches `parameters`. A tool of a plugin that declares `agzPlugin.access` may not define it: the host refuses to load such a tool.

- `execute: (toolCallId: string, params: StaticType<[], "Encode", {}, {}, TParams>, signal: AbortSignal | undefined, onUpdate: ToolUpdateCallback<TDetails> | undefined, ctx: ToolContext) => Promise<...>`

  Runs the tool.

  - **Parameter** `toolCallId`: The id of this call.
  - **Parameter** `params`: The validated arguments.
  - **Parameter** `signal`: Aborts when the call is cancelled. `undefined` when the host cannot cancel it.
  - **Parameter** `onUpdate`: Reports partial results; `undefined` when nobody listens.
  - **Parameter** `ctx`: The running session's context.
  - **Returns**: The result. Throw to report a failure as an error result.

### ToolExposure

How the model reaches a tool. "Callable" means callable from other tools through `ctx.executeTool()`, as Code Mode does.

- `direct`: declared to the model and callable. The default.
- `model-only`: declared to the model, never callable from other tools.
- `codemode`: callable from Code Mode scripts; not declared to the model.
- `deferred`: like `codemode`, but Code Mode does not list it; tool search can find it.
- `hidden`: registered but unreachable.

```ts
type ToolExposure = "direct" | "model-only" | "codemode" | "deferred" | "hidden"
```

### ToolResult

What a tool returns, whole or as a partial update.

```ts
interface ToolResult<TDetails = unknown>
```

**Members**

- `content: (ImageContent | TextContent)[]`

  What the model reads: text and images.

- `details: TDetails`

  Free-form data for the user interface and logs; not sent to the model.

- `structuredContent?: JsonValue`

  Machine-readable result that matches the tool's `outputSchema`. Not sent to the model; Code Mode scripts receive it instead of the text content.

- `isError?: boolean`

  Reports a failure without throwing: the model sees `content` as an error result.

- `terminate?: boolean`

  Hint to stop the agent after the current tool batch; takes effect when every result of the batch sets it.

### ToolUpdateCallback

The callback a tool calls to report partial results while it runs.

```ts
type ToolUpdateCallback<TDetails = unknown> = (partialResult: ToolResult<TDetails>) => void
```

## Contexts

### AccessDeniedReason

> **Experimental: the API may change or be withdrawn in any release**

Reasons the host refuses access.

```ts
type AccessDeniedReason = | "declined"
	| "timeout"
	| "aborted"
	| "no_ui"
	| "not_declared"
	| "changed"
	| "off"
	| "untrusted"
	| "subagent"
```

### AccessRequest

> **Experimental: the API may change or be withdrawn in any release**

A request for user approval before a change.

```ts
interface AccessRequest
```

**Members**

- `action: "delete" | "modify" | "send"`

  The action to approve.

- `account?: string`

  The account used, at most 200 characters.

- `target: string`

  The target, at most 500 characters.

- `summary: string`

  A summary, at most 1000 characters.

- `details?: string`

  Exact content, at most 4000 characters.

### AccessTicket

> **Experimental: the API may change or be withdrawn in any release**

An approval that can be invalidated.

```ts
interface AccessTicket
```

**Members**

- `check: () => void`

  Throws if the approval no longer holds.

### ExecuteToolOptions

Options of ToolContext.executeTool.

```ts
interface ExecuteToolOptions
```

**Members**

- `signal?: AbortSignal`

  Aborts the nested call. Defaults to the calling tool's signal.

- `onUpdate?: ToolUpdateCallback<unknown>`

  Receives the nested tool's partial results.

### PluginAccountInfo

> **Experimental: the API may change or be withdrawn in any release**

A declared account's state; its token never reaches plugin code.

```ts
interface PluginAccountInfo
```

**Members**

- `id: string`

- `provider: "google" | "microsoft"`

- `label?: LocalizedText`

- `state: "connected" | "disconnected" | "reconnect_required" | "unavailable" | "unconfigured"`

- `email?: string`

- `grantedScopes: readonly string[]`

- `missingScopes: readonly string[]`

### PluginCommandContext

What a command handler receives: the PluginContext plus what only a user-started command may do.

```ts
interface PluginCommandContext extends PluginContext
```

**Members**

- `waitForIdle: () => Promise<void>`

  Resolves when the agent has finished its running turn.

- `owner?: { readonly plugin: string; readonly name: string; }`

  > **Experimental: the API may change or be withdrawn in any release**

  The calling plugin's owned session, when this extension belongs to its owner.

- `ui: PluginUIContext`

  Asks the user for input and shows notifications.

- `hasUI: boolean`

  Whether a user is attached, so the dialogs of ui can be answered.

- `isSubagent: boolean`

  Whether the engine started this session as a subagent, including a workflow task.

- `cwd: string`

  The session's working directory.

- `signal: AbortSignal | undefined`

  Aborts when the user stops the running turn; `undefined` while the agent is idle.

- `isIdle: () => boolean`

  Whether the agent is idle (not running a turn).

- `isProjectTrusted: () => boolean`

  Whether the user trusts the project folder of this session.

- `abort: () => void`

  Aborts the running turn.

### PluginContext

What an event handler receives next to the event.

```ts
interface PluginContext
```

**Members**

- `owner?: { readonly plugin: string; readonly name: string; }`

  > **Experimental: the API may change or be withdrawn in any release**

  The calling plugin's owned session, when this extension belongs to its owner.

- `ui: PluginUIContext`

  Asks the user for input and shows notifications.

- `hasUI: boolean`

  Whether a user is attached, so the dialogs of ui can be answered.

- `isSubagent: boolean`

  Whether the engine started this session as a subagent, including a workflow task.

- `cwd: string`

  The session's working directory.

- `signal: AbortSignal | undefined`

  Aborts when the user stops the running turn; `undefined` while the agent is idle.

- `isIdle: () => boolean`

  Whether the agent is idle (not running a turn).

- `isProjectTrusted: () => boolean`

  Whether the user trusts the project folder of this session.

- `abort: () => void`

  Aborts the running turn.

### PluginToolAccounts

> **Experimental: the API may change or be withdrawn in any release**

Requests through an engine-owned account.

```ts
interface PluginToolAccounts
```

**Members**

- `get: (accountId: string) => Promise<PluginAccountInfo>`

  Reads a declared account's state.

- `fetch: (accountId: string, url: string, init?: RequestInit | undefined, options?: { readonly ticket?: AccessTicket | undefined; } | undefined) => Promise<Response>`

  Sends to a provider API origin; writes require an approval ticket.

### PluginToolAgentRun

> **Experimental: the API may change or be withdrawn in any release**

Result of an agent run.

```ts
interface PluginToolAgentRun
```

**Members**

- `status: "completed" | "empty" | "partial" | "started" | "timeout"`

  The outcome, or started for a background run.

- `text: string`

  The answer, empty when started in the background.

- `sessionId?: string`

  The agent session identifier, when available.

### PluginToolAgentRunOptions

> **Experimental: the API may change or be withdrawn in any release**

Options for running an agent from this plugin's package.

```ts
interface PluginToolAgentRunOptions
```

**Members**

- `agent: string`

  The package's agent identifier.

- `prompt: string`

  The task given to the agent.

- `description: string`

  A short description shown to the user.

- `background?: boolean`

  Return immediately and deliver the result as a background report.

- `timeoutMs?: number`

  Time limit in milliseconds (1..900000, default 360000).

- `answerReserveMs?: number`

  Time reserved for an answer, from 0 to timeoutMs; default 0.

- `extendReadFor?: { paths: string[]; ms: number; }`

  Paths whose read time may be extended, by up to 60000 milliseconds.

- `tools?: ToolDefinition<TSchema, unknown>[]`

  Up to 32 run-only tools named with the package prefix.

### PluginToolAgents

> **Experimental: the API may change or be withdrawn in any release**

Runs agents declared by this plugin.

```ts
interface PluginToolAgents
```

**Members**

- `run: (options: PluginToolAgentRunOptions) => Promise<PluginToolAgentRun>`

  Starts a run; a foreground run follows the calling tool's abort signal.

### PluginUIContext

The user interface a plugin can ask for. Every method needs PluginContext.hasUI: without a user interface the dialogs resolve to their empty answer (`false`, `undefined`) and `notify` shows nothing.

```ts
interface PluginUIContext
```

**Members**

- `select: (title: string, options: string[], opts?: UIDialogOptions | undefined) => Promise<string | undefined>`

  Shows a list and resolves to the chosen option, or `undefined` when the user dismisses it.

- `confirm: (title: string, message: string, opts?: UIDialogOptions | undefined) => Promise<boolean>`

  Asks a yes/no question and resolves to the answer.

- `input: (title: string, placeholder?: string | undefined, opts?: UIDialogOptions | undefined) => Promise<string | undefined>`

  Asks for one line of text and resolves to it, or `undefined` when the user dismisses it.

- `notify: (message: string, type?: "error" | "info" | "warning" | undefined) => void`

  Shows a short notification. `type` defaults to `"info"`.

### ToolCallOutcome

The outcome of a tool run by ToolContext.executeTool, after hooks ran.

```ts
interface ToolCallOutcome
```

**Members**

- `result: ToolResult<unknown>`

  The tool's result; an error result when the call failed.

- `isError: boolean`

  Whether the call failed.

- `durationMs?: number`

  How long the tool ran, in milliseconds; absent when it did not run.

### ToolContext

The fifth argument of a tool's `execute`: the PluginContext of the running session. The abort signal and the progress callback are the third and fourth arguments of `execute`.

```ts
interface ToolContext extends PluginContext
```

**Members**

- `accounts?: PluginToolAccounts`

  > **Experimental: the API may change or be withdrawn in any release**

  Declared accounts, when available from the host.

- `agents?: PluginToolAgents`

  > **Experimental: the API may change or be withdrawn in any release**

  Package agent runs, in a main session with the agents permission.

- `access: { approve(request: AccessRequest): Promise<AccessTicket>; check(): void; }`

  > **Experimental: the API may change or be withdrawn in any release**

  Approval and continuing access checks for this call.

- `executeTool: (name: string, args: unknown, options?: ExecuteToolOptions | undefined) => Promise<ToolCallOutcome>`

  Runs another tool through the same validation, hooks and checks as a call of the model. It does not reject when the tool fails: unknown tools, invalid arguments, blocked calls and thrown errors come back with `isError: true`.

- `owner?: { readonly plugin: string; readonly name: string; }`

  > **Experimental: the API may change or be withdrawn in any release**

  The calling plugin's owned session, when this extension belongs to its owner.

- `ui: PluginUIContext`

  Asks the user for input and shows notifications.

- `hasUI: boolean`

  Whether a user is attached, so the dialogs of ui can be answered.

- `isSubagent: boolean`

  Whether the engine started this session as a subagent, including a workflow task.

- `cwd: string`

  The session's working directory.

- `signal: AbortSignal | undefined`

  Aborts when the user stops the running turn; `undefined` while the agent is idle.

- `isIdle: () => boolean`

  Whether the agent is idle (not running a turn).

- `isProjectTrusted: () => boolean`

  Whether the user trusts the project folder of this session.

- `abort: () => void`

  Aborts the running turn.

### UIDialogOptions

Options of a dialog the plugin opens through PluginUIContext.

```ts
interface UIDialogOptions
```

**Members**

- `signal?: AbortSignal`

  Dismisses the dialog when aborted.

- `timeout?: number`

  Dismisses the dialog after this many milliseconds.

### isAccessDenied

> **Experimental: the API may change or be withdrawn in any release**

Recognizes the host's access denial across SDK and host module boundaries.

```ts
declare const isAccessDenied: (error: unknown) => error is Error & { reason: AccessDeniedReason; };
```

## Events and messages

### AgentEndEvent

Fired when the agent stops running.

```ts
interface AgentEndEvent
```

**Members**

- `type: "agent_end"`

- `messages: SessionMessage[]`

  The messages of the run.

### AgentStartEvent

Fired when the agent starts running.

```ts
interface AgentStartEvent
```

**Members**

- `type: "agent_start"`

### AssistantMessage

A message the model wrote.

```ts
interface AssistantMessage
```

**Members**

- `role: "assistant"`

- `content: (TextContent | ThinkingContent | ToolCallContent)[]`

  The text, reasoning and tool calls, in order.

- `provider: string`

  The provider that produced it.

- `model: string`

  The model that produced it.

- `stopReason: "aborted" | "deferred" | "error" | "length" | "pending" | "stop" | "toolUse"`

  Why the model stopped.

- `errorMessage?: string`

  The error text when `stopReason` is `"error"`.

- `timestamp: number`

  When the request started, in milliseconds since the Unix epoch.

### BeforeAgentStartCustomEvent

Fired at the start of an agent run that a custom message starts.

```ts
interface BeforeAgentStartCustomEvent
```

**Members**

- `type: "before_agent_start"`

- `messageType: "custom"`

  The run starts from a custom message.

- `systemPrompt: string`

  The system prompt as it stands, after earlier handlers.

- `message: CustomMessage<unknown>`

  The message that starts the run.

### BeforeAgentStartEvent

Fired before an agent run starts.

```ts
type BeforeAgentStartEvent = BeforeAgentStartUserEvent | BeforeAgentStartCustomEvent
```

### BeforeAgentStartEventResult

What a `before_agent_start` handler may change for this run.

```ts
interface BeforeAgentStartEventResult
```

**Members**

- `message?: CustomMessageInput<unknown>`

  A custom message added before the run.

- `systemPrompt?: string`

  Replaces the whole system prompt for this run. Later handlers see the replacement.

- `sections?: Record<string, string>`

  > **Experimental: the API may change or be withdrawn in any release**

  Named sections for this plugin's owned session.

### BeforeAgentStartUserEvent

Fired at the start of every agent run that a user message or a custom message with `triggerTurn` starts.

```ts
interface BeforeAgentStartUserEvent
```

**Members**

- `type: "before_agent_start"`

- `messageType: "user"`

  The run starts from a user message.

- `systemPrompt: string`

  The system prompt as it stands, after earlier handlers.

- `prompt: string`

  The user's prompt text.

- `images?: ImageContent[]`

  Images attached to the prompt.

### CustomEntryDraft

An entry a handler adds to the session when a turn ends, kept in the session but not sent to the model.

```ts
interface CustomEntryDraft
```

**Members**

- `type: "custom"`

- `customType: string`

  Names the kind of entry.

- `data?: unknown`

  The data to keep.

### CustomMessage

A message a plugin or the host added with `sendMessage`.

```ts
interface CustomMessage<TDetails = unknown>
```

**Members**

- `role: "custom"`

- `customType: string`

  Names the kind of message; yours, chosen when you sent it.

- `content: string | (ImageContent | TextContent)[]`

  The text, or text and images.

- `display: boolean`

  Whether the user interface shows it.

- `details?: TDetails`

  Data for the user interface; not sent to the model.

- `timestamp: number`

  When the message was created, in milliseconds since the Unix epoch.

### CustomMessageEntryDraft

A message entry a handler adds to the session when a turn ends.

```ts
interface CustomMessageEntryDraft
```

**Members**

- `type: "custom_message"`

- `customType: string`

  Names the kind of message.

- `content: string | (ImageContent | TextContent)[]`

  The text, or text and images.

- `display: boolean`

  Whether the user interface shows it.

- `details?: unknown`

  Data for the user interface; not sent to the model.

### CustomMessageInput

The fields of a custom message a plugin supplies.

```ts
interface CustomMessageInput<TDetails = unknown>
```

**Members**

- `customType: string`

  Names the kind of message.

- `content: string | (ImageContent | TextContent)[]`

  The text, or text and images.

- `display: boolean`

  Whether the user interface shows it.

- `details?: TDetails`

  Data for the user interface; not sent to the model.

### HostMessage

A message the host keeps in the session for its own use. Only its role and time are part of the contract.

```ts
interface HostMessage
```

**Members**

- `role: "bashExecution" | "branchSummary" | "compactionSummary" | "system"`

- `timestamp: number`

  When the message was created, in milliseconds since the Unix epoch.

### InputEvent

Fired when user input arrives, before the agent processes it.

```ts
interface InputEvent
```

**Members**

- `type: "input"`

- `text: string`

  The input text.

- `images?: ImageContent[]`

  Attached images.

- `source: "extension" | "interactive" | "rpc"`

  Where the input came from.

- `streamingBehavior?: "followUp" | "steer"`

  How the input is delivered while the agent runs; `undefined` while it is idle.

### InputEventResult

What an `input` handler decides: `continue` leaves the input as it is, `transform` replaces it, `handled` consumes it so the agent never sees it.

```ts
type InputEventResult = | { action: "continue" }
	| { action: "transform"; text: string; images?: ImageContent[] }
	| { action: "handled" }
```

### PluginEventName

The names of the events a plugin can subscribe to with PluginAPI.on.

```ts
type PluginEventName = | "session_start"
	| "session_shutdown"
	| "settings_change"
	| "tool_call"
	| "tool_result"
	| "input"
	| "turn_start"
	| "turn_end"
	| "agent_start"
	| "agent_end"
	| "before_agent_start"
	| "session_compaction_state"
	| "session_compact"
```

### PluginHandler

An event handler: the event and the context in, an optional result out (possibly later).

```ts
type PluginHandler<E, R = undefined> = (event: E, ctx: PluginContext) => Promise<R | void> | R | void
```

### SessionCompactEvent

Fired after the host compacted the session's context: earlier messages are now a summary, so a note the plugin added to the conversation before may be gone. The host's object has more fields; only these are part of the contract.

Example: a handler whose note went into the conversation clears its "note added" flag here, so the next run adds the note again.

```ts
interface SessionCompactEvent
```

**Members**

- `type: "session_compact"`

- `reason: string`

  What started the compaction: `"manual"`, `"threshold"`, `"overflow"`, `"idle"` or `"expired"`.

### SessionCompactionStateEvent

Fired right before the host summarizes (compacts) the session's context. The handler may return a few plain lines of the plugin's live state; the host puts them in the summary's state block under the plugin's id, so the model still knows that state after the compaction. A handler has 3 seconds; a throw or a timeout is named in the block instead.

Example: a handler that keeps a work list returns `{ stateLines: "- [open] write the docs" }`, and the summary then says `worklist state:` followed by that line.

```ts
interface SessionCompactionStateEvent
```

**Members**

- `type: "session_compaction_state"`

- `reason: string`

  What started the compaction: `"manual"`, `"threshold"`, `"overflow"`, `"idle"` or `"expired"`.

### SessionCompactionStateResult

What a `session_compaction_state` handler returns.

```ts
interface SessionCompactionStateResult
```

**Members**

- `stateLines?: string`

  A few plain lines of the plugin's state (cut at about 1000 characters); empty or absent adds nothing.

### SessionMessage

A message of the session. Switch on `role` to read it.

```ts
type SessionMessage = UserMessage | AssistantMessage | ToolResultMessage | CustomMessage | HostMessage
```

### SessionShutdownEvent

Fired before the plugin's code is torn down: on quit, reload or session replacement. Release resources here.

```ts
interface SessionShutdownEvent
```

**Members**

- `type: "session_shutdown"`

- `reason: "fork" | "new" | "quit" | "reload" | "resume"`

  Why the plugin is shut down.

- `targetSessionFile?: string`

  The session file that replaces this one, when the session is replaced.

### SessionStartEvent

Fired when a session starts, is loaded or reloaded.

```ts
interface SessionStartEvent
```

**Members**

- `type: "session_start"`

- `reason: "fork" | "new" | "reload" | "resume" | "startup"`

  Why the session started.

- `previousSessionFile?: string`

  The session file that was active before. Present for `"new"`, `"resume"` and `"fork"`.

### SettingsChangeEvent

Fired when the user saved the plugin's settings.

```ts
interface SettingsChangeEvent
```

**Members**

- `type: "settings_change"`

- `settings: Readonly<Record<string, unknown>>`

  What PluginAPI.getPluginSettings returns now.

### ThinkingContent

Reasoning text of an assistant message.

```ts
interface ThinkingContent
```

**Members**

- `type: "thinking"`

- `thinking: string`

  The reasoning text.

### ToolCallContent

A call of a tool inside an assistant message.

```ts
interface ToolCallContent
```

**Members**

- `type: "toolCall"`

- `id: string`

  The id of the call; the tool result message carries the same id.

- `name: string`

  The tool's name.

- `arguments: JsonObject`

  The arguments the model sent.

### ToolCallEvent

Fired before a tool executes. A handler can block the call. `input` is mutable: change it in place to patch the arguments, and later handlers see the change. The arguments are not validated again.

```ts
interface ToolCallEvent
```

**Members**

- `type: "tool_call"`

- `toolCallId: string`

  The call's id.

- `parentToolCallId?: string`

  Set when another tool (for example a Code Mode script) made this call.

- `toolName: string`

  The tool's name.

- `input: Record<string, unknown>`

  The arguments.

### ToolCallEventResult

What a `tool_call` handler decides.

```ts
interface ToolCallEventResult
```

**Members**

- `block?: boolean`

  Blocks the call. To change the arguments instead, mutate `event.input`.

- `reason?: string`

  The text the model sees as the error when the call is blocked.

- `terminate?: boolean`

  Hint to stop the agent after the current tool batch when this call is blocked. It takes effect when every result of the batch sets it.

### ToolResultEvent

Fired after a tool executed. A handler can change the result.

```ts
interface ToolResultEvent
```

**Members**

- `type: "tool_result"`

- `toolCallId: string`

  The call's id.

- `parentToolCallId?: string`

  Set when another tool made this call.

- `toolName: string`

  The tool's name.

- `input: Record<string, unknown>`

  The arguments the tool ran with.

- `content: (ImageContent | TextContent)[]`

  What the model will read.

- `details: unknown`

  The tool's `details`.

- `structuredContent?: JsonValue`

  The tool's `structuredContent`.

- `isError: boolean`

  Whether the call failed.

### ToolResultEventResult

What a `tool_result` handler changes. Fields it leaves out stay as they are, except that replacing `content` without returning `structuredContent` drops the structured content, because it may no longer match. Return both to keep it.

```ts
interface ToolResultEventResult
```

**Members**

- `content?: (ImageContent | TextContent)[]`

  Replaces what the model reads.

- `details?: unknown`

  Replaces the details.

- `structuredContent?: JsonValue`

  Replaces the structured content.

- `isError?: boolean`

  Replaces the error flag.

### ToolResultMessage

The result of a tool call, as the model sees it.

```ts
interface ToolResultMessage
```

**Members**

- `role: "toolResult"`

- `toolCallId: string`

  The id of the call this answers.

- `toolName: string`

  The tool's name.

- `content: (ImageContent | TextContent)[]`

  What the model reads.

- `isError: boolean`

  Whether the call failed.

- `timestamp: number`

  When the result was created, in milliseconds since the Unix epoch.

### TurnEndEvent

Fired at the end of every turn.

```ts
interface TurnEndEvent
```

**Members**

- `type: "turn_end"`

- `turnIndex: number`

  The turn's index within the run, from 0.

- `message: SessionMessage`

  The assistant message the turn produced.

- `toolResults: ToolResultMessage[]`

  The results of the tools the turn called.

- `outcome: "aborted" | "completed" | "error"`

  How the run ended; known when this turn is the last one.

### TurnEndEventResult

What a `turn_end` handler may change.

```ts
interface TurnEndEventResult
```

**Members**

- `entries?: (CustomEntryDraft | CustomMessageEntryDraft)[]`

  Entries added to the session.

- `continue?: boolean`

  Ensures the agent makes one more request after this turn.

### TurnStartEvent

Fired at the start of every turn (one model request and the tool calls it asks for).

```ts
interface TurnStartEvent
```

**Members**

- `type: "turn_start"`

- `turnIndex: number`

  The turn's index within the run, from 0.

- `timestamp: number`

  When the turn started, in milliseconds since the Unix epoch.

### UserMessage

A message the user wrote.

```ts
interface UserMessage
```

**Members**

- `role: "user"`

- `content: string | (ImageContent | TextContent)[]`

  The text, or text and images.

- `timestamp: number`

  When the message was created, in milliseconds since the Unix epoch.

## Content

### ImageContent

An image in a message or a tool result.

```ts
interface ImageContent
```

**Members**

- `type: "image"`

- `data: string`

  Base64-encoded image data.

- `mimeType: string`

  The media type, for example `image/png`.

### JsonObject

A JSON object: string keys with JSON values.

```ts
type JsonObject = { [key: string]: JsonValue }
```

### JsonValue

Any JSON value.

```ts
type JsonValue = null | boolean | number | string | readonly JsonValue[] | JsonObject
```

### TextContent

A piece of text in a message or a tool result.

```ts
interface TextContent
```

**Members**

- `type: "text"`

- `text: string`

  The text.

## Manifest

### AccessName

> **Experimental: the API may change or be withdrawn in any release**

Access switches a plugin may declare.

```ts
type AccessName = "read" | "subagents" | "modify" | "send" | "delete" | "download" | "automations"
```

### LocalizedText

Text in the app's two languages.

```ts
interface LocalizedText
```

**Members**

- `en: string`

  English.

- `tr: string`

  Turkish.

### PluginAccountDeclaration

> **Experimental: the API may change or be withdrawn in any release**

An OAuth account declared by a plugin.

```ts
interface PluginAccountDeclaration
```

**Members**

- `id: string`

  Lowercase account id, unique within the plugin.

- `provider: "google" | "microsoft"`

  OAuth provider.

- `scopes: string[]`

  Requested provider scopes.

- `label?: LocalizedText`

  Name shown to the user.

### PluginBinaries

Each executable name maps to the platforms it supports.

```ts
type PluginBinaries = Record<string, Partial<Record<PluginBinaryTarget, PluginBinary>>>
```

### PluginBinary

One packaged build of a native executable.

```ts
interface PluginBinary
```

**Members**

- `path: string`

  Package-relative executable path.

- `sha256: string`

  SHA-256 of the packaged executable, lowercase hex.

### PluginBinaryTarget

Exact platform and architecture of the engine that runs a native executable.

```ts
type PluginBinaryTarget = | "linux-x64"
	| "linux-arm64"
	| "darwin-x64"
	| "darwin-arm64"
	| "win32-x64"
	| "android-arm64"
```

### PluginManifest

The `agzPlugin` field of a plugin's `package.json`. Resource paths are relative to the package root.

```ts
interface PluginManifest
```

**Members**

- `schemaVersion: 1`

  The manifest format version. Always 1.

- `id: string`

  The plugin's id: `<publisher>/<name>` in lowercase letters, digits, `.`, `_` and `-` (a bare `<name>` is accepted). No two installed plugins share one.

- `name?: string`

  The display name.

- `description?: string`

  What the plugin does.

- `publisher?: string`

  Who publishes it.

- `homepage?: string`

  The plugin's home page (https).

- `icon?: string`

  One package-relative png, webp or svg file (at most 32 KB) shown for the plugin.

- `extensions?: string[]`

  Extension code files, which export a PluginFactory.

- `skills?: string[]`

  Skill folders or files.

- `prompts?: string[]`

  Prompt templates.

- `themes?: string[]`

  Themes.

- `agents?: string[]`

  Agent definitions.

- `systemPrompt?: string`

  One package-relative JSON file of system prompt edits; its content is a PluginSystemPrompt.

- `engine?: string`

  One package-relative module (ts, mts, js or mjs) the host loads once while the plugin is enabled, not once per session. Its default export is a `PluginEngineFactory` of `@agz-yazilim/plugin-sdk/unstable`.

- `binaries?: PluginBinaries`

  Platform-specific executables for the engine module, with the native and process permissions.

- `mcpServers?: Record<string, McpServerConfig>`

  MCP servers the plugin brings, by name (at most 16). The host registers them in every session that loads the plugin, as `registerMcpServer` would, and lists them without running plugin code. In a stdio server's `command`, `args`, `cwd` and `env` values, `${pluginDir}` stands for the installed package folder; `cwd` defaults to it.

- `userContent?: PluginUserContent[]`

  Places outside the plugin's own folders where it keeps what belongs to the user. An uninstall never deletes them.

- `permissions?: PluginPermission[]`

  What the plugin needs; the user sees the list before installing. A statement, not a sandbox.

- `settings?: PluginSettingField[]`

  The plugin's settings form, in order (at most 32 fields). The host stores the values, not the package.

- `ui?: PluginUiManifest`

  UI the app draws for the plugin.

- `contributes?: Record<string, PluginJson>`

  JSON data for other plugins, keyed `<plugin id>/<key>` (at most 16 keys, 64 KiB each), for example `"agz/bots/templates"`. An object holding only `$file` names a package-relative UTF-8 file. The addressed plugin reads it with `engine.contributions(key)`.

- `access?: AccessName[]`

  > **Experimental: the API may change or be withdrawn in any release**

  Access switches, off by default; when present must include read.

- `accessNotes?: Partial<Record<AccessName, LocalizedText>>`

  > **Experimental: the API may change or be withdrawn in any release**

  Localized details for declared access switches.

- `accounts?: PluginAccountDeclaration[]`

  > **Experimental: the API may change or be withdrawn in any release**

  OAuth accounts; requires the accounts permission and access declaration.

### PluginPermission

What a plugin can say it needs: `network` (talks to other hosts), `filesystem` (files outside its own folders and the session's project), `process` (starts programs), `native` (ships and runs its own binaries), `ui` (adds its own code to the app's window), `secrets` (keeps credentials), `sessions` (reads or drives other sessions), `memory` (the general memory), `git` (changes the project's repository), `notifications` (notifies the user), `usage` (reads the provider quotas and usage figures), `providers` (contributes model providers). The engine module's `notify` needs `notifications`, its `quotas` needs `usage` and its `providers` needs `providers`: without the permission the call throws.

```ts
type PluginPermission = | "network"
	| "filesystem"
	| "process"
	| "native"
	| "ui"
	| "secrets"
	| "sessions"
	| "memory"
	| "git"
	| "notifications"
	| "usage"
	| "automations"
	| "agents"
	/** View the design assigned to a session; does not choose or remove designs or run servers. */
	| "designer"
	/** Contribute model providers to the engine's model list (`engine.providers.register`). */
	| "providers"
	/** Use engine-owned OAuth accounts. */
	| "accounts"
```

### PluginSettingEnumOption

One choice of an `enum` setting.

```ts
interface PluginSettingEnumOption
```

**Members**

- `value: string`

  The stored value.

- `label: LocalizedText`

  What the user sees.

### PluginSettingField

One field of `agzPlugin.settings`; also the field vocabulary of a view's `form` block. The type decides the value: `string`, `number`, `boolean` and `enum` store a value (with an optional default); a `secret` is write-only: it has no default and the app never shows it again, only its last characters. A string field may request a multiline input.

```ts
type PluginSettingField = | (PluginSettingBase & {
			type: "string";
			default?: string;
			/** Maximum UTF-16 length: 1–4096, or 1–32768 when multiline is true. Defaults to 4096. */
			maxLength?: number;
			/** A text area for several lines instead of a one-line input. */
			multiline?: boolean;
	  })
	| (PluginSettingBase & { type: "number"; default?: number; min?: number; max?: number; integer?: boolean })
	| (PluginSettingBase & { type: "boolean"; default?: boolean })
	| (PluginSettingBase & { type: "enum"; options: PluginSettingEnumOption[]; default?: string })
	| (PluginSettingBase & { type: "secret" })
```

### PluginToolView

Decorates the card of a tool the same plugin registered. `key` is a dotted path of property names (`total`, `page.items`). The view only adds to the card: the full arguments and result stay reachable.

```ts
interface PluginToolView
```

**Members**

- `tool: string`

  The name of the tool this decorates.

- `card?: "agent"`

  Draws and groups the tool as an agent card.

- `title?: LocalizedText`

  The card's title.

- `subject?: { from: PluginToolViewSource; key: string; }`

  A short subject line.

- `facts?: { label: LocalizedText; from: PluginToolViewSource; key: string; values?: Record<string, LocalizedText> | undefined; }[]`

  Label and value pairs. `values` maps up to 32 raw values (keys of 1–64 characters) to localized labels; unmatched values are shown as they are.

- `sections?: { label: LocalizedText; from: PluginToolViewSource; key: string; as: PluginToolViewSectionAs; }[]`

  Larger parts of the card.

### PluginToolViewSectionAs

How a tool card section draws its value.

```ts
type PluginToolViewSectionAs = "text" | "json" | "kv" | "list" | "markdown"
```

### PluginToolViewSource

Where a tool card part reads its value: the call's arguments or its result (structured content, else JSON parsed from the text).

```ts
type PluginToolViewSource = "args" | "result"
```

### PluginUiManifest

What `agzPlugin.ui` declares: tool card decorations, views and the interface module.

```ts
interface PluginUiManifest
```

**Members**

- `toolViews?: PluginToolView[]`

  Decorations of the plugin's own tool cards.

- `views?: PluginViewDeclaration[]`

  Views the plugin registers.

- `module?: PluginUiModuleDeclaration`

  The interface module, when the plugin draws some of its views or its settings itself.

### PluginUiModuleDeclaration

The plugin's interface module: one prebuilt ESM file (js or mjs, at most 4 MiB) the app loads into its own window and runs there. It is written with `@agz-yazilim/plugin-ui`. A manifest with a module must declare the permission `ui`, and the user allows the module on each device before it runs.

```ts
interface PluginUiModuleDeclaration
```

**Members**

- `entry: string`

  The package-relative path of the built module.

- `settings?: boolean`

  The module draws a part of the plugin's settings page (its `settings` component).

### PluginUserContent

A place where a plugin keeps the user's own work, such as designs or documents: `project:<relative path>` under the session's project folder, or `home:<relative path>` under the AGZ Code home folder.

```ts
interface PluginUserContent
```

**Members**

- `path: string`

  `project:<relative path>` or `home:<relative path>`.

- `description: LocalizedText`

  What is kept there, in a few words.

### PluginViewDeclaration

A view the plugin may register with PluginAPI.registerView (one at an engine place: with the engine module's `registerView`).

```ts
interface PluginViewDeclaration
```

**Members**

- `id: string`

  The id `registerView` is called with.

- `title: LocalizedText`

  The view's title.

- `icon: PluginViewIcon`

  The view's icon.

- `place: PluginViewPlace`

  Where the app shows it.

- `refreshSeconds?: number`

  Only with `place: "statusbar"`: the app renders the view again this often (1 to 3600 seconds) while it shows it. Without it the view is rendered again only after `invalidateView` or an action.

### PluginViewIcon

The icons a view may name (kebab-case Lucide names).

```ts
type PluginViewIcon = | "activity"
	| "blocks"
	| "book-open"
	| "bookmark"
	| "bot"
	| "box"
	| "boxes"
	| "bell"
	| "bug"
	| "calendar"
	| "chart-bar"
	| "chart-line"
	| "chart-pie"
	| "clock"
	| "cloud"
	| "code"
	| "cpu"
	| "database"
	| "file-text"
	| "folder"
	| "gauge"
	| "git-branch"
	| "globe"
	| "hard-drive"
	| "heart"
	| "image"
	| "key"
	| "layout-dashboard"
	| "link"
	| "list"
	| "list-checks"
	| "lock"
	| "mail"
	| "map"
	| "memory-stick"
	| "message-square"
	| "package"
	| "play"
	| "plug"
	| "puzzle"
	| "rocket"
	| "search"
	| "server"
	| "settings"
	| "shield"
	| "sparkles"
	| "star"
	| "table"
	| "tag"
	| "terminal"
	| "user"
	| "users"
	| "workflow"
	| "wrench"
	| "zap"
```

### PluginViewPlace

Where the app shows a view. `panel`: a tab of a session's right panel. `sidebar`: a page of a project. `composer`: a bar above a session's composer; an empty render hides it. `statusbar` (an item in the app's status bar with a panel that opens from it), `session` (a part of a session's screen) and `settings` (a part of the plugin's settings page) belong to the engine, not to a session, so the plugin's engine module (`agzPlugin.engine`) registers them.

```ts
type PluginViewPlace = "panel" | "sidebar" | "statusbar" | "composer" | "session" | "settings"
```

### ToolAccessName

> **Experimental: the API may change or be withdrawn in any release**

Access names a tool may declare.

```ts
type ToolAccessName = "read" | "modify" | "send" | "delete" | "download"
```

## System prompt edits

### PluginPromptAddOp

Adds a block to a section. Allowed in every section, including the closed ones.

```ts
interface PluginPromptAddOp
```

**Members**

- `op: "add"`

- `section: string`

  The id of the section that gets the block.

- `after?: string`

  The block the new one follows. Without it, or when it names no block, the new block goes to the end of the section.

- `id: string`

  The new block's id, unique in its list and in the prompt. Start it with your plugin id.

- `text: string`

  The block's text, 1 to 20,000 characters.

### PluginPromptAddSectionOp

Adds a section with its blocks.

```ts
interface PluginPromptAddSectionOp
```

**Members**

- `op: "add-section"`

- `after?: string`

  The section the new one follows. Without it, or when it names no section, the new section goes to the end of the prompt.

- `id: string`

  The new section's id, unique in its list and in the prompt. Start it with your plugin id.

- `heading: string`

  The section's heading, 1 to 200 characters.

- `blocks: PluginPromptBlock[]`

  The section's blocks, at most 100.

### PluginPromptBlock

A block of a new section, for PluginPromptAddSectionOp.

```ts
interface PluginPromptBlock
```

**Members**

- `id: string`

  The new block's id, unique in its list: lowercase letters and digits joined by single `.` or `-`. Start it with your plugin id.

- `text: string`

  The block's text, 1 to 20,000 characters.

### PluginPromptOp

One edit of the system prompt; switch on `op`.

```ts
type PluginPromptOp = | PluginPromptReplaceOp
	| PluginPromptRemoveOp
	| PluginPromptAddOp
	| PluginPromptAddSectionOp
```

### PluginPromptRemoveOp

Removes an existing block. `base` works as in PluginPromptReplaceOp. Not allowed in the closed sections.

```ts
interface PluginPromptRemoveOp
```

**Members**

- `op: "remove"`

- `target: string`

  The id of the block to remove.

- `base: string`

  The hash of the block's current text.

### PluginPromptReplaceOp

Replaces the text of an existing block. `base` must equal the hash of the block's current engine text; after an engine update changes that text the op is `stale` and does not apply. Not allowed in the closed sections.

```ts
interface PluginPromptReplaceOp
```

**Members**

- `op: "replace"`

- `target: string`

  The id of the block to replace, such as `base.working.ground-claims`.

- `base: string`

  The first 16 hex characters of the SHA-256 of the block's current text; Settings > Agents > System prompt lists it.

- `text: string`

  The new text, 1 to 20,000 characters.

### PluginSystemPrompt

The JSON file `PluginManifest.systemPrompt` names: edits of the agent system prompt, as data and not as code. `all` applies to every agent; `agents` holds one list per agent id, applied to that agent only, and for one target its op wins over the `all` op. Each list holds at most 200 ops. A list may change a target (`replace` or `remove`) once, and may declare a new id once. The `replace` and `remove` ops are not allowed in the closed sections `identity`, `role`, `instructions-and-trust` and `approval-modes`; the engine shows them as `locked`. The text of the whole file (every `text`, heading and block text) is at most 32,768 characters. A field this type does not name makes the engine refuse the whole file. A user's edit in Settings wins over a plugin's edit of the same target.

```ts
interface PluginSystemPrompt
```

**Members**

- `all?: PluginPromptOp[]`

  Edits for every agent.

- `agents?: Record<string, PluginPromptOp[]>`

  Edits per agent id.

## Views

### PluginGitDiff

One file's diff; `binary` and `too_large` come without hunks.

```ts
interface PluginGitDiff
```

**Members**

- `path: string`

- `origPath?: string`

- `staged: boolean`

- `kind: "binary" | "text" | "too_large"`

- `change: "added" | "copied" | "deleted" | "modified" | "renamed" | "unchanged"`

- `hunks: PluginGitHunk[]`

- `additions: number`

- `deletions: number`

### PluginGitDiffLine

One line of a hunk.

```ts
interface PluginGitDiffLine
```

**Members**

- `kind: "add" | "context" | "del"`

- `text: string`

- `oldLine?: number`

- `newLine?: number`

- `noNewline?: boolean`

  The line has no newline at the end of the file.

### PluginGitDiffRequest

What `diff` takes: a path of the status, the source path of a rename, the staged side, the lines of context.

```ts
interface PluginGitDiffRequest
```

**Members**

- `path: string`

- `origPath?: string`

- `staged?: boolean`

- `context?: number`

### PluginGitFileStatus

One changed file of the session's repository. Paths are relative to the repository root.

```ts
interface PluginGitFileStatus
```

**Members**

- `path: string`

- `origPath?: string`

  The source of a rename or copy.

- `index: PluginGitStatusLetter`

  Staged side: HEAD against the index.

- `worktree: PluginGitStatusLetter`

  Unstaged side: the index against the work tree.

- `kind: "changed" | "renamed" | "unmerged" | "untracked"`

- `score?: number`

  Rename or copy similarity, 0 to 100.

- `added?: number`

  Added and removed lines in the work tree, when textual.

- `removed?: number`

- `statKind?: PluginGitNumstatKind`

- `stagedAdded?: number`

  Added and removed lines in the index, when textual.

- `stagedRemoved?: number`

- `stagedStatKind?: PluginGitNumstatKind`

- `submodule?: boolean`

  The entry is a submodule.

- `editedBy?: { sessionId: string; agentId?: string | undefined; tool: string; at: number; }`

  The last agent tool call of this engine that wrote the file, when known.

### PluginGitHunk

One hunk of a file's diff.

```ts
interface PluginGitHunk
```

**Members**

- `header: string`

  The `@@ -a,b +c,d @@ section` line.

- `oldStart: number`

- `oldLines: number`

- `newStart: number`

- `newLines: number`

- `lines: PluginGitDiffLine[]`

### PluginGitNumstatKind

Why a line count is absent.

```ts
type PluginGitNumstatKind = "binary" | "too_large" | "unavailable"
```

### PluginGitStatus

The state of the session's repository.

```ts
interface PluginGitStatus
```

**Members**

- `root: string`

  The repository's work tree root.

- `prefix: string`

  The session's directory relative to `root` (`""`: the root itself).

- `branch: string | null`

  The current branch; `null` when HEAD is detached.

- `head: string | null`

  The HEAD commit; `null` before the first commit.

- `upstream?: string`

- `ahead?: number`

- `behind?: number`

- `files: PluginGitFileStatus[]`

  Staged, unstaged and untracked files; ignored files are not listed.

- `truncated: boolean`

- `revision: string`

  Changes when the repository's state does.

### PluginGitStatusLetter

One status letter of a changed file: `.` unchanged, `M` modified, `T` type changed, `A` added, `D` deleted, `R` renamed, `C` copied, `U` unmerged, `?` untracked.

```ts
type PluginGitStatusLetter = "." | "M" | "T" | "A" | "D" | "R" | "C" | "U" | "?"
```

### PluginJson

A JSON value, at most 8 levels deep.

```ts
type PluginJson = null | boolean | number | string | PluginJson[] | { [key: string]: PluginJson }
```

### PluginText

Text that does not depend on the language, or one string per language.

```ts
type PluginText = string | LocalizedText
```

### PluginView

What `render` returns. A view is data the app draws with its own components; no plugin code runs in the app. The host refuses a view whole when it breaks a cap: 20 sections, 50 blocks per section, 200 characters of title, 10000 characters of text, 20000 of code, 100 items per list or key-value block, 12 table columns, 200 table rows, 32 form fields, 240 values per series, 5 series per chart, 4096 characters of a button payload and 262144 characters of JSON for the whole view.

```ts
interface PluginView
```

**Members**

- `status?: PluginViewStatus`

  Only for a view declared with `place: "statusbar"`: what the item shows in the bar. Without it the item shows the view's icon and title.

- `sections: PluginViewSection[]`

  The sections, in order. For a status bar view they are the panel that opens from the item.

### PluginViewActionInput

What the app sent with an action: the button's `payload` or the form's `values`.

```ts
interface PluginViewActionInput
```

**Members**

- `blockId: string`

  The id of the button or form that sent it.

- `payload?: PluginJson`

  The button's payload.

- `values?: Readonly<Record<string, PluginViewFieldValue>>`

  The form's values.

### PluginViewActionResult

An action reports a failure by throwing or by returning `{ error }`; the app shows the text.

```ts
interface PluginViewActionResult
```

**Members**

- `error?: string`

  The text the app shows as the failure.

### PluginViewBlock

One block of a section. Switch on `kind`.

```ts
type PluginViewBlock = | (BlockBase & {
			kind: "designPreview";
			screen: string;
			state?: string;
			width?: number;
			theme?: string;
			locale?: string;
	  })
	| (BlockBase & { kind: "text"; text: PluginText; muted?: boolean })
	| (BlockBase & { kind: "keyValue"; items: Array<{ label: PluginText; value: PluginText }> })
	| (BlockBase & {
			kind: "metric";
			label: PluginText;
			value: string | number;
			hint?: PluginText;
			tone?: PluginViewTone;
	  })
	| (BlockBase & {
			/** One figure with its facts and its recent values as a small line. */
			kind: "stat";
			icon?: PluginViewIcon;
			label: PluginText;
			value: string | number;
			tone?: PluginViewTone;
			/** Short facts under the value; at most 6. */
			details?: PluginText[];
			/** The recent values, oldest first; at most 240, none negative. */
			series?: number[];
			/** Fixes the line's scale (100 for a percentage); otherwise the largest value sets it. */
			max?: number;
	  })
	| (BlockBase & {
			/** A chart of up to 5 series over the same points. */
			kind: "chart";
			type: PluginViewChartType;
			/** The chart's accessible name. */
			label: PluginText;
			/** The names of the points; as many as the longest series. */
			x?: string[];
			/** At most 240 values per series. */
			series: Array<{ name: PluginText; values: number[]; tone?: PluginViewTone }>;
			/** Fixes the scale's top. */
			max?: number;
			/** Written after a value, for example `%` or `ms`. */
			unit?: string;
	  })
	| (BlockBase & {
			/** A share of a whole as a ring. */
			kind: "ring";
			label: PluginText;
			value: number;
			/** The whole; default 100. */
			max?: number;
			/** What the ring reads as; default the percent. */
			text?: string;
			hint?: PluginText;
			tone?: PluginViewTone;
	  })
	| (BlockBase & {
			kind: "table";
			/** `align: "end"` puts a column of numbers against its right edge. */
			columns: Array<{ key: string; label: PluginText; align?: "start" | "end" }>;
			/** At most 200 rows; more go through an action. The keys are column keys. */
			rows: Array<Record<string, PluginViewCell>>;
			empty?: PluginText;
	  })
	| (BlockBase & { kind: "list"; items: Array<{ text: PluginText; description?: PluginText }>; ordered?: boolean })
	| (BlockBase & { kind: "badge"; text: PluginText; tone?: PluginViewTone })
	| (BlockBase & { kind: "alert"; tone: Exclude<PluginViewTone, "neutral">; title?: PluginText; text: PluginText })
	| (BlockBase & { kind: "code"; code: string; language?: string })
	| (BlockBase & { kind: "progress"; label?: PluginText; value: number; max?: number })
	| (BlockBase & { kind: "empty"; title: PluginText; description?: PluginText })
	| {
			kind: "button";
			id: string;
			label: PluginText;
			/** The action name `PluginViewDefinition.action` receives. */
			action: string;
			payload?: PluginJson;
			variant?: PluginViewButtonVariant;
			/** A question the app asks before it runs the action. */
			confirm?: PluginText;
	  }
	| {
			kind: "form";
			id: string;
			/** The `agzPlugin.settings` vocabulary; a field's `key` is its stable id. */
			fields: PluginSettingField[];
			/** Current values of the non-secret fields. */
			values?: Record<string, PluginViewFieldValue>;
			submit: { label: PluginText; action: string; confirm?: PluginText };
	  }
	| {
			kind: "link";
			id: string;
			label: PluginText;
			/** http or https only; the app opens it externally and shows the host. */
			url: string;
	  }
	| (BlockBase & {
			/** The plugin's own page, drawn in a frame kept apart from the app. Experimental: it may change in a minor SDK version. */
			kind: "htmlFrame";
			/** The whole page (at most 65536 characters); the app draws no script of it. */
			html: string;
			/** Pixels, 48 to 800. */
			height?: number;
			title?: PluginText;
	  })
	| (BlockBase & {
			/** A button whose click the app runs itself, without asking the plugin. Experimental: it may change in a minor SDK version. */
			kind: "action";
			label: PluginText;
			/** What the app runs: no `plugins.view.action` round trip. */
			action: PluginViewClientAction;
	  })
```

### PluginViewButtonVariant

How a button looks.

```ts
type PluginViewButtonVariant = "primary" | "secondary" | "destructive"
```

### PluginViewCell

The content of a table cell.

```ts
type PluginViewCell = PluginText | number | boolean | null
```

### PluginViewChartType

How a `chart` block draws its series.

```ts
type PluginViewChartType = "line" | "area" | "bar"
```

### PluginViewClientAction

> **Experimental: the API may change or be withdrawn in any release**

What an `action` block runs in the app: open a session, put `text` into its composer (at most 8000 characters), or show one of its transcript entries.

```ts
type PluginViewClientAction = | { type: "openSession"; sessionId: string }
	| { type: "prefillComposer"; sessionId: string; text: string }
	| { type: "inspectEntry"; sessionId: string; entryId: string }
```

### PluginViewContext

What `render` and `action` receive.

```ts
interface PluginViewContext
```

**Members**

- `locale: PluginViewLocale`

  The client's language.

- `cwd: string`

  The session's working directory; for a view the engine module registered, the user's home directory.

- `statusOnly?: boolean`

  A status bar view whose panel is closed: only `status` is shown, so `render` may return no sections.

- `session?: { readonly sessionId: string; readonly name: string; }`

  > **Experimental: the API may change or be withdrawn in any release**

  The plugin's own session a view declared with `place: "session"` is rendered for: the session's id and the name the app shows it under. Absent for a view at any other place.

- `signal: AbortSignal`

  Aborts when the host's time limit passes.

- `git?: PluginViewGit`

  Read-only Git of the session; absent without the permission `git`, for a sidebar or status bar view, or in a host without it.

### PluginViewDefinition

A view for PluginAPI.registerView.

```ts
interface PluginViewDefinition
```

**Members**

- `render: (ctx: PluginViewContext) => PluginView | Promise<PluginView>`

  Returns the view. It must not change anything: the host calls it whenever the app needs the view.

- `action?: ((name: string, input: PluginViewActionInput, ctx: PluginViewContext) => void | PluginViewActionResult | Promise<...>)`

  Runs the action a button or form of the view named. Return `{ error }` or throw to report a failure.

### PluginViewFieldValue

A value a `form` field holds. A secret field's value is never sent back to the app.

```ts
type PluginViewFieldValue = string | number | boolean
```

### PluginViewGit

Read-only access to the Git repository of the session that shows the view. Present only when the plugin's manifest lists the permission `git` and the view is shown in a session; it works only during the `render` or `action` call it came with.

```ts
interface PluginViewGit
```

**Members**

- `status: () => Promise<PluginGitStatus>`

  The changed files of the session's repository.

- `diff: (request: PluginGitDiffRequest) => Promise<PluginGitDiff>`

  One file's diff.

### PluginViewLocale

The app's two languages. The host passes the client's language to `render`.

```ts
type PluginViewLocale = "en" | "tr"
```

### PluginViewSection

A group of blocks, with an optional title.

```ts
interface PluginViewSection
```

**Members**

- `id?: string`

  Unique within the view.

- `title?: PluginText`

  The section's heading.

- `collapsed?: boolean`

  Draws the section closed until the user opens it by its title, which it then needs.

- `blocks: PluginViewBlock[]`

  The blocks, in order.

### PluginViewStatus

What a status bar view shows in the bar: at most 4 readouts. With none the item is not shown.

```ts
interface PluginViewStatus
```

**Members**

- `items: PluginViewStatusItem[]`

### PluginViewStatusItem

One readout of a status bar item: a short label and its value.

```ts
interface PluginViewStatusItem
```

**Members**

- `label?: PluginText`

  For example `CPU`.

- `value: string`

  At most 40 characters, for example `12%`.

- `tone?: PluginViewTone`

  Colours the value.

- `ring?: number`

  Draws a ring filled to this percent (0 to 100) before the value.

### PluginViewTone

The colour role of a metric, badge or alert.

```ts
type PluginViewTone = "neutral" | "info" | "success" | "warning" | "danger"
```
