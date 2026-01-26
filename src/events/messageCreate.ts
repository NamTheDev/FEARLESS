import { Events, Message, EmbedBuilder, Colors } from "discord.js";
import { BotEvent } from "../types";
import { sendLog } from "../utils/logger";
import { addXp } from "../utils/leveling"; // Use your existing leveling util

const messageTimestamps = new Map<string, number[]>();

export const event: BotEvent = {
  name: Events.MessageCreate,
  execute: async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    // Spam Check
    const userId = message.author.id;
    const now = Date.now();
    const stamps = messageTimestamps.get(userId) || [];
    stamps.push(now);
    const recent = stamps.filter((t) => now - t < 5000);
    messageTimestamps.set(userId, recent);

    if (recent.length >= 5) {
      // Log Spam
      const log = new EmbedBuilder()
        .setTitle("🚨 Spam Alert")
        .setColor(Colors.Red)
        .addFields(
          { name: "User", value: `<@${userId}>` },
          {
            name: "Content",
            value: message.content.substring(0, 500) || "[Media]",
          },
        )
        .setTimestamp();
      await sendLog(message.guild, log);

      await message.delete().catch(() => null);
      return;
    }

    // Process Leveling
    await addXp(message);
  },
};
