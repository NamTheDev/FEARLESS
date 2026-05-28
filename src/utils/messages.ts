import { Collection, Snowflake, Message, TextBasedChannel, MessageCreateOptions, MessagePayload, EmbedBuilder, Role, time, TimestampStyles, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { CONFIG } from "@core/config";
import { UserData } from "@typings/UserData";
import { SnipedMessage } from "@typings/Snipe";

export const sendTempMessage = async (
  channel: TextBasedChannel,
  payload: string | MessagePayload | MessageCreateOptions,
  duration = 5000,
) => {
  if (!channel.isSendable()) return;
  const msg = await channel.send(payload);
  setTimeout(() => msg.delete().catch(() => null), duration);
  return msg;
};

export const generateTranscript = (messages: Collection<Snowflake, Message>): string => {
  return messages
    .reverse()
    .map((m) => {
      const timeStr = m.createdTimestamp
        ? new Date(m.createdTimestamp).toISOString()
        : "Unknown Time";
      const author = m.author?.tag || "Unknown";
      const content = m.content || "[No Content]";
      const attachments = m.attachments?.size
        ? `[Attachments: ${m.attachments.map((a) => a.name).join(", ")}]`
        : "";
      return `[${timeStr}] ${author}: ${content}${attachments}`;
    })
    .join("\n");
};

export function formatRolesList(roles: Collection<Snowflake, Role>): string {
  return roles
    .filter((role) => role.name !== "@everyone")
    .sort((a, b) => b.position - a.position)
    .map((role) => `- **${role.name}**: \`${role.id}\``)
    .join("\n");
}

export function formatEcoLeaderboard(topUsers: [string, number][]): string {
  if (topUsers.length === 0) return "No data yet.";

  return topUsers
    .map(([userId, balance], index) => {
      let medal = "";
      if (index === 0) medal = "🥇";
      else if (index === 1) medal = "🥈";
      else if (index === 2) medal = "🥉";
      else medal = `**${index + 1}.**`;

      return `${medal} <@${userId}> — **${balance}** bloodern`;
    })
    .join("\n");
}

export function formatInventory(items: { itemKey: string; count: number }[]): string {
  const shopItems = CONFIG.LOGIC.ECONOMY.SHOP_ITEMS as any;

  const formatted = items
    .map(
      (i) =>
        `**${shopItems[i.itemKey]?.name || i.itemKey}**: ${i.count} time(s)`,
    )
    .join("\n");
    
  return formatted || "Your inventory is empty.";
}

export function formatRewards(loots: any[]): string {
  return loots
    .map((l: any) => {
      const minSpawnM = Math.floor(l.minSpawn / 60);
      const maxSpawnM = Math.floor(l.maxSpawn / 60);
      const durationM =
        l.duration >= 60 ? `${l.duration / 60}m` : `${l.duration}s`;
      return (
        `✨ **${l.name}**\n` +
        `• 💰 **Value**: \`${l.minVal} - ${l.maxVal}\` bloodern\n` +
        `• ⏳ **Spawns**: Every ${minSpawnM}~${maxSpawnM}m\n` +
        `• 🎯 **Max Claims**: \`${l.maxClaims}\`\n` +
        `• ⏱️ **Duration**: \`${durationM}\``
      );
    })
    .join("\n\n");
}

export function formatLevelingLeaderboard(topUsers: [string, { level: number; xp: number }][]): string {
  if (topUsers.length === 0) return "No data yet.";

  return topUsers
    .map(([userId, data], index) => {
      let medal = "";
      if (index === 0) medal = "🥇";
      else if (index === 1) medal = "🥈";
      else if (index === 2) medal = "🥉";
      else medal = `**${index + 1}.**`;

      return `${medal} <@${userId}> — **Lvl ${data.level}** (${data.xp} XP)`;
    })
    .join("\n");
}

export function buildPurgeLogEmbed(moderatorId: string, channelId: string, deletedSize: number, targetId: string | undefined) {
  return new EmbedBuilder()
    .setTitle("🗑️ Purge Executed")
    .setColor(CONFIG.COLORS.DEFAULT)
    .addFields(
      {
        name: "👮 Moderator",
        value: `<@${moderatorId}>`,
        inline: true,
      },
      {
        name: "💬 Channel",
        value: `<#${channelId}>`,
        inline: true,
      },
      {
        name: "🔢 Deleted Count",
        value: `${deletedSize}`,
        inline: true,
      },
      {
        name: "🎯 Target Filter",
        value: targetId ? `<@${targetId}>` : "None",
      },
    )
    .setTimestamp();
}

export function buildViolationsEmbed(target: any, spamRow: any) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: target.username,
      iconURL: target.displayAvatarURL(),
    })
    .setTitle("📜 User Violations Profile")
    .setColor(CONFIG.COLORS.DEFAULT)
    .setTimestamp();

  if (!spamRow || spamRow.offenseCount === 0) {
    embed.setDescription("✅ This user has a clean record.");
  } else {
    embed.addFields({
      name: "🚨 Spamming",
      value: `**${spamRow.offenseCount}** Active Offense(s)\n🕒 Last Incident: ${time(Math.floor(spamRow.lastOffenseTime / 1000), TimestampStyles.RelativeTime)}`,
      inline: false,
    });
  }

  return embed;
}

export function buildGiveawayEmbed(prize: string, winnerCount: number, requiredRole: Role | null, end: number) {
  return new EmbedBuilder()
    .setTitle("🎉 GIVEAWAY STARTED 🎉")
    .setDescription(
      `🎁 Prize: **${prize}**\n🏆 Winners: **${winnerCount}**\n${requiredRole ? `🛡️ Requirement: ${requiredRole} or higher\n` : ""}Click the button below to enter!\n\n*💡 Odds: Early group (first 3) gets 80% shared chance!*`,
    )
    .setColor(CONFIG.COLORS.GIVEAWAY)
    .setTimestamp(end);
}

export function buildSnipeEmbed(data: SnipedMessage, currentIndex: number, totalSnipes: number) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: data.author.tag,
      iconURL: data.author.displayAvatarURL(),
    })
    .setDescription(data.content || "*[No text content]*")
    .setColor(CONFIG.COLORS.DEFAULT)
    .setTimestamp(data.timestamp)
    .setFooter({
      text: `📄 Page ${currentIndex + 1}/${totalSnipes} | Present <— —> Past`,
    });

  if (data.imageBuffer) embed.setImage("attachment://sniped.png");
  return embed;
}

export function getSnipeFiles(data: SnipedMessage) {
  return data.imageBuffer ? [new AttachmentBuilder(data.imageBuffer, { name: "sniped.png" })] : [];
}

export function buildSnipeButtons(currentIndex: number, totalSnipes: number) {
  return buildPaginationRow(
    "snipe",
    currentIndex,
    totalSnipes,
    { prev: "", next: "" },
    false,
  );
}

export function buildGiveawayButtons() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("giveaway_enter")
      .setLabel("Enter Giveaway")
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Success),
  );
}

export function buildBalanceEmbed(user: { username: string; displayAvatarURL: () => string }, bloodern: number, gorelith: number) {
  let description = `💰 Current balance: **${bloodern}** bloodern`;
  if (gorelith > 0) {
    description += ` and **${gorelith}** gorelith`;
  }
  description += ".";

  return new EmbedBuilder()
    .setColor(CONFIG.COLORS.DEFAULT)
    .setAuthor({
      name: user.username,
      iconURL: user.displayAvatarURL(),
    })
    .setDescription(description);
}

export function buildPurchaseApprovalEmbed(buyerId: string, itemName: string) {
  return new EmbedBuilder()
    .setTitle("🛒 Purchase Pending")
    .setColor(CONFIG.COLORS.DEFAULT)
    .setFields(
      { name: "Buyer", value: `<@${buyerId}>`, inline: true },
      { name: "Item", value: itemName, inline: true }
    )
    .setTimestamp();
}

export function buildRankEmbed(user: { username: string; displayAvatarURL: () => string }, data: UserData, rank: number) {
  const nextLevel = data.level + 1;
  const nextLevelReq = nextLevel * CONFIG.LOGIC.LEVELING.LEVEL_XP_RATIO;
  const xpNeeded = nextLevelReq - data.xp;

  return new EmbedBuilder()
    .setColor(CONFIG.COLORS.DEFAULT)
    .setAuthor({
      name: user.username,
      iconURL: user.displayAvatarURL(),
    })
    .addFields(
      { name: "🏅 Rank", value: `#${rank}`, inline: true },
      { name: "⭐ Level", value: `${data.level}`, inline: true },
      { name: "⚡ XP", value: `${data.xp} / ${nextLevelReq}`, inline: true },
      {
        name: "🚀 To Next Level",
        value: `${xpNeeded} XP needed`,
        inline: false,
      },
    );
}

export function buildSpamWarningEmbed(userId: string, count: number, punishmentXp: number, muted: boolean, xpBlockedUntil: number) {
  return new EmbedBuilder()
    .setTitle("⚠️ Anti-Spam Warning")
    .setDescription(
      `<@${userId}>, stop spamming! You have triggered the anti-spam filter.`,
    )
    .setColor(CONFIG.COLORS.ERROR)
    .addFields(
      { name: "🚫 Violation #", value: `${count}`, inline: true },
      { name: "📉 XP Deducted", value: `-${punishmentXp} XP`, inline: true },
      {
        name: "⚖️ Punishment",
        value: muted
          ? "1 Hour Mute Applied"
          : xpBlockedUntil > Date.now()
            ? "XP Gain Blocked (10m)"
            : "Warning Only",
        inline: false,
      },
    );
}

export function buildSpamLogEmbed(userId: string, count: number, punishmentXp: number, status: string) {
  return new EmbedBuilder()
    .setTitle("🚨 Spam Detected")
    .setColor(CONFIG.COLORS.ERROR)
    .addFields(
      { name: "👤 User", value: `<@${userId}>`, inline: true },
      { name: "🚫 Violation #", value: `${count}`, inline: true },
      { name: "📉 XP Deducted", value: `-${punishmentXp} XP`, inline: true },
      { name: "⚖️ Status", value: status, inline: false },
    )
    .setTimestamp();
}

export function buildReceiptEmbed(username: string, itemsList: string, totalSpentBloodern: number, totalSpentGorelith: number, balanceBloodern: number, balanceGorelith: number, totalXp: number) {
  const embed = new EmbedBuilder()
    .setTitle(`🧾 Final Receipt for ${username}`)
    .setColor(CONFIG.COLORS.DEFAULT)
    .addFields(
      { name: "🛍️ Purchased Items", value: itemsList || "None" },
      {
        name: "🧮 Calculation",
        value: `\`Bloodern: ${balanceBloodern + totalSpentBloodern} - ${totalSpentBloodern} = ${balanceBloodern}\`\n\`Gorelith: ${balanceGorelith + totalSpentGorelith} - ${totalSpentGorelith} = ${balanceGorelith}\``,
      },
      {
        name: "💰 Balance after deduction",
        value: `**${balanceBloodern}** bloodern\n**${balanceGorelith}** gorelith`,
      },
    );

  if (totalXp > 0) {
    embed.addFields({ name: "⭐ Total XP to Add", value: `\`${totalXp}\` XP`, inline: false });
  }

  return embed;
}

export function buildLootSpawnEmbed(lootName: string, value: number, claimsLeft: number, expiryTimestamp: number, image: string | null) {
  const embed = new EmbedBuilder()
    .setTitle(`🩸 ${lootName} Appeared!`)
    .setDescription(
      `💎 Value: **${value}** | 🫳 Claims available: **${claimsLeft}**\n` +
        `⏳ Disappears: <t:${expiryTimestamp}:R>`,
    )
    .setColor(CONFIG.COLORS.DEFAULT);

  if (image) embed.setThumbnail(`attachment://${image}`);
  return embed;
}

export function buildShopEmbed(shopItems: any, stockGetter: (key: string) => number, expiryTimestamp: number, isRedEyed = false) {
  const title = isRedEyed ? "🩸 Some Say It Sees Blood Only...\nA Red-eyed Merchant Has Appeared!!" : "🏪 A Hollow Merchant Has Arrived...";

  return new EmbedBuilder()
    .setTitle(isRedEyed ? "Red-eyed Merchant" : "Mysterious Shop")
    .setDescription(
      title + "\n\n" +
        Object.entries(shopItems)
          .map(([key, i]: [string, any]) => {
            const stockDisplay = i.minStock ? `📦 Stock: ${stockGetter(key)}` : `🛑 Limit: ${i.limit} purchase(s)`;
            const emoji = i.emoji || "🛒";
            const currency = i.isGorelith ? "gorelith" : "bloodern";
            return `${emoji} **${i.name}** - ${i.price} ${currency} (${stockDisplay})`;
          })
          .join("\n") +
        "\n\n# 🚪 Closes: <t:" + expiryTimestamp + ":R>"
    )
    .setColor(CONFIG.COLORS.DEFAULT);
}

export function buildAfkEmbed(reason: string) {
  return new EmbedBuilder()
    .setDescription(`✅ You are now AFK: **${reason}**`)
    .setColor(CONFIG.COLORS.SUCCESS);
}

export function buildAfkNotifyEmbed(userId: string, reason: string) {
  return {
    content: `💤 <@${userId}> is currently AFK: **${reason}**`,
    allowedMentions: { parse: [] },
  };
}

export function buildAvatarEmbed(user: { username: string; displayAvatarURL: (options?: any) => string }, size: number) {
  return new EmbedBuilder()
    .setTitle(`🖼️ ${user.username}'s Avatar`)
    .setColor(CONFIG.COLORS.DEFAULT)
    .setImage(user.displayAvatarURL({ size }))
    .setTimestamp();
}

export function buildPingMessage(latency: number, apiPing: number) {
  return {
    content: `🏓 **Pong!**\n📡 Latency: \`${latency}ms\`\n💓 API Heartbeat: \`${apiPing}ms\``,
  };
}

export function buildFlexEmbed(client: any, loc: string, bio: string, bannerUrl: string | null) {
  const uptime = Math.floor(client.uptime / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  const user = client.user!;
  
  const embed = new EmbedBuilder()
    .setTitle(`🦾 ${user.username} Statistics`)
    .setThumbnail(user.displayAvatarURL())
    .setColor(CONFIG.COLORS.DEFAULT)
    .addFields(
      {
        name: "📊 Code Base",
        value: `\`${loc}\` lines of TypeScript`,
        inline: true,
      },
      {
        name: "🕒 Uptime",
        value: `\`${hours}h ${minutes}m ${seconds}s\``,
        inline: true,
      },
      {
        name: "🤖 Status",
        value: user.presence?.status || "Online",
        inline: true,
      },
      {
        name: "📜 Bio",
        value: bio || "No bio set.",
      },
    )
    .setTimestamp();

  if (bannerUrl) {
    embed.setImage(bannerUrl);
  }

  return embed;
}

export function buildPaginationRow(
  prefix: string,
  current: number,
  total: number,
  labels: { prev: string; next: string },
  startAtOne = false,
) {
  const { PRIMARY_STYLE, PREVIOUS_EMOJI, NEXT_EMOJI } = CONFIG.UI.PAGINATION;
  const style =
    PRIMARY_STYLE === "Danger" ? ButtonStyle.Danger : ButtonStyle.Primary;

  const min = startAtOne ? 1 : 0;
  const max = startAtOne ? total : total - 1;

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${prefix}:${current - 1}`)
      .setLabel(`${PREVIOUS_EMOJI} ${labels.prev}`)
      .setStyle(style)
      .setDisabled(current <= min),
    new ButtonBuilder()
      .setCustomId(`${prefix}:${current + 1}`)
      .setLabel(`${labels.next} ${NEXT_EMOJI}`)
      .setStyle(style)
      .setDisabled(current >= max),
  );
}

export function buildChangelogButtons(currentIndex: number, totalLogs: number) {
  return buildPaginationRow(
    "changelog",
    currentIndex,
    totalLogs,
    { prev: "Newer", next: "Older" },
    false,
  );
}

export function buildChangelogEmbed(date: string, content: string, currentIndex: number, totalLogs: number) {
  const maxLen = 4000;
  const safeContent = content.length > maxLen ? content.slice(0, maxLen) + "...\n*[Truncated]*" : content;

  return new EmbedBuilder()
    .setTitle(`📜 FEARLESS Changelog`)
    .setDescription(safeContent)
    .setColor(CONFIG.COLORS.DEFAULT)
    .setFooter({ text: `Page ${currentIndex + 1}/${totalLogs} • ${date}` });
}

export function buildHelpButtons(currentPage: number) {
  return buildPaginationRow(
    "help",
    currentPage,
    5,
    { prev: "Previous", next: "Next" },
    true,
  );
}

export function buildHelpEmbed(commands: Map<string, SlashCommand>, page = 1) {
  const categories: Record<string, SlashCommand[]> = {};

  for (const cmd of commands.values()) {
    if (!cmd.visible) continue;
    const cat = cmd.category || "Uncategorized";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cmd);
  }

  // Define 5 logical pages
  const pageMap: Record<number, { title: string; cmds: SlashCommand[] }> = {
    1: { title: "💰 Economy", cmds: categories["economy"] || [] },
    2: { title: "⭐ Leveling", cmds: categories["leveling"] || [] },
    3: { title: "🛡️ Moderation", cmds: categories["moderation"] || [] },
    4: { title: "⚙️ Utility (Tools)", cmds: (categories["utility"] || []).filter(c => ["afk", "autoresponse", "giveaway", "roles", "snipe"].includes(c.data.name)) },
    5: { title: "🔧 Utility (General)", cmds: (categories["utility"] || []).filter(c => !["afk", "autoresponse", "giveaway", "roles", "snipe"].includes(c.data.name)) },
  };

  const currentPage = pageMap[page] || pageMap[1]!;
  
  const embed = new EmbedBuilder()
    .setTitle(`📚 Help: ${currentPage.title}`)
    .setColor(CONFIG.COLORS.DEFAULT)
    .setFooter({ text: `Page ${page}/5` });

  let description = "";
  for (const cmd of currentPage.cmds) {
    const slash = !cmd.messageOnly ? "[/]" : "";
    description += `${slash} **${cmd.data.name}** - ${cmd.data.description}\n`;
  }

  if (!description) description = "No commands in this category.";

  description += "\n-# [/] = support slash command";
  embed.setDescription(description);

  return embed;
}

