import { GuildMember, TextChannel } from "discord.js";

const LEVEL_FILE = "data/levels.json";
const COOLDOWN = 60 * 1000;

const LEVEL_UP_CHANNEL = process.env.LEVEL_UP_CHANNEL_ID;
const MEDIA_PERMS_ROLE = process.env.MEDIA_PERMS_ROLE_ID;
const NICKNAME_PERMS_ROLE = process.env.NICKNAME_PERMS_ROLE_ID;
const POLL_PERMS_ROLE = process.env.POLL_PERMS_ROLE_ID;

interface LevelData {
  xp: number;
  level: number;
  lastXpTime: number;
}

interface LevelDB {
  [userId: string]: LevelData;
}

export const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100));

export async function addXp(message: any) {
  if (message.author.bot || !message.guild) return;

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

async function handleLevelUp(member: GuildMember, level: number, guild: any, conditional = true) {
  if (conditional === true) return;
  if (LEVEL_UP_CHANNEL) {
    const channel = guild.channels.cache.get(LEVEL_UP_CHANNEL) as TextChannel;
    if (channel && channel.isSendable()) {
      await channel.send(`<@${member.id}> has reached ${level}. GG!`);
    }
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

export async function setLevel(member: GuildMember, level: number) {
  const file = Bun.file(LEVEL_FILE);
  let db: LevelDB = {};
  if (await file.exists()) db = await file.json();

  const xp = level * level * 100;

  db[member.id] = {
    xp: xp,
    level: level,
    lastXpTime: Date.now(),
  };

  await Bun.write(LEVEL_FILE, JSON.stringify(db, null, 2));

  await handleLevelUp(member, level, member.guild, false);
}

export async function getUserRank(userId: string) {
    const file = Bun.file(LEVEL_FILE);
    if (!await file.exists()) return 0;
    const db: LevelDB = await file.json();
    
    const sorted = Object.keys(db).sort((a, b) => db[b].xp - db[a].xp);
    const index = sorted.indexOf(userId);
    
    return index === -1 ? 0 : index + 1;
}