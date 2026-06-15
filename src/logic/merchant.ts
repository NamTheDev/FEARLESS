import { Client, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, MessageFlags } from "discord.js";
import { CONFIG } from "@core/config";
import { economyState } from "@core/state";
import { getRandomInt } from "@utils/math";
import db, { getBalanceStmt, updateBalanceStmt, updateInventoryStmt } from "@core/database";
import { getBloodern, subBloodern, subGorelith, getInventory } from "@logic/economy";
import { buildShopEmbed } from "@utils/messages";

export function getGorelith(userId: string): number {
  const res = getBalanceStmt.get(userId) as { gorelith: number } | undefined;
  return res?.gorelith || 0;
}

export function getMerchantStock(itemKey: string): number {
  return economyState.merchantStock.get(itemKey) || 0;
}

export function refreshMerchantStock() {
  economyState.merchantStock.clear();
  const items = CONFIG.LOGIC.ECONOMY.MERCHANT_ITEMS as any;
  for (const [key, item] of Object.entries(items)) {
    const i = item as any;
    if (i.minStock && i.maxStock) {
      economyState.merchantStock.set(key, getRandomInt(i.minStock, i.maxStock));
    }
  }
}

export async function spawnMerchant(client: Client, targetChannel?: TextChannel) {
  let channel = targetChannel;
  if (!channel) {
    const channelId = CONFIG.CHANNELS.GENERAL;
    channel = await client.channels.fetch(channelId).catch(() => null) as TextChannel;
  }
  if (!channel) return;

  refreshMerchantStock();
  economyState.merchantActive = true;
  const duration = 30 * 60;
  economyState.merchantExpiry = Math.floor(Date.now() / 1000) + duration;

  const items = CONFIG.LOGIC.ECONOMY.MERCHANT_ITEMS as any;
  const embed = buildShopEmbed(items, getMerchantStock, economyState.merchantExpiry, true);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("merchant_buy_potion_fearless")
      .setLabel("🕷️ Potion of Fearless")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("merchant_buy_potion_ruthless")
      .setLabel("🔪 Potion of Ruthless")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("merchant_buy_bloodtrace_device")
      .setLabel("🩸 Bloodtrace Device")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("merchant_buy_hemovision_core")
      .setLabel("🫀 Hemovision Core")
      .setStyle(ButtonStyle.Danger),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("merchant_convert_gorelith")
      .setLabel("🔄 Convert 9k Bloodern -> 1 Gorelith")
      .setStyle(ButtonStyle.Primary),
  );

  const msg = await channel.send({
    embeds: [embed],
    components: [row, row2],
  });

  setTimeout(() => {
    msg.delete().catch(() => null);
    economyState.merchantActive = false;
    economyState.merchantExpiry = null;
  }, duration * 1000);
}

export async function handleMerchantInteraction(interaction: ButtonInteraction) {
  const { customId, user } = interaction;
  const userId = user.id;

  if (!economyState.merchantActive) {
    return await interaction.reply({ content: "❌ The merchant has already left.", flags: MessageFlags.Ephemeral });
  }

  if (customId === "merchant_convert_gorelith") {
    if (subBloodern(userId, 9000)) {
        const res = getBalanceStmt.get(userId) as { bloodern: number, gorelith: number } | undefined;
        updateBalanceStmt.run(userId, res!.bloodern, res!.gorelith + 1);
        return await interaction.reply({ content: `✅ Converted 9000 Bloodern to 1 Gorelith!`, flags: MessageFlags.Ephemeral });
    } else {
        return await interaction.reply({ content: "❌ Need 9000 Bloodern!", flags: MessageFlags.Ephemeral });
    }
  }

  if (customId.startsWith("merchant_buy_")) {
    const itemKey = customId.replace("merchant_buy_", "");
    const item = (CONFIG.LOGIC.ECONOMY.MERCHANT_ITEMS as any)[itemKey];
    if (!item) return await interaction.reply({ content: "❌ Item not found.", flags: MessageFlags.Ephemeral });

    if (item.minStock && item.maxStock) {
      const stock = getMerchantStock(itemKey);
      if (stock <= 0) return await interaction.reply({ content: `❌ **${item.name}** is out of stock!`, flags: MessageFlags.Ephemeral });
      economyState.merchantStock.set(itemKey, stock - 1);
    } else {
      const inventory = getInventory(userId);
      const currentCount = inventory.find(i => i.itemKey === itemKey)?.count || 0;
      if (currentCount >= item.limit) {
          return await interaction.reply({ content: `❌ You reached the limit for **${item.name}**!`, flags: MessageFlags.Ephemeral });
      }
    }

    const price = item.price;
    const success = item.isGorelith ? subGorelith(userId, price) : subBloodern(userId, price);
    
    if (!success) {
      const currencyName = item.isGorelith ? "gorelith" : "bloodern";
      return await interaction.reply({ content: `❌ You need **${price}** ${currencyName}!`, flags: MessageFlags.Ephemeral });
    }

    const inventory = getInventory(userId);
    const count = inventory.find(i => i.itemKey === itemKey)?.count || 0;
    updateInventoryStmt.run(userId, itemKey, 1);

    if (item.minStock && item.maxStock) {
      const newEmbed = buildShopEmbed(CONFIG.LOGIC.ECONOMY.MERCHANT_ITEMS, getMerchantStock, economyState.merchantExpiry!, true);
      await interaction.message.edit({ embeds: [newEmbed] }).catch(() => null);
    }

    return await interaction.reply({ content: `✅ Bought **${item.name}**! New balance: ${getBloodern(userId)} bloodern / ${getGorelith(userId)} gorelith.`, flags: MessageFlags.Ephemeral });
  }
}

export function startMerchantLoop(client: Client) {
  const schedule = () => {
    const nextSpawn = getRandomInt(1.5 * 3600, 3.5 * 3600);
    setTimeout(async () => {
      await spawnMerchant(client);
      schedule();
    }, nextSpawn * 1000);
  };
  schedule();
}
