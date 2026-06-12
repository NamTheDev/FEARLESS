import { CONFIG } from "@core/config";
import { Responder } from "@utils/responder";
import { ChannelType, TextChannel, EmbedBuilder } from "discord.js";
import { join } from "path";
import { client } from "src";

const prefix = "rh ";
const path = join(process.cwd(), "data", "summer.json");
const SUMMER_CONFIG = {
    ACTION_LIMIT: 5,
};

const format = {
    inventory: {
        bucket: 0,
        water: 0,
        splash: 0,
        sand: 0,
        watergun: 0,
        role: 0,
    },
    castle: {
        evolution: 0,
        health: 0,
        damage_taken: 0,
    },
    balance: 0,
};

interface ShopItem {
    emoji: string;
    name: string;
    desc: string;
    cost: number;
    type: string;
    damage?: number;
}

const shopItems: Record<string, ShopItem> = {
    bucket: {
        emoji: "🪣",
        name: "Bucket",
        desc: "To build the castle",
        cost: 3,
        type: "defense",
    },
    water: {
        emoji: "💧",
        name: "Water",
        desc: "To shape the castle",
        cost: 2,
        type: "defense",
    },
    splash: {
        emoji: "🌊",
        name: "Water Splash",
        desc: "To damage other castles",
        cost: 1,
        type: "offense",
        damage: 33,
    },
    watergun: {
        emoji: "🔫",
        name: "Water Gun",
        desc: "For precision strikes",
        cost: 2,
        type: "offense",
        damage: 55,
    },
    sand: {
        emoji: "🟨",
        name: "Sand",
        desc: "Extra sand",
        cost: 1,
        type: "defense",
    },
    role: {
        emoji: "🏖️",
        name: "Role",
        desc: '"RF Summer Event 2026" role',
        cost: 3,
        type: "cosmetic",
    },
};

const EVOLUTION_HP = {
    1: 120,
    2: 310,
    3: 500,
};

let cachedData: any = null;

async function loadData() {
    const file = Bun.file(path);
    if (!(await file.exists())) {
        await Bun.write(path, JSON.stringify(format));
        cachedData = { ...format };
    } else {
        cachedData = await file.json();
    }
    return cachedData;
}

loadData();

async function reply(channel: TextChannel, payload: any) {
    await Responder.webhook(CONFIG.SUMMER_WEBHOOK_URL, channel, payload);
}

client.on("messageCreate", async (message) => {
    // Beta testing: Developer only access for now, will open up after testing phase
    if (
        message.author.bot ||
        !message.content.startsWith(prefix) ||
        message.channel.type !== ChannelType.GuildText ||
        message.author.id !== CONFIG.DEVELOPER_USER_ID
    )
        return;

    const data = cachedData || (await loadData());

    const args = message.content.split(" ").slice(1);
    const command = args.shift()?.toLowerCase();
    const embed = new EmbedBuilder().setColor(CONFIG.COLORS.SUMMER);

    switch (command) {
        case "shop":
            const groupedItems: Record<string, string[]> = {};
            Object.values(shopItems).forEach((item) => {
                if (!groupedItems[item.type]) groupedItems[item.type] = [];
                const damageText = item.damage ? ` (*${item.damage} dmg*)` : "";
                groupedItems[item.type]!.push(
                    `> **${item.emoji} ${item.name}** - ${item.desc} (*${item.cost} shellites*)${damageText}`,
                );
            });

            const shopDescription = Object.entries(groupedItems)
                .map(
                    ([type, items]) =>
                        `### ${type.toUpperCase()}\n${items.join("\n")}`,
                )
                .join("\n\n");

            return await reply(message.channel, {
                content: `<@${message.author.id}>`,
                embeds: [
                    embed
                        .setTitle("🏝️ Summer Shop")
                        .setDescription(
                            `💥 **Redheat**:\n> "Sunny, hot-damn day, isn't it? Perfect for building sandcastles and splashing around!"\n\n🛒 **Shop Items**:\n${shopDescription}`,
                        ),
                ],
            });

        case "help":
            return await reply(message.channel, {
                content: `<@${message.author.id}>`,
                embeds: [
                    embed
                        .setTitle("📜 Summer Command Guide")
                        .setDescription(
                            `💥 **Redheat**:\n> "Lost? Don't worry, here's how to navigate the beach!"\n\n🤖 **Commands**:\n> \`${prefix}shop\` - Browse items for your sandcastle.\n> \`${prefix}inventory\` - See your current gear.\n> \`${prefix}use <item>\` - Build, repair, or attack.\n> \`${prefix}stat\` - Check your castle's strength and debt.\n> \`${prefix}tutorial\` - Full guide for newcomers.\n\n-# (New here? Run \`${prefix}tutorial\` to start your journey!)`,
                        ),
                ],
            });

        case "inventory":
            const inv = Object.entries(data.inventory)
                .map(
                    ([item, count]) =>
                        `> ${shopItems[item as keyof typeof shopItems]?.emoji || "❓"} **${shopItems[item as keyof typeof shopItems]?.name || item}**: ${count}`,
                )
                .join("\n");

            return await reply(message.channel, {
                content: `<@${message.author.id}>`,
                embeds: [
                    embed
                        .setTitle("🎒 Summer Inventory")
                        .setDescription(
                            `💥 **Redheat**:\n> "Checking what you got in that bag, huh?"\n\n🎒 **Inventory**:\n${inv}`,
                        ),
                ],
            });

        case "stat":
            return await reply(message.channel, {
                content: `<@${message.author.id}>`,
                embeds: [
                    embed
                        .setTitle("🏰 Summer Castle Stats")
                        .setDescription(
                            `💥 **Redheat**:\n> "Let's see the state of your fortress..."\n\n📄 **Stats**:\n> **Evolution**: ${data.castle.evolution}\n> **Health**: ${data.castle.health}\n> **Damage Taken**: ${data.castle.damage_taken}`,
                        ),
                ],
            });

        case "use":
            const itemKey = args[0]?.toLowerCase();
            const target = message.mentions.users.first() || message.author;

            if (
                !itemKey ||
                !data.inventory[itemKey as keyof typeof data.inventory]
            ) {
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `You don't have that item or didn't specify one! Check \`${prefix}inventory\`.`,
                        ),
                    ],
                });
            }

            if (data.inventory[itemKey as keyof typeof data.inventory] <= 0) {
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(`You ran out of ${itemKey}!`),
                    ],
                });
            }

            if (itemKey === "bucket") {
                if (data.castle.evolution === 0) {
                    if (
                        data.inventory.bucket < 1 ||
                        data.inventory.water < 1 ||
                        data.inventory.sand < 1
                    ) {
                        return await reply(message.channel, {
                            content: `<@${message.author.id}>`,
                            embeds: [
                                embed.setDescription(
                                    "You need 1 Bucket, 1 Water, and 1 Sand to build your first sandcastle!",
                                ),
                            ],
                        });
                    }
                    data.inventory.bucket--;
                    data.inventory.water--;
                    data.inventory.sand--;
                    data.castle.evolution = 1;
                    data.castle.health = EVOLUTION_HP[1];
                    await Bun.write(path, JSON.stringify(data));
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                `Your castle is now at level ${data.castle.evolution} with ${data.castle.health} HP.`,
                            ),
                        ],
                    });
                } else {
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription("You already have a castle!"),
                        ],
                    });
                }
            } else if (itemKey === "sand") {
                if (data.castle.evolution === 0) {
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                "You need to build a castle first! (Use bucket)",
                            ),
                        ],
                    });
                }
                if (data.inventory.sand < 1 || data.inventory.water < 1) {
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                "You need 1 Sand and 1 Water to repair 60 HP to your sandcastle!",
                            ),
                        ],
                    });
                }
                data.inventory.sand--;
                data.inventory.water--;
                data.castle.health = Math.min(
                    data.castle.health + 60,
                    EVOLUTION_HP[
                        data.castle.evolution as keyof typeof EVOLUTION_HP
                    ],
                );
                await Bun.write(path, JSON.stringify(data));
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `Your castle is now at level ${data.castle.evolution} with ${data.castle.health} HP.`,
                        ),
                    ],
                });
            } else if (
                shopItems[itemKey] &&
                shopItems[itemKey].type === "offense"
            ) {
                if (data.castle.damage_taken > 0) {
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                "You cannot attack while in debt! Recover your castle health first.",
                            ),
                        ],
                    });
                }
                data.inventory[itemKey as keyof typeof data.inventory]--;
                data.castle.damage_taken += shopItems[itemKey].damage || 0;
                await Bun.write(path, JSON.stringify(data));
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `You used ${itemKey} on <@${target.id}>!`,
                        ),
                    ],
                });
            } else {
                data.inventory[itemKey as keyof typeof data.inventory]--;
                await Bun.write(path, JSON.stringify(data));
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `You used ${itemKey} on <@${target.id}>!`,
                        ),
                    ],
                });
            }
    }
});
