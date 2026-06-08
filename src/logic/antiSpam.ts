import { Message, TextChannel } from "discord.js";
import { CONFIG } from "@core/config";
import { getChannel } from "@utils/fetchers";
import { sendLog } from "@utils/logging";
import { applySpamPunishment } from "@logic/leveling";
import db from "@core/database";
import { sendTempMessage, buildSpamWarningEmbed, buildSpamLogEmbed } from "@utils/messages";

const { WINDOW, THRESHOLD, CLEANUP_LIMIT, EXPIRY, VIOLATION_RESET } = CONFIG.LOGIC.ANTI_SPAM;

const messageTimestamps = new Map<string, number[]>();

export function getViolations(userId: string) {
  return db
    .query("SELECT * FROM spam_violations WHERE userId = ?")
    .get(userId) as { userId: string; offenseCount: number; lastOffenseTime: number } | undefined;
}

export async function handleSpamCheck(message: Message): Promise<boolean> {
  if (message.member?.roles.cache.has(CONFIG.ROLES.STAFF)) return false;

  const userId = message.author.id;
  const now = Date.now();
  const stamps = messageTimestamps.get(userId) || [];

  const recent = stamps.filter((t) => now - t < WINDOW);
  recent.push(now);
  messageTimestamps.set(userId, recent);

  if (messageTimestamps.size > CLEANUP_LIMIT) {
    for (const [uid, arr] of messageTimestamps) {
      const last = arr.length ? arr[arr.length - 1] : 0;
      if (!last || now - last > EXPIRY) {
        messageTimestamps.delete(uid);
      }
    }
  }

  if (recent.length >= THRESHOLD) {
    await executeSpamAction(message);
    return true;
  }
  return false;
}

async function executeSpamAction(message: Message) {
  const userId = message.author.id;
  const now = Date.now();

  const row = db
    .query("SELECT * FROM spam_violations WHERE userId = ?")
    .get(userId) as any;
  let newCount = 1;

  if (row) {
    const diff = now - row.lastOffenseTime;
    if (diff <= VIOLATION_RESET) {
      newCount = row.offenseCount + 1;
    }
  }

  db.run(
    "INSERT INTO spam_violations (userId, offenseCount, lastOffenseTime) VALUES (?, ?, ?) ON CONFLICT(userId) DO UPDATE SET offenseCount = excluded.offenseCount, lastOffenseTime = excluded.lastOffenseTime",
    [userId, newCount, now],
  );

  const { punishmentXp, count, xpBlockedUntil, muted } =
    await applySpamPunishment(message.member!);

  if (message.guild && message.channel instanceof TextChannel) {
    const channel = await getChannel(message.guild, message.channel.id);
    if (channel) {
      const fetched = await channel.messages.fetch({ limit: 10 });
      await channel.bulkDelete(
        fetched.filter((m) => m.author.id === userId),
        true,
      );

      const userWarning = buildSpamWarningEmbed(userId, count, punishmentXp, muted, xpBlockedUntil);

      await sendTempMessage(channel, {
        content: `<@${userId}>`,
        embeds: [userWarning],
      }, 10000);
    }
  }

  const blockMsg =
    xpBlockedUntil > now ? "Blocked for 10 minutes" : "No active block";

  const log = buildSpamLogEmbed(userId, count, punishmentXp, muted ? "MUTED (1h)" : blockMsg);

  if (message.guild) await sendLog(message.guild, CONFIG.LOG_CHANNEL_ID, log);
}
