import {
  Message,
  GuildMember,
  TextChannel,
  EmbedBuilder,
  ChannelType,
} from "discord.js";
import { CONFIG } from "../config";
import db from "./database";

export async function addXp(message: Message) {
  if (
    message.channel.type !== ChannelType.GuildText ||
    (CONFIG.CHANNELS.COMMUNITY_CATEGORY &&
      message.channel.parentId !== CONFIG.CHANNELS.COMMUNITY_CATEGORY)
  )
    return;
  const userId = message.author.id;
  const now = Date.now();
  const user: any = db
    .query("SELECT * FROM leveling WHERE userId = ?")
    .get(userId);
  if (user && now - user.lastXpTime < 60000) return;

  const xpGain = Math.floor(Math.random() * 11) + 15;
  const newXp = (user?.xp || 0) + xpGain;
  const newLevel = Math.floor(newXp / 400);

  db.run(
    "INSERT INTO leveling (userId, xp, level, lastXpTime) VALUES (?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET xp=excluded.xp, level=excluded.level, lastXpTime=excluded.lastXpTime",
    [userId, newXp, newLevel, now],
  );
  if (newLevel > (user?.level || 0))
    await announceLevelUp(message.member!, newLevel);
}

export async function setLevel(
  member: GuildMember,
  level: number,
  silent = false,
) {
  const xp = level * 400;
  db.run(
    "INSERT INTO leveling (userId, xp, level, lastXpTime) VALUES (?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET xp=excluded.xp, level=excluded.level",
    [member.id, xp, level, Date.now()],
  );
  if (!silent) await announceLevelUp(member, level);
}

export async function adjustXp(member: GuildMember, amount: number) {
  const user: any = db
    .query("SELECT * FROM leveling WHERE userId = ?")
    .get(member.id);
  const newXp = Math.max(0, (user?.xp || 0) + amount);
  const newLevel = Math.floor(newXp / 400);
  db.run(
    "INSERT INTO leveling (userId, xp, level, lastXpTime) VALUES (?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET xp=excluded.xp, level=excluded.level",
    [member.id, newXp, newLevel, Date.now()],
  );
  if (newLevel > (user?.level || 0)) await announceLevelUp(member, newLevel);
}

export function getUserData(userId: string) {
  return db.query("SELECT * FROM leveling WHERE userId = ?").get(userId);
}
export function getUserRank(userId: string) {
  const all = db
    .query("SELECT userId FROM leveling ORDER BY xp DESC")
    .all() as any[];
  const idx = all.findIndex((u) => u.userId === userId);
  return idx === -1 ? 0 : idx + 1;
}
export function getLeaderboard() {
  const res = db
    .query("SELECT * FROM leveling ORDER BY xp DESC LIMIT 10")
    .all() as any[];
  return res.map((u) => [u.userId, { level: u.level, xp: u.xp }]);
}

async function announceLevelUp(member: GuildMember, level: number) {
  const channel = member.guild.channels.cache.get(
    CONFIG.CHANNELS.LEVEL_UP,
  ) as TextChannel;
  if (channel) {
    const embed = new EmbedBuilder()
      .setTitle("🆙 Level Up!")
      .setDescription(`<@${member.id}> reached **Level ${level}**`)
      .setColor(CONFIG.COLORS.SUCCESS);
    await channel.send({ embeds: [embed] });
  }
  if (level >= 10)
    await member.roles
      .add([CONFIG.ROLES.MEDIA, CONFIG.ROLES.NICKNAME])
      .catch(() => null);
  if (level >= 20) await member.roles.add(CONFIG.ROLES.POLL).catch(() => null);
}
