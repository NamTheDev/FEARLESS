import { Events, Message, TextChannel } from "discord.js";
import { BotEvent } from "../types";
import { addXp } from "../utils/leveling";

const messageTimestamps = new Map<string, number[]>();

const RAPID_LIMIT = 5;
const RAPID_WINDOW = 5000;
const TRIGGER_WINDOW = 3 * 60 * 1000;
const DATA_FILE = "data/spam.json";
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

interface UserSpamData {
  triggers: number[];
  muteLevel: number;
  lastActionTime: number;
}

interface SpamDB {
  [userId: string]: UserSpamData;
}

export const event: BotEvent = {
  name: Events.MessageCreate,
  execute: async (message: Message) => {
    if (message.author.bot || !message.guild || message.guild.id !== process.env.GUILD_ID) return;

    const isStaff =
      STAFF_ROLE_ID && message.member?.roles.cache.has(STAFF_ROLE_ID);
    let isSpamming = false;

    if (!isStaff) {
      const userId = message.author.id;
      const now = Date.now();

      const stamps = messageTimestamps.get(userId) || [];
      stamps.push(now);

      const recentStamps = stamps.filter((t) => now - t < RAPID_WINDOW);
      messageTimestamps.set(userId, recentStamps);

      if (recentStamps.length >= RAPID_LIMIT) {
        messageTimestamps.delete(userId);
        isSpamming = true;
        await handleSpamTrigger(message);
      }
    }

    if (!isSpamming) {
      await addXp(message);
    }
  },
};

async function handleSpamTrigger(message: Message) {
  const userId = message.author.id;
  const now = Date.now();
  const file = Bun.file(DATA_FILE);

  let db: SpamDB = {};
  if (await file.exists()) {
    try {
      db = await file.json();
    } catch {}
  }

  const userData = db[userId] || {
    triggers: [],
    muteLevel: 0,
    lastActionTime: 0,
  };

  if (now - userData.lastActionTime > 24 * 60 * 60 * 1000) {
    userData.triggers = [];
    userData.muteLevel = 0;
  }

  userData.triggers.push(now);
  userData.lastActionTime = now;

  const recentTriggers = userData.triggers.filter(
    (t) => now - t < TRIGGER_WINDOW,
  );

  if (message.channel instanceof TextChannel) {
    try {
      const fetched = await message.channel.messages.fetch({ limit: 20 });
      const userMessages = fetched.filter((m) => m.author.id === userId);
      await message.channel.bulkDelete(userMessages, true);
    } catch {}
  }

  let duration = 0;
  let muteText = "";

  if (userData.muteLevel >= 1) {
    duration = 24 * 60 * 60 * 1000;
    muteText = "24 hours";
    userData.muteLevel = 2;
  } else if (recentTriggers.length >= 3) {
    duration = 60 * 60 * 1000;
    muteText = "1 hour";
    userData.muteLevel = 1;
    userData.triggers = [];
  }

  db[userId] = userData;
  await Bun.write(DATA_FILE, JSON.stringify(db, null, 2));

  if (duration > 0) {
    try {
      await message.member?.timeout(duration, "Anti-Spam Escalation");
      if (message.channel.isSendable()) {
        await message.channel.send(
          `<@${userId}> 🚫 **Muted for ${muteText}** for repeated spamming.`,
        );
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    if (message.channel.isSendable()) {
      const remaining = 3 - recentTriggers.length;
      if (remaining > 0) {
        await message.channel.send(
          `<@${userId}> ⚠️ Stop spamming! Messages deleted. (${recentTriggers.length}/3 triggers)`,
        );
      }
    }
  }
}
