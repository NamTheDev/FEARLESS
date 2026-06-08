import { Events, Message, Collection, Snowflake, GuildTextBasedChannel } from "discord.js";
import { BotEvent } from "@typings/BotEvent";
import { handleMessageDeleteLog, handleMessageUpdateLog, handleMessageBulkDeleteLog } from "@logic/logging";

export const event: BotEvent = {
  name: Events.MessageDelete,
  execute: async (message: Message) => {
    await handleMessageDeleteLog(message);
  },
};

export const updateEvent: BotEvent = {
  name: Events.MessageUpdate,
  execute: async (oldMsg: Message, newMsg: Message) => {
    await handleMessageUpdateLog(oldMsg, newMsg);
  },
};

export const bulkDeleteEvent: BotEvent = {
  name: Events.MessageBulkDelete,
  execute: async (messages: Collection<Snowflake, Message>, channel: GuildTextBasedChannel) => {
    await handleMessageBulkDeleteLog(messages, channel);
  },
};
