import { Collection } from "discord.js";
import { SnipedMessage } from "@typings/Snipe";

export const snipes = new Collection<string, SnipedMessage[]>();
