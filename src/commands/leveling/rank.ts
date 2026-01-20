import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { SlashCommand } from "../../types";
import { getUserData } from "../../utils/leveling";

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
    const data = await getUserData(target.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.DarkRed)
      .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() });

    if (!data) {
      embed.setDescription("Has not earned any XP yet.");
      await interaction.reply({ embeds: [embed] });
      return;
    }

    const currentLevelBase = data.level * data.level * 100;
    const nextLevel = data.level + 1;
    const nextLevelReq = nextLevel * nextLevel * 100;

    const xpNeeded = nextLevelReq - data.xp;

    embed.addFields(
      { name: "Level", value: `${data.level}`, inline: true },
      { name: "XP", value: `${data.xp} / ${nextLevelReq}`, inline: true },
      { name: "To Next Level", value: `${xpNeeded} XP needed`, inline: false },
    );

    await interaction.reply({ embeds: [embed] });
  },
};
