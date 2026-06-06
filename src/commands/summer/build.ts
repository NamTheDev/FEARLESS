import { getCastle, updateCastle, getShellite } from "@logic/economy";

export const command = {
  data: { name: "build" },
  async executeMessage(message: any) {
    const uid = message.author.id;
    const shellite = getShellite(uid);
    if (shellite < 1) return message.reply("Need shellite to build.");
    const castle = getCastle(uid) as any;
    const newStage = (castle?.stage ?? 0) + 1;
    updateCastle(uid, newStage, (castle?.health ?? 0) + 10);
    message.reply(`Built castle stage ${newStage}!`);
  }
};
