import { REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const commands = [];
const base = join(process.cwd(), "src/commands");
for (const folder of readdirSync(base)) {
  for (const file of readdirSync(join(base, folder)).filter((f) =>
    f.endsWith(".ts"),
  )) {
    const { command } = await import(`../commands/${folder}/${file}`);
    if (command) commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!,
      ),
      { body: commands },
    );
    console.log("Successfully reloaded commands.");
  } catch (e) {
    console.error(e);
  }
})();
