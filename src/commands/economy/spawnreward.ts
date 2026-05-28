import {
  PermissionFlagsBits,
  TextChannel,
  Message,
  SlashCommandBuilder
} from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { CONFIG } from "@core/config";
import { triggerSpawn } from "@logic/economy";
import { sendTempMessage } from "@utils/messages";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("spawnreward")
    .setDescription("Spawn loot instantly")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  visible: true,
  messageOnly: true,
  executeMessage: async (message: Message, args: string[]) => {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return;
    }

    const lootName = args.join(" ");
    if (!lootName) {
      if (message.channel.isSendable()) {
        await sendTempMessage(message.channel, "❌ Provide a loot name!");
      }
      return;
    }

    const loots = CONFIG.LOGIC.ECONOMY.LOOTS;
    const loot = loots.find(
      (l) => l.name.toLowerCase() === lootName.toLowerCase(),
    );

    if (!loot) {
      if (message.channel.isSendable()) {
        await sendTempMessage(message.channel, `❌ Could not find loot named **${lootName}**.`);
      }
      return;
    }

    if (!(message.channel instanceof TextChannel)) {
      if (message.channel.isSendable()) {
        await sendTempMessage(message.channel, "❌ Can only spawn in text channels.");
      }
      return;
    }

    await triggerSpawn(loot, message.channel);
  },
};
