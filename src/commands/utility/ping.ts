import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { Responder } from "@utils/responder";
import { buildPingMessage } from "@utils/messages";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Displays the bot latency"),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const message = (await interaction.fetchReply()) as any;

    const createdTimestamp = message ? message.createdTimestamp : Date.now();
    const latency = createdTimestamp - interaction.createdTimestamp;
    const apiPing = interaction.client.ws.ping;

    await Responder.reply(interaction, buildPingMessage(latency, apiPing));
  },
};
