import { Guild, ChatInputCommandInteraction, Message } from "discord.js";
import { sendLog } from "@utils/logger";
import { buildSystemErrorEmbed, buildCommandLogEmbed } from "@utils/logs";
import { CONFIG } from "@core/config";

export async function handleSystemErrorLog(guild: Guild, error: Error, context: string) {
  const embed = buildSystemErrorEmbed(error, context);
  await sendLog(guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleCommandLog(
  interactionOrMessage: ChatInputCommandInteraction | Message,
  commandName?: string,
  args?: string[],
) {
  const guild = interactionOrMessage.guild;
  if (!guild) return;

  const isInteraction = "commandName" in interactionOrMessage;
  const user = interactionOrMessage.member?.user || 
    (isInteraction ? (interactionOrMessage as ChatInputCommandInteraction).user : (interactionOrMessage as Message).author);
  
  const type = isInteraction ? "Slash" : "Message";
  const name = isInteraction ? `/${(interactionOrMessage as ChatInputCommandInteraction).commandName}` : `rf ${commandName}`;
  const channelId = interactionOrMessage.channelId;

  const embed = buildCommandLogEmbed(user, type, name, channelId, args);

  await sendLog(guild, CONFIG.LOG_CHANNEL_ID, embed);
}
