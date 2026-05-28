import { Events, Guild } from "discord.js";
import { BotEvent } from "@typings/BotEvent";
import { handleServerUpdateLog } from "@logic/systemLogging";

export const event: BotEvent = {
  name: Events.GuildUpdate,
  execute: async (oldGuild: Guild, newGuild: Guild) => {
    await handleServerUpdateLog(oldGuild, newGuild);
  },
};
