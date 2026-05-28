import { EmbedBuilder, Message } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { getEconomyLeaderboard } from "@logic/economy";
import { CONFIG } from "@core/config";
import { formatEcoLeaderboard } from "@utils/messages";

export const command: SlashCommand = {
    data: {
        name: "ecoleaderboard",
        description: "View the top 15 richest members in bloodern",
    },
    visible: true,
    messageOnly: true,
    executeMessage: async (message: Message, args: string[]) => {
        const topUsers = getEconomyLeaderboard();

        const embed = new EmbedBuilder()
            .setTitle("🏆 Bloodern Leaderboard")
            .setColor(CONFIG.COLORS.DEFAULT)
            .setTimestamp()
            .setDescription(formatEcoLeaderboard(topUsers));

        await message.reply({ embeds: [embed] });
    },
};
