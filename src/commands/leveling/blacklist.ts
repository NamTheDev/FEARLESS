import {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";

import { SlashCommand } from "@typings/SlashCommand";
import { Responder } from "@utils/responder";
import { setBlacklistState, getUserData } from "@logic/leveling";

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("blacklist")
        .setDescription("Toggle XP gain for a member")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((sub) =>
            sub
                .setName("apply")
                .setDescription("Set blacklist status for a member")
                .addUserOption((opt) =>
                    opt
                        .setName("target")
                        .setDescription("The member")
                        .setRequired(true),
                )
                .addBooleanOption((opt) =>
                    opt
                        .setName("status")
                        .setDescription("Whether to blacklist from XP gain")
                        .setRequired(true),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("status")
                .setDescription("Check blacklist status of a member")
                .addUserOption((opt) =>
                    opt
                        .setName("target")
                        .setDescription("The member (default: you)"),
                ),
        ),
    visible: true,
    execute: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "apply") {
            const target = interaction.options.getUser("target", true);
            const status = interaction.options.getBoolean("status", true);

            setBlacklistState(target.id, status);

            return await Responder.success(
                interaction,
                `${target.username} blacklisted: **${status}**`,
            );
        }

        if (subcommand === "status") {
            const target =
                interaction.options.getUser("target") || interaction.user;
            const data = getUserData(target.id);
            const isBlacklisted = data
                ? data.xpBlockedUntil > Date.now()
                : false;

            return await Responder.success(
                interaction,
                `${target.username} blacklisted: **${isBlacklisted}**`,
            );
        }
    },
};
