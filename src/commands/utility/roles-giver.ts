import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
  MessageFlags,
} from "discord.js";
import { SlashCommand } from "../../types";

const DATA_FILE = "data/reaction-roles.json";

interface ReactionData {
  [messageId: string]: {
    [emojiName: string]: string;
  };
}

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("roles-giver")
    .setDescription("Manage Reaction Role Panels")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new role panel")
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Embed Title").setRequired(false),
        )
        .addStringOption((opt) =>
          opt
            .setName("description")
            .setDescription("Embed Description")
            .setRequired(false),
        )
        .addStringOption((opt) =>
          opt.setName("color").setDescription("Hex Color").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a character/role to an existing panel")
        .addStringOption((opt) =>
          opt
            .setName("message_id")
            .setDescription("Panel Message ID")
            .setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("Role to give").setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("Name for the list (e.g. Garou)")
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("emoji")
            .setDescription("The Emoji to react with")
            .setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target Channel")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a character/role from the panel")
        .addStringOption((opt) =>
          opt
            .setName("message_id")
            .setDescription("Panel Message ID")
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("emoji")
            .setDescription("The Emoji to remove")
            .setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target Channel")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Edit Title/Desc")
        .addStringOption((o) =>
          o
            .setName("message_id")
            .setDescription("Panel Message ID")
            .setRequired(true),
        )
        .addStringOption((o) =>
          o.setName("title").setDescription("New Title").setRequired(false),
        )
        .addStringOption((o) =>
          o
            .setName("description")
            .setDescription("New Description")
            .setRequired(false),
        )
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Target Channel")
            .setRequired(false),
        ),
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      const title = interaction.options.getString("title") || "Role Menu";
      const desc =
        interaction.options.getString("description") ||
        "React to get the role!";
      const colorStr = interaction.options.getString("color") || "FF0000";
      const color = parseInt(colorStr.replace("#", ""), 16);

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor(color);

      await interaction.reply({
        content: "Panel created!",
        flags: MessageFlags.Ephemeral,
      });
      if (interaction.channel?.isSendable())
        await interaction.channel.send({ embeds: [embed] });
      return;
    }

    const messageId = interaction.options.getString("message_id", true);
    const channel = (interaction.options.getChannel("channel") ||
      interaction.channel) as TextChannel;

    if (!channel?.isTextBased()) {
      await interaction.reply({
        content: "Invalid channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const message = await channel.messages.fetch(messageId);

      const file = Bun.file(DATA_FILE);
      let db: ReactionData = {};
      if (await file.exists()) db = await file.json();
      if (!db[messageId]) db[messageId] = {};

      const embed = new EmbedBuilder(message.embeds[0].toJSON());

      if (sub === "add") {
        const role = interaction.options.getRole("role", true);
        const name = interaction.options.getString("name", true);
        const emoji = interaction.options.getString("emoji", true);

        await message.react(emoji);

        db[messageId][emoji] = role.id;
        await Bun.write(DATA_FILE, JSON.stringify(db, null, 2));

        let currentDesc = embed.data.description || "";
        if (currentDesc === "React to get the role!") currentDesc = "";
        embed.setDescription(`${currentDesc}\n- ${emoji} ${name}`);

        await message.edit({ embeds: [embed] });
        await interaction.reply({
          content: `✅ Added ${emoji} for **${name}**`,
          flags: MessageFlags.Ephemeral,
        });
      } else if (sub === "remove") {
        const emoji = interaction.options.getString("emoji", true);

        const reaction = message.reactions.cache.find(
          (r) => r.emoji.name === emoji || r.emoji.toString() === emoji,
        );
        if (reaction) await reaction.remove();

        delete db[messageId][emoji];
        await Bun.write(DATA_FILE, JSON.stringify(db, null, 2));

        if (embed.data.description) {
          const lines = embed.data.description.split("\n");
          const newLines = lines.filter((line) => !line.includes(emoji));
          embed.setDescription(newLines.join("\n") || "React to get the role!");
        }

        await message.edit({ embeds: [embed] });

        await interaction.reply({
          content: `🗑️ Removed configuration for ${emoji}`,
          flags: MessageFlags.Ephemeral,
        });
      } else if (sub === "edit") {
        const title = interaction.options.getString("title");
        const desc = interaction.options.getString("description");
        if (title) embed.setTitle(title);
        if (desc) embed.setDescription(desc);
        await message.edit({ embeds: [embed] });
        await interaction.reply({
          content: "✅ Updated.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Error: Invalid Emoji, Message ID, or Permissions.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
