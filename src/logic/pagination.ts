import { ButtonInteraction } from "discord.js";
import {
    buildHelpEmbed,
    buildHelpButtons,
    buildChangelogEmbed,
    buildChangelogButtons,
    buildSummerStatEmbed,
    buildSummerStatButtons,
} from "@utils/messages";
import { SlashCommand } from "@typings/SlashCommand";
import { getChangelogs } from "@logic/changelog";
import { parsePaginationId } from "@utils/pagination";
import { clamp } from "@utils/math";
import { handleSnipePagination } from "@logic/snipe";
import { join } from "path";

const summerPath = join(process.cwd(), "data", "summer.json");

const HANDLERS: Record<
    string,
    (interaction: ButtonInteraction, page: number) => Promise<void>
> = {
    help: async (interaction, page) => {
        const commands = interaction.client.commands as Map<
            string,
            SlashCommand
        >;
        await interaction.update({
            embeds: [buildHelpEmbed(commands, page)],
            components: [buildHelpButtons(page)],
        });
    },
    changelog: async (interaction, index) => {
        const logs = getChangelogs();
        if (!logs[index]) return;
        await interaction.update({
            embeds: [
                buildChangelogEmbed(
                    logs[index]!.date,
                    logs[index]!.content,
                    index,
                    logs.length,
                ),
            ],
            components: [buildChangelogButtons(index, logs.length)],
        });
    },
    snipe: handleSnipePagination,
    summer_stat: async (interaction, page) => {
        const file = Bun.file(summerPath);
        if (await file.exists()) {
            const data = await file.json();
            const userData = data[interaction.user.id];
            const castles = userData.castles || [];
            const totalPages = castles.length;
            const embed = buildSummerStatEmbed(castles, page);
            const buttons = buildSummerStatButtons(page, totalPages);

            await interaction.update({
                embeds: [embed],
                components: buttons ? [buttons] : [],
            });
        }
    },
};

export const getHelpPage = (input: any): number => {
    const page = typeof input === "string" ? parseInt(input) : input || 1;
    return isNaN(page) ? 1 : clamp(page, 1, 5);
};

export const handlePagination = async (interaction: ButtonInteraction) => {
    const parsed = parsePaginationId(interaction.customId);
    if (!parsed) return;

    try {
        const handler = HANDLERS[parsed.prefix];
        if (handler) await handler(interaction, parsed.page);
    } catch {}
};
