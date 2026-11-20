// Calendar arithmetic on plain dates (YYYY-MM-DD), without time zones: a date is a day of the proleptic Gregorian
// calendar, counted in UTC so that daylight saving never adds or drops an hour.

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The UTC midnight of a YYYY-MM-DD date in milliseconds. Throws for anything that is not a real calendar day. */
export function parseDate(value, name) {
	const match = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
	if (match === null) throw new Error(`${name} must be a date as YYYY-MM-DD`);
	const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
	const time = Date.UTC(year, month - 1, day);
	const date = new Date(time);
	// Date.UTC turns 2025-02-30 into March 2; a real day reads back as it was written.
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error(`${name} is not a day of the calendar: ${value}`);
	return time;
}

const formatDate = (time) => new Date(time).toISOString().slice(0, 10);
const weekdayOf = (time) => WEEKDAYS[new Date(time).getUTCDay()];

/** The number of days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween({ from, to }) {
	const days = Math.round((parseDate(to, "to") - parseDate(from, "from")) / DAY_MS);
	return { days, weeks: Math.trunc(days / 7), remainingDays: days % 7 };
}

/** The date `days` days after `date` (before it, when negative), with its weekday. */
export function addDays({ date, days }) {
	if (!Number.isInteger(days) || Math.abs(days) > 1_000_000) throw new Error("days must be a whole number between -1000000 and 1000000");
	const time = parseDate(date, "date") + days * DAY_MS;
	return { date: formatDate(time), weekday: weekdayOf(time) };
}

/** The weekday of `date` and its ISO 8601 week. */
export function weekday({ date }) {
	const time = parseDate(date, "date");
	// ISO 8601: weeks start on Monday, and week 1 is the week with the year's first Thursday.
	const day = (new Date(time).getUTCDay() + 6) % 7;
	const thursday = time + (3 - day) * DAY_MS;
	const isoYear = new Date(thursday).getUTCFullYear();
	const isoWeek = Math.floor((thursday - Date.UTC(isoYear, 0, 1)) / DAY_MS / 7) + 1;
	return { weekday: weekdayOf(time), isoWeek, isoYear };
}
