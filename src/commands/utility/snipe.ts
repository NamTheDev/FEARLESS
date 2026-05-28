import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { snipes } from "@core/snipe";
import { Responder } from "@utils/responder";
import {
  buildSnipeEmbed,
  getSnipeFiles,
  buildSnipeButtons,
} from "@utils/messages";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("snipe")
    .setDescription("Reveal recently deleted messages in this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const channelSnipes = snipes.get(interaction.channelId);

    if (!channelSnipes || channelSnipes.length === 0) {
      await Responder.error(
        interaction,
        "There's nothing to snipe here!",
        true,
      );
      return;
    }

    const index = 0;

    await Responder.reply(interaction, {
      embeds: [
        buildSnipeEmbed(channelSnipes[index]!, index, channelSnipes.length),
      ],
      files: getSnipeFiles(channelSnipes[index]!),
      components:
        channelSnipes.length > 1
          ? [buildSnipeButtons(index, channelSnipes.length)]
          : [],
    });
  },
};
