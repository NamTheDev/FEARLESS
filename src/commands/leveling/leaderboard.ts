import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { SlashCommand } from "../../types";
import { getLeaderboard } from "../../utils/leveling";
import { CONFIG } from "../../config";
import { Responder } from "../../utils/responder";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the top 10 members"),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const topUsers = getLeaderboard();

    const embed = new EmbedBuilder()
      .setTitle("🏆 Server Leaderboard")
      .setColor(CONFIG.COLORS.SUCCESS)
      .setTimestamp();

    if (topUsers.length === 0) {
      embed.setDescription("No data yet.");
    } else {
      const description = topUsers
        .map(([userId, data], index) => {
          let medal = "";
          if (index === 0) medal = "🥇";
          else if (index === 1) medal = "🥈";
          else if (index === 2) medal = "🥉";
          else medal = `**${index + 1}.**`;

          return `${medal} <@${userId}> — **Lvl ${data.level}** (${data.xp} XP)`;
        })
        .join("\n");

      embed.setDescription(description);
    }

    await Responder.reply(interaction, { embeds: [embed] });
  },
};
