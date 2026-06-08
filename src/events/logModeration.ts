import { Events, GuildBan, GuildMember } from "discord.js";
import { BotEvent } from "@typings/BotEvent";
import { handleBanLog, handleUnbanLog, handleKickLog } from "@logic/logging";

export const banEvent: BotEvent = {
  name: Events.GuildBanAdd,
  execute: async (ban: GuildBan) => {
    await handleBanLog(ban);
  },
};

export const unbanEvent: BotEvent = {
  name: Events.GuildBanRemove,
  execute: async (unban: GuildBan) => {
    await handleUnbanLog(unban);
  },
};

export const kickEvent: BotEvent = {
  name: Events.GuildMemberRemove,
  execute: async (member: GuildMember) => {
    await handleKickLog(member);
  },
};
