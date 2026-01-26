const RR_FILE = "data/reaction-roles.json";
let rrCache: Record<string, Record<string, string>> = {};

export async function loadReactionRoles() {
  const file = Bun.file(RR_FILE);
  if (await file.exists()) rrCache = await file.json();
}

export async function addReactionRole(
  messageId: string,
  emoji: string,
  roleId: string,
) {
  if (!rrCache[messageId]) rrCache[messageId] = {};
  rrCache[messageId][emoji] = roleId;
  await Bun.write(RR_FILE, JSON.stringify(rrCache, null, 2));
}

export function getRoleFromReaction(messageId: string, emoji: string) {
  return rrCache[messageId]?.[emoji];
}
