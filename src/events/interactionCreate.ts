import { Events, Interaction, EmbedBuilder } from "discord.js";
import { BotEvent } from "../types";
import { sendLog } from "../utils/logger";
import { CONFIG } from "../config";
import { Responder } from "../utils/responder";

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
      await Responder.error(interaction, e as Error);
    }
  },
};
