import { EmbedBuilder, Guild, ChatInputCommandInteraction, Message, ChannelType, AuditLogEvent, GuildMember, Role, GuildBan, TimestampStyles, time } from "discord.js";
import { CONFIG } from "@core/config";
import { createLogEmbed } from "./logger";

export function buildSystemErrorEmbed(error: Error, context: string) {
  return new EmbedBuilder()
    .setTitle("❌ System Error")
    .setColor(CONFIG.COLORS.ERROR)
    .addFields(
      { name: "📁 Context", value: context, inline: true },
      { name: "💬 Message", value: `\`\`\`${error.message}\`\`\`` },
    )
    .setTimestamp();
}

export function buildCommandLogEmbed(user: { id: string } | null, type: string, commandName: string, channelId: string | null, args: string[] | undefined) {
  const embed = new EmbedBuilder()
    .setTitle("💻 Command Used")
    .setColor(CONFIG.COLORS.DEFAULT)
    .setTimestamp()
    .addFields(
      { name: "👤 User", value: user ? `<@${user.id}>` : "Unknown", inline: true },
      { name: "⚙️ Type", value: type, inline: true },
      { name: "⌨️ Command", value: commandName, inline: true },
      { name: "💬 Channel", value: channelId ? `<#${channelId}>` : "Unknown", inline: true },
    );

  if (args && args.length > 0) {
    embed.addFields({ name: "📄 Args", value: `\`${args.join(" ")}\``, inline: false });
  }

  return embed;
}

export function buildMemberUpdateEmbed(member: GuildMember, executorText: string, fields: any[], color: any) {
  return new EmbedBuilder()
    .setTitle("👤 Member Updated")
    .setAuthor({
      name: member.user.tag,
      iconURL: member.displayAvatarURL(),
    })
    .setColor(color || CONFIG.COLORS.DEFAULT)
    .setTimestamp()
    .addFields({ name: "👮 Executed by", value: executorText }, ...fields);
}

export function buildChannelCreateEmbed(name: string, type: number, executorId: string | undefined) {
  return new EmbedBuilder()
    .setTitle("📂 Channel Created")
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTimestamp()
    .addFields(
      { name: "📛 Name", value: name, inline: true },
      { name: "⚙️ Type", value: ChannelType[type] || "Unknown", inline: true },
      {
        name: "👮 Executed By",
        value: executorId ? `<@${executorId}>` : "Unknown",
      },
    );
}

export function buildChannelDeleteEmbed(name: string, executorId: string | undefined) {
  return new EmbedBuilder()
    .setTitle("🗑️ Channel Deleted")
    .setColor(CONFIG.COLORS.ERROR)
    .setTimestamp()
    .addFields(
      { name: "📛 Name", value: name, inline: true },
      {
        name: "👮 Executed By",
        value: executorId ? `<@${executorId}>` : "Unknown",
      },
    );
}

export function buildRoleCreateEmbed(name: string, id: string, executorId: string | undefined) {
  return new EmbedBuilder()
    .setTitle("🆕 Role Created")
    .setColor(CONFIG.COLORS.SUCCESS)
    .setTimestamp()
    .addFields(
      { name: "🛡️ Role", value: `${name} (${id})` },
      {
        name: "👮 Executed By",
        value: executorId ? `<@${executorId}>` : "Unknown",
      },
    );
}

export function buildRoleDeleteEmbed(name: string, executorId: string | undefined) {
  return new EmbedBuilder()
    .setTitle("🔥 Role Deleted")
    .setColor(CONFIG.COLORS.ERROR)
    .setTimestamp()
    .addFields(
      { name: "📛 Role Name", value: name },
      {
        name: "👮 Executed By",
        value: executorId ? `<@${executorId}>` : "Unknown",
      },
    );
}

export function buildServerUpdateEmbed(executorId: string | undefined, fields: any[]) {
  return new EmbedBuilder()
    .setTitle("🌐 Server Updated")
    .setColor(CONFIG.COLORS.DEFAULT)
    .setTimestamp()
    .addFields(
      {
        name: "👮 Executed By",
        value: executorId ? `<@${executorId}>` : "Unknown",
      },
      ...fields
    );
}

export function buildBanLogEmbed(tag: string, id: string, executorId: string | undefined, reason: string | null) {
  return new EmbedBuilder()
    .setTitle("🔨 Member Banned")
    .setColor(CONFIG.COLORS.ERROR)
    .setTimestamp()
    .addFields(
      { name: "👤 User", value: `${tag} (${id})` },
      {
        name: "👮 Executed By",
        value: executorId ? `<@${executorId}>` : "Unknown",
      },
      { name: "📄 Reason", value: reason || "No reason provided" },
    );
}

export function buildUnbanLogEmbed(tag: string, id: string, executorId: string | undefined, reason: string | null) {
  return new EmbedBuilder()
    .setTitle("🔨 Member Unbanned")
    .setColor(CONFIG.COLORS.DEFAULT)
    .setTimestamp()
    .addFields(
      { name: "👤 User", value: `${tag} (${id})` },
      {
        name: "👮 Executed By",
        value: executorId ? `<@${executorId}>` : "Unknown",
      },
      { name: "📄 Reason", value: reason || "No reason provided" },
    );
}

export function buildKickLogEmbed(tag: string, id: string, executorId: string | undefined, reason: string | null) {
  return new EmbedBuilder()
    .setTitle("🔨 Member Kicked")
    .setColor(CONFIG.COLORS.ERROR)
    .setTimestamp()
    .addFields(
      { name: "👤 User", value: `${tag} (${id})` },
      {
        name: "👮 Executed By",
        value: executorId ? `<@${executorId}>` : "Unknown",
      },
      { name: "📄 Reason", value: reason || "No reason provided" },
    );
}

export function buildMessageDeleteEmbed(authorId: string, channelId: string, content: string | null, longContent: boolean, embedUrls: string[]) {
  const embed = new EmbedBuilder()
    .setTitle("🗑️ Message Deleted")
    .setColor(CONFIG.COLORS.ERROR)
    .setTimestamp()
    .addFields(
      { name: "👤 Author", value: `<@${authorId}>`, inline: true },
      { name: "💬 Channel", value: `<#${channelId}>`, inline: true },
    );

  if (content) {
    embed.addFields({ name: "📄 Content", value: longContent ? "*[Content too long, attached as deleted-content.md]*" : content });
  }

  if (embedUrls.length > 0) {
    embed.addFields({ name: "🔗 Embed URLs", value: embedUrls.join("\n") });
  }

  return embed;
}

export function buildMessageEditEmbed(authorId: string, channelId: string, before: string, after: string, longContent: boolean) {
  const embed = new EmbedBuilder()
    .setTitle("📝 Message Edited")
    .setColor(CONFIG.COLORS.DEFAULT)
    .setTimestamp()
    .addFields(
      { name: "👤 Author", value: `<@${authorId}>`, inline: true },
      { name: "💬 Channel", value: `<#${channelId}>`, inline: true },
    );

  if (longContent) {
    embed.addFields(
      { name: "⏮️ Before", value: "*[Attached as before.md]*" },
      { name: "⏭️ After", value: "*[Attached as after.md]*" },
    );
  } else {
    embed.addFields(
      { name: "⏮️ Before", value: before || "None" },
      { name: "⏭️ After", value: after || "None" },
    );
  }

  return embed;
}

export function buildBulkDeleteEmbed(channelId: string, count: number, executorId: string | undefined) {
  return new EmbedBuilder()
    .setTitle("🧹 Bulk Messages Deleted")
    .setColor(CONFIG.COLORS.DEFAULT)
    .setTimestamp()
    .addFields(
      { name: "💬 Channel", value: `<#${channelId}>`, inline: true },
      { name: "🔢 Count", value: `${count}`, inline: true },
      {
        name: "👮 Executed By",
        value: executorId ? `<@${executorId}>` : "Unknown",
        inline: true,
      },
    );
}

