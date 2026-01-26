import { EmbedBuilder, Guild, TextChannel } from "discord.js";
import { CONFIG } from "../config";
import { getChannel } from "./fetchers";

export async function sendLog(guild: Guild, embed: EmbedBuilder) {
  const channel = await getChannel(guild, CONFIG.LOG_CHANNEL_ID);
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
