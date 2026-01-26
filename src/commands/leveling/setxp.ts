import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { SlashCommand } from "../../types";
import { adjustXp } from "../../utils/leveling";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setxp")
    .setDescription("Give or remove XP from a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("give")
        .setDescription("Give XP to a user")
        .addUserOption((opt) =>
          opt.setName("target").setDescription("The user").setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("Amount of XP")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deduct")
        .setDescription("Remove XP from a user")
        .addUserOption((option) =>
          option.setName("target").setDescription("The user").setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of XP")
            .setRequired(true),
        ),
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
      await interaction.reply({
        content: "User not found in this guild.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const amount = interaction.options.getInteger("amount", true);

    if (subcommand === "give") {
      await adjustXp(member, amount);
      await interaction.reply({
        content: `✅ Gave **${amount} XP** to ${targetUser.username}.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommand === "deduct") {
      await adjustXp(member, -amount);
      await interaction.reply({
        content: `✅ Removed **${amount} XP** from ${targetUser.username}.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
