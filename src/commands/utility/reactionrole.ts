import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { SlashCommand } from "../../types";
import { addReactionRole } from "../../utils/reactionRoles";
import { getRole } from "../../utils/fetchers";
import { Responder } from "../../utils/responder";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Bind a role to an emoji on a message")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("message_id")
        .setDescription("ID of the message")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("emoji").setDescription("Emoji to use").setRequired(true),
    )
    .addRoleOption((option) =>
      option.setName("role").setDescription("Role to grant").setRequired(true),
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const mid = interaction.options.getString("message_id", true);
    const emoji = interaction.options.getString("emoji", true);
    const roleOption = interaction.options.getRole("role", true);
    const role = interaction.guild
      ? await getRole(interaction.guild, roleOption.id)
      : null;
    if (!role) {
      await Responder.error(interaction, "Role not found in this server.");
      return;
    }

    try {
      const msg = await interaction.channel?.messages.fetch(mid);
      if (!msg) {
        await Responder.error(interaction, "Message not found.", true);
        return;
      }

      await msg.react(emoji);
      await addReactionRole(mid, emoji, role.id);

      await Responder.success(interaction, "Reaction role configured!", true);
    } catch (e) {
      await Responder.error(
        interaction,
        "Error: Ensure bot has perms and emoji is valid.",
        true,
      );
    }
  },
};
