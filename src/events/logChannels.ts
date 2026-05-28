import { Events, GuildChannel } from "discord.js";
import { BotEvent } from "@typings/BotEvent";
import { handleChannelCreateLog, handleChannelDeleteLog } from "@logic/systemLogging";

export const event: BotEvent = {
  name: Events.ChannelCreate,
  execute: async (channel: GuildChannel) => {
    await handleChannelCreateLog(channel);
  },
};

export const deleteEvent: BotEvent = {
  name: Events.ChannelDelete,
  execute: async (channel: GuildChannel) => {
    await handleChannelDeleteLog(channel);
  },
};
