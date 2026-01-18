import { Events, Message } from "discord.js";
import { BotEvent } from "../types";

const messageTimestamps = new Map<string, number[]>();

const SPAM_LIMIT = 5;
const TIME_WINDOW = 5000;
const DATA_FILE = "data/spam.json";

interface SpamData {
  [userId: string]: {
    offenseCount: number;
    lastOffenseTime: number;
  };
}

export const event: BotEvent = {
  name: Events.MessageCreate,
  execute: async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const now = Date.now();

    const stamps = messageTimestamps.get(userId) || [];
    stamps.push(now);

    const recentStamps = stamps.filter(
      (timestamp) => now - timestamp < TIME_WINDOW,
    );
    messageTimestamps.set(userId, recentStamps);

    if (recentStamps.length >= SPAM_LIMIT) {
      messageTimestamps.delete(userId);
      await handleSpamPunishment(message);
    }
  },
};

async function handleSpamPunishment(message: Message) {
  const userId = message.author.id;
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const file = Bun.file(DATA_FILE);
  let data: SpamData = {};

  if (await file.exists()) {
    try {
      data = await file.json();
    } catch {
      data = {};
    }
  }

  let userRecord = data[userId] || { offenseCount: 0, lastOffenseTime: 0 };

  if (now - userRecord.lastOffenseTime > oneDay) {
    userRecord.offenseCount = 0;
  }

  userRecord.offenseCount++;
  userRecord.lastOffenseTime = now;

  data[userId] = userRecord;
  await Bun.write(DATA_FILE, JSON.stringify(data, null, 2));

  let muteHours = userRecord.offenseCount;
  if (muteHours > 3) muteHours = 3;

  const durationMs = muteHours * 60 * 60 * 1000;

  try {
    await message.member?.timeout(durationMs, "Anti-Spam Triggered");

    let replyText = `🚫 **Anti-Spam Triggered**\nYou have been muted for **${muteHours} hour(s)**.`;

    if (userRecord.offenseCount >= 3) {
      replyText += `\n⚠️ **Warning:** You have violated this ${userRecord.offenseCount} times today.`;
    }
    if (message.channel.isSendable())
      return await message.channel.send({
        content: `<@${userId}> ${replyText}`,
      });
  } catch (error) {
    console.error(`Failed to timeout user ${userId}`, error);
  }
}
