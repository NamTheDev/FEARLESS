import { Database } from "bun:sqlite";
import { join } from "node:path";

const db = new Database(join(process.cwd(), "data", "fearless.db"), {
  create: true,
});

// Leveling
db.run(
  `CREATE TABLE IF NOT EXISTS leveling (userId TEXT PRIMARY KEY, xp INTEGER, level INTEGER, lastXpTime INTEGER)`,
);
// Reaction Roles - SQLite Migration
db.run(
  `CREATE TABLE IF NOT EXISTS reaction_roles (messageId TEXT, emoji TEXT, roleId TEXT, PRIMARY KEY (messageId, emoji))`,
);
// Spam
db.run(
  `CREATE TABLE IF NOT EXISTS spam_violations (userId TEXT PRIMARY KEY, offenseCount INTEGER, lastOffenseTime INTEGER)`,
);
// Giveaways
db.run(
  `CREATE TABLE IF NOT EXISTS giveaways (id TEXT PRIMARY KEY, channelId TEXT, prize TEXT, endTime INTEGER, entrants TEXT, active INTEGER)`,
);

export default db;
