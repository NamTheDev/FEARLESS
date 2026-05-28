import { ChatInputCommandInteraction, SlashCommandBuilder, Message, AutocompleteInteraction } from "discord.js";

export interface SlashCommand {
  data: SlashCommandBuilder | any;
  execute?: (interaction: ChatInputCommandInteraction) => Promise<any>;
  executeMessage?: (message: Message, args: string[]) => Promise<any>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<any>;
  visible: boolean;
  messageOnly?: boolean;
  category?: string;
}
