import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { SlashCommand } from "../../types";
import { setLevel } from "../../utils/leveling";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setlevel")
    .setDescription("Manually set a user's level")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName("target").setDescription("The user").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("level")
        .setDescription("The level to set")
        .setRequired(true),
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const target = interaction.options.getUser("target", true);
    const level = interaction.options.getInteger("level", true);

    await setLevel(target.id, level);

    await interaction.reply({
      content: `✅ Set **${target.username}** to **Level ${level}**.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
