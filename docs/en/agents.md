# Agents

In a session, a **lead** (the main agent) runs the work. The lead reads your request, does the work or hands bounded parts to specialist agents, checks the result and reports to you. Each specialist works in its own context, so your conversation does not grow with theirs.

Specialists cannot start other specialists or reach another session. Only the lead does that.

## Roles

| Role | What it does | Changes files? |
|---|---|---|
| lead | Owns the request, does the work or splits it, verifies and reports | Yes |
| explorer | Searches the code quickly; gives every finding with its file path and line number | No |
| researcher | Answers one question from code and current web sources, with its sources and open doubts | No |
| analyst | Answers by measuring data, logs and code; keeps its scripts for a rerun | No |
| worker | Makes one bounded change, runs the project's checks and reports with evidence | Yes |
| verifier | Tests a delivery through the user's eyes and scores each criterion with screenshots. Does not change the delivery | No |
| advisor | The lead's second opinion: reads code and memory and gives a read-only recommendation. Does not search the web; only the lead calls it | No |

Two helper agents also exist: the skill developer turns skill handoffs into tested skills, and the skill maintainer repairs and merges existing skills.

## Workflows and parallel work

The lead can split a large job into several parts and run them in parallel. This is a workflow: its parts run in waves. You can pause, resume or cancel a workflow.

Parallel specialists cannot change the same file at the same time. The [safety page](./safety.md#two-subagents-on-one-file) explains the rule.

## Goals and the to-do list

- **To-do list:** a multi-step job turns into a to-do list above the session.
- **Goal:** goals come from the preinstalled AGZ plugin `agz/goal`, not from the engine. Set one with `/goal <objective>`; acceptance criteria may follow on lines that start with `- `. An agent can also offer `run /goal <objective>` as a button, and the goal starts only when you press it. The goal bar above the composer is the plugin's own view.
  - After every run the agent continues by itself, until it claims with evidence that the goal is complete, or that it is impossible. Only then does a judge run.
  - The judge is a real model call: the session's model, or the model in the plugin's `judgeModel` setting. It answers met, not yet, or impossible. A not-yet answer lists the concrete items still missing, and the agent gets that list. Repeated rejections do not pause the goal.
  - When the judge call fails, the claim stays and the judge asks again after a wait that grows with each failure.
  - When the agent needs you, it asks with a block of kind `needs_user` instead of blocking. The goal then waits for you and resumes with your next message.
  - A goal continues on its own 25 times by default (the plugin's `continuationAllowance` setting), then stops until you resume it.

## Bots

Bots are agents that outlive a single session. Each has its own folder, memory and permissions. Bots live under `~/.agz-code/bots/` and appear in Settings > Bots.

- **Main bot:** your main conversation. It hands incoming work to the right bot or does it itself, sets the bots' schedules and creates new ones.
- **Fixed bot:** a bot with one session and one folder. It does its job from the instructions in its `BOT.md` file.
- **Memory maintenance bot:** merges duplicate records, splits mixed ones and restores records deleted by mistake.

A plugin can bring a bot template, but no bot is created until you approve it.
