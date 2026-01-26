import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { SlashCommand } from "../../types";
import { setLevel } from "../../utils/leveling";
import { getMember } from "../../utils/fetchers";
import { Responder } from "../../utils/responder";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setlevel")
    .setDescription("Force set a user to a specific level")
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
    const targetUser = interaction.options.getUser("target", true);
    const level = interaction.options.getInteger("level", true);
    const guild = interaction.guild;

    if (!guild) return;

    const member = await getMember(guild, targetUser.id);
    if (!member) {
      await Responder.error(interaction, "User not found in this server.");
      return;
    }

    await setLevel(member, level, true);

    await Responder.success(
      interaction,
      `Set ${targetUser.username} to **Level ${level}**.`,
      true,
    );
  },
};
