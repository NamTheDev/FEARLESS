import { getShellite, getCastle } from "@logic/economy";
import db from "@core/database";

export const command = {
  data: { name: "buy" },
  async executeMessage(message: any, args: string[]) {
    const item = args[0];
    const costs = { bucket: 3, water: 2, splash: 2, rebuild: 1 };
    const cost = (costs as any)[item?.toLowerCase()];
    if (!cost) return message.reply("Unknown item.");
    if (getShellite(message.author.id) < cost) return message.reply("Not enough Shellite.");
    db.run("UPDATE economy SET shellite = shellite - ? WHERE userId = ?", [cost, message.author.id]);
    message.reply(`Bought ${item}.`);
  }
};
