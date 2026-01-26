import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { SlashCommand, UserData } from "../../types";
import { getUserData, getUserRank } from "../../utils/leveling";
import { CONFIG } from "../../config";
import { Responder } from "../../utils/responder";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your current level and XP")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Check another user's rank")
        .setRequired(false),
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const target = interaction.options.getUser("target") || interaction.user;

    const [firstEntry, secondEntry] = await Promise.all([
      getUserData(target.id),
      getUserRank(target.id),
    ]);

    const data = firstEntry as UserData | null;
    const rank = secondEntry as number | null;

    const embed = new EmbedBuilder()
      .setColor(CONFIG.COLORS.SUCCESS)
      .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() });

    if (!data) {
      embed.setDescription("Has not earned any XP yet.");
      await Responder.reply(interaction, { embeds: [embed] });
      return;
    }

    const nextLevel = data.level + 1;
    const nextLevelReq = nextLevel * 400;
    const xpNeeded = nextLevelReq - data.xp;

    embed.addFields(
      { name: "Rank", value: `#${rank}`, inline: true },
      { name: "Level", value: `${data.level}`, inline: true },
      { name: "XP", value: `${data.xp} / ${nextLevelReq}`, inline: true },
      { name: "To Next Level", value: `${xpNeeded} XP needed`, inline: false },
    );

    await Responder.reply(interaction, { embeds: [embed] });
  },
};
