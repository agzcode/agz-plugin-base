# First session

The first time you open the app, a six-step setup wizard appears. Each step makes one decision. The wizard opens while no provider is set up and the setup has not been finished before. An installation that already has a provider never sees it. You can change every setting later in Settings.

Continue moves the wizard forward. From the third step on, "Skip the rest" goes straight to the project step; skipped steps keep their default values.

## Welcome

It says that setup takes about a minute. Your keys stay on this computer. Only your prompts and the files the agent reads go to the provider you pick.

## Connect a provider

The agent needs a model to answer. On first run four providers are offered: Anthropic (Claude account or API key), OpenAI (ChatGPT account or API key), OpenRouter (API key, many models) and Google (Gemini API key).

- **Sign-in:** the "Sign in with …" button, named after the provider, opens a sign-in page in your browser.
- **Key:** paste the key and choose "Connect key". The app asks the provider to check the key, for up to 10 seconds. If the provider rejects the key, it is not saved. If the provider cannot be reached, it is not saved either; check your connection and try again. A provider without a key check saves the key, but marks it as not verified.

## Main model and helper models

Pick one of the provider's models. The recommended model is selected first. The list shows each model's price per million tokens. You can change the model from the message box at any time.

The helper models are on the "Details" screen of this step. Both are optional, do not replace the main model, and are off on a new installation:

| Helper | What it does | Cost | What it sends |
|---|---|---|---|
| Decision model | Picks skills and sorts results | A small model; a daily token limit | Prompt excerpts, to OpenRouter or TypeSafe |
| Semantic search (embeddings) | Lets memory search match by meaning | Per use; 5 million tokens a day | Memory notes and skill text, to OpenRouter |

The decision model needs an OpenRouter account or a TypeSafe key. Embeddings need OpenRouter. Connect the account in Settings > Provider logins, then turn the helper on.

While they are off:

- Memory search matches words only. The search result says that meaning search is not in use.
- Judgements that depend on the decision model are skipped. A skipped judgement is not a "no" answer.

## Spending cap

An optional daily cap in US dollars, at list price, counted across all sessions. Leave it empty for no cap. When the cap is reached, work pauses and waits; you can resume it or raise the cap at any time. The daily cap opens again when the day changes. You can set session and token caps in Settings > Usage and cost.

## Approvals

For each of the five risky action classes, you decide whether the agent asks you first. The step starts with all five on Allow. "Ask before these" sets all five to Ask. The classes and how the question window works are on the [safety page](./safety.md#approvals). Change them later in Settings > Approvals.

## Project and trust

Choose the folder the agent works in ("Choose folder…"). Then decide whether to trust it:

- **Trust this folder:** its `AGENTS.md` file, its skills and its MCP servers load.
- **Don't trust:** none of them load. You can change this later in Settings.

Instruction files and scripts in a folder you do not trust can change how the agent behaves. Trust only the folders you know.

## Your first message

The app suggests a first prompt: it asks the agent to look through the folder, say what it does, how to run it and whether anything looks broken. Edit it or replace it. "Start first session" opens the session.

Write your message in the session. The lead (main agent) does the work or hands its parts to specialist agents. [The agents page](./agents.md) explains who they are and what they do. You can undo the agent's file edits from the Changes panel.
