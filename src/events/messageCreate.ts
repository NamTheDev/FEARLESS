import { Events, Message } from "discord.js";
import { BotEvent } from "@typings/BotEvent";
import { handleSpamCheck } from "@logic/antiSpam";
import { addXp } from "@logic/leveling";
import { CONFIG } from "@core/config";
import { checkAfkStatus } from "@logic/afk";
import { handleChannelMessages } from "@logic/messages";
import { handleCommandLog } from "@logic/logging";

export const event: BotEvent = {
  name: Events.MessageCreate,
  execute: async (message: Message) => {
    if (
      message.author.bot ||
      !message.guild ||
      !message.guildId ||
      !CONFIG.WHITELISTED_GUILDS.includes(message.guildId)
    )
      return;

    if (message.content.toLowerCase().startsWith("rf ")) {
      const args = message.content.slice(3).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();
      if (commandName) {
        const command = message.client.commands.get(commandName);
        if (command && command.executeMessage && command.category !== "summer") {
          try {
            await handleCommandLog(message, commandName, args);
            await command.executeMessage(message, args);
          } catch (error) {
            console.error(error);
            await message.reply("❌ Error executing command.");
          }
          return;
        }
      }
    }

    if (message.content.toLowerCase().startsWith("rh ")) {
      const args = message.content.slice(3).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();
      if (commandName) {
        const command = message.client.commands.get(commandName);
        if (command && command.executeMessage && command.category === "summer") {
          try {
            await handleCommandLog(message, commandName, args);
            await command.executeMessage(message, args);
          } catch (error) {
            console.error(error);
            await message.reply("❌ Error executing command.");
          }
          return;
        }
      }
    }

    checkAfkStatus(message);
    await handleChannelMessages(message);

    if (await handleSpamCheck(message)) return;
    await addXp(message);
  },
};
