import db from "@core/database";
import { Message } from "discord.js";
import { sendTempMessage, buildAfkNotifyEmbed } from "@utils/messages";

export const afkCache = new Map<
  string,
  { reason: string; timestamp: number }
>();

export const setAfk = (userId: string, reason: string) => {
  const now = Date.now();
  db.run(
    "INSERT OR REPLACE INTO afk (userId, reason, timestamp) VALUES (?, ?, ?)",
    [userId, reason, now],
  );
  afkCache.set(userId, { reason, timestamp: now });
};

export const removeAfk = (userId: string) => {
  db.run("DELETE FROM afk WHERE userId = ?", [userId]);
  afkCache.delete(userId);
};

export const loadAfkCache = () => {
  const rows = db.query("SELECT * FROM afk").all() as any[];
  rows.forEach((r) =>
    afkCache.set(r.userId, { reason: r.reason, timestamp: r.timestamp }),
  );
};

export const checkAfkStatus = (message: Message) => {
  if (afkCache.has(message.author.id)) {
    removeAfk(message.author.id);
    sendTempMessage(message.channel as any, { content: "Welcome back! I've removed your AFK status.", allowedMentions: { repliedUser: true } });
  }

  message.mentions.users.forEach((user) => {
    const afkData = afkCache.get(user.id);
    if (afkData) {
      if (message.channel.isSendable())
        message.channel.send({
          content: `<@${user.id}> is currently AFK: **${afkData.reason}**`,
          allowedMentions: {
            parse: [],
          },
        });
    }
  });
};
