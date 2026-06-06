import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getCastle, updateCastle, getShellite } from "@logic/economy";

export default {
  data: new SlashCommandBuilder()
    .setName("build")
    .setDescription("Build your sand castle"),
  async execute(interaction: ChatInputCommandInteraction) {
    const uid = interaction.user.id;
    const shellite = getShellite(uid);
    if (shellite < 1) return interaction.reply({ content: "Need shellite to build.", ephemeral: true });

    const castle = getCastle(uid) as any;
    const newStage = (castle?.stage ?? 0) + 1;
    updateCastle(uid, newStage, (castle?.health ?? 0) + 10);
    interaction.reply(`Built castle stage ${newStage}!`);
  }
};
