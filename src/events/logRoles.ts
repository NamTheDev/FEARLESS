import { Events, Role } from "discord.js";
import { BotEvent } from "@typings/BotEvent";
import { handleRoleCreateLog, handleRoleDeleteLog } from "@logic/systemLogging";

export const event: BotEvent = {
  name: Events.GuildRoleCreate,
  execute: async (role: Role) => {
    await handleRoleCreateLog(role);
  },
};

export const deleteEvent: BotEvent = {
  name: Events.GuildRoleDelete,
  execute: async (role: Role) => {
    await handleRoleDeleteLog(role);
  },
};
