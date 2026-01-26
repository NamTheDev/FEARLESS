import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Collection,
} from "discord.js";

export interface SlashCommand {
  data: SlashCommandBuilder | any;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface BotEvent {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => void;
}

export interface Giveaway {
  id: string;
  channelId: string;
  prize: string;
  endTime: number;
  entrants: string[];
  active: boolean;
}

export interface UserData {
  userId: string;
  xp: number;
  level: number;
}

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, SlashCommand>;
  }
}
