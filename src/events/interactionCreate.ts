import { Events, Interaction, MessageFlags } from "discord.js";
import { BotEvent } from "../types";

export const event: BotEvent = {
  name: Events.InteractionCreate,
  execute: async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "Error executing command",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
      return;
    }
  },
};
