import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

import { SlashCommand } from "@typings/SlashCommand";
import { adjustXp } from "@logic/leveling";
import { getMember } from "@utils/fetchers";
import { Responder } from "@utils/responder";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setxp")
    .setDescription("Give or remove XP from a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("give")
        .setDescription("Give XP to a user")
        .addUserOption((option) =>
          option.setName("target").setDescription("The user").setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of XP")
            .setRequired(true)
            .setMinValue(1),
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
            .setRequired(true)
            .setMinValue(1),
        ),
    ),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser("target", true);
    const guild = interaction.guild;

    if (!guild) return;

    const member = await getMember(guild, targetUser.id);
    if (!member) {
      await Responder.error(interaction, "User not found in this server.");
      return;
    }

    const amount = interaction.options.getInteger("amount", true);

    if (subcommand === "give") {
      await adjustXp(member, amount);
      await Responder.success(
        interaction,
        `Gave **${amount} XP** to ${targetUser.username}.`,
        true,
      );
    } else if (subcommand === "deduct") {
      await adjustXp(member, -amount);
      await Responder.success(
        interaction,
        `Removed **${amount} XP** from ${targetUser.username}.`,
        true,
      );
    }
  },
};
