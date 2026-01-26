import { Events, MessageReaction, User } from "discord.js";
import { BotEvent } from "../types";
import { getRoleFromReaction } from "../utils/reactionRoles";
import { getActiveGiveaway, updateEntrants } from "../utils/giveaway";

export const event: BotEvent = {
  name: Events.MessageReactionAdd,
  execute: async (reaction: MessageReaction, user: User) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => null);
    const mid = reaction.message.id;
    const emoji = reaction.emoji.name || reaction.emoji.toString();

    const g = getActiveGiveaway(mid);
    if (emoji === "🎉" && g && !g.entrants.includes(user.id)) {
      g.entrants.push(user.id);
      updateEntrants(mid, g.entrants);
    }

    const roleId = getRoleFromReaction(mid, emoji);
    if (roleId && reaction.message.guild) {
      const member = await reaction.message.guild.members.fetch(user.id);
      await member.roles.add(roleId).catch(() => null);
    }
  },
};
