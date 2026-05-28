import { Message } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { subBloodern, addBloodern } from "@logic/economy";

export const command: SlashCommand = {
    data: {
        name: "gift",
        description: "Gift bloodern to another user",
    },
    visible: true,
    messageOnly: true,
    executeMessage: async (message: Message, args: string[]) => {
        const target = message.mentions.users.first();
        const amount = parseInt(args[1] || "");

        if (!target) {
            await message.reply(
                "❌ You must mention a user to gift to! Usage: `rf gift @user amount`",
            );
            return;
        }

        if (isNaN(amount) || amount < 1) {
            await message.reply("❌ Invalid amount!");
            return;
        }

        if (target.id === message.author.id) {
            await message.reply("❌ You cannot gift to yourself!");
            return;
        }

        if (target.bot) {
            await message.reply("❌ You cannot gift to bots!");
            return;
        }

        if (!subBloodern(message.author.id, amount)) {
            await message.reply("❌ Insufficient funds!");
            return;
        }

        addBloodern(target.id, amount);

        await message.reply(
            `✅ Gifted **${amount}** 🩸 Bloodern to ${target.toString()}!`,
        );
    },
};
