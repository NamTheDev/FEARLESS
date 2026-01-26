import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "../../types";
import { Responder } from "../../utils/responder";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Displays the bot latency"),

  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ ephemeral: true });

    // fetch the deferred reply message to measure latency
    const message = (await interaction.fetchReply()) as any;

    const createdTimestamp = message ? message.createdTimestamp : Date.now();
    const latency = createdTimestamp - interaction.createdTimestamp;
    const apiPing = interaction.client.ws.ping;

    await Responder.reply(interaction, {
      content: `🏓 **Pong!**\nLatency: \`${latency}ms\`\nAPI Heartbeat: \`${apiPing}ms\``,
    });
  },
};
