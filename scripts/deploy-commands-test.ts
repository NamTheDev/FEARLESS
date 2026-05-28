import { REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { CONFIG } from "@core/config.ts"

const commands = [];
const base = join(process.cwd(), "src/commands");
for (const folder of readdirSync(base)) {
  for (const file of readdirSync(join(base, folder)).filter((f) =>
    f.endsWith(".ts"),
  )) {
    const commandPath = join(process.cwd(), "src", "commands", folder, file);
    const { command } = await import(commandPath);
    if (command && !command.messageOnly) commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(CONFIG.TOKEN!);
(async () => {
  try {
    const secondaryGuildId = CONFIG.WHITELISTED_GUILDS[1];
    
    if (!secondaryGuildId) {
      console.error("❌ SECONDARY_GUILD_ID is not defined in CONFIG.WHITELISTED_GUILDS.");
      return;
    }

    await rest.put(
      Routes.applicationGuildCommands(
        CONFIG.CLIENT_ID!,
        secondaryGuildId,
      ),
      { body: commands },
    );
    console.log(`Successfully reloaded commands for test guild: ${secondaryGuildId}`);
  } catch (e) {
    console.error(e);
  }
})();
