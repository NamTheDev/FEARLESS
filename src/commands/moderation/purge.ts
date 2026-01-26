import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  MessageFlags,
} from "discord.js";
import { SlashCommand } from "../../types";
import { sendLog } from "../../utils/logger";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete messages (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((o) =>
      o
        .setName("amount")
        .setDescription("1-100 messages")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addUserOption((o) => o.setName("target").setDescription("Filter by user")),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("target");

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const messages = await interaction.channel?.messages.fetch({
      limit: amount,
    });
    if (!messages) return;

    const toDelete = messages.filter((m) => {
      const ageCheck = Date.now() - m.createdTimestamp < 1209600000; // 14 days
      const userCheck = target ? m.author.id === target.id : true;
      return ageCheck && userCheck && !m.system; // Exclude system messages
    });

    if (toDelete.size === 0) {
      await interaction.editReply("No eligible messages found.");
      return;
    }

    const deleted = await (interaction.channel as any).bulkDelete(
      toDelete,
      true,
    );

    await interaction.editReply(`Deleted **${deleted.size}** messages.`);

    const log = new EmbedBuilder()
      .setTitle("🗑️ Purge Executed")
      .setColor(Colors.Orange)
      .addFields(
        { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Channel", value: `<#${interaction.channelId}>`, inline: true },
        { name: "Deleted Count", value: `${deleted.size}`, inline: true },
        { name: "Target Filter", value: target ? `<@${target.id}>` : "None" },
      )
      .setTimestamp();

    await sendLog(interaction.guild!, log);
  },
};
