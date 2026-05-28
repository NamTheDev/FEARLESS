import { Client } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";

export async function loadEvents(client: Client) {
  const base = join(process.cwd(), "src/events");
  for (const file of readdirSync(base).filter((f) => f.endsWith(".ts"))) {
    const module = await import(`../events/${file}`);
    
    for (const key in module) {
      const event = module[key];
      if (event && event.name && typeof event.execute === "function") {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
      }
    }
  }
}