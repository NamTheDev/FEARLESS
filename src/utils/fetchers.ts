import {
  Guild,
  GuildMember,
  TextChannel,
  Role,
} from "discord.js";

export async function getMember(
  guild: Guild,
  userId: string,
): Promise<GuildMember | null> {
  try {
    const cached = guild.members.cache.get(userId);
    if (cached) return cached;
    return await guild.members.fetch(userId);
  } catch {
    return null;
  }
}

export async function getChannel(
  guild: Guild,
  channelId: string,
): Promise<TextChannel | null> {
  try {
    const channel =
      guild.channels.cache.get(channelId) ||
      (await guild.channels.fetch(channelId));
    if (channel && channel instanceof TextChannel) return channel;
    return null;
  } catch {
    return null;
  }
}

export async function getRole(
  guild: Guild,
  roleId: string,
): Promise<Role | null> {
  try {
    return guild.roles.cache.get(roleId) || (await guild.roles.fetch(roleId));
  } catch {
    return null;
  }
}
