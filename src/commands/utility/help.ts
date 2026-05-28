import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
} from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { buildHelpEmbed, buildHelpButtons } from "@utils/messages";
import { getHelpPage } from "@logic/pagination";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Displays all available commands")
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("The page number to display (1-5)")
        .setMinValue(1)
        .setMaxValue(5),
    ),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const page = getHelpPage(interaction.options.getInteger("page"));
    const commands = interaction.client.commands as Map<string, SlashCommand>;

    await interaction.reply({
      embeds: [buildHelpEmbed(commands, page)],
      components: [buildHelpButtons(page)],
    });
  },
  executeMessage: async (message: Message, args: string[]) => {
    const page = getHelpPage(args[0]);
    const commands = message.client.commands as Map<string, SlashCommand>;

    await message.reply({
      embeds: [buildHelpEmbed(commands, page)],
      components: [buildHelpButtons(page)],
    });
  },
};
