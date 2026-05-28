import { Message, ButtonInteraction } from "discord.js";
import { snipes } from "@core/snipe";
import { SnipedMessage } from "@typings/Snipe";
import {
  buildSnipeEmbed,
  getSnipeFiles,
  buildSnipeButtons,
} from "@utils/messages";

export const addSnipe = async (message: Message) => {
  const snipeData: SnipedMessage = {
    content: message.content || null,
    author: message.author,
    timestamp: message.createdTimestamp,
    imageBuffer: null,
  };

  const channelSnipes = snipes.get(message.channelId) || [];
  channelSnipes.unshift(snipeData);
  if (channelSnipes.length > 10) channelSnipes.pop();
  snipes.set(message.channelId, channelSnipes);

  const firstAttachment = message.attachments.first();
  if (firstAttachment) {
    try {
      const res = await fetch(firstAttachment.url);
      if (res.ok) {
        snipeData.imageBuffer = Buffer.from(await res.arrayBuffer());
      }
    } catch {}
  }
};

export const handleSnipePagination = async (
  interaction: ButtonInteraction,
  index: number,
) => {
  const channelSnipes = snipes.get(interaction.channelId);
  if (!channelSnipes || !channelSnipes[index]) return;

  await interaction.update({
    embeds: [
      buildSnipeEmbed(channelSnipes[index]!, index, channelSnipes.length),
    ],
    files: getSnipeFiles(channelSnipes[index]!),
    components: [buildSnipeButtons(index, channelSnipes.length)],
  });
};
