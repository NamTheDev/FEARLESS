import { PermissionFlagsBits, Message, SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { spawnMerchant } from "@logic/merchant";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("merchant")
    .setDescription("Spawn the red-eyed merchant menu")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  visible: true,
  messageOnly: true,
  executeMessage: async (message: Message, args: string[]) => {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return;
    }

    if (message.channel instanceof TextChannel) {
      await spawnMerchant(message.client, message.channel);
    }
  },
};
