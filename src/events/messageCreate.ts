import { Events, Message } from "discord.js";
import { BotEvent } from "../types";
import { handleSpamCheck } from "../utils/antiSpam";
import { addXp } from "../utils/leveling";

export const event: BotEvent = {
  name: Events.MessageCreate,
  execute: async (message: Message) => {
    if (message.author.bot || !message.guild) return;
    if (await handleSpamCheck(message)) return;
    await addXp(message);
  },
};
