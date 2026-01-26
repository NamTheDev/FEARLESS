import { Message, TextChannel, EmbedBuilder } from "discord.js";
import { CONFIG } from "../config";
import { sendLog } from "./logger";
import db from "./database";

const messageTimestamps = new Map<string, number[]>();

export async function handleSpamCheck(message: Message): Promise<boolean> {
  if (message.member?.roles.cache.has(CONFIG.ROLES.STAFF)) return false;

  const userId = message.author.id;
  const now = Date.now();
  const stamps = messageTimestamps.get(userId) || [];
  stamps.push(now);
  const recent = stamps.filter((t) => now - t < 5000);
  messageTimestamps.set(userId, recent);

  if (recent.length >= 5) {
    await executeSpamAction(message);
    return true;
  }
  return false;
}

async function executeSpamAction(message: Message) {
  const userId = message.author.id;
  const now = Date.now();

  db.run(
    "INSERT INTO spam_violations (userId, offenseCount, lastOffenseTime) VALUES (?, 1, ?) ON CONFLICT(userId) DO UPDATE SET offenseCount = offenseCount + 1, lastOffenseTime = excluded.lastOffenseTime",
    [userId, now],
  );

  if (message.channel instanceof TextChannel) {
    const fetched = await message.channel.messages.fetch({ limit: 10 });
    await message.channel.bulkDelete(
      fetched.filter((m) => m.author.id === userId),
      true,
    );
  }

  const log = new EmbedBuilder()
    .setTitle("🚨 Spam Detected")
    .setColor(CONFIG.COLORS.ERROR)
    .addFields({ name: "User", value: `<@${userId}>` })
    .setTimestamp();

  if (message.guild) await sendLog(message.guild, log);
}
