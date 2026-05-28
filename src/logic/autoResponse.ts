import db from "@core/database";
import { CONFIG } from "@core/config";

const cooldowns = new Map<string, number>();
const { MIN_CD, MAX_CD } = CONFIG.LOGIC.AUTO_RESPONSE;

export const getResponses = (guildId: string) =>
  db
    .query("SELECT * FROM auto_responses WHERE guildId = ?")
    .all(guildId) as any[];

export const createResponse = (
  guildId: string,
  trigger: string,
  response: string,
): boolean => {
  try {
    const result = db.run(
      "INSERT INTO auto_responses (guildId, trigger, response) VALUES (?, ?, ?)",
      [guildId, trigger.toLowerCase(), response],
    );
    return result.changes > 0;
  } catch (e) {
    return false;
  }
};

export const editResponse = (
  guildId: string,
  trigger: string,
  response: string,
): boolean => {
  const result = db.run(
    "UPDATE auto_responses SET response = ? WHERE guildId = ? AND trigger = ?",
    [response, guildId, trigger.toLowerCase()],
  );
  return result.changes > 0;
};

export const removeResponse = (guildId: string, trigger: string): boolean => {
  const result = db.run(
    "DELETE FROM auto_responses WHERE guildId = ? AND trigger = ?",
    [guildId, trigger.toLowerCase()],
  );
  return result.changes > 0;
};

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const attemptAutoResponse = (guildId: string, content: string) => {
  const rows = getResponses(guildId);

  const row = rows.find((r) => {
    const escaped = escapeRegex(r.trigger);
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    return regex.test(content);
  });

  if (!row) return null;

  const now = Date.now();
  const cooldownKey = `${guildId}-${row.trigger}`;
  const nextAllowed = cooldowns.get(cooldownKey) || 0;

  if (now < nextAllowed) return null;

  const delay = Math.floor(Math.random() * (MAX_CD - MIN_CD + 1)) + MIN_CD;
  cooldowns.set(cooldownKey, now + delay);

  return row.response;
};
