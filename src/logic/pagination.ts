import { ButtonInteraction } from "discord.js";
import {
  buildHelpEmbed,
  buildHelpButtons,
  buildChangelogEmbed,
  buildChangelogButtons,
} from "@utils/messages";
import { SlashCommand } from "@typings/SlashCommand";
import { getChangelogs } from "@logic/changelog";
import { parsePaginationId } from "@utils/pagination";
import { clamp } from "@utils/math";
import { handleSnipePagination } from "@logic/snipe";

const HANDLERS: Record<
  string,
  (interaction: ButtonInteraction, page: number) => Promise<void>
> = {
  help: async (interaction, page) => {
    const commands = interaction.client.commands as Map<string, SlashCommand>;
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
