import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { describe, it } from "node:test";
import { addDays, daysBetween, weekday } from "../server/dates.mjs";

const root = join(import.meta.dirname, "..");

describe("calendar arithmetic", () => {
	it("counts days across a leap day and across a year", () => {
		assert.deepEqual(daysBetween({ from: "2024-02-28", to: "2024-03-01" }), { days: 2, weeks: 0, remainingDays: 2 });
		assert.deepEqual(daysBetween({ from: "2025-02-28", to: "2025-03-01" }), { days: 1, weeks: 0, remainingDays: 1 });
		assert.deepEqual(daysBetween({ from: "2025-12-25", to: "2026-01-08" }), { days: 14, weeks: 2, remainingDays: 0 });
	});

	it("counts backwards as a negative number", () => {
		assert.deepEqual(daysBetween({ from: "2025-03-10", to: "2025-03-01" }), { days: -9, weeks: -1, remainingDays: -2 });
	});

	it("is not moved by a daylight saving change", () => {
		// Europe changed its clocks on 2025-03-30; a calendar day is still one day.
		assert.equal(daysBetween({ from: "2025-03-29", to: "2025-03-31" }).days, 2);
	});

	it("adds and subtracts days over month and year ends", () => {
		assert.deepEqual(addDays({ date: "2025-01-31", days: 1 }), { date: "2025-02-01", weekday: "Saturday" });
		assert.deepEqual(addDays({ date: "2025-01-01", days: -1 }), { date: "2024-12-31", weekday: "Tuesday" });
		assert.deepEqual(addDays({ date: "2024-02-28", days: 2 }), { date: "2024-03-01", weekday: "Friday" });
	});

	it("gives the ISO week, also where it belongs to another year", () => {
		assert.deepEqual(weekday({ date: "2025-06-18" }), { weekday: "Wednesday", isoWeek: 25, isoYear: 2025 });
		assert.deepEqual(weekday({ date: "2024-12-30" }), { weekday: "Monday", isoWeek: 1, isoYear: 2025 });
		assert.deepEqual(weekday({ date: "2021-01-03" }), { weekday: "Sunday", isoWeek: 53, isoYear: 2020 });
	});

	it("refuses what is not a day of the calendar", () => {
		assert.throws(() => weekday({ date: "2025-02-30" }), /date is not a day of the calendar: 2025-02-30/);
		assert.throws(() => weekday({ date: "18.06.2025" }), /date must be a date as YYYY-MM-DD/);
		assert.throws(() => addDays({ date: "2025-01-01", days: 1.5 }), /days must be a whole number/);
	});
});

describe("the declared server", () => {
	/** Starts the server the way the host does: `${pluginDir}` in the declaration is the package folder. */
	function startServer() {
		const config = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).agzPlugin.mcpServers["date-tools"];
		const expand = (value) => value.replaceAll("${pluginDir}", root);
		const child = spawn(expand(config.command), config.args.map(expand), { cwd: root, stdio: ["pipe", "pipe", "inherit"] });
		const waiting = new Map();
		createInterface({ input: child.stdout }).on("line", (line) => {
			const message = JSON.parse(line);
			waiting.get(message.id)?.(message);
			waiting.delete(message.id);
		});
		let nextId = 1;
		const request = (method, params) =>
			new Promise((resolve) => {
				const id = nextId++;
				waiting.set(id, resolve);
				child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
			});
		const stop = () => new Promise((resolve) => child.once("exit", resolve).stdin.end());
		return { request, stop };
	}

	it("lists its three tools and answers a call over stdio", async () => {
		const server = startServer();
		try {
			const init = await server.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
			assert.equal(init.result.serverInfo.name, "date-tools");
			const list = await server.request("tools/list", {});
			assert.deepEqual(list.result.tools.map((tool) => tool.name), ["days_between", "add_days", "weekday"]);
			const call = await server.request("tools/call", { name: "days_between", arguments: { from: "2025-01-01", to: "2025-12-31" } });
			assert.deepEqual(call.result.structuredContent, { days: 364, weeks: 52, remainingDays: 0 });
		} finally {
			await server.stop();
		}
	});

	it("returns a bad date as an error result the model can read", async () => {
		const server = startServer();
		try {
			const call = await server.request("tools/call", { name: "weekday", arguments: { date: "2025-13-01" } });
			assert.equal(call.result.isError, true);
			assert.equal(call.result.content[0].text, "date is not a day of the calendar: 2025-13-01");
		} finally {
			await server.stop();
		}
	});
});
