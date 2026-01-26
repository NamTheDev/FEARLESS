import { Guild, TextChannel } from "discord.js";
import db from "./database";
import { Giveaway } from "../types";
import { getChannel } from "./fetchers";

export function loadGiveaways() {}
export function getActiveGiveaway(id: string): Giveaway | null {
  const g: any = db
    .query("SELECT * FROM giveaways WHERE id = ? AND active = 1")
    .get(id);
  return g ? { ...g, entrants: JSON.parse(g.entrants) } : null;
}
export function updateEntrants(id: string, entrants: string[]) {
  db.run("UPDATE giveaways SET entrants = ? WHERE id = ?", [
    JSON.stringify(entrants),
    id,
  ]);
}
export async function createGiveaway(g: Giveaway) {
  db.run(
    "INSERT INTO giveaways (id, channelId, prize, endTime, entrants, active) VALUES (?, ?, ?, ?, ?, 1)",
    [g.id, g.channelId, g.prize, g.endTime, JSON.stringify(g.entrants)],
  );
}
export function resumeGiveaways(guild: Guild) {
  const active = db
    .query("SELECT * FROM giveaways WHERE active = 1")
    .all() as any[];
  active.forEach((g) => {
    if (g.endTime <= Date.now()) {
      // If the giveaway ended while offline, end it immediately
      void endGiveaway(g.id, guild);
    } else {
      setTimeout(
        () => endGiveaway(g.id, guild),
        Math.max(0, g.endTime - Date.now()),
      );
    }
  });
}
export async function endGiveaway(id: string, guild: Guild) {
  const g = getActiveGiveaway(id);
  if (!g) return;
  db.run("UPDATE giveaways SET active = 0 WHERE id = ?", [id]);

  const channel = await getChannel(guild, g.channelId);
  if (!channel) return;

  const winner = pickWinner(g);
  await channel.send(
    winner
      ? `🎊 <@${winner}> won **${g.prize}**!`
      : "Giveaway ended, no winners.",
  );
}
function pickWinner(g: Giveaway): string | null {
  if (g.entrants.length === 0) return null;
  const early = g.entrants.slice(0, 3),
    late = g.entrants.slice(3);
  if (late.length > 0 && Math.random() > 0.8) {
    const weights = late.map((_, i) => Math.max(5, 90 - i * 5)),
      total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i]!;
      if (r <= 0) return late[i]!;
    }
  }
  return early[Math.floor(Math.random() * early.length)]!;
}
