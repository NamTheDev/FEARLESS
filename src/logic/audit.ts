import { GuildMember, AuditLogEvent, Guild } from "discord.js";
import { getMember } from "@utils/fetchers";

export async function findAuditLogEntry(member: GuildMember, type: AuditLogEvent) {
  try {
    for (let i = 0; i < 3; i++) {
      const logs = await member.guild.fetchAuditLogs({
        limit: 15,
        type,
      });

      const entry = logs.entries.find(
        (e) =>
          e.targetId === member.id && Date.now() - e.createdTimestamp < 20000,
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
