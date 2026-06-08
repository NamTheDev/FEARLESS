import {
  Guild,
  ChatInputCommandInteraction,
  Message,
  AuditLogEvent,
  GuildMember,
  AttachmentBuilder,
  Collection,
  Snowflake,
  GuildTextBasedChannel,
  GuildChannel,
  Role,
  GuildBan,
} from "discord.js";
import { sendLog } from "@utils/logging";
import {
  buildSystemErrorEmbed,
  buildCommandLogEmbed,
  buildMemberUpdateEmbed,
  buildMessageDeleteEmbed,
  buildMessageEditEmbed,
  buildBulkDeleteEmbed,
  buildChannelCreateEmbed,
  buildChannelDeleteEmbed,
  buildRoleCreateEmbed,
  buildRoleDeleteEmbed,
  buildServerUpdateEmbed,
  buildBanLogEmbed,
  buildUnbanLogEmbed,
  buildKickLogEmbed,
} from "@utils/logging";
import { CONFIG } from "@core/config";
import { generateTranscript } from "@utils/messages";
import { addSnipe } from "@logic/snipe";
import { getMember } from "@utils/fetchers";

export async function handleSystemErrorLog(guild: Guild, error: Error, context: string) {
  const embed = buildSystemErrorEmbed(error, context);
  await sendLog(guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleCommandLog(
  interactionOrMessage: ChatInputCommandInteraction | Message,
  commandName?: string,
  args?: string[],
) {
  const guild = interactionOrMessage.guild;
  if (!guild) return;

  const isInteraction = "commandName" in interactionOrMessage;
  const user =
    interactionOrMessage.member?.user ||
    (isInteraction
      ? (interactionOrMessage as ChatInputCommandInteraction).user
      : (interactionOrMessage as Message).author);

  const type = isInteraction ? "Slash" : "Message";
  const name = isInteraction
    ? `/${(interactionOrMessage as ChatInputCommandInteraction).commandName}`
    : `rf ${commandName}`;
  const channelId = interactionOrMessage.channelId;

  const embed = buildCommandLogEmbed(user, type, name, channelId, args);

  await sendLog(guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleMemberUpdateLog(oldMember: GuildMember, newMember: GuildMember) {
  const fields: { name: string; value: string; inline?: boolean }[] = [];

  if (oldMember.nickname !== newMember.nickname) {
    fields.push({
      name: "Nickname Change",
      value: `**Old:** ${oldMember.nickname || "None"}\n**New:** ${newMember.nickname || "None"}`,
    });
  }

  const oldRoles = oldMember.roles.cache.map((r) => r.id);
  const newRoles = newMember.roles.cache.map((r) => r.id);
  const added = newRoles.filter((r) => !oldRoles.includes(r));
  const removed = oldRoles.filter((r) => !newRoles.includes(r));

  if (added.length > 0 || removed.length > 0) {
    if (added.length)
      fields.push({
        name: "Role Added",
        value: added.map((r) => `<@&${r}>`).join(", "),
      });
    if (removed.length)
      fields.push({
        name: "Role Removed",
        value: removed.map((r) => `<@&${r}>`).join(", "),
      });
  }

  const oldTimeout = oldMember.communicationDisabledUntilTimestamp || 0;
  const newTimeout = newMember.communicationDisabledUntilTimestamp || 0;

  if (oldTimeout !== newTimeout) {
    const timeout = newMember.communicationDisabledUntil;
    fields.push({
      name: "Timeout Status",
      value: timeout
        ? `Timed out until <t:${Math.floor(timeout.getTime() / 1000)}:F>`
        : "Timeout Removed",
    });
  }

  if (fields.length === 0) return;

  const isRoleChange = added.length > 0 || removed.length > 0;
  const logType = isRoleChange ? AuditLogEvent.MemberRoleUpdate : AuditLogEvent.MemberUpdate;

  const updateLog = await findAuditLogEntry(newMember, logType);
  const executor = updateLog?.executor;

  let executorText = "Unknown (Self-updated)";
  if (executor) {
    executorText =
      executor.id === newMember.client.user?.id ? "System (Bot Sync)" : `<@${executor.id}>`;
  } else if (newMember.id === newMember.client.user?.id) {
    executorText = "System (Self-updated)";
  }

  let color: any = CONFIG.COLORS.DEFAULT;
  if (oldTimeout !== newTimeout) {
    color = newMember.communicationDisabledUntil ? CONFIG.COLORS.ERROR : CONFIG.COLORS.DEFAULT;
    if (updateLog?.reason) {
      fields.push({ name: "Reason", value: updateLog.reason });
    }
  }

  const embed = buildMemberUpdateEmbed(newMember, executorText, fields, color);
  await sendLog(newMember.guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleMessageDeleteLog(message: Message) {
  if (!message.guild || !message.author || message.author.bot) return;

  addSnipe(message);

  const files: AttachmentBuilder[] = [];

  if (message.attachments?.size > 0) {
    const attachments = Array.from(message.attachments.values());
    await Promise.all(
      attachments.map(async (a) => {
        try {
          const res = await fetch(a.url);
          if (!res.ok) return;
          const arrayBuffer = await res.arrayBuffer();
          files.push(new AttachmentBuilder(Buffer.from(arrayBuffer), { name: a.name }));
        } catch {}
      }),
    );
  }

  const embedUrls = message.embeds
    .map((e) => e.url || e.image?.url || e.thumbnail?.url)
    .filter((url): url is string => !!url);

  const isLong = (message.content?.length || 0) > 1024;
  if (isLong && message.content) {
    files.push(new AttachmentBuilder(Buffer.from(message.content), { name: "deleted-content.md" }));
  }

  const embed = buildMessageDeleteEmbed(
    message.author.id,
    message.channelId,
    message.content,
    isLong,
    embedUrls,
  );

  if (files.length > 10) files.length = 10;
  await sendLog(message.guild, CONFIG.LOG_CHANNEL_ID, embed, files);
}

export async function handleMessageUpdateLog(oldMsg: Message, newMsg: Message) {
  if (!oldMsg.guild || !oldMsg.author || oldMsg.author.bot || oldMsg.content === newMsg.content)
    return;

  const files: AttachmentBuilder[] = [];
  const oldContent = oldMsg.content || "";
  const newContent = newMsg.content || "";

  const isLong = oldContent.length > 1024 || newContent.length > 1024;

  if (isLong) {
    files.push(new AttachmentBuilder(Buffer.from(oldContent || "None"), { name: "before.md" }));
    files.push(new AttachmentBuilder(Buffer.from(newContent || "None"), { name: "after.md" }));
  }

  const embed = buildMessageEditEmbed(oldMsg.author.id, oldMsg.channelId, oldContent, newContent, isLong);

  await sendLog(oldMsg.guild, CONFIG.LOG_CHANNEL_ID, embed, files);
}

export async function handleMessageBulkDeleteLog(
  messages: Collection<Snowflake, Message>,
  channel: GuildTextBasedChannel,
) {
  if (!channel || !channel.guild) return;

  const executor = await findAuditExecutor(channel.guild, AuditLogEvent.MessageBulkDelete);

  const transcript = generateTranscript(messages);

  const files: AttachmentBuilder[] = [
    new AttachmentBuilder(Buffer.from(transcript), {
      name: `purge-${Date.now()}.md`,
    }),
  ];

  const embed = buildBulkDeleteEmbed(channel.id, messages.size, executor?.id);

  await sendLog(channel.guild, CONFIG.LOG_CHANNEL_ID, embed, files);
}

export async function handleChannelCreateLog(channel: GuildChannel) {
  const executor = await findAuditExecutor(channel.guild, AuditLogEvent.ChannelCreate);
  const embed = buildChannelCreateEmbed(channel.name, channel.type, executor?.id);
  await sendLog(channel.guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleChannelDeleteLog(channel: GuildChannel) {
  const executor = await findAuditExecutor(channel.guild, AuditLogEvent.ChannelDelete);
  const embed = buildChannelDeleteEmbed(channel.name, executor?.id);
  await sendLog(channel.guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleRoleCreateLog(role: Role) {
  const executor = await findAuditExecutor(role.guild, AuditLogEvent.RoleCreate);
  const embed = buildRoleCreateEmbed(role.name, role.id, executor?.id);
  await sendLog(role.guild, CONFIG.LOG_CHANNEL_ID, embed);
}

export async function handleRoleDeleteLog(role: Role) {
  const executor = await findAuditExecutor(role.guild, AuditLogEvent.RoleDelete);
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
    const executor = await findAuditExecutor(newGuild, AuditLogEvent.GuildUpdate);
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

  const embed = buildBanLogEmbed(
    target.tag || target.username || "Unknown",
    target.id,
    executor?.id,
    banLog.reason,
  );
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

export async function findAuditLogEntry(member: GuildMember, type: AuditLogEvent) {
  try {
    for (let i = 0; i < 3; i++) {
      const logs = await member.guild.fetchAuditLogs({
        limit: 15,
        type,
      });

      const entry = logs.entries.find(
        (e) => e.targetId === member.id && Date.now() - e.createdTimestamp < 20000,
      );

      if (entry && entry.executorId) {
        const { reason, createdTimestamp } = entry;
        const target = await getMember(member.guild, entry.targetId!);
        const executor = await getMember(member.guild, entry.executorId);
        return { executor, target, reason, createdTimestamp };
      }

      await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, i)));
    }
    return null;
  } catch {
    return null;
  }
}

export async function findAuditExecutor(guild: Guild, type: AuditLogEvent) {
  try {
    for (let i = 0; i < 3; i++) {
      const logs = await guild.fetchAuditLogs({ limit: 1, type });
      const entry = logs.entries.first();

      if (entry && Date.now() - entry.createdTimestamp < 10000) {
        return entry.executor;
      }

      await new Promise((resolve) => setTimeout(resolve, 200 * Math.pow(2, i)));
    }
    return null;
  } catch {
    return null;
  }
}
