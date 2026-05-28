import db, {
  getBalanceStmt,
  updateBalanceStmt,
  getBuffsStmt,
  updateBuffsStmt,
  getUserItemsStmt,
  updateUserItemStmt,
} from "@core/database";
import { CONFIG } from "@core/config";
import { economyState } from "@core/state";
import {
  AttachmentBuilder,
  TextChannel,
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  MessageFlags,
} from "discord.js";
import { join } from "node:path";
import { getRandomInt } from "@utils/math";
import { adjustXp } from "@logic/leveling";
import {
  buildReceiptEmbed,
  buildLootSpawnEmbed,
  buildShopEmbed,
  buildPurchaseApprovalEmbed,
} from "@utils/messages";

export function getBalance(userId: string): number {
  const res = getBalanceStmt.get(userId) as { bloodern: number } | undefined;
  return res?.bloodern || 0;
}

export function getEconomyLeaderboard(): Array<[string, number]> {
  const res = db
    .query(
      "SELECT userId, bloodern FROM economy ORDER BY bloodern DESC LIMIT 15",
    )
    .all() as { userId: string; bloodern: number }[];
  return res.map((u) => [u.userId, u.bloodern]);
}

export function addBloodern(userId: string, amount: number) {
  const res = getBalanceStmt.get(userId) as
    | { bloodern: number; gorelith: number }
    | undefined;
  const currentBloodern = res?.bloodern || 0;
  const currentGorelith = res?.gorelith || 0;
  updateBalanceStmt.run(userId, currentBloodern + amount, currentGorelith);
}

export function subBloodern(userId: string, amount: number): boolean {
  const res = getBalanceStmt.get(userId) as
    | { bloodern: number; gorelith: number }
    | undefined;
  const currentBloodern = res?.bloodern || 0;
  const currentGorelith = res?.gorelith || 0;
  if (currentBloodern < amount) return false;
  updateBalanceStmt.run(userId, currentBloodern - amount, currentGorelith);
  return true;
}

export function subGorelith(userId: string, amount: number): boolean {
  const res = getBalanceStmt.get(userId) as
    | { bloodern: number; gorelith: number }
    | undefined;
  if (!res || res.gorelith < amount) return false;
  updateBalanceStmt.run(userId, res.bloodern, res.gorelith - amount);
  return true;
}

export function getInventory(
  userId: string,
): { itemKey: string; count: number }[] {
  const res = getUserItemsStmt.all(userId) as {
    itemKey: string;
    count: number;
    pending: number;
  }[];
  return res.filter((i) => i.pending === 0);
}

export function getPurchasedItems(
  userId: string,
): { itemKey: string; count: number }[] {
  const res = getUserItemsStmt.all(userId) as {
    itemKey: string;
    count: number;
    pending: number;
  }[];
  return res.filter((i) => i.pending === 1);
}

export function getShopStock(itemKey: string): number {
  return economyState.shopStock.get(itemKey) || 0;
}

export function refreshShopStock() {
  economyState.shopStock.clear();
  const shopItems = CONFIG.LOGIC.ECONOMY.SHOP_ITEMS as any;
  for (const [key, item] of Object.entries(shopItems)) {
    const i = item as any;
    if (i.minStock && i.maxStock) {
      economyState.shopStock.set(key, getRandomInt(i.minStock, i.maxStock));
    }
  }
}

export function buyItem(
  userId: string,
  itemKey: string,
  client?: Client,
): { success: boolean; message: string } {
  const shopItems = CONFIG.LOGIC.ECONOMY.SHOP_ITEMS as any;
  const merchantItems = CONFIG.LOGIC.ECONOMY.MERCHANT_ITEMS as any;
  const item = shopItems[itemKey] || merchantItems[itemKey];

  if (!item) return { success: false, message: "Item not found." };

  const inventory = getInventory(userId);
  const pending = getPurchasedItems(userId);
  const combined = [...inventory, ...pending];
  const currentCount = combined.find((i) => i.itemKey === itemKey)?.count || 0;

  if (item.minStock && item.maxStock) {
    const currentStock = getShopStock(itemKey);
    if (currentStock <= 0)
      return { success: false, message: `**${item.name}** is out of stock!` };
    economyState.shopStock.set(itemKey, currentStock - 1);
  } else if (currentCount >= item.limit) {
    return {
      success: false,
      message: `You reached the limit for **${item.name}**!`,
    };
  }

  if (item.isGorelith) {
    if (!subGorelith(userId, item.price))
      return {
        success: false,
        message: `You need **${item.price}** gorelith!`,
      };
  } else {
    if (!subBloodern(userId, item.price))
      return {
        success: false,
        message: `You need **${item.price}** bloodern!`,
      };
  }

  const isPassive = !item.duration && !item.isGorelith;
  updateUserItemStmt.run(userId, itemKey, currentCount + 1, isPassive ? 1 : 0);

  if (isPassive && client) {
    const channel = client.channels.cache.get(
      CONFIG.CHANNELS.PURCHASES,
    ) as TextChannel;
    if (channel) {
      const embed = buildPurchaseApprovalEmbed(userId, item.name);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_purchase_${userId}_${itemKey}`)
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Success),
      );
      channel.send({ embeds: [embed], components: [row] });
    }
  }

  return {
    success: true,
    message: `Bought **${item.name}**! ${isPassive ? "Waiting for staff confirmation." : "Remaining stock: " + (item.minStock ? getShopStock(itemKey) : "N/A")}`,
  };
}

export function generateReceipt(userId: string): {
  itemsList: string;
  totalSpentBloodern: number;
  totalSpentGorelith: number;
  totalXp: number;
} {
  const pending = getPurchasedItems(userId);
  const shopItems = CONFIG.LOGIC.ECONOMY.SHOP_ITEMS as any;
  let totalSpentBloodern = 0;
  let totalSpentGorelith = 0;
  let totalXp = 0;

  const itemsList = pending
    .map((i) => {
      const item = shopItems[i.itemKey];
      const price = item?.price || 0;

      if (item?.xp) totalXp += item.xp * i.count;

      if (item?.isGorelith) {
        totalSpentGorelith += price * i.count;
        return `**${item?.name || i.itemKey}**: ${i.count}x (${price * i.count} gorelith)`;
      } else {
        totalSpentBloodern += price * i.count;
        return `**${item?.name || i.itemKey}**: ${i.count}x (${price * i.count} bloodern)`;
      }
    })
    .join("\n");

  db.prepare("DELETE FROM user_items WHERE userId = ? AND pending = 1").run(
    userId,
  );
  return { itemsList, totalSpentBloodern, totalSpentGorelith, totalXp };
}

export function useItem(
  userId: string,
  itemKey: string,
): { success: boolean; message: string } {
  const items = getInventory(userId);
  const item = items.find((i) => i.itemKey === itemKey);
  if (!item || item.count <= 0)
    return { success: false, message: "❌ No item found!" };

  if (itemKey === "potion_fearless") {
    const expiry = Math.floor(Date.now() / 1000) + 7200;
    updateBuffsStmt.run(userId, 1.2, 1.0, expiry);
    updateUserItemStmt.run(userId, itemKey, item.count - 1, 0);
    return { success: true, message: "✅ Used Potion of Fearless." };
  } else if (itemKey === "potion_ruthless") {
    const expiry = Math.floor(Date.now() / 1000) + 7200;
    updateBuffsStmt.run(userId, 1.0, 1.2, expiry);
    updateUserItemStmt.run(userId, itemKey, item.count - 1, 0);
    return { success: true, message: "✅ Used Potion of Ruthless." };
  }
  return { success: false, message: "❌ Non-usable." };
}

export async function triggerSpawn(loot: any, channel: TextChannel) {
  const value = getRandomInt(loot.minVal, loot.maxVal);
  const dropId = Date.now().toString() + getRandomInt(1, 1000).toString();
  const expiryTimestamp = Math.floor(Date.now() / 1000) + loot.duration;

  const imagePath = join(process.cwd(), "src", "core", "media", loot.image);
  const files: AttachmentBuilder[] = [new AttachmentBuilder(imagePath)];

  const embed = buildLootSpawnEmbed(
    loot.name,
    value,
    loot.maxClaims,
    expiryTimestamp,
    loot.image,
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`claim_${dropId}`)
      .setLabel("Claim")
      .setStyle(ButtonStyle.Danger),
  );

  const pingRoleKey = loot.pingRole;
  let content = "";
  if (pingRoleKey && (CONFIG.ROLES as any)[pingRoleKey]) {
    content = `<@&${(CONFIG.ROLES as any)[pingRoleKey]}>`;
  }

  const msg = await channel.send({
    content: content || undefined,
    embeds: [embed],
    components: [row],
    files: files,
  });

  economyState.activeClaims.set(dropId, {
    claimsLeft: loot.maxClaims,
    claimedBy: new Set(),
    messageId: msg.id,
    channelId: channel.id,
    lootName: loot.name,
    value: value,
    duration: loot.duration,
    expiryTimestamp: expiryTimestamp,
    image: loot.image,
  });

  setTimeout(() => {
    msg.delete().catch(() => {});
    economyState.activeClaims.delete(dropId);
  }, loot.duration * 1000);
}

export function startLootSpawner(client: Client) {
  const loots = CONFIG.LOGIC.ECONOMY.LOOTS;
  const channelId = CONFIG.CHANNELS.GENERAL;

  loots.forEach((loot: any) => {
    const schedule = () => {
      const nextSpawnSeconds = getRandomInt(loot.minSpawn, loot.maxSpawn);
      setTimeout(async () => {
        try {
          const channel = await client.channels
            .fetch(channelId)
            .catch(() => null);
          if (channel instanceof TextChannel) {
            await triggerSpawn(loot, channel);
          }
        } catch (e) {
          console.error(`Loot spawner error (${loot.name}):`, e);
        } finally {
          schedule();
        }
      }, nextSpawnSeconds * 1000);
    };
    schedule();
  });
}

export function getActiveClaim(dropId: string) {
  return economyState.activeClaims.get(dropId);
}

export function removeActiveClaim(dropId: string) {
  economyState.activeClaims.delete(dropId);
}

export async function spawnShop(channel: TextChannel) {
  refreshShopStock();

  const shopItems = CONFIG.LOGIC.ECONOMY.SHOP_ITEMS as any;
  const { SHOP_DURATION } = CONFIG.LOGIC.ECONOMY;
  economyState.shopExpiryTimestamp =
    Math.floor(Date.now() / 1000) + SHOP_DURATION;

  const embed = buildShopEmbed(
    shopItems,
    getShopStock,
    economyState.shopExpiryTimestamp,
  );

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("shop_buy_namechange")
      .setLabel("Buy Namechange Perm")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("shop_buy_poll")
      .setLabel("Buy Poll Perm")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("shop_buy_image")
      .setLabel("Buy Image Perm")
      .setStyle(ButtonStyle.Primary),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("shop_buy_xp100")
      .setLabel("100 XP")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("shop_buy_xp250")
      .setLabel("250 XP")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("shop_buy_xp350")
      .setLabel("350 XP")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("shop_buy_xp500")
      .setLabel("500 XP")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("shop_user_inventory")
      .setLabel("My Inventory")
      .setStyle(ButtonStyle.Secondary),
  );

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("shop_balance")
      .setLabel("Check Balance")
      .setStyle(ButtonStyle.Secondary),
  );

  const msg = await channel.send({
    embeds: [embed],
    components: [row1, row2, row3],
  });

  economyState.activeShopMessageId = msg.id;

  setTimeout(() => {
    msg.delete().catch(() => {});
    economyState.activeShopMessageId = null;
    economyState.shopExpiryTimestamp = null;
  }, SHOP_DURATION * 1000);
}

export function startShopSpawner(client: Client) {
  const channelId = CONFIG.CHANNELS.GENERAL;
  const { SHOP_SPAWN_MIN, SHOP_SPAWN_MAX } = CONFIG.LOGIC.ECONOMY;

  const schedule = () => {
    const nextSpawnSeconds = getRandomInt(SHOP_SPAWN_MIN, SHOP_SPAWN_MAX);
    setTimeout(async () => {
      try {
        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (channel instanceof TextChannel) {
          await spawnShop(channel);
        }
      } catch (e) {
        console.error("Shop spawner error:", e);
      } finally {
        schedule();
      }
    }, nextSpawnSeconds * 1000);
  };
  schedule();
}

export async function handleEconomyInteraction(interaction: ButtonInteraction) {
  const { customId } = interaction;

  if (customId.startsWith("claim_")) {
    const dropId = customId.replace("claim_", "");
    const dropData = getActiveClaim(dropId);

    if (!dropData) {
      await interaction.message.delete().catch(() => {});
      return await interaction.reply({
        content: "❌ This loot has expired or was fully claimed!",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (dropData.claimedBy.has(interaction.user.id)) {
      return await interaction.reply({
        content: "❌ You already claimed this drop!",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (dropData.claimsLeft <= 0) {
      return await interaction.reply({
        content: "❌ Fully claimed!",
        flags: MessageFlags.Ephemeral,
      });
    }

    dropData.claimedBy.add(interaction.user.id);
    dropData.claimsLeft--;

    let multiplier = 1.0;
    const buff = getBuffsStmt.get(interaction.user.id) as
      | { moneyMultiplier: number; expiry: number }
      | undefined;
    if (buff && buff.expiry > Date.now()) {
      multiplier = buff.moneyMultiplier;
    }

    const finalValue = Math.floor(dropData.value * multiplier);
    addBloodern(interaction.user.id, finalValue);

    await interaction.reply({
      content: `🎉 Claimed **${dropData.lootName}** for **${finalValue}**! Balance: ${getBalance(interaction.user.id)}`,
      flags: MessageFlags.Ephemeral,
    });

    if (dropData.claimsLeft === 0) {
      await interaction.message.delete().catch(() => {});
    } else {
      const updatedEmbed = buildLootSpawnEmbed(
        dropData.lootName,
        dropData.value,
        dropData.claimsLeft,
        dropData.expiryTimestamp,
        dropData.image,
      );
      await interaction.message
        .edit({ embeds: [updatedEmbed] })
        .catch(() => {});
    }
    return;
  }

  if (customId.startsWith("shop_")) {
    const now = Math.floor(Date.now() / 1000);
    if (
      !economyState.shopExpiryTimestamp ||
      now >= economyState.shopExpiryTimestamp
    ) {
      if (interaction.message.deletable) {
        await interaction.message.delete().catch(() => {});
      }
      economyState.activeShopMessageId = null;
      economyState.shopExpiryTimestamp = null;
      return await interaction.reply({
        content: "❌ The mysterious shop has closed!",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (customId === "shop_balance") {
      return await interaction.reply({
        content: `💰 Your current balance is: **${getBalance(interaction.user.id)}** bloodern.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (customId === "shop_user_inventory") {
      const inventory = getInventory(interaction.user.id);
      const shopItems = CONFIG.LOGIC.ECONOMY.SHOP_ITEMS as any;
      const items = Object.entries(inventory)
        .map(([key, count]) => `**${shopItems[key]?.name || key}**: ${count}`)
        .join("\n");
      return await interaction.reply({
        content: `🎒 **Your Purchased Items:**\n${items || "Nothing yet!"}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const itemKey = customId.replace("shop_buy_", "");
    const result = buyItem(interaction.user.id, itemKey, interaction.client);

    if (result.success) {
      const shopItem = (CONFIG.LOGIC.ECONOMY.SHOP_ITEMS as any)[itemKey];
      if (shopItem.xp && interaction.member) {
        await adjustXp(interaction.member as any, shopItem.xp);
      }
      if (shopItem.minStock && shopItem.maxStock) {
        const embed = interaction.message.embeds[0];
        if (embed) {
          const newEmbed = buildShopEmbed(
            CONFIG.LOGIC.ECONOMY.SHOP_ITEMS,
            getShopStock,
            economyState.shopExpiryTimestamp!,
          );
          interaction.message.edit({ embeds: [newEmbed] }).catch(() => {});
        }
      }
    }

    return await interaction
      .reply({
        content: result.success
          ? `✅ ${result.message} New balance: **${getBalance(interaction.user.id)}**.`
          : `❌ ${result.message}`,
        flags: MessageFlags.Ephemeral,
      })
      .catch((e) => {
        if (e.code === 10008 || e.code === 40060) return null;
        throw e;
      });
  }

  if (customId.startsWith("confirm_purchase_")) {
    const parts = customId.split("_");
    const userId = parts[2];
    const itemKey = parts[3];
    
    if (userId && itemKey) {
        db.prepare("UPDATE user_items SET pending = 0 WHERE userId = ? AND itemKey = ? AND pending = 1").run(userId, itemKey);
        await interaction.update({ content: `✅ Purchase approved for <@${userId}>`, embeds: [], components: [] });
    }
    return;
  }
}
