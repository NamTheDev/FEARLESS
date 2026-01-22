import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags } from "discord.js";
import { SlashCommand } from "../../types";
import { setLevel } from "../../utils/leveling";

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("setlevel")
        .setDescription("Manually set a user's level (Admin Only)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => 
            option.setName("target").setDescription("The user").setRequired(true)
        )
        .addIntegerOption(option => 
            option.setName("level").setDescription("The level to set").setRequired(true)
        ),

    execute: async (interaction: ChatInputCommandInteraction) => {
        const targetUser = interaction.options.getUser("target", true);
        const level = interaction.options.getInteger("level", true);
        const guild = interaction.guild;

        if (!guild) return;

        let member;
        try {
            member = await guild.members.fetch(targetUser.id);
        } catch {
            await interaction.reply({ content: "User not found in this guild.", flags: MessageFlags.Ephemeral });
            return;
        }

        await setLevel(member, level);

        await interaction.reply({ 
            content: `✅ Set **${targetUser.username}** to **Level ${level}**. Roles have been updated.`,
            flags: MessageFlags.Ephemeral
        });
    }
};