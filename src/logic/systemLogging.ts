import { GuildChannel, AuditLogEvent, Role, Guild, GuildBan, GuildMember } from "discord.js";
import { findAuditExecutor, findAuditLogEntry } from "@logic/audit";
import { getMember } from "@utils/fetchers";
import { sendLog } from "@utils/logger";
import { buildChannelCreateEmbed, buildChannelDeleteEmbed, buildRoleCreateEmbed, buildRoleDeleteEmbed, buildServerUpdateEmbed, buildBanLogEmbed, buildUnbanLogEmbed, buildKickLogEmbed } from "@utils/logs";
import { CONFIG } from "@core/config";

export async function handleChannelCreateLog(channel: GuildChannel) {
  const executor = await findAuditExecutor(
    channel.guild,
    AuditLogEvent.ChannelCreate,
  );
  const embed = buildChannelCreateEmbed(channel.name, channel.type, executor?.id);
  await sendLog(channel.guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleChannelDeleteLog(channel: GuildChannel) {
  const executor = await findAuditExecutor(
    channel.guild,
    AuditLogEvent.ChannelDelete,
  );
  const embed = buildChannelDeleteEmbed(channel.name, executor?.id);
  await sendLog(channel.guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleRoleCreateLog(role: Role) {
  const executor = await findAuditExecutor(
    role.guild,
    AuditLogEvent.RoleCreate,
  );
  const embed = buildRoleCreateEmbed(role.name, role.id, executor?.id);
  await sendLog(role.guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleRoleDeleteLog(role: Role) {
  const executor = await findAuditExecutor(
    role.guild,
    AuditLogEvent.RoleDelete,
  );
  const embed = buildRoleDeleteEmbed(role.name, executor?.id);
  await sendLog(role.guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleServerUpdateLog(oldGuild: Guild, newGuild: Guild) {
  const fields: { name: string; value: string; inline?: boolean }[] = [];

  if (oldGuild.name !== newGuild.name) {
    fields.push({
      name: "Name Change",
      value: `**Old:** ${oldGuild.name}\n**New:** ${newGuild.name}`,
    });
  }

  if (oldGuild.icon !== newGuild.icon) {
    fields.push({
      name: "Icon Change",
      value: "Server icon was updated.",
    });
  }

  if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
    fields.push({
      name: "Vanity URL",
      value: `**Old:** ${oldGuild.vanityURLCode || "None"}\n**New:** ${newGuild.vanityURLCode || "None"}`,
    });
  }

  if (fields.length > 0) {
    const executor = await findAuditExecutor(
      newGuild,
      AuditLogEvent.GuildUpdate,
    );
    const embed = buildServerUpdateEmbed(executor?.id, fields);
    await sendLog(newGuild, CONFIG.LOG_CHANNEL_ID, embed);
  }
}

export async function handleBanLog(ban: GuildBan) {
  const fetchedLogs = ban.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberBanAdd,
  });

  const banLog = (await fetchedLogs).entries.first();
  if (!banLog) return;

  const { executor, target } = banLog;

  if (!target) return;

  const embed = buildBanLogEmbed(target.tag || target.username || "Unknown", target.id, executor?.id, banLog.reason);
  await sendLog(ban.guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleUnbanLog(ban: GuildBan) {
  const member = await getMember(ban.guild, ban.user.id);
  if (!member) return;

  const unbanLog = await findAuditLogEntry(member, AuditLogEvent.MemberBanRemove);

  if (!unbanLog) return;

  const { executor, target } = unbanLog;

  if (!target) return;

  const embed = buildUnbanLogEmbed(target.user.tag, target.id, executor?.id, unbanLog.reason);
  await sendLog(ban.guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleKickLog(member: GuildMember) {
  const kickLog = await findAuditLogEntry(member, AuditLogEvent.MemberKick);
  const banLog = await findAuditLogEntry(member, AuditLogEvent.MemberBanAdd);

  if (!kickLog) return;
  if (banLog && banLog.createdTimestamp > kickLog.createdTimestamp) return;

  const { executor, target } = kickLog;
  if (!target) return;

  const embed = buildKickLogEmbed(target.user.tag, target.id, executor?.id, kickLog.reason);
  await sendLog(member.guild, CONFIG.LOG_CHANNEL_ID, embed);
}
