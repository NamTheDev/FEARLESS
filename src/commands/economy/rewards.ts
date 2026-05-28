import { EmbedBuilder, Message } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { CONFIG } from "@core/config";
import { formatRewards } from "@utils/messages";

export const command: SlashCommand = {
    data: {
        name: "rewards",
        description: "Displays all possible loot drops",
    },
    visible: true,
    messageOnly: true,
    executeMessage: async (message: Message, args: string[]) => {
        const loots = CONFIG.LOGIC.ECONOMY.LOOTS;

        const embed = new EmbedBuilder()
            .setTitle("🎁 Loot Table & Rewards")
            .setColor(CONFIG.COLORS.DEFAULT)
            .setDescription(formatRewards(loots));

        await message.reply({ embeds: [embed] });
    },
};
