import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

import { SlashCommand } from "@typings/SlashCommand";
import { createGiveaway, endGiveaway } from "@logic/giveaway";
import { Responder } from "@utils/responder";
import { buildGiveawayEmbed, buildGiveawayButtons } from "@utils/messages";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Start a weighted giveaway")
    .addStringOption((option) =>
      option.setName("prize").setDescription("Prize name").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Duration")
        .setRequired(true)
        .setMinValue(1),
    )
    .addIntegerOption((option) =>
      option
        .setName("winners")
        .setDescription("Number of winners")
        .setMinValue(1)
        .setMaxValue(10),
    )
    .addRoleOption((option) =>
      option.setName("role").setDescription("Minimum role requirement"),
    ),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const prize = interaction.options.getString("prize", true);
    const mins = interaction.options.getInteger("minutes", true);
    const winnerCount = interaction.options.getInteger("winners") || 1;
    const requiredRole = interaction.options.getRole("role");
    const end = Date.now() + mins * 60000;

    const embed = buildGiveawayEmbed(
      prize,
      winnerCount,
      requiredRole as any,
      end,
    );
    const buttons = buildGiveawayButtons();

    if (!interaction.channel?.isSendable()) return;
    const msg = await interaction.channel.send({
      embeds: [embed],
      components: [buttons],
    });

    await createGiveaway({
      id: msg.id,
      channelId: interaction.channelId,
      prize,
      endTime: end,
      entrants: [],
      active: true,
      winnerCount,
      requiredRoleId: requiredRole?.id,
    });

    await Responder.success(interaction, "Giveaway started! 🎉");
    setTimeout(() => endGiveaway(msg.id, interaction.guild!), mins * 60000);
  },
};
