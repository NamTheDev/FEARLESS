import { PermissionFlagsBits } from "discord.js";
import db from "@core/database";

export const command = {
  data: { name: "give" },
  async executeMessage(message: any, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply("Unauthorized.");
    const target = message.mentions.users.first();
    const amount = parseInt(args[1] ?? "0");
    if (!target || isNaN(amount)) return message.reply("Usage: give @user <amount>");
    db.run("UPDATE economy SET shellite = shellite + ? WHERE userId = ?", [amount, target.id]);
    message.reply(`Gave ${amount} Shellite to ${target.username}.`);
  }
};
