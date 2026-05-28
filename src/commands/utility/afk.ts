import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { setAfk } from "@logic/afk";
import { Responder } from "@utils/responder";
import { buildAfkEmbed } from "@utils/messages";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set your AFK status")
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Why are you away?")
        .setRequired(false),
    ),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    setAfk(interaction.user.id, reason);
    await Responder.success(interaction, `You are now AFK: **${reason}**`);
  },
  executeMessage: async (message: Message, args: string[]) => {
    const reason = args.length > 0 ? args.join(" ") : "No reason provided";
    setAfk(message.author.id, reason);
    
    const embed = buildAfkEmbed(reason);
      
    await message.reply({ embeds: [embed] });
  },
};

