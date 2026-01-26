import { Client, Events } from "discord.js";
import { BotEvent } from "../types";
import { CONFIG } from "../config";
import { loadGiveaways, resumeGiveaways } from "../utils/giveaway";
import { loadReactionRoles } from "../utils/reactionRoles";

export const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: Client) => {
    console.log(`Ready! ${client.user?.tag}`);
    loadGiveaways();
    await loadReactionRoles();
    const g = client.guilds.cache.get(CONFIG.GUILD_ID);
    if (g) resumeGiveaways(g);
  },
};
