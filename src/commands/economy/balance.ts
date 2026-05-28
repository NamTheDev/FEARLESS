import { Message } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { getBalance } from "@logic/economy";
import { getGorelith } from "@logic/merchant";
import { buildBalanceEmbed } from "@utils/messages";

export const command: SlashCommand = {
    data: {
        name: "balance",
        description: "Check your current economy balance",
    },
    visible: true,
    messageOnly: true,
    executeMessage: async (message: Message, args: string[]) => {
        const target = message.mentions.users.first() || message.author;
        const bloodern = getBalance(target.id);
        const gorelith = getGorelith(target.id);

        const embed = buildBalanceEmbed(target, bloodern, gorelith);

        await message.reply({ embeds: [embed] });
    },
};
