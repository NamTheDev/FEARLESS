import { SlashCommand } from "@typings/SlashCommand";
import { Collection } from "discord.js";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, SlashCommand>;
  }
}
