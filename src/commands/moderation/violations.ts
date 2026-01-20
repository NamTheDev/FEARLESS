import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  time,
  TimestampStyles,
  MessageFlags,
  Colors,
} from "discord.js";
import { SlashCommand } from "../../types";

const DATA_FILE = "data/spam.json";

interface SpamData {
  [userId: string]: {
    offenseCount: number;
    lastOffenseTime: number;
  };
}

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("violations")
    .setDescription("View spam violations")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Check a specific user")
        .setRequired(false),
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    const targetUser = interaction.options.getUser("target");
    const file = Bun.file(DATA_FILE);

    let data: SpamData = {};
    if (await file.exists()) {
      try {
        data = await file.json();
      } catch {
        data = {};
      }
    }

    const embed = new EmbedBuilder().setColor(Colors.DarkRed).setTimestamp();

    if (targetUser) {
      const record = data[targetUser.id];

      embed.setTitle(`Violations: ${targetUser.username}`);

      if (!record || record.offenseCount === 0) {
        embed.setDescription("✅ Clean record (No active violations).");
      } else {
        embed.addFields(
          {
            name: "Offenses (24h)",
            value: `${record.offenseCount}`,
            inline: true,
          },
          {
            name: "Last Incident",
            value: time(
              Math.floor(record.lastOffenseTime / 1000),
              TimestampStyles.RelativeTime,
            ),
            inline: true,
          },
        );
      }
    } else {
      embed.setTitle("Server Violations (Top 25)");

      const sorted = Object.entries(data)
        .filter(([_, record]) => record.offenseCount > 0)
        .sort((a, b) => b[1].offenseCount - a[1].offenseCount)
        .slice(0, 25);

      if (sorted.length === 0) {
        embed.setDescription("✅ No active violations on the server.");
      } else {
        const description = sorted
          .map(([id, record]) => {
            return `<@${id}>: **${record.offenseCount}** offenses - ${time(Math.floor(record.lastOffenseTime / 1000), TimestampStyles.RelativeTime)}`;
          })
          .join("\n");

        embed.setDescription(description);
      }
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
