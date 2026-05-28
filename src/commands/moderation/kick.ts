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
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to kick")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the kick"),
    ),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const targetUser = interaction.options.getUser("target", true);
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    const guild = interaction.guild!;

    const member = await getMember(guild, targetUser.id);

    if (!member) {
      await Responder.error(interaction, "User is not in the server.");
      return;
    }

    if (!member.kickable) {
      await Responder.error(interaction, "I cannot kick this user.");
      return;
    }

    if (member.id === interaction.user.id) {
      await Responder.error(interaction, "You cannot kick yourself.");
      return;
    }

    try {
      await member.kick(reason);
      await Responder.success(
        interaction,
        `**${targetUser.tag}** has been kicked.\n> **Reason**: \`${reason}\``,
      );
    } catch (e) {
      await Responder.error(interaction, e as Error);
    }
  },
};
