import { PermissionFlagsBits, Message, TextChannel, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { spawnShop } from "@logic/economy";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Spawn the mysterious shop menu")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  visible: true,
  messageOnly: true,
  executeMessage: async (message: Message, args: string[]) => {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return;
    }

    if (message.channel instanceof TextChannel) {
      await spawnShop(message.channel);
    }
  },
};
