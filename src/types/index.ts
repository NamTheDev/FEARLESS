import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    Collection,  
} from 'discord.js';

export interface SlashCommand {
    data: SlashCommandBuilder | any;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface BotEvent {
    name: string;
    once?: boolean;
    execute: (...args: any[]) => void;
}

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, SlashCommand>;
    }
}