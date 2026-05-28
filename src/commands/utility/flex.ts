import { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder, PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { buildFlexEmbed } from "@utils/messages";
import { getProjectLOC, getProjectTree } from "@logic/stats";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("flex")
    .setDescription("Display bot statistics and project structure")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const loc = getProjectLOC();
    const tree = getProjectTree();
    
    const treeBuffer = Buffer.from(tree, "utf-8");
    const attachment = new AttachmentBuilder(treeBuffer, { name: "tree.txt" });

    const botUser = await interaction.client.users.fetch(interaction.client.user!.id, { force: true });
    const bannerUrl = botUser.bannerURL({ size: 1024 });
    const bio = interaction.client.application?.description || "";

    const embed = buildFlexEmbed(interaction.client, loc, bio, bannerUrl || null);

    await interaction.editReply({
      embeds: [embed],
      files: [attachment],
    });
  },
};
