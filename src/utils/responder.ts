import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  MessageFlags,
} from "discord.js";
import { CONFIG } from "@core/config";
import { handleSystemErrorLog } from "@logic/logging";

export type InteractionOrMessage = ChatInputCommandInteraction | Message;

export const Responder = {
  success: async (
    target: InteractionOrMessage,
    message: string,
    ephemeral = false,
  ) => {
    const embed = new EmbedBuilder()
      .setDescription(`✅ ${message}`)
      .setColor(CONFIG.COLORS.SUCCESS);

    const flags = ephemeral ? MessageFlags.Ephemeral : undefined;

    return await Responder.reply(target, {
      embeds: [embed],
      flags,
    });
  },

  error: async (
    target: InteractionOrMessage,
    error: string | Error,
    ephemeral = false,
  ) => {
    const errorMessage = typeof error === "string" ? error : error.message;

    const embed = new EmbedBuilder()
      .setTitle("❌ Action Failed")
      .setDescription(errorMessage)
      .setColor(CONFIG.COLORS.ERROR);

    const flags = ephemeral ? MessageFlags.Ephemeral : undefined;

    if (error instanceof Error && target.guild) {
      const context = "commandName" in target ? `/ ${target.commandName}` : "Message Command";
      await handleSystemErrorLog(target.guild, error, context);
    }

    return await Responder.reply(target, {
      embeds: [embed],
      flags,
    });
  },

  update75: async (target: InteractionOrMessage, title: string, desc: string) => {
    const embed = new EmbedBuilder()
      .setTitle(`🩸 Update 7.5: ${title}`)
      .setDescription(desc)
      .setColor(0x8B0000)
      .setTimestamp();

    return await Responder.reply(target, { embeds: [embed] });
  },

  reply: async (target: InteractionOrMessage, payload: any) => {
    try {
      if ("commandName" in target) {
        if (target.replied || target.deferred) {
          return await target.editReply(payload);
        }
        return await target.reply(payload);
      }
      return await target.reply(payload);
    } catch (e: any) {
      if (e.code === 10008 || e.code === 40060 || e.code === 10015) return null;
      throw e;
    }
  },
};
