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
    .setName("ban")
    .setDescription("Ban a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to ban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the ban"),
    ),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const targetUser = interaction.options.getUser("target", true);
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    const guild = interaction.guild!;

    const member = await getMember(guild, targetUser.id);

    if (member) {
      if (!member.bannable) {
        await Responder.error(
          interaction,
          "I cannot ban this user. They may have a higher role than me.",
        );
        return;
      }
      if (member.id === interaction.user.id) {
        await Responder.error(interaction, "You cannot ban yourself.");
        return;
      }
    }

    try {
      await guild.members.ban(targetUser.id, { reason });
      await Responder.success(
        interaction,
        `**${targetUser.tag}** has been banned.\n> **Reason**: \`${reason}\``,
      );
    } catch (e) {
      await Responder.error(interaction, e as Error);
    }
  },
};
