import { EmbedBuilder, Message } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { useItem } from "@logic/economy";
import { CONFIG } from "@core/config";
import { formatInventory } from "@utils/messages";
import { getUserInventoryStmt } from "@core/database";

export const command: SlashCommand = {
    data: {
        name: "inventory",
        description: "Check or use your purchased items",
    },
    visible: true,
    messageOnly: true,
    executeMessage: async (message: Message, args: string[]) => {
        const userId = message.author.id;
        const sub = args[0]?.toLowerCase();

        switch (sub) {
            case "use": {
                const itemKey = args[1]?.toLowerCase();
                if (!itemKey) return await message.reply("❌ Specify item!");
                const res = useItem(userId, itemKey);
                await message.reply(res.message);
                break;
            }
            case "help": {
                const embed = new EmbedBuilder()
                    .setTitle("🎒 Inventory Help")
                    .setColor(CONFIG.COLORS.DEFAULT)
                    .setDescription(
                        "**Commands:**\n" +
                        "`rf inventory` - Show your items\n" +
                        "`rf inventory use <key>` - Use an item"
                    );
                await message.reply({ embeds: [embed] });
                break;
            }
            default: {
                const items = getUserInventoryStmt.all(userId) as {
                    itemKey: string;
                    count: number;
                }[];
                const embed = new EmbedBuilder()
                    .setTitle(`🎒 ${message.author.username}'s Inventory`)
                    .setColor(CONFIG.COLORS.DEFAULT)
                    .setDescription("-# Need help? Run `rf inventory help`")
                    .addFields(
                        { name: "Items", value: formatInventory(items) || "None", inline: false }
                    );
                await message.reply({ embeds: [embed] });
            }
        }
    },
};
