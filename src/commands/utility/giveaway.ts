import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  MessageFlags,
} from "discord.js";
import { SlashCommand } from "../../types";
import { createGiveaway, endGiveaway } from "../../utils/giveaway";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Start a weighted giveaway")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option.setName("prize").setDescription("Prize name").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Duration")
        .setRequired(true)
        .setMinValue(1),
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const prize = interaction.options.getString("prize", true);
    const mins = interaction.options.getInteger("minutes", true);
    const end = Date.now() + mins * 60000;

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const embed = new EmbedBuilder()
      .setTitle("🎉 GIVEAWAY STARTED")
      .setDescription(
        `Prize: **${prize}**\nReact with 🎉 to enter!\n\n*Odds: Early group (first 3) gets 80% shared chance!*`,
      )
      .setColor(Colors.Blue)
      .setTimestamp(end);

    if (!interaction.channel?.isSendable()) return;
    const msg = await interaction.channel.send({ embeds: [embed] });

    await msg.react("🎉");

    await createGiveaway({
      id: msg.id,
      channelId: interaction.channelId,
      prize,
      endTime: end,
      entrants: [],
      active: true,
    });

    await interaction.followUp("Giveaway started! 🎉");

    setTimeout(() => endGiveaway(msg.id, interaction.guild!), mins * 60000);
  },
};
