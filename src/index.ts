import { Client, GatewayIntentBits, Partials } from "discord.js";
import { CONFIG } from "./core/config";
import { loadCommands } from "./handlers/commandHandler";
import { loadEvents } from "./handlers/eventHandler";
import { handleSystemErrorLog } from "@logic/logging";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  allowedMentions: { repliedUser: false, parse: ["users", "roles"] },
});

async function bootstrap() {
  try {
    await loadCommands(client);
    await loadEvents(client);

    process.on("unhandledRejection", async (err: Error) => {
      console.error(err);
      const g = client.guilds.cache.get(CONFIG.GUILD_ID);
      if (g) await handleSystemErrorLog(g, err, "Global Reject");
    });

    await client.login(CONFIG.TOKEN);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

bootstrap();
