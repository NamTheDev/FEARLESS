import { REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const commands = [];
const foldersPath = join(process.cwd(), "src", "commands");
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
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log(`[⚙️] Started refreshing ${commands.length} commands.`);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!,
      ),
      { body: commands },
    );

    console.log("[✅] Successfully reloaded commands.");
  } catch (error) {
    console.error(error);
  }
})();
