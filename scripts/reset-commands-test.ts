import { REST, Routes } from "discord.js";
import { CONFIG } from "@core/config.ts"

const rest = new REST().setToken(CONFIG.TOKEN!);

(async () => {
  try {
    const secondaryGuildId = CONFIG.WHITELISTED_GUILDS[1];
    
    if (!secondaryGuildId) {
      console.error("❌ SECONDARY_GUILD_ID is not defined in CONFIG.WHITELISTED_GUILDS.");
      return;
    }

    console.log(`[⚙️] Deleting all commands for test guild: ${secondaryGuildId}...`);

    await rest.put(
      Routes.applicationGuildCommands(
        CONFIG.CLIENT_ID!,
        secondaryGuildId,
      ),
      { body: [] },
    );
    console.log("[✅] Test guild commands cleared.");
  } catch (error) {
    console.error(error);
  }
})();
