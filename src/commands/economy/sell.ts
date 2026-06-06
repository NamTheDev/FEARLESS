import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getCastle, addBloodern } from "@logic/economy";
import db from "@core/database";

export default {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell your castle for Bloodern"),
  async execute(interaction: ChatInputCommandInteraction) {
    const castle = getCastle(interaction.user.id) as any;
    if (!castle) return interaction.reply("No castle to sell.");
    const price = castle.stage * 250;
    addBloodern(interaction.user.id, price);
    db.run("DELETE FROM castles WHERE userId = ?", [interaction.user.id]);
    interaction.reply(`Sold castle for ${price} Bloodern.`);
  }
};
