import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import {
  createResponse,
  editResponse,
  removeResponse,
  getResponses,
} from "@logic/autoResponse";
import { Responder } from "@utils/responder";
import { CONFIG } from "@core/config";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("autoresponse")
    .setDescription("Manage trigger-based auto-responses")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Add a new auto-response")
        .addStringOption((option) =>
          option
            .setName("trigger")
            .setDescription("The word/phrase to watch for")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("response")
            .setDescription("The bot's reply")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Update an existing response")
        .addStringOption((option) =>
          option
            .setName("trigger")
            .setDescription("The existing trigger")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("response")
            .setDescription("The new reply")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Delete an auto-response")
        .addStringOption((option) =>
          option
            .setName("trigger")
            .setDescription("The trigger to remove")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all active triggers"),
    ),
  visible: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const trigger =
      interaction.options.getString("trigger")?.toLowerCase() || "";
    const response = interaction.options.getString("response") || "";

    switch (sub) {
      case "create": {
        const success = createResponse(guildId, trigger, response);
        if (!success) {
          await Responder.error(
            interaction,
            `Trigger \`${trigger}\` already exists or could not be created.`,
          );
          return;
        }
        await Responder.success(
          interaction,
          `Created auto-response for \`${trigger}\`.`,
        );
        break;
      }

      case "edit": {
        const success = editResponse(guildId, trigger, response);
        if (!success) {
          await Responder.error(
            interaction,
            `Trigger \`${trigger}\` does not exist. Use \`/autoresponse create\` instead.`,
          );
          return;
        }
        await Responder.success(
          interaction,
          `Updated response for \`${trigger}\`.`,
        );
        break;
      }

      case "remove": {
        const success = removeResponse(guildId, trigger);
        if (!success) {
          await Responder.error(
            interaction,
            `No auto-response found for \`${trigger}\`.`,
          );
          return;
        }
        await Responder.success(
          interaction,
          `Removed auto-response for \`${trigger}\`.`,
        );
        break;
      }

      case "list": {
        const list = getResponses(guildId);
        if (list.length === 0) {
          await Responder.error(
            interaction,
            "No auto-responses configured for this server.",
          );
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle("🤖 Auto-Responses")
          .setColor(CONFIG.COLORS.DEFAULT)
          .setDescription(
            list.map((r) => `• **${r.trigger}** → ${r.response}`).join("\n"),
          )
          .setFooter({ text: `Total: ${list.length}` });

        await Responder.reply(interaction, { embeds: [embed] });
        break;
      }
    }
  },
};
