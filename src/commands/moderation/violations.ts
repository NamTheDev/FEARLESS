import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
} from "discord.js";

import { SlashCommand } from "@typings/SlashCommand";
import { Responder } from "@utils/responder";
import { getViolations } from "@logic/antiSpam";
import { buildViolationsEmbed } from "@utils/messages";

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("violations")
        .setDescription("View violations for a user")
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers | PermissionFlagsBits.ModerateMembers)
        .addUserOption((option) =>
            option
                .setName("target")
                .setDescription("The user to check")
                .setRequired(true),
        ),
    visible: true,
    execute: async (interaction: ChatInputCommandInteraction) => {
        const target = interaction.options.getUser("target", true);

        const spamRow = getViolations(target.id);

        const embed = buildViolationsEmbed(target, spamRow);

        await Responder.reply(interaction, { embeds: [embed] });
    },
};
