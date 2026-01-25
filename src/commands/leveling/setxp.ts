import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    PermissionFlagsBits, 
    MessageFlags 
} from "discord.js";
import { SlashCommand } from "../../types";
import { setLevel, adjustXp } from "../../utils/leveling";

export const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("setxp")
        .setDescription("Manage Member XP and Levels")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => 
            sub.setName("give")
                .setDescription("Give XP to a user")
                .addUserOption(opt => opt.setName("target").setDescription("The user").setRequired(true))
                .addIntegerOption(opt => opt.setName("amount").setDescription("Amount of XP").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("deduct")
                .setDescription("Remove XP from a user")
                .addUserOption(opt => opt.setName("target").setDescription("The user").setRequired(true))
                .addIntegerOption(opt => opt.setName("amount").setDescription("Amount of XP").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("setlevel")
                .setDescription("Force set a user to a specific level")
                .addUserOption(opt => opt.setName("target").setDescription("The user").setRequired(true))
                .addIntegerOption(opt => opt.setName("level").setDescription("Level").setRequired(true))
        ),

    execute: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser("target", true);
        const guild = interaction.guild;

        if (!guild) return;

        let member;
        try {
            member = await guild.members.fetch(targetUser.id);
        } catch {
            await interaction.reply({ content: "User not found in this guild.", flags: MessageFlags.Ephemeral });
            return;
        }

        if (subcommand === "give") {
            const amount = interaction.options.getInteger("amount", true);
            await adjustXp(member, amount);
            await interaction.reply({ 
                content: `✅ Gave **${amount} XP** to ${targetUser.username}.`,
                flags: MessageFlags.Ephemeral
            });
        } 
        else if (subcommand === "deduct") {
            const amount = interaction.options.getInteger("amount", true);
            await adjustXp(member, -amount);
            await interaction.reply({ 
                content: `✅ Removed **${amount} XP** from ${targetUser.username}.`,
                flags: MessageFlags.Ephemeral
            });
        }
        else if (subcommand === "setlevel") {
            const level = interaction.options.getInteger("level", true);
            await setLevel(member, level, true);
            await interaction.reply({ 
                content: `✅ Set ${targetUser.username} to **Level ${level}**.`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};