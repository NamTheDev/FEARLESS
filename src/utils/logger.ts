import { EmbedBuilder, Guild, TextChannel } from "discord.js";

export async function sendLog(guild: Guild, embed: EmbedBuilder) {
  const logChannelId = process.env.LOG_CHANNEL_ID;
  if (!logChannelId) return;

  const channel = guild.channels.cache.get(logChannelId) as TextChannel;
  if (!channel || !channel.isSendable()) return;

  await channel.send({ embeds: [embed] });
}
