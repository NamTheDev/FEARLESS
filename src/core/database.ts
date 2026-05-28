import { Database } from "bun:sqlite";
import { join } from "node:path";

const db = new Database(join(process.cwd(), "data", "fearless.db"), {
  readwrite: true,
  create: true,
});

db.run(
  `CREATE TABLE IF NOT EXISTS leveling (userId TEXT PRIMARY KEY, xp INTEGER, level INTEGER, lastXpTime INTEGER, xpBlockedUntil INTEGER DEFAULT 0)`,
);
db.run(
  `CREATE TABLE IF NOT EXISTS spam_violations (userId TEXT PRIMARY KEY, offenseCount INTEGER, lastOffenseTime INTEGER)`,
);
db.run(
  `CREATE TABLE IF NOT EXISTS giveaways (id TEXT PRIMARY KEY, channelId TEXT, prize TEXT, endTime INTEGER, entrants TEXT, active INTEGER, winnerCount INTEGER DEFAULT 1, requiredRoleId TEXT)`,
);

db.run(
  `CREATE TABLE IF NOT EXISTS afk (userId TEXT PRIMARY KEY, reason TEXT, timestamp INTEGER)`,
);

db.run(
  `CREATE TABLE IF NOT EXISTS auto_responses (guildId TEXT, trigger TEXT, response TEXT, PRIMARY KEY (guildId, trigger))`,
);

db.run(
  `CREATE TABLE IF NOT EXISTS economy (userId TEXT PRIMARY KEY, bloodern INTEGER DEFAULT 0, gorelith INTEGER DEFAULT 0)`,
);

db.run(
  `CREATE TABLE IF NOT EXISTS active_buffs (userId TEXT PRIMARY KEY, xpMultiplier REAL DEFAULT 1.0, moneyMultiplier REAL DEFAULT 1.0, expiry INTEGER DEFAULT 0)`,
);

try {
  db.run("ALTER TABLE active_buffs ADD COLUMN moneyMultiplier REAL DEFAULT 1.0");
} catch (e) {}


db.run(
  `CREATE TABLE IF NOT EXISTS user_items (userId TEXT, itemKey TEXT, count INTEGER, pending INTEGER DEFAULT 0, PRIMARY KEY (userId, itemKey, pending))`,
);

export const upsertLevelStmt = db.prepare(
  "INSERT INTO leveling (userId, xp, level, lastXpTime, xpBlockedUntil) VALUES (?, ?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET xp=excluded.xp, level=excluded.level, lastXpTime=excluded.lastXpTime, xpBlockedUntil=excluded.xpBlockedUntil",
);

export const getBalanceStmt = db.prepare(
  "SELECT bloodern, gorelith FROM economy WHERE userId = ?",
);

export const updateBalanceStmt = db.prepare(
  "INSERT INTO economy (userId, bloodern, gorelith) VALUES (?, ?, ?) ON CONFLICT(userId) DO UPDATE SET bloodern = excluded.bloodern, gorelith = excluded.gorelith",
);

export const getBuffsStmt = db.prepare(
  "SELECT xpMultiplier, moneyMultiplier, expiry FROM active_buffs WHERE userId = ?",
);

export const updateBuffsStmt = db.prepare(
  "INSERT INTO active_buffs (userId, xpMultiplier, moneyMultiplier, expiry) VALUES (?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET xpMultiplier = excluded.xpMultiplier, moneyMultiplier = excluded.moneyMultiplier, expiry = excluded.expiry",
);

export const getUserItemsStmt = db.prepare(
  "SELECT itemKey, count, pending FROM user_items WHERE userId = ?",
);

export const updateUserItemStmt = db.prepare(
  "INSERT INTO user_items (userId, itemKey, count, pending) VALUES (?, ?, ?, ?) ON CONFLICT(userId, itemKey, pending) DO UPDATE SET count = excluded.count",
);

export default db;
