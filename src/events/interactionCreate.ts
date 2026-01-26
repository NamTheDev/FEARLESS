import {
  Events,
  Interaction,
  MessageFlags,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { BotEvent } from "../types";
import { sendLog, sendError } from "../utils/logger";
import { CONFIG } from "../config";

export const event: BotEvent = {
  name: Events.InteractionCreate,
  execute: async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    const log = new EmbedBuilder()
      .setTitle("💻 Command Used")
      .setColor(CONFIG.COLORS.INFO)
      .addFields(
        { name: "User", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Command", value: `/${interaction.commandName}`, inline: true },
      )
      .setTimestamp();
    if (interaction.guild) await sendLog(interaction.guild, log);

    try {
      await command.execute(interaction);
    } catch (e) {
      // Send the error to the centralized log channel (if a guild is present)
      if (interaction.guild) {
        try {
          await sendError(
            interaction.guild,
            e as Error,
            "Slash Command: /" + interaction.commandName,
          );
        } catch {
          // swallow sendError failures, but keep logging to console
        }
      } else {
        // fallback: still log to console
        console.error(e);
      }

      // Reply to user using a branded embed
      const embed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setColor(CONFIG.COLORS.ERROR)
        .setDescription("An error occurred while executing that command.")
        .setTimestamp();

      await interaction
        .reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
        .catch(() => null);
    }
  },
};
