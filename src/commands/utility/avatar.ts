import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { Responder } from "@utils/responder";
import { buildAvatarEmbed } from "@utils/messages";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("View a user's avatar")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to get the avatar of")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("size")
        .setDescription("The size of the avatar image")
        .setRequired(false)
        .addChoices(
          { name: "128x128", value: 128 },
          { name: "256x256", value: 256 },
          { name: "512x512", value: 512 },
          { name: "1024x1024", value: 1024 },
          { name: "2048x2048", value: 2048 },
          { name: "4096x4096", value: 4096 },
        ),
    ),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const target = interaction.options.getUser("target") || interaction.user;
    const size = (interaction.options.getInteger("size") || 1024) as any;

    const embed = buildAvatarEmbed(target, size);

    await Responder.reply(interaction, { embeds: [embed] });
  },
};
