import { Message, GuildMember, ChannelType } from "discord.js";
import { CONFIG } from "@core/config";
import db, { upsertLevelStmt, getBuffsStmt } from "@core/database";
import { LevelingRow } from "@typings/Leveling";
import { UserData } from "@typings/UserData";
import { getChannel, getMember } from "@utils/fetchers";
import { sendTempMessage } from "@utils/messages";

const { ONE_HOUR, TEN_MINUTES, XP_COOLDOWN, LEVEL_XP_RATIO } =
  CONFIG.LOGIC.LEVELING;

export async function addXp(message: Message) {
  if (
    message.channel.type !== ChannelType.GuildText ||
    (CONFIG.CHANNELS.COMMUNITY_CATEGORY &&
      message.channel.parentId !== CONFIG.CHANNELS.COMMUNITY_CATEGORY) ||
    !message.guild
  )
    return;

  const noXpChannels = (CONFIG.CHANNELS as any).NO_XP;
  if (Array.isArray(noXpChannels) && noXpChannels.includes(message.channel.id))
    return;

  const userId = message.author.id;
  const now = Date.now();
  const user = db
    .query("SELECT * FROM leveling WHERE userId = ?")
    .get(userId) as LevelingRow | undefined;

  if (user && user.xpBlockedUntil > now) return;
  if (user && now - user.lastXpTime < XP_COOLDOWN) return;

  const buff = getBuffsStmt.get(userId) as { xpMultiplier: number, moneyMultiplier: number, expiry: number } | undefined;
  let multiplier = 1.0;
  if (buff && buff.expiry > now / 1000) {
    multiplier = buff.xpMultiplier;
  }

  const rawXp = Math.floor(Math.random() * 19) + 17;
  const xpGain = Math.floor(rawXp * multiplier);
  const newXp = Math.max(0, (user?.xp || 0) + xpGain);
  const newLevel = Math.max(0, Math.floor(newXp / LEVEL_XP_RATIO));
  const oldLevel = user?.level || 0;

  upsertLevelStmt.run(userId, newXp, newLevel, now, user?.xpBlockedUntil || 0);

  if (newLevel > oldLevel) {
    if (!message.member) return;
    await announceLevelUp(message.member, newLevel);

    const isMilestone = CONFIG.ROLES.LEVELING.some((r) => r.VALUE === newLevel);

    if (isMilestone) {
      const generalChannel = await getChannel(
        message.guild,
        CONFIG.CHANNELS.GENERAL,
      );
      if (generalChannel && generalChannel.isSendable()) {
        await sendTempMessage(generalChannel, `**${message.author.username}** has reached level ${newLevel}, keep going!`);
      }
    }
  }
}

export async function applySpamPunishment(member: GuildMember) {
  const userId = member.id;
  const now = Date.now();

  const violation = db
    .query("SELECT * FROM spam_violations WHERE userId = ?")
    .get(userId) as any;
  const count = violation?.offenseCount || 1;

  const user = getUserData(userId);
  let punishmentXp = 0;
  let xpBlockedUntil = user?.xpBlockedUntil || 0;
  let muted = false;

  const PERMA_LOCK = 8640000000000000;

  if (count === 1) {
    punishmentXp = 100;
    if (xpBlockedUntil < now + TEN_MINUTES && xpBlockedUntil !== PERMA_LOCK) {
      xpBlockedUntil = now + TEN_MINUTES;
    }
  } else if (count === 2) {
    punishmentXp = 200;
    if (xpBlockedUntil < now + TEN_MINUTES && xpBlockedUntil !== PERMA_LOCK) {
      xpBlockedUntil = now + TEN_MINUTES;
    }
  } else if (count >= 3) {
    punishmentXp = 500;
    muted = true;
    await member
      .timeout(ONE_HOUR, "Spamming - 3rd Violation")
      .catch(() => null);
  }

  const currentXp = user?.xp || 0;
  const newXp = Math.max(0, currentXp - punishmentXp);
  const newLevel = Math.max(0, Math.floor(newXp / LEVEL_XP_RATIO));

  upsertLevelStmt.run(userId, newXp, newLevel, now, xpBlockedUntil);

  return { punishmentXp, count, xpBlockedUntil, muted };
}

export async function setLevel(
  member: GuildMember,
  level: number,
  silent = false,
) {
  const user = getUserData(member.id);
  const xp = level * LEVEL_XP_RATIO;
  upsertLevelStmt.run(member.id, xp, level, Date.now(), user?.xpBlockedUntil || 0);
  if (!silent) await announceLevelUp(member, level);
}

export async function adjustXp(member: GuildMember, amount: number) {
  const user = db
    .query("SELECT * FROM leveling WHERE userId = ?")
    .get(member.id) as LevelingRow | undefined;

  if (user && user.xpBlockedUntil > Date.now() && amount > 0) return;

  const newXp = Math.max(0, (user?.xp || 0) + amount);
  const newLevel = Math.max(0, Math.floor(newXp / LEVEL_XP_RATIO));
  const oldLevel = user?.level || 0;

  upsertLevelStmt.run(
    member.id,
    newXp,
    newLevel,
    Date.now(),
    user?.xpBlockedUntil || 0,
  );

  if (newLevel > oldLevel)
    await announceLevelUp(member, newLevel);
}

export function getUserData(userId: string): UserData | undefined {
  const leveling = db.query("SELECT * FROM leveling WHERE userId = ?").get(userId) as LevelingRow | undefined;
  if (!leveling) return undefined;

  const economy = db.query("SELECT bloodern, gorelith FROM economy WHERE userId = ?").get(userId) as { bloodern: number, gorelith: number } | undefined;
  const buffs = db.query("SELECT xpMultiplier, moneyMultiplier, expiry FROM active_buffs WHERE userId = ?").get(userId) as { xpMultiplier: number, moneyMultiplier: number, expiry: number } | undefined;

  return {
    userId: leveling.userId,
    xp: leveling.xp,
    level: leveling.level,
    bloodern: economy?.bloodern || 0,
    gorelith: economy?.gorelith || 0,
    xpBlockedUntil: leveling.xpBlockedUntil,
    activeBuffs: buffs && buffs.expiry > Date.now() / 1000 ? { xpMultiplier: buffs.xpMultiplier, moneyMultiplier: buffs.moneyMultiplier, expiry: buffs.expiry } : null,
  };
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
    .query("SELECT * FROM leveling ORDER BY xp DESC LIMIT 15")
    .all() as LevelingRow[];
  return res.map((u) => [u.userId, { level: u.level, xp: u.xp }]);
}

export function getAllUsersLevel(): { userId: string; level: number }[] {
  return db.query("SELECT userId, level FROM leveling").all() as {
    userId: string;
    level: number;
  }[];
}

async function announceLevelUp(member: GuildMember, level: number) {
  const channel = await getChannel(member.guild, CONFIG.CHANNELS.LEVEL_UP);
  if (channel && channel.isTextBased()) {
    await channel.send({
      content: `<@${member.id}> has reached **Level ${level}**. GG!`,
    });
  }

  await syncMemberRoles(member, level);
}

export async function syncMemberRoles(member: GuildMember, level: number) {
  const freshMember = (await getMember(member.guild, member.id)) || member;

  const rolesToAdd: string[] = [];

  const allLevelingRoles = CONFIG.ROLES.LEVELING;
  const targetRoleObj = [...allLevelingRoles]
    .sort((a, b) => b.VALUE - a.VALUE)
    .find((r) => level >= r.VALUE);

  if (targetRoleObj && !freshMember.roles.cache.has(targetRoleObj.ROLE_ID)) {
    rolesToAdd.push(targetRoleObj.ROLE_ID);
  }

  if (rolesToAdd.length > 0) {
    await freshMember.roles.add(rolesToAdd).catch(() => null);
  }

  const allRoleIds = allLevelingRoles.map((r) => r.ROLE_ID);
  const rolesToRemove = freshMember.roles.cache
    .map((r) => r.id)
    .filter((id) => allRoleIds.includes(id) && id !== targetRoleObj?.ROLE_ID);

  if (rolesToRemove.length > 0) {
    await freshMember.roles.remove(rolesToRemove).catch(() => null);
  }
}

export function setBlacklistState(id: string, lock?: boolean) {
  const row = db.query("SELECT * FROM leveling WHERE userId = ?").get(id) as LevelingRow | undefined;
  const current = row ? row.xpBlockedUntil > Date.now() : false;
  const next = lock ?? !current;
  const limit = next ? 8640000000000000 : 0;

  upsertLevelStmt.run(id, row?.xp || 0, row?.level || 0, row?.lastXpTime || 0, limit);
  return next;
}
