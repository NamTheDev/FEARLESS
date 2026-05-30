import { Message, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { CONFIG } from "@core/config";
import { getPurchasesStmt } from "@core/database";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("purchased")
    .setDescription("Check items pending manual staff grant"),
  visible: true,
  messageOnly: true,
  executeMessage: async (message: Message) => {
    const userId = message.author.id;
    const items = getPurchasesStmt.all(userId) as { itemKey: string, count: number }[];
    const shop = CONFIG.LOGIC.ECONOMY.SHOP_ITEMS as any;

    const list = items
        .map(i => `**${shop[i.itemKey]?.name || i.itemKey}**: ${i.count}x`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("🛒 Pending Purchases")
        .setDescription(list || "No pending purchases.")
        .setColor(CONFIG.COLORS.DEFAULT);
        
    await message.reply({ embeds: [embed] });
  },
};
