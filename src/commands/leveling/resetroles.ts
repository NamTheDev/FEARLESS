import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
} from "discord.js";

import { SlashCommand } from "@typings/SlashCommand";
import { syncMemberRoles, getAllUsersLevel } from "@logic/leveling";
import { Responder } from "@utils/responder";

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("resetroles")
        .setDescription(
            "Resync leveling roles for everyone based on database levels",
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    visible: true,
    execute: async (interaction: ChatInputCommandInteraction) => {
        const guild = interaction.guild;
        if (!guild) return;

        const users = getAllUsersLevel();

        let successCount = 0;

        for (const data of users) {
            try {
                const member = await guild.members
                    .fetch(data.userId)
                    .catch(() => null);
                if (member) {
                    await syncMemberRoles(member, data.level);
                    successCount++;
                }
            } catch {
                continue;
            }
        }

        await Responder.success(
            interaction,
            `Successfully synced roles for ${successCount} members.`,
            true,
        );
    },
};
