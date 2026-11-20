import { defineTool, type PluginAPI, type PluginView, Type } from "@agz-yazilim/plugin-sdk";

interface Task {
	id: number;
	title: string;
	done: boolean;
}

export default function (agz: PluginAPI) {
	// Kept for the session only. A plugin that must keep it longer writes it into its data folder (see the storage template).
	const tasks: Task[] = [];
	let nextId = 1;

	const add = (title: string): Task => {
		const task = { id: nextId++, title, done: false };
		tasks.push(task);
		// The app draws the view again; the plugin never draws anything itself.
		agz.invalidateView("tasks");
		return task;
	};

	agz.registerTool(
		defineTool({
			name: "my_plugin_add_task",
			label: "My Plugin add task",
			description: "Add a task to the session's task list, which the user sees in the Tasks panel. Returns the task's id and the number of open tasks.",
			parameters: Type.Object({ title: Type.String({ description: "What is to be done.", minLength: 1, maxLength: 200 }) }),
			exposure: "codemode",
			outputSchema: {
				type: "object",
				properties: { id: { type: "number" }, open: { type: "number" } },
				required: ["id", "open"],
			},
			execute: async (_toolCallId, params) => {
				const task = add(params.title);
				const result = { id: task.id, open: tasks.filter((entry) => !entry.done).length };
				// The tool card reads `open` from the structured content (agzPlugin.ui.toolViews).
				return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result, details: result };
			},
		}),
	);

	agz.registerView("tasks", {
		// Returns data, changes nothing: the host calls it whenever the app needs the view.
		render(): PluginView {
			return {
				sections: [
					{
						blocks: [
							{
								kind: "form",
								id: "new-task",
								fields: [{ type: "string", key: "title", label: { en: "New task", tr: "Yeni görev" }, maxLength: 200 }],
								submit: { label: { en: "Add", tr: "Ekle" }, action: "add" },
							},
						],
					},
					{
						title: { en: "Tasks", tr: "Görevler" },
						blocks: [
							{
								kind: "table",
								id: "tasks",
								columns: [
									{ key: "id", label: "#" },
									{ key: "title", label: { en: "Task", tr: "Görev" } },
									{ key: "done", label: { en: "Done", tr: "Bitti" } },
								],
								rows: tasks.map((task) => ({ id: task.id, title: task.title, done: task.done })),
								empty: { en: "No tasks yet.", tr: "Henüz görev yok." },
							},
							...tasks
								.filter((task) => !task.done)
								.map((task) => ({
									kind: "button" as const,
									id: `done-${task.id}`,
									label: { en: `Finish #${task.id}`, tr: `#${task.id} bitti` },
									action: "done",
									payload: { id: task.id },
								})),
						],
					},
				],
			};
		},
		// Runs what a button or a form of the view named. The host draws the view again afterwards.
		action(name, input) {
			if (name === "add") {
				const title = input.values?.title;
				if (typeof title !== "string" || title.trim() === "") return { error: "A task needs a title." };
				add(title.trim());
				return undefined;
			}
			if (name === "done") {
				const payload = input.payload;
				const id = typeof payload === "object" && payload !== null && !Array.isArray(payload) ? payload.id : undefined;
				const task = tasks.find((entry) => entry.id === id);
				if (task === undefined) return { error: "That task is gone." };
				task.done = true;
				return undefined;
			}
			return { error: `Unknown action ${name}.` };
		},
	});
}
