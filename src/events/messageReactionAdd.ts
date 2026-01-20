import { Events, MessageReaction, User } from "discord.js";
import { BotEvent } from "../types";

const DATA_FILE = "data/reaction-roles.json";

export const event: BotEvent = {
  name: Events.MessageReactionAdd,
  execute: async (reaction: MessageReaction, user: User) => {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error(error);
        return;
      }
    }

    const messageId = reaction.message.id;
    const emoji = reaction.emoji.name || reaction.emoji.toString();

    const file = Bun.file(DATA_FILE);
    if (!(await file.exists())) return;
    const db = await file.json();

    if (db[messageId] && db[messageId][emoji]) {
      const roleId = db[messageId][emoji];
      const guild = reaction.message.guild;

      if (guild) {
        const member = await guild.members.fetch(user.id);
        await member.roles.add(roleId).catch(console.error);
      }
    }
  },
};
