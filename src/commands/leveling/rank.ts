import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";

import { SlashCommand } from "@typings/SlashCommand";
import { UserData } from "@typings/UserData";
import { getUserData, getUserRank } from "@logic/leveling";
import { CONFIG } from "@core/config";
import { Responder } from "@utils/responder";
import { buildRankEmbed } from "@utils/messages";

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
    visible: true,
    execute: async (interaction: ChatInputCommandInteraction) => {
        const target =
            interaction.options.getUser("target") || interaction.user;

        const [data, rank] = await Promise.all([
            getUserData(target.id),
            getUserRank(target.id),
        ]);

        if (!data) {
            const embed = new EmbedBuilder()
                .setColor(CONFIG.COLORS.DEFAULT)
                .setAuthor({
                    name: target.username,
                    iconURL: target.displayAvatarURL(),
                })
                .setDescription("Has not earned any XP yet.");
            await Responder.reply(interaction, { embeds: [embed] });
            return;
        }

        const embed = buildRankEmbed(target, data, rank || 0);

        await Responder.reply(interaction, { embeds: [embed] });
    },
};
