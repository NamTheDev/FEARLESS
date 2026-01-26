import { Client, Events } from "discord.js";
import { BotEvent } from "../types";
import { loadGiveaways, resumeGiveaways } from "../utils/giveaway";
import { loadReactionRoles } from "../utils/reactionRoles";

export const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: Client) => {
    console.log(`Ready! Logged in as ${client.user?.tag}`);

    await loadGiveaways();
    await loadReactionRoles();

    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (guild) resumeGiveaways(guild);
  },
};
