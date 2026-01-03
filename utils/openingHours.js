
const dayjs = require("dayjs");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);
dayjs.extend(timezone);

/* -----------------------------
   Time helpers
----------------------------- */

function convertTo24Hour(timeStr) {
  if (!timeStr) return null;

  // Handle "HH:mm:ss" manually if present
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    // Just trim to HH:mm
    return timeStr.slice(0, 5);
  }

  const formats = [
    "HH:mm",      // 24h
    "hh:mm A",    // 12h with AM/PM
    "h:mm A",     // 12h single digit hour
  ];

  for (const fmt of formats) {
    // Use non-strict parsing
    const parsed = dayjs(timeStr, fmt, false);
    if (parsed.isValid()) {
      return parsed.format("HH:mm"); // normalized 24h
    }
  }

  return null; // failed to parse
}

function timeToMinutes(time24) {
  if (!time24) return null;
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + m;
}

/* -----------------------------
   isOpen logic (SINGLE DAY)
----------------------------- */

function isOpenFromRow(openingRow) {
  if (!openingRow) {
    console.log("❌ No opening_hours row for today");
    return false;
  }

  // Direct is_closed check
  if (openingRow.is_closed === true || openingRow.isClosed === true) {
    console.log("🔴 Closed today (is_closed = true)");
    return false;
  }

  const openRaw = openingRow.open_time ?? openingRow.open;
  const closeRaw = openingRow.close_time ?? openingRow.close;

  const open24 = convertTo24Hour(openRaw);
  const close24 = convertTo24Hour(closeRaw);

  if (!open24 || !close24) {
    console.log("❌ Invalid open/close time", { open_time: openRaw, close_time: closeRaw });
    return false;
  }

  const now = dayjs().tz("Asia/Manila");
  const currentMinutes = now.hour() * 60 + now.minute();

  const openMinutes = timeToMinutes(open24);
  const closeMinutes = timeToMinutes(close24);

  console.log("⏱ Parsed times", { now: currentMinutes, openMinutes, closeMinutes });

  // Overnight (close < open)
  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;

}

module.exports = {
  convertTo24Hour,
  timeToMinutes,
  isOpenFromRow,
};
