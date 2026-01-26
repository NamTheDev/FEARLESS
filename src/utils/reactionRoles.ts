import db from "./database";

export async function loadReactionRoles() {} // SQLite initialized on boot

export async function addReactionRole(
  messageId: string,
  emoji: string,
  roleId: string,
) {
  db.run(
    "INSERT INTO reaction_roles (messageId, emoji, roleId) VALUES (?, ?, ?) ON CONFLICT(messageId, emoji) DO UPDATE SET roleId=excluded.roleId",
    [messageId, emoji, roleId],
  );
}

export function getRoleFromReaction(messageId: string, emoji: string) {
  const res: any = db
    .query(
      "SELECT roleId FROM reaction_roles WHERE messageId = ? AND emoji = ?",
    )
    .get(messageId, emoji);
  return res?.roleId;
}
