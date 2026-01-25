import { GuildMember, TextChannel } from "discord.js";

const LEVEL_FILE = "data/levels.json";
const COOLDOWN = 60 * 1000;

const LEVEL_UP_CHANNEL = process.env.LEVEL_UP_CHANNEL_ID;
const MEDIA_PERMS_ROLE = process.env.MEDIA_PERMS_ROLE_ID;
const NICKNAME_PERMS_ROLE = process.env.NICKNAME_PERMS_ROLE_ID;
const POLL_PERMS_ROLE = process.env.POLL_PERMS_ROLE_ID;
const COMMUNITY_CATEGORY = process.env.COMMUNITY_CATEGORY_ID;

interface LevelData {
  xp: number;
  level: number;
  lastXpTime: number;
}

interface LevelDB {
  [userId: string]: LevelData;
}

export const calculateLevel = (xp: number) => Math.floor(xp / 400);

export async function addXp(message: any) {
  if (message.author.bot || !message.guild) return;
  if (COMMUNITY_CATEGORY && message.channel.parentId !== COMMUNITY_CATEGORY)
    return;

  const file = Bun.file(LEVEL_FILE);
  let db: LevelDB = {};

  if (await file.exists()) {
    try {
      db = await file.json();
    } catch {}
  }

  const userId = message.author.id;
  const userData = db[userId] || { xp: 0, level: 0, lastXpTime: 0 };

  const now = Date.now();
  if (now - userData.lastXpTime < COOLDOWN) return;

  const xpGain = Math.floor(Math.random() * 11) + 15;

  userData.xp += xpGain;
  userData.lastXpTime = now;

  const newLevel = calculateLevel(userData.xp);
  const didLevelUp = newLevel > userData.level;

  userData.level = newLevel;
  db[userId] = userData;

  await Bun.write(LEVEL_FILE, JSON.stringify(db, null, 2));

  if (didLevelUp) {
    await handleLevelUp(message.member, newLevel, message.guild);
  }
}

async function handleLevelUp(
  member: GuildMember,
  level: number,
  guild: any,
  sendMessage = true,
) {
  if (!sendMessage) return;
  const channel = guild.channels.cache.get(LEVEL_UP_CHANNEL) as TextChannel;
  if (channel && channel.isSendable()) {
    await channel.send(`<@${member.id}> has reached **Level ${level}**. GG!`);
  }

  if (level >= 10) {
    const rolesToAdd = [];
    if (MEDIA_PERMS_ROLE && !member.roles.cache.has(MEDIA_PERMS_ROLE))
      rolesToAdd.push(MEDIA_PERMS_ROLE);
    if (NICKNAME_PERMS_ROLE && !member.roles.cache.has(NICKNAME_PERMS_ROLE))
      rolesToAdd.push(NICKNAME_PERMS_ROLE);

    if (rolesToAdd.length > 0) {
      try {
        await member.roles.add(rolesToAdd);
        const channel = guild.channels.cache.get(
          LEVEL_UP_CHANNEL,
        ) as TextChannel;
        if (channel)
          await channel.send(
            `🔓 <@${member.id}> has unlocked **Level 10 Perks** (Image & Nickname)!`,
          );
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (level >= 20) {
    if (POLL_PERMS_ROLE && !member.roles.cache.has(POLL_PERMS_ROLE)) {
      try {
        await member.roles.add(POLL_PERMS_ROLE);
        const channel = guild.channels.cache.get(
          LEVEL_UP_CHANNEL,
        ) as TextChannel;
        if (channel)
          await channel.send(
            `📊 <@${member.id}> has unlocked **Poll Permissions**!`,
          );
      } catch (e) {
        console.error(e);
      }
    }
  }
}

export async function getUserData(userId: string) {
  const file = Bun.file(LEVEL_FILE);
  if (!(await file.exists())) return null;
  const db: LevelDB = await file.json();
  return db[userId] || null;
}

export async function getLeaderboard() {
  const file = Bun.file(LEVEL_FILE);
  if (!(await file.exists())) return [];
  const db: LevelDB = await file.json();

  return Object.entries(db)
    .sort(([, a], [, b]) => b.xp - a.xp)
    .slice(0, 10);
}

export async function setLevel(
  member: GuildMember,
  level: number,
  triggeredByCommand = false,
) {
  const file = Bun.file(LEVEL_FILE);
  let db: LevelDB = {};
  if (await file.exists()) db = await file.json();

  const xp = level * 400;

  db[member.id] = {
    xp: xp,
    level: level,
    lastXpTime: Date.now(),
  };

  await Bun.write(LEVEL_FILE, JSON.stringify(db, null, 2));

  await handleLevelUp(member, level, member.guild, !triggeredByCommand);
}

export async function adjustXp(member: GuildMember, amount: number) {
  const file = Bun.file(LEVEL_FILE);
  let db: LevelDB = {};
  if (await file.exists()) db = await file.json();

  const userData = db[member.id] || { xp: 0, level: 0, lastXpTime: 0 };

  userData.xp += amount;
  if (userData.xp < 0) userData.xp = 0;

  const newLevel = calculateLevel(userData.xp);
  const didLevelUp = newLevel > userData.level;

  userData.level = newLevel;
  db[member.id] = userData;

  await Bun.write(LEVEL_FILE, JSON.stringify(db, null, 2));

  if (didLevelUp) {
    await handleLevelUp(member, newLevel, member.guild);
  }
}

export async function getUserRank(userId: string) {
  const file = Bun.file(LEVEL_FILE);
  if (!(await file.exists())) return 0;
  const db: LevelDB = await file.json();

  const sorted = Object.keys(db).sort((a, b) => {
    if (db[a] === undefined) return 1;
    if (db[b] === undefined) return -1;
    return db[b].xp - db[a].xp;
  });
  const index = sorted.indexOf(userId);

  return index === -1 ? 0 : index + 1;
}
