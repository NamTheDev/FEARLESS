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
    .setDescription("Force set a user to a specific level")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) =>
      opt.setName("target").setDescription("The user").setRequired(true),
    )
    .addIntegerOption((opt) =>
      opt.setName("level").setDescription("The level to set").setRequired(true),
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const targetUser = interaction.options.getUser("target", true);
    const level = interaction.options.getInteger("level", true);
    const guild = interaction.guild;

    if (!guild) return;

    let member;
    try {
      member = await guild.members.fetch(targetUser.id);
    } catch {
      await interaction.reply({
        content: "User not found in this guild.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await setLevel(member, level, true);

    await interaction.reply({
      content: `✅ Set ${targetUser.username} to **Level ${level}**.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
