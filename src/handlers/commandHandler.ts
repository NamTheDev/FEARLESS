import { Client, Collection } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";

export async function loadCommands(client: Client) {
  client.commands = new Collection();
  const base = join(process.cwd(), "src/commands");
  for (const folder of readdirSync(base)) {
    for (const file of readdirSync(join(base, folder)).filter((f) =>
      f.endsWith(".ts"),
    )) {
      const { command } = await import(`../commands/${folder}/${file}`);
      if (command) client.commands.set(command.data.name, command);
    }
  }
}
