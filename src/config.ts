import { Colors } from "discord.js";

const env = process.env;
const getEnv = (key: string, req = true) => {
  const val = env[key];
  if (!val && req) throw new Error(`❌ MISSING ENV: ${key}`);
  return val || "";
};

export const CONFIG = {
  TOKEN: getEnv("DISCORD_TOKEN"),
  CLIENT_ID: getEnv("CLIENT_ID"),
  GUILD_ID: getEnv("GUILD_ID"),
  LOG_CHANNEL_ID: getEnv("LOG_CHANNEL_ID"),
  CHANNELS: {
    LEVEL_UP: getEnv("LEVEL_UP_CHANNEL_ID"),
    COMMUNITY_CATEGORY: getEnv("COMMUNITY_CATEGORY_ID", false),
  },
  ROLES: {
    STAFF: getEnv("STAFF_ROLE_ID"),
    MEDIA: getEnv("MEDIA_PERMS_ROLE_ID"),
    NICKNAME: getEnv("NICKNAME_PERMS_ROLE_ID"),
    POLL: getEnv("POLL_PERMS_ROLE_ID"),
  },
  COLORS: {
    ERROR: Colors.Red,
    SUCCESS: Colors.Green,
    INFO: Colors.Blue,
    GIVEAWAY: Colors.Gold,
  }
};