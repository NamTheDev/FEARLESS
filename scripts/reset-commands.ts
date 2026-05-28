import { REST, Routes } from "discord.js";
import { CONFIG } from "@core/config.ts"

const rest = new REST().setToken(CONFIG.TOKEN!);

(async () => {
  try {
    console.log("[⚙️]  Deleting all commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        CONFIG.CLIENT_ID!,
        CONFIG.GUILD_ID!,
      ),
      { body: [] },
    );
    console.log("[✅] Guild commands cleared.");

    await rest.put(Routes.applicationCommands(CONFIG.CLIENT_ID!), {
      body: [],
    });
    console.log("[✅] Global commands cleared.");
  } catch (error) {
    console.error(error);
  }
})();
