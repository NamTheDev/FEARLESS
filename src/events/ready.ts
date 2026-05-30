import { Client, Events } from "discord.js";
import { BotEvent } from "@typings/BotEvent";
import { CONFIG } from "@core/config";
import { loadGiveaways, resumeGiveaways } from "@logic/giveaway";
import { loadAfkCache } from "@logic/afk";
import { startLootSpawner, startShopSpawner } from "@logic/economy";

export const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: Client) => {
    console.log(`Ready! ${client.user?.tag}`);
    loadGiveaways();
    const g = client.guilds.cache.get(CONFIG.GUILD_ID);
    if (g) resumeGiveaways(g);

    loadAfkCache();
    startLootSpawner(client);
    startShopSpawner(client);
    const { startMerchantLoop } = await import("@logic/merchant");
    startMerchantLoop(client);
  },
};
