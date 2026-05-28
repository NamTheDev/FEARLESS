import { Message } from "discord.js";
import { CONFIG } from "@core/config";
import { attemptAutoResponse } from "@logic/autoResponse";

export const handleChannelMessages = async (message: Message) => {
  switch (message.channelId) {
    case CONFIG.CHANNELS.GENERAL:
      const response = attemptAutoResponse(
        message.guild!.id,
        message.content.toLowerCase(),
      );
      if (response && message.channel.isSendable()) {
        await message.channel.send(response);
      }
      break;
    case CONFIG.CHANNELS.VERIFY:
      message.delete();
      break;
  }
};
