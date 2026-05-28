import { AuditLogEvent, GuildMember } from "discord.js";
import { findAuditLogEntry } from "@logic/audit";
import { sendLog } from "@utils/logger";
import { CONFIG } from "@core/config";
import { buildMemberUpdateEmbed } from "@utils/logs";

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
    executorText = executor.id === newMember.client.user?.id ? "System (Bot Sync)" : `<@${executor.id}>`;
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
