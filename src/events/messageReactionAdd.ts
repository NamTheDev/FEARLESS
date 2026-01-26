import { Events, MessageReaction, User } from "discord.js";
import { BotEvent } from "../types";
import { getRoleFromReaction } from "../utils/reactionRoles";
import { getActiveGiveaway, saveGiveawayState } from "../utils/giveaway";

export const event: BotEvent = {
  name: Events.MessageReactionAdd,
  execute: async (reaction: MessageReaction, user: User) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => null);

    const mid = reaction.message.id;
    const emoji = reaction.emoji.name || reaction.emoji.toString();

    // 1. Giveaway Logic
    if (emoji === "🎉") {
      const g = getActiveGiveaway(mid);
      if (g && !g.entrants.includes(user.id)) {
        g.entrants.push(user.id);
        await saveGiveawayState();
      }
    }

    // 2. Reaction Role Logic
    const roleId = getRoleFromReaction(mid, emoji);
    if (roleId && reaction.message.guild) {
      const member = await reaction.message.guild.members.fetch(user.id);
      await member.roles.add(roleId).catch(() => null);
    }
  },
};
