import { REST, Routes } from 'discord.js';

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('🗑️  Deleting ALL commands...');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
            { body: [] }
        );
        console.log('✅ Guild commands cleared.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: [] }
        );
        console.log('✅ Global commands cleared.');

        console.log('✨ All clean! Now run "bun run deploy" to re-register your actual commands.');
    } catch (error) {
        console.error(error);
    }
})();