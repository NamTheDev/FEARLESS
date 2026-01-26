import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { SlashCommand, BotEvent } from "./types";

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

client.commands = new Collection<string, SlashCommand>();

const foldersPath = join(__dirname, "commands");
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = join(foldersPath, folder);
  const commandFiles = readdirSync(commandsPath).filter((file) =>
    file.endsWith(".ts"),
  );

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const { command } = await import(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    }
  }
}

const eventsPath = join(__dirname, "events");
const eventFiles = readdirSync(eventsPath).filter((file) =>
  file.endsWith(".ts"),
);

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  const { event } = (await import(filePath)) as { event: BotEvent };

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(process.env.DISCORD_TOKEN);
