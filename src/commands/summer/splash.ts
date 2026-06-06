import { getShellite, getCastle, updateCastle } from "@logic/economy";

export const command = {
  data: { name: "splash" },
  category: "summer",
  async executeMessage(message: any, args: string[]) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention user to splash.");
    if (getShellite(message.author.id) < 2) return message.reply("Need 2 shellite to splash.");
    
    const castle = getCastle(target.id) as any;
    if (!castle) return message.reply("Target has no castle.");
    updateCastle(target.id, castle.stage, Math.max(0, castle.health - 5));
    message.reply(`Splashed ${target.username}'s castle!`);
  }
};
