import { Message, EmbedBuilder } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { CONFIG } from "@core/config";
import { addBloodern, getBalance } from "@logic/economy";
import db, { getBalanceStmt, updateBalanceStmt } from "@core/database";
import { getGorelith } from "@logic/merchant";

export const command: SlashCommand = {
    data: {
        name: "sudo",
        description: "Admin sudo commands",
    },
    visible: true,
    messageOnly: true,
    executeMessage: async (message: Message, args: string[]) => {
        if (message.author.id !== CONFIG.DEVELOPER_USER_ID) return;

        const tree = {
            economy: ["give <currency> <amount> [user]", "help"],
            help: []
        };

        const sub = args[0]?.toLowerCase();

        if (sub === "help" || !sub) {
            let desc = "```\nsudo\n";
            for (const [key, subcmds] of Object.entries(tree)) {
                desc += `├── ${key}\n`;
                for (const sc of subcmds) desc += `│   └── ${sc}\n`;
            }
            desc += "└── help\n```";

            await message.reply({
                embeds: [new EmbedBuilder().setTitle("🛠️ Sudo Command Tree").setDescription(desc).setColor(CONFIG.COLORS.DEFAULT)]
            });
            return;
        }

        if (sub === "economy") {
            const action = args[1]?.toLowerCase();
            if (action === "give") {
                const currency = args[2]?.toLowerCase();
                const amount = parseInt(args[3] || "");
                const target = message.mentions.users.first() || message.author;

                if (!currency || isNaN(amount)) {
                    await message.reply("Usage: `rf sudo economy give <currency> <amount> [user]`");
                    return;
                }

                if (currency === "bloodern") {
                    addBloodern(target.id, amount);
                    await message.reply(`✅ Added ${amount} bloodern to ${target.tag}.`);
                } else if (currency === "gorelith") {
                    const res = getBalanceStmt.get(target.id) as { bloodern: number, gorelith: number } | undefined;
                    updateBalanceStmt.run(target.id, res?.bloodern || 0, (res?.gorelith || 0) + amount);
                    await message.reply(`✅ Added ${amount} gorelith to ${target.tag}.`);
                }
            } else if (action === "help") {
                const embed = new EmbedBuilder()
                    .setTitle("🛠️ Sudo Economy Guide")
                    .setDescription("Usage: `rf sudo economy give <currency> <amount> [user]`\nCurrency: `bloodern`, `gorelith`\nUser: Optional mention (defaults to author)")
                    .setColor(CONFIG.COLORS.DEFAULT);
                await message.reply({ embeds: [embed] });
            }
        }
    },
};
