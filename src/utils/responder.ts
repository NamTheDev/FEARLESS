// src/utils/responder.ts
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { CONFIG } from "../config";
import { sendError as logErrorToChannel } from "./logger";

export const Responder = {
  /**
   * Standard Success Response
   */
  success: async (
    interaction: ChatInputCommandInteraction,
    message: string,
    ephemeral = true,
  ) => {
    const embed = new EmbedBuilder()
      .setDescription(`✅ ${message}`)
      .setColor(CONFIG.COLORS.SUCCESS);

    return await Responder.reply(interaction, {
      embeds: [embed],
      ephemeral,
    });
  },

  /**
   * Standard Error Response (and automatic logging)
   */
  error: async (
    interaction: ChatInputCommandInteraction,
    error: string | Error,
    ephemeral = true,
  ) => {
    const errorMessage = typeof error === "string" ? error : error.message;

    const embed = new EmbedBuilder()
      .setTitle("❌ Action Failed")
      .setDescription(errorMessage)
      .setColor(CONFIG.COLORS.ERROR);

    // If it's a real Error object, log it to the staff log channel
    if (error instanceof Error && interaction.guild) {
      await logErrorToChannel(
        interaction.guild,
        error,
        `Command: /${interaction.commandName}`,
      );
    }

    return await Responder.reply(interaction, {
      embeds: [embed],
      ephemeral,
    });
  },

  /**
   * Internal helper to handle deferred/replied states
   */
  reply: async (interaction: ChatInputCommandInteraction, payload: any) => {
    if (interaction.replied || interaction.deferred) {
      return await interaction.editReply(payload);
    }
    return await interaction.reply(payload);
  },
};
