import { Client, GatewayIntentBits, Partials } from "discord.js";
import { CONFIG } from "./config";
import { loadCommands } from "./handlers/commandHandler";
import { loadEvents } from "./handlers/eventHandler";
import { sendError } from "./utils/logger";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

async function bootstrap() {
  try {
    await loadCommands(client);
    await loadEvents(client);

    process.on("unhandledRejection", async (err: Error) => {
      console.error(err);
      const g = client.guilds.cache.get(CONFIG.GUILD_ID);
      if (g) await sendError(g, err, "Global Reject");
    });

    await client.login(CONFIG.TOKEN);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

bootstrap();
