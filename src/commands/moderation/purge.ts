import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { SlashCommand } from "../../types";
import { sendLog } from "../../utils/logger";
import { CONFIG } from "../../config";
import { Responder } from "../../utils/responder";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("1-100 messages")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addUserOption((option) =>
      option.setName("target").setDescription("Filter by user"),
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("target");

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel?.messages.fetch({
      limit: amount,
    });
    if (!messages) return;

    const toDelete = messages.filter((m) => {
      const ageCheck = Date.now() - m.createdTimestamp < 1209600000;
      const userCheck = target ? m.author.id === target.id : true;
      return ageCheck && userCheck && !m.system;
    });

    if (toDelete.size === 0) {
      await Responder.error(interaction, "No eligible messages found.", true);
      return;
    }

    const deleted = await (interaction.channel as any).bulkDelete(
      toDelete,
      true,
    );

    await Responder.success(
      interaction,
      `Deleted ${deleted.size} messages.`,
      true,
    );

    const log = new EmbedBuilder()
      .setTitle("🗑️ Purge Executed")
      .setColor(CONFIG.COLORS.INFO)
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
