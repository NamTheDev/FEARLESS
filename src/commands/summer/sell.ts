import { getCastle, addBloodern } from "@logic/economy";
import db from "@core/database";

export const command = {
  data: { name: "sell" },
  category: "summer",
  async executeMessage(message: any) {
    const castle = getCastle(message.author.id) as any;
    if (!castle) return message.reply("No castle to sell.");
    const price = castle.stage * 250;
    addBloodern(message.author.id, price);
    db.run("DELETE FROM castles WHERE userId = ?", [message.author.id]);
    message.reply(`Sold castle for ${price} Bloodern.`);
  }
};
