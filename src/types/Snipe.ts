import { User } from "discord.js";

export interface SnipedMessage {
    content: string | null;
    author: User;
    timestamp: number;
    imageBuffer: Buffer | null;
}
