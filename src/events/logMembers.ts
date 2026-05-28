import { Events, GuildMember } from "discord.js";
import { BotEvent } from "@typings/BotEvent";
import { handleMemberUpdateLog } from "@logic/memberLogging";

export const event: BotEvent = {
  name: Events.GuildMemberUpdate,
  execute: async (oldMember: GuildMember, newMember: GuildMember) => {
    await handleMemberUpdateLog(oldMember, newMember);
  },
};
