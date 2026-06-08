import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
} from "discord.js";

import { SlashCommand } from "@typings/SlashCommand";
import { sendLog } from "@utils/logging";
import { Responder } from "@utils/responder";
import { buildPurgeLogEmbed } from "@utils/messages";
import { CONFIG } from "@core/config";

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Bulk delete messages")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("1-100 messages")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100),
        )
        .addUserOption((option) =>
            option.setName("target").setDescription("Filter by user"),
        ),
    visible: true,
    execute: async (interaction: ChatInputCommandInteraction) => {
        const amount = interaction.options.getInteger("amount", true);
        const target = interaction.options.getUser("target");

        if (amount === 1) {
            await Responder.error(
                interaction,
                "Purging with 1 message isn't possible sir :D",
                true,
            );
            return;
        }

        const messages = await interaction.channel?.messages.fetch({
            limit: amount,
        });
        if (!messages) return;

        const toDelete = messages.filter((m) => {
            const ageCheck = Date.now() - m.createdTimestamp < 1209600000;
            const userCheck = target ? m.author?.id === target.id : true;
            return ageCheck && userCheck && !m.system;
        });

        if (toDelete.size === 0) {
            await Responder.error(
                interaction,
                "No eligible messages found.",
                true,
            );
            return;
        }

        const deleted = await (interaction.channel as any).bulkDelete(
            toDelete,
            true,
        );

        await Responder.success(
            interaction,
            `Deleted ${deleted.size} messages.`,
            true,
        );

        const log = buildPurgeLogEmbed(
            interaction.user.id,
            interaction.channelId,
            deleted.size,
            target?.id
        );

        await sendLog(interaction.guild!, CONFIG.LOG_CHANNEL_ID, log);
    },
};
