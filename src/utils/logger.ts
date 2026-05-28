import { EmbedBuilder, Guild, AttachmentBuilder, ColorResolvable } from "discord.js";
import { getChannel } from "@utils/fetchers";

export async function sendLog(
  guild: Guild,
  logChannelId: string,
  embed: EmbedBuilder,
  files: AttachmentBuilder[] = [],
) {
  const channel = await getChannel(guild, logChannelId);
  if (!channel) return;
  await channel.send({ embeds: [embed], files });
}

export async function createLogEmbed(title: string, defaultColor: ColorResolvable, color?: ColorResolvable) {
  return new EmbedBuilder()
    .setTitle(title)
    .setColor(color || defaultColor)
    .setTimestamp();
}
