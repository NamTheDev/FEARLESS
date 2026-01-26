import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { SlashCommand } from "../../types";
import { addReactionRole } from "../../utils/reactionRoles";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Bind a role to an emoji on a message")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) =>
      o
        .setName("message_id")
        .setDescription("ID of the message")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("emoji").setDescription("Emoji to use").setRequired(true),
    )
    .addRoleOption((o) =>
      o.setName("role").setDescription("Role to grant").setRequired(true),
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const mid = interaction.options.getString("message_id", true);
    const emoji = interaction.options.getString("emoji", true);
    const role = interaction.options.getRole("role", true);

    try {
      const msg = await interaction.channel?.messages.fetch(mid);
      if (!msg) {
        interaction.reply({
          content: "Message not found.",
          ephemeral: true,
        });
        return;
      }

      await msg.react(emoji);
      await addReactionRole(mid, emoji, role.id);

      await interaction.reply({
        content: "✅ Reaction role configured!",
        ephemeral: true,
      });
    } catch (e) {
      await interaction.reply({
        content: "Error: Ensure bot has perms and emoji is valid.",
        ephemeral: true,
      });
    }
  },
};
