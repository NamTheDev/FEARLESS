import { EmbedBuilder, Colors, Guild, TextChannel } from "discord.js";
import { Giveaway } from "../types";
import { sendLog } from "./logger";

const GIVEAWAY_FILE = "data/giveaways.json";
let giveawayCache: Giveaway[] = [];

export async function loadGiveaways() {
  const file = Bun.file(GIVEAWAY_FILE);
  if (await file.exists()) giveawayCache = await file.json();
}

export function getActiveGiveaway(id: string) {
  return giveawayCache.find((g) => g.id === id && g.active);
}

export async function saveGiveawayState() {
  await Bun.write(GIVEAWAY_FILE, JSON.stringify(giveawayCache, null, 2));
}

export async function createGiveaway(data: Giveaway) {
  giveawayCache.push(data);
  await saveGiveawayState();
}

export async function endGiveaway(giveawayId: string, guild: Guild) {
  const giveaway = giveawayCache.find((g) => g.id === giveawayId);
  if (!giveaway || !giveaway.active) return;

  giveaway.active = false;
  await saveGiveawayState();

  const channel = guild.channels.cache.get(giveaway.channelId) as TextChannel;
  if (!channel) return;

  const winnerId = pickWinner(giveaway);

  const embed = new EmbedBuilder()
    .setTitle("🎁 Giveaway Results")
    .setColor(Colors.Gold)
    .setDescription(
      winnerId
        ? `Winner: <@${winnerId}>\nPrize: **${giveaway.prize}**`
        : "No winners (no participants).",
    )
    .setTimestamp();

  await channel.send({
    content: winnerId
      ? `🎊 Congratulations <@${winnerId}>!`
      : "Giveaway ended.",
    embeds: [embed],
  });

  const log = new EmbedBuilder()
    .setTitle("🎁 Giveaway Ended")
    .addFields(
      { name: "Prize", value: giveaway.prize, inline: true },
      {
        name: "Winner",
        value: winnerId ? `<@${winnerId}>` : "None",
        inline: true,
      },
      { name: "Entries", value: `${giveaway.entrants.length}`, inline: true },
    )
    .setColor(Colors.Green);

  await sendLog(guild, log);
}

function pickWinner(g: Giveaway): string | null {
  if (g.entrants.length === 0) return null;

  const early = g.entrants.slice(0, 3);
  const late = g.entrants.slice(3);

  // If late group exists, roll 80/20. Otherwise 100% early.
  const winFromEarly = late.length === 0 ? true : Math.random() < 0.8;

  if (winFromEarly) {
    return early[Math.floor(Math.random() * early.length)]!;
  } else {
    // Weighted late group: 4th=90, 5th=85... min 5
    const weights = late.map((_, i) => Math.max(5, 90 - i * 5));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i]!;
      if (roll <= 0) return late[i]!;
    }
    return late[0]!;
  }
}

export function resumeGiveaways(guild: Guild) {
  const now = Date.now();
  giveawayCache
    .filter((g) => g.active)
    .forEach((g) => {
      const remaining = g.endTime - now;
      setTimeout(() => endGiveaway(g.id, guild), Math.max(0, remaining));
    });
}
