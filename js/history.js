// Pure helpers for the saved roll history (no DOM, so they run under Node).
// Records are kept oldest first; the page shows them newest first.

export const MAX_RESULTS = 100;

const ROLL_KINDS = ["plain", "attack", "initiative", "saving"];
const WINNERS = ["a", "b", "tie"];

const isInt = (v) => Number.isInteger(v);
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const text = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");

function intList(value, maxLength) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maxLength) return null;
  return value.every(isInt) ? value : null;
}

function sanitizeSide(side) {
  if (!side || !isNum(side.roll) || !isNum(side.mod) || !isNum(side.total)) return null;
  return { roll: side.roll, mod: side.mod, total: side.total };
}

// Rebuilds a record from untrusted saved data, or returns null if unusable.
export function sanitizeRecord(raw) {
  if (!raw || typeof raw !== "object") return null;

  if (raw.kind === "versus") {
    const r = raw.result;
    const a = r && sanitizeSide(r.a);
    const b = r && sanitizeSide(r.b);
    if (!a || !b || !WINNERS.includes(r.winner) || !isNum(r.margin)) return null;
    if (!isInt(raw.sides) || raw.sides < 2 || raw.sides > 1000) return null;
    return {
      kind: "versus",
      nameA: text(raw.nameA, 20) || "Side A",
      nameB: text(raw.nameB, 20) || "Side B",
      sides: raw.sides,
      result: { a, b, winner: r.winner, tied: r.a.total === r.b.total, margin: r.margin },
    };
  }

  if (raw.kind === "roll") {
    const rolls = intList(raw.rolls, 100);
    if (!rolls || !isNum(raw.result)) return null;
    const breakdown = raw.breakdownRolls === undefined ? undefined : intList(raw.breakdownRolls, 100);
    return {
      kind: "roll",
      labelText: text(raw.labelText, 80),
      rolls,
      result: raw.result,
      typeClass: /^result-[a-z0-9-]{1,20}$/.test(raw.typeClass) ? raw.typeClass : "",
      sides: isInt(raw.sides) && raw.sides >= 2 && raw.sides <= 1000 ? raw.sides : undefined,
      rollKind: ROLL_KINDS.includes(raw.rollKind) ? raw.rollKind : "plain",
      mod: isInt(raw.mod) ? raw.mod : 0,
      breakdownRolls: breakdown || undefined,
    };
  }

  return null;
}

// Cleans a whole saved list, dropping bad records and keeping the newest.
export function sanitizeRecords(raw, max = MAX_RESULTS) {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeRecord).filter(Boolean).slice(-max);
}

// Returns a new list with `record` added as the newest, trimmed to `max`.
export function appendRecord(list, record, max = MAX_RESULTS) {
  return [...list, record].slice(-max);
}
