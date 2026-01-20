import { Client, Events } from "discord.js";
import { BotEvent } from "../types";

export const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    console.log(`Ready! Logged in as ${client.user?.tag}`);
  },
};
