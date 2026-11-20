---
name: my-plugin
description: 'A starting point for a plugin.'
metadata:
  version: 0.1.0
  agz-kind: routed
---

# My Plugin

Replace this body with the procedure agents should follow. Name the tools, say when to use them and what a good result looks like.

- `count_words({text})` (a skill tool, after skill_load) counts the words, lines and characters of a text.
- `my_plugin_echo({text})` (an extension tool) returns the text; an empty text is refused by the plugin's hook.
