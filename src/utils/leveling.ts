import { Message, GuildMember, TextChannel, ChannelType } from "discord.js";
import { CONFIG } from "../config";
import db from "./database";
import { LevelingRow } from "../types";

// Prepared statement to reduce overhead for high-frequency writes
const upsertLevelStmt = db.prepare(
  "INSERT INTO leveling (userId, xp, level, lastXpTime) VALUES (?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET xp=excluded.xp, level=excluded.level, lastXpTime=excluded.lastXpTime",
);

export async function addXp(message: Message) {
  if (
    message.channel.type !== ChannelType.GuildText ||
    (CONFIG.CHANNELS.COMMUNITY_CATEGORY &&
      message.channel.parentId !== CONFIG.CHANNELS.COMMUNITY_CATEGORY)
  )
    return;

  // Respect future NO_XP channel config if present
  const noXpChannels = (CONFIG.CHANNELS as any).NO_XP;
  if (Array.isArray(noXpChannels) && noXpChannels.includes(message.channel.id))
    return;

  const userId = message.author.id;
  const now = Date.now();
  const user = db
    .query("SELECT * FROM leveling WHERE userId = ?")
    .get(userId) as LevelingRow | undefined;
  if (user && now - user.lastXpTime < 60000) return;

  const xpGain = Math.floor(Math.random() * 11) + 15;
  const newXp = (user?.xp || 0) + xpGain;
  const newLevel = Math.floor(newXp / 400);
  const oldLevel = user?.level || 0;

  // Use prepared statement with varargs (not a single array)
  upsertLevelStmt.run(userId, newXp, newLevel, now);

  // Only announce if level legitimately increased and previous level was > 0
  if (newLevel > oldLevel && oldLevel > 0) {
    if (message.member) await announceLevelUp(message.member, newLevel);
  }
}

export async function setLevel(
  member: GuildMember,
  level: number,
  silent = false,
) {
  const xp = level * 400;
  upsertLevelStmt.run(member.id, xp, level, Date.now());
  if (!silent) await announceLevelUp(member, level);
}

export async function adjustXp(member: GuildMember, amount: number) {
  const user = db
    .query("SELECT * FROM leveling WHERE userId = ?")
    .get(member.id) as LevelingRow | undefined;
  const newXp = Math.max(0, (user?.xp || 0) + amount);
  const newLevel = Math.floor(newXp / 400);
  const oldLevel = user?.level || 0;

  upsertLevelStmt.run(member.id, newXp, newLevel, Date.now());
  if (newLevel > oldLevel && oldLevel > 0)
    await announceLevelUp(member, newLevel);
}

export function getUserData(userId: string): LevelingRow | undefined {
  return db.query("SELECT * FROM leveling WHERE userId = ?").get(userId) as
    | LevelingRow
    | undefined;
}

export function getUserRank(userId: string): number {
  const all = db
    .query("SELECT userId FROM leveling ORDER BY xp DESC")
    .all() as { userId: string }[];
  const idx = all.findIndex((u) => u.userId === userId);
  return idx === -1 ? 0 : idx + 1;
}

export function getLeaderboard(): Array<
  [string, { level: number; xp: number }]
> {
  const res = db
    .query("SELECT * FROM leveling ORDER BY xp DESC LIMIT 10")
    .all() as LevelingRow[];
  return res.map((u) => [u.userId, { level: u.level, xp: u.xp }]);
}

async function announceLevelUp(member: GuildMember, level: number) {
  const channel = member.guild.channels.cache.get(CONFIG.CHANNELS.LEVEL_UP) as
    | TextChannel
    | undefined;
  if (channel && channel.isTextBased()) {
    await channel.send({
      content: `<@${member.id}> has reached **Level ${level}**. GG!`,
    });
  }
  if (level >= 10)
    await member.roles
      .add([CONFIG.ROLES.MEDIA, CONFIG.ROLES.NICKNAME])
      .catch(() => null);
  if (level >= 20) await member.roles.add(CONFIG.ROLES.POLL).catch(() => null);
}
