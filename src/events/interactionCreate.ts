import {
  Events,
  Interaction,
  MessageFlags,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { BotEvent } from "../types";
import { sendLog } from "../utils/logger";

export const event: BotEvent = {
  name: Events.InteractionCreate,
  execute: async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    const log = new EmbedBuilder()
      .setTitle("💻 Command Used")
      .setColor(Colors.Blue)
      .addFields(
        { name: "User", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Command", value: `/${interaction.commandName}`, inline: true },
      )
      .setTimestamp();

    if (interaction.guild) await sendLog(interaction.guild, log);

    try {
      await command.execute(interaction);
    } catch (e) {
      console.error(e);
      await interaction
        .reply({ content: "Command Error.", flags: MessageFlags.Ephemeral })
        .catch(() => null);
    }
  },
};
