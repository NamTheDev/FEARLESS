import { Colors } from "discord.js";
import globalConfig from "./config/global.json";
import mainConfig from "./config/main.json";
import testConfig from "./config/test.json";

const env = Bun.env;
const getEnv = (key: string, req = true) => {
    const val = env[key];
    if (!val && req) throw new Error(`❌ MISSING ENV: ${key}`);
    return val || "";
};

const appEnv = env.APP_ENV || "main";
const envConfig = appEnv === "test" ? testConfig : mainConfig;

const mergedConfig = { ...globalConfig, ...envConfig };

export const CONFIG = {
    TOKEN: getEnv("DISCORD_TOKEN"),
    CLIENT_ID: mergedConfig.CLIENT_ID,
    GUILD_ID: mergedConfig.GUILD_ID,
    WHITELISTED_GUILDS: [mainConfig.GUILD_ID, testConfig.GUILD_ID],
    DEVELOPER_USER_ID: mergedConfig.DEVELOPER_USER_ID,
    LOG_CHANNEL_ID: mergedConfig.LOG_CHANNEL_ID,
    SUMMER_WEBHOOK_URL: getEnv("SUMMER_WEBHOOK_URL"),
    CHANNELS: {
        GENERAL: mergedConfig.GENERAL_CHANNEL_ID,
        LEVEL_UP: mergedConfig.LEVEL_UP_CHANNEL_ID,
        PURCHASES: mergedConfig.PURCHASES_CHANNEL_ID,
    },
    ROLES: {
        STAFF: mergedConfig.STAFF_ROLE_ID,
        MEDIA: mergedConfig.MEDIA_PERMS_ROLE_ID,
        NICKNAME: mergedConfig.NICKNAME_PERMS_ROLE_ID,
        POLL: mergedConfig.POLL_PERMS_ROLE_ID,
        BLOODTRACE: mergedConfig.BLOODTRACE_ROLE_ID,
        HEMOVISION: mergedConfig.HEMOVISION_ROLE_ID,
        LEVELING: [
            {
                ROLE_ID: "1482596112937255033",
                VALUE: 1,
                NAME: "",
            },
            {
                ROLE_ID: "1482596219615186994",
                VALUE: 5,
                NAME: "",
            },
            {
                ROLE_ID: "1482596292558585966",
                VALUE: 10,
                NAME: "",
            },
            {
                ROLE_ID: "1482596385734918185",
                VALUE: 15,
                NAME: "",
            },
            {
                ROLE_ID: "1482596449211646137",
                VALUE: 20,
                NAME: "",
            },
            {
                ROLE_ID: "1482596497685221496",
                VALUE: 25,
                NAME: "",
            },
            {
                ROLE_ID: "1482596573484548136",
                VALUE: 30,
                NAME: "",
            },
            {
                ROLE_ID: "1482596636663218288",
                VALUE: 35,
                NAME: "",
            },
            {
                ROLE_ID: "1482597154626469998",
                VALUE: 50,
                NAME: "",
            },
            {
                ROLE_ID: "1482597144656347187",
                VALUE: 60,
                NAME: "",
            },
            {
                ROLE_ID: "1482600859610124329",
                VALUE: 67,
                NAME: "",
            },
            {
                ROLE_ID: "1482600979940642957",
                VALUE: 69,
                NAME: "",
            },
            {
                ROLE_ID: "1482597314010021978",
                VALUE: 70,
                NAME: "",
            },
            {
                ROLE_ID: "1482597375574016206",
                VALUE: 80,
                NAME: "",
            },
            {
                ROLE_ID: "1482597428640088126",
                VALUE: 100,
                NAME: "",
            },
        ],
    },
    COLORS: {
        DEFAULT: Colors.DarkRed,
        ERROR: Colors.Red,
        SUCCESS: Colors.Green,
        GIVEAWAY: Colors.Gold,
        SUMMER: 0xc2b280,
    },
    UI: {
        PAGINATION: {
            PRIMARY_STYLE: "Danger",
            SECONDARY_STYLE: "Secondary",
            PREVIOUS_EMOJI: "⬅️",
            NEXT_EMOJI: "➡️",
        },
    },
    LOGIC: {
        LEVELING: {
            ONE_HOUR: 60 * 60 * 1000,
            TEN_MINUTES: 10 * 60 * 1000,
            XP_COOLDOWN: 60000,
            LEVEL_XP_RATIO: 800,
        },
        ANTI_SPAM: {
            WINDOW: 5000,
            THRESHOLD: 5,
            CLEANUP_LIMIT: 1000,
            EXPIRY: 600000,
            VIOLATION_RESET: 3600000,
        },
        AUTO_RESPONSE: {
            MIN_CD: 5 * 60 * 1000,
            MAX_CD: 10 * 60 * 1000,
        },
        ECONOMY: {
            SHOP_SPAWN_MIN: 60 * 60,
            SHOP_SPAWN_MAX: 60 * 60,
            SHOP_DURATION: 15 * 60,
            LOOTS: [
                {
                    name: "Dread Mark",
                    minVal: 5,
                    maxVal: 12,
                    minSpawn: 5 * 60,
                    maxSpawn: 5 * 60,
                    maxClaims: 6,
                    duration: 30,
                    image: "dread_mark.png",
                },
                {
                    name: "Cursed Bloody Relic",
                    minVal: 15,
                    maxVal: 27,
                    minSpawn: 10 * 60,
                    maxSpawn: 15 * 60,
                    maxClaims: 6,
                    duration: 60,
                    image: "cursed_bloody_relic.png",
                },
                {
                    name: "Crimson Sigil",
                    minVal: 35,
                    maxVal: 61,
                    minSpawn: 20 * 60,
                    maxSpawn: 35 * 60,
                    maxClaims: 4,
                    duration: 5 * 60,
                    image: "crimson_sigil.png",
                },
                {
                    name: "Sanguine's Wound",
                    minVal: 85,
                    maxVal: 115,
                    minSpawn: 60 * 60,
                    maxSpawn: 120 * 60,
                    maxClaims: 4,
                    duration: 12 * 60,
                    pingRole: "BLOODTRACE",
                    image: "sanguines_wound.png",
                },
                {
                    name: "Bleed Cache",
                    minVal: 166,
                    maxVal: 351,
                    minSpawn: 60 * 60,
                    maxSpawn: 180 * 60,
                    maxClaims: 3,
                    duration: 30 * 60,
                    pingRole: "HEMOVISION",
                    image: "bleed_crate.png",
                },
                {
                    name: "Bleeding Hellish Heart",
                    minVal: 311,
                    maxVal: 535,
                    minSpawn: 2 * 60 * 60 + 35 * 60,
                    maxSpawn: 4 * 60 * 60 + 10 * 60,
                    maxClaims: 3,
                    duration: 15 * 60,
                    image: "bleeding_hellish_heart.png",
                },
            ],
            SHOP_ITEMS: {
                namechange: {
                    name: "Namechange Perm",
                    price: 450,
                    limit: 1,
                    emoji: "🪪",
                },
                poll: { name: "Poll Perm", price: 785, limit: 1, emoji: "🧮" },
                image: {
                    name: "Image Perm",
                    price: 1255,
                    limit: 1,
                    emoji: "📷",
                },
                xp100: {
                    name: "100 XP",
                    price: 150,
                    minStock: 6,
                    maxStock: 23,
                    xp: 100,
                    emoji: "📶",
                },
                xp250: {
                    name: "250 XP",
                    price: 310,
                    minStock: 5,
                    maxStock: 20,
                    xp: 250,
                    emoji: "📶",
                },
                xp350: {
                    name: "350 XP",
                    price: 599,
                    minStock: 4,
                    maxStock: 19,
                    xp: 350,
                    emoji: "📶",
                },
                xp500: {
                    name: "500 XP",
                    price: 812,
                    minStock: 3,
                    maxStock: 17,
                    xp: 500,
                    emoji: "📶",
                },
            },
            MERCHANT_ITEMS: {
                potion_fearless: {
                    name: "Potion of Fearless",
                    price: 2,
                    minStock: 1,
                    maxStock: 3,
                    emoji: "🕷️",
                    isGorelith: true,
                    isInventoryItem: true,
                    duration: 2 * 60 * 60,
                },
                potion_ruthless: {
                    name: "Potion of Ruthless",
                    price: 2,
                    minStock: 1,
                    maxStock: 3,
                    emoji: "🔪",
                    isGorelith: true,
                    isInventoryItem: true,
                    duration: 2 * 60 * 60,
                },
                bloodtrace_device: {
                    name: "Bloodtrace Device",
                    price: 4,
                    limit: 1,
                    emoji: "🩸",
                    isGorelith: true,
                    isInventoryItem: true,
                },
                hemovision_core: {
                    name: "Hemovision Core",
                    price: 7,
                    limit: 1,
                    emoji: "🫀",
                    isGorelith: true,
                    isInventoryItem: true,
                },
            },
        },
    },
};
