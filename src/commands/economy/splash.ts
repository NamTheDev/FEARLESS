import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getShellite, getCastle, updateCastle } from "@logic/economy";

export default {
  data: new SlashCommandBuilder()
    .setName("splash")
    .setDescription("Damage a user's castle")
    .addUserOption(o => o.setName("target").setDescription("User").setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("target")!;
    if (getShellite(interaction.user.id) < 2) return interaction.reply({ content: "Need 2 shellite to splash.", ephemeral: true });
    
    const castle = getCastle(target.id) as any;
    if (!castle) return interaction.reply("Target has no castle.");
    updateCastle(target.id, castle.stage, Math.max(0, castle.health - 5));
    interaction.reply(`Splashed ${target.username}'s castle!`);
  }
};
