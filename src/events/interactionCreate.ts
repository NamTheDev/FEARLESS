import { Events, Interaction, MessageFlags } from "discord.js";
import { BotEvent } from "@typings/BotEvent";
import { handleCommandLog } from "@logic/logging";
import { Responder } from "@utils/responder";
import { handleEconomyInteraction } from "@logic/economy";
import { handleMerchantInteraction } from "@logic/merchant";
import { handlePagination } from "@logic/pagination";
import { handleGiveawayInteraction } from "@logic/giveaway";

export const event: BotEvent = {
    name: Events.InteractionCreate,
    execute: async (interaction: Interaction) => {
        if (interaction.isButton()) {
            if (
                interaction.customId.startsWith("help:") ||
                interaction.customId.startsWith("changelog:") ||
                interaction.customId.startsWith("snipe:")
            ) {
                await handlePagination(interaction);
                return;
            }
            if (interaction.customId === "giveaway_enter") {
                await handleGiveawayInteraction(interaction);
                return;
            }
            if (interaction.customId.startsWith("merchant_")) {
                await handleMerchantInteraction(interaction);
                return;
            }
            await handleEconomyInteraction(interaction);
            return;
        }

        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(
                interaction.commandName,
            );
            if (command && command.autocomplete) {
                try {
                    await command.autocomplete(interaction);
                } catch (e) {
                    console.error(e);
                }
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(
            interaction.commandName,
        );
        if (!command) return;

        try {
            const flags =
                command.visible === false ? MessageFlags.Ephemeral : undefined;
            try {
                await interaction.deferReply({ flags });
            } catch (e: any) {
                if (e.code === 10008 || e.code === 10015) return;
                throw e;
            }

            await handleCommandLog(interaction);

            if (command.execute) {
                await command.execute(interaction);
            }
        } catch (e) {
            await Responder.error(interaction, e as Error);
        }
    },
};
