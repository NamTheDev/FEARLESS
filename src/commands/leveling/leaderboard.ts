import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";

import { SlashCommand } from "@typings/SlashCommand";
import { getLeaderboard } from "@logic/leveling";
import { CONFIG } from "@core/config";
import { Responder } from "@utils/responder";
import { formatLevelingLeaderboard } from "@utils/messages";

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View the top 15 members"),
    visible: true,
    execute: async (interaction: ChatInputCommandInteraction) => {
        const topUsers = getLeaderboard();

        const embed = new EmbedBuilder()
            .setTitle("🏆 Server Leaderboard")
            .setColor(CONFIG.COLORS.DEFAULT)
            .setTimestamp()
            .setDescription(formatLevelingLeaderboard(topUsers));

        await Responder.reply(interaction, { embeds: [embed] });
    },
};
