import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

import { SlashCommand } from "@typings/SlashCommand";
import { getMember } from "@utils/fetchers";
import { Responder } from "@utils/responder";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to timeout")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration of the timeout")
        .setRequired(true)
        .addChoices(
          { name: "60 Seconds", value: 60 * 1000 },
          { name: "5 Minutes", value: 5 * 60 * 1000 },
          { name: "10 Minutes", value: 10 * 60 * 1000 },
          { name: "1 Hour", value: 60 * 60 * 1000 },
          { name: "1 Day", value: 24 * 60 * 60 * 1000 },
          { name: "1 Week", value: 7 * 24 * 60 * 60 * 1000 },
        ),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the timeout"),
    ),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const targetUser = interaction.options.getUser("target", true);
    const duration = interaction.options.getInteger("duration", true);
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    const guild = interaction.guild!;

    const member = await getMember(guild, targetUser.id);

    if (!member) {
      await Responder.error(interaction, "User is not in the server.");
      return;
    }

    if (!member.moderatable) {
      await Responder.error(interaction, "I cannot timeout this user.");
      return;
    }

    try {
      await member.timeout(duration, reason);
      await Responder.success(
        interaction,
        `Timed out **${targetUser.tag}** for **${duration / 60000}** minutes.\n> **Reason**: \`${reason}\``,
      );
    } catch (e) {
      await Responder.error(interaction, e as Error);
    }
  },
};
