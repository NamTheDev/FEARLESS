import { EmbedBuilder, Guild, TextChannel } from "discord.js";
import { CONFIG } from "../config";

export async function sendLog(guild: Guild, embed: EmbedBuilder) {
  const channel = guild.channels.cache.get(
    CONFIG.LOG_CHANNEL_ID,
  ) as TextChannel;
  if (!channel || !channel.isSendable()) return;
  await channel.send({ embeds: [embed] });
}

export async function sendError(guild: Guild, error: Error, context: string) {
  const embed = new EmbedBuilder()
    .setTitle("❌ System Error")
    .setColor(CONFIG.COLORS.ERROR)
    .addFields(
      { name: "Context", value: context, inline: true },
      { name: "Message", value: `\`\`\`${error.message}\`\`\`` },
    )
    .setTimestamp();
  await sendLog(guild, embed);
}
