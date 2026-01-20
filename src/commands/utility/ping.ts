import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import type { SlashCommand } from "../../types";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Displays the bot latency"),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const response = await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
      withResponse: true,
    });

    const message = response.resource?.message;

    const createdTimestamp = message ? message.createdTimestamp : Date.now();
    const latency = createdTimestamp - interaction.createdTimestamp;
    const apiPing = interaction.client.ws.ping;

    await interaction.editReply({
      content: `🏓 **Pong!**\nLatency: \`${latency}ms\`\nAPI Heartbeat: \`${apiPing}ms\``,
    });
  },
};
