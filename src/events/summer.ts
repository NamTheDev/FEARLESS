import { CONFIG } from "@core/config";
import { Responder } from "@utils/responder";
import { ChannelType, TextChannel, EmbedBuilder } from "discord.js";
import { join } from "path";
import { client } from "src";
import { buildSummerStatEmbed, buildSummerStatButtons } from "@utils/messages";

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

const typeEmojis: Record<string, string> = {
    offense: "⚔️",
    defense: "🛡️",
    cosmetic: "🎨",
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
    if (!cachedData.castles) {
        if (cachedData.castle && cachedData.castle.evolution > 0) {
            cachedData.castles = [cachedData.castle];
        } else {
            cachedData.castles = [];
        }
    }
    return cachedData;
}

async function saveData(data: any) {
    if (data.castles && data.castles.length > 0) {
        data.castle = data.castles[data.castles.length - 1];
    }
    await Bun.write(path, JSON.stringify(data));
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

    const commandDetails: Record<
        | "shop"
        | "help"
        | "tutorial"
        | "inventory"
        | "balance"
        | "stat"
        | "use"
        | "buy",
        { desc: string; args: string; usage: string }
    > = {
        shop: {
            desc: "Browse items for your sandcastle.",
            args: "None",
            usage: `${prefix}shop`,
        },
        help: {
            desc: "Displays details for a command or lists all available commands.",
            args: "[command name]",
            usage: `${prefix}help [command name]`,
        },
        tutorial: {
            desc: "Full guide for newcomers to the summer event.",
            args: "None",
            usage: `${prefix}tutorial`,
        },
        inventory: {
            desc: "See your current gear and items.",
            args: "None",
            usage: `${prefix}inventory`,
        },
        balance: {
            desc: "Check your shellite balance.",
            args: "None",
            usage: `${prefix}balance`,
        },
        stat: {
            desc: "Check your castle's strength and damage taken.",
            args: "None",
            usage: `${prefix}stat`,
        },
        use: {
            desc: "Build, repair, or attack with an item.",
            args: "<item> [amount] [@user]",
            usage: `${prefix}use <item> [amount] [@user]`,
        },
        buy: {
            desc: "Buy item from shop.",
            args: "<item> [amount]",
            usage: `${prefix}buy <item> [amount]`,
        },
    };

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
                .map(([type, items]) => {
                    if (!type) return "";
                    return `- **${typeEmojis[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}**\n${items.join("\n")}`;
                })
                .join("\n\n");

            return await reply(message.channel, {
                content: `<@${message.author.id}>`,
                embeds: [
                    embed
                        .setTitle("🏝️ Summer Shop")
                        .setDescription(
                            `💥 **Redheat**:\n> "Sunny, hot-damn day, isn't it? Perfect for building sandcastles and splashing around!"\n\n🛒 **Shop Items**:\n\n${shopDescription}\n\n-# (Run \`${commandDetails.buy.usage}\` to purchase items from the shop.)`,
                        ),
                ],
            });

        case "help":
            const cmdName = args[0]?.toLowerCase();
            if (cmdName) {
                const details =
                    commandDetails[cmdName as keyof typeof commandDetails];
                if (details) {
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed
                                .setTitle("Command info")
                                .setDescription(
                                    `💥 **Redheat**:\n> "Ah yes, the command works like this:"\n\n` +
                                        `**Command**: ${cmdName}\n` +
                                        `**Description**: ${details.desc}\n` +
                                        `**Arguments**: ${details.args}\n` +
                                        `**Usage**: ${details.usage}`,
                                ),
                        ],
                    });
                } else {
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                `💥 **Redheat**:\n> "I don't know that command! Try \`${prefix}help\` to see what's available."`,
                            ),
                        ],
                    });
                }
            }

            return await reply(message.channel, {
                content: `<@${message.author.id}> - type \`${prefix}tutorial\` in case you don't know where to start!`,
                embeds: [
                    embed.setTitle("📜 Summer Command Guide").setDescription(
                        `💥 **Redheat**:\n> "Ah yes, list of... whatever this is."\n\n🤖 **Commands**:\n` +
                            Object.entries(commandDetails)
                                .filter(([name]) => name !== "help")
                                .map(
                                    ([, cmd]) =>
                                        `- \`${cmd.usage}\` - ${cmd.desc}`,
                                )
                                .join("\n") +
                            `\n\n💥 **Redheat**:\n> "Oh right, just FYI, <argument> is required and [argument] is optional."\n\n-# (Use \`${commandDetails.help.usage}\` for more info of a command.)`,
                    ),
                ],
            });

        case "tutorial":
            return await reply(message.channel, {
                content: `<@${message.author.id}>`,
                embeds: [
                    embed
                        .setTitle("📖 Summer Event Tutorial")
                        .setDescription(
                            `💥 **Redheat**:\n> "Welcome to the RF Summer Event 2026! Feel free to splash nukes on each other!"\n\n🔢 **Guide**\n1. Convert Bloodern to Shellite and buy items in the shop (run \`rh shop\`).\n2. Use \`rh use <item>\` to:\n- Build your first castle (Bucket + Water + Sand).\n- Repair your castle (Sand + Water).\n- Attack other players.\n3. Check your castle status and damage taken with \`rh stat\`.\n\n💥 **Redheat**:\n> "Have fun and enjoy the summer vibes!"\n\n-# (run \`${commandDetails.help.usage}\` for more command info.)`,
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

        case "balance":
            return await reply(message.channel, {
                content: `<@${message.author.id}>`,
                embeds: [
                    embed
                        .setTitle("💰 Shellite Balance")
                        .setDescription(
                            `💥 **Redheat**:\n> "Let me check your pockets..."\n\n💰 **Balance**: **${data.balance}** shellites`,
                        ),
                ],
            });

        case "stat":
            const castles = data.castles || [];
            const page = Math.max(1, castles.length);

            const statEmbed = buildSummerStatEmbed(castles, page);
            const statButtons = buildSummerStatButtons(page, castles.length);

            return await reply(message.channel, {
                content: `<@${message.author.id}>`,
                embeds: [statEmbed],
                components: statButtons ? [statButtons] : [],
            });

        case "buy":
            const buyItemKey = args[0]?.toLowerCase();
            let buyAmount = 1;
            if (args[1] && !isNaN(Number(args[1]))) {
                buyAmount = parseInt(args[1], 10);
            }

            if (!buyItemKey || !shopItems[buyItemKey]) {
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `💥 **Redheat**:\n> "That item is not in the shop! Check \`${prefix}shop\`."`,
                        ),
                    ],
                });
            }

            if (buyAmount <= 0) {
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `💥 **Redheat**:\n> "Amount must be a positive number!"`,
                        ),
                    ],
                });
            }

            const item = shopItems[buyItemKey]!;
            const cost = item.cost * buyAmount;
            if (data.balance < cost) {
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `💥 **Redheat**:\n> "You don't have enough shellites! You need **${cost}** shellites, but you only have **${data.balance}**."`,
                        ),
                    ],
                });
            }

            data.balance -= cost;
            data.inventory[buyItemKey as keyof typeof data.inventory] +=
                buyAmount;
            await saveData(data);

            return await reply(message.channel, {
                content: `<@${message.author.id}>`,
                embeds: [
                    embed.setDescription(
                        `💥 **Redheat**:\n> "You bought ${buyAmount} **${item.name}** for ${cost} shellites!"`,
                    ),
                ],
            });

        case "use":
            const itemKey = args[0]?.toLowerCase();
            const target = message.mentions.users.first() || message.author;

            if (!itemKey || !(itemKey in data.inventory)) {
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `💥 **Redheat**:\n> "You don't have that item or didn't specify one! Check \`${prefix}inventory\`."`,
                        ),
                    ],
                });
            }

            let amount = 1;
            if (args[1] && !isNaN(Number(args[1]))) {
                amount = parseInt(args[1], 10);
            }

            if (amount <= 0) {
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `💥 **Redheat**:\n> "Amount must be a positive number!"`,
                        ),
                    ],
                });
            }

            if (
                shopItems[itemKey] &&
                shopItems[itemKey].type === "offense" &&
                amount > SUMMER_CONFIG.ACTION_LIMIT
            ) {
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `💥 **Redheat**:\n> "You cannot use more than ${SUMMER_CONFIG.ACTION_LIMIT} offense items at once!"`,
                        ),
                    ],
                });
            }

            if (
                data.inventory[itemKey as keyof typeof data.inventory] < amount
            ) {
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            data.inventory[
                                itemKey as keyof typeof data.inventory
                            ] <= 0
                                ? `💥 **Redheat**:\n> "You should go buy some ${itemKey}!\n\n-# (Run \`${commandDetails.shop.usage}\` to view purchasable items, then \`${commandDetails.buy.usage}\` to purchase them. Use single space after prefix.)"`
                                : `💥 **Redheat**:\n> "You don't have enough ${itemKey}!"`,
                        ),
                    ],
                });
            }

            if (itemKey === "bucket") {
                const castles = data.castles || [];
                const activeCastle = castles[castles.length - 1];

                const isBuildingNew =
                    !activeCastle || activeCastle.evolution === 3;

                if (isBuildingNew && castles.length >= 4) {
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                `💥 **Redheat**:\n> "You have reached the limit of 4 castles!"`,
                            ),
                        ],
                    });
                }

                if (
                    data.inventory.bucket < 1 ||
                    data.inventory.water < 1 ||
                    data.inventory.sand < 1
                ) {
                    const actionWord = isBuildingNew ? "build" : "upgrade";
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                `💥 **Redheat**:\n> "You need 1 Bucket, 1 Water, and 1 Sand to ${actionWord} your sandcastle!"`,
                            ),
                        ],
                    });
                }

                data.inventory.bucket--;
                data.inventory.water--;
                data.inventory.sand--;

                if (isBuildingNew) {
                    const newCastle = {
                        evolution: 1,
                        health: EVOLUTION_HP[1],
                        damage_taken: 0,
                    };
                    castles.push(newCastle);
                    data.castles = castles;
                    await saveData(data);
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                `💥 **Redheat**:\n> "You built a new castle! It is level 1 with ${newCastle.health} HP. (Castle #${castles.length}/4)"`,
                            ),
                        ],
                    });
                } else {
                    activeCastle.evolution += 1;
                    activeCastle.health =
                        EVOLUTION_HP[
                            activeCastle.evolution as keyof typeof EVOLUTION_HP
                        ];
                    data.castles = castles;
                    await saveData(data);
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                `💥 **Redheat**:\n> "Your castle #${castles.length} evolved to level ${activeCastle.evolution} with ${activeCastle.health} HP."`,
                            ),
                        ],
                    });
                }
            } else if (itemKey === "sand") {
                const castles = data.castles || [];
                const activeCastle = castles[castles.length - 1];

                if (!activeCastle) {
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                `💥 **Redheat**:\n> "You need to build a castle first! (Use bucket)"`,
                            ),
                        ],
                    });
                }
                if (data.inventory.sand < 1 || data.inventory.water < 1) {
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                `💥 **Redheat**:\n> "You need 1 Sand and 1 Water to repair 60 HP to your sandcastle!"`,
                            ),
                        ],
                    });
                }
                data.inventory.sand--;
                data.inventory.water--;
                activeCastle.health = Math.min(
                    activeCastle.health + 60,
                    EVOLUTION_HP[
                        activeCastle.evolution as keyof typeof EVOLUTION_HP
                    ],
                );
                data.castles = castles;
                await saveData(data);
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `💥 **Redheat**:\n> "Your castle #${castles.length} is now at level ${activeCastle.evolution} with ${activeCastle.health} HP."`,
                        ),
                    ],
                });
            } else if (
                shopItems[itemKey] &&
                shopItems[itemKey].type === "offense"
            ) {
                const castles = data.castles || [];
                const activeCastle = castles[castles.length - 1];

                if (activeCastle && activeCastle.damage_taken > 0) {
                    return await reply(message.channel, {
                        content: `<@${message.author.id}>`,
                        embeds: [
                            embed.setDescription(
                                `💥 **Redheat**:\n> "You cannot attack while in damage taken! Recover your castle health first."`,
                            ),
                        ],
                    });
                }
                data.inventory[itemKey as keyof typeof data.inventory] -=
                    amount;
                if (activeCastle) {
                    activeCastle.damage_taken +=
                        (shopItems[itemKey].damage || 0) * amount;
                }
                data.castles = castles;
                await saveData(data);
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `💥 **Redheat**:\n> "You used ${amount} ${itemKey} on <@${target.id}>!"`,
                        ),
                    ],
                });
            } else {
                data.inventory[itemKey as keyof typeof data.inventory] -=
                    amount;
                await saveData(data);
                return await reply(message.channel, {
                    content: `<@${message.author.id}>`,
                    embeds: [
                        embed.setDescription(
                            `💥 **Redheat**:\n> "You used ${amount} ${itemKey} on <@${target.id}>!"`,
                        ),
                    ],
                });
            }
    }
});
