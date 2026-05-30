import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { getChangelogs } from "@logic/changelog";
import { Responder } from "@utils/responder";
import { buildChangelogEmbed, buildChangelogButtons } from "@utils/messages";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("changelog")
    .setDescription("View the bot's update history"),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const logs = getChangelogs();

    if (logs.length === 0) {
      await Responder.error(interaction, "No changelogs available.");
      return;
    }

    const index = 0;
    const embed = buildChangelogEmbed(
      logs[index]!.date,
      logs[index]!.content,
      index,
      logs.length,
    );

    await Responder.reply(interaction, {
      embeds: [embed],
      components: [buildChangelogButtons(index, logs.length)],
    });
  },
};
