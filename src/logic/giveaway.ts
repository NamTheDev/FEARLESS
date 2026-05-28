import { Guild, ButtonInteraction, MessageFlags } from "discord.js";
import db from "@core/database";
import { Giveaway } from "@typings/Giveaway";
import { getChannel, getMember } from "@utils/fetchers";
import { GuildMember } from "discord.js";
import { CONFIG } from "@core/config";

export function loadGiveaways() {}

export function getActiveGiveaway(id: string): Giveaway | null {
  const g: any = db
    .query("SELECT * FROM giveaways WHERE id = ? AND active = 1")
    .get(id);
  return g ? { ...g, entrants: JSON.parse(g.entrants) } : null;
}

export function updateEntrants(id: string, entrants: string[]) {
  db.run("UPDATE giveaways SET entrants = ? WHERE id = ?", [
    JSON.stringify(entrants),
    id,
  ]);
}

export async function createGiveaway(g: Giveaway) {
  db.run(
    "INSERT INTO giveaways (id, channelId, prize, endTime, entrants, active) VALUES (?, ?, ?, ?, ?, 1)",
    [g.id, g.channelId, g.prize, g.endTime, JSON.stringify(g.entrants)],
  );
}

export function resumeGiveaways(guild: Guild) {
  const active = db
    .query("SELECT * FROM giveaways WHERE active = 1")
    .all() as any[];
  active.forEach((g) => {
    if (g.endTime <= Date.now()) {
      void endGiveaway(g.id, guild);
    } else {
      setTimeout(
        () => endGiveaway(g.id, guild),
        Math.max(0, g.endTime - Date.now()),
      );
    }
  });
}

export async function endGiveaway(id: string, guild: Guild) {
  const g = getActiveGiveaway(id);
  if (!g) return;
  db.run("UPDATE giveaways SET active = 0 WHERE id = ?", [id]);

  const channel = await getChannel(guild, g.channelId);
  if (!channel) return;

  const winner = pickWinner(g);
  await channel.send(
    winner
      ? `🎊 <@${winner}> won **${g.prize}**!`
      : "Giveaway ended, no winners.",
  );
}

export async function handleGiveawayInteraction(
  interaction: ButtonInteraction,
) {
  if (interaction.customId !== "giveaway_enter") return;

  const g = getActiveGiveaway(interaction.message.id);
  if (!g) {
    return await interaction.reply({
      content: "❌ This giveaway has ended!",
      flags: MessageFlags.Ephemeral,
    });
  }

  const member = await getMember(interaction.guild!, interaction.user.id);
  if (
    g.requiredRoleId &&
    member &&
    !meetsRequirement(member as any, g.requiredRoleId)
  ) {
    return await interaction.reply({
      content: "❌ You don't meet the requirements for this giveaway!",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (g.entrants.includes(interaction.user.id)) {
    return await interaction.reply({
      content: "❌ You have already entered this giveaway!",
      flags: MessageFlags.Ephemeral,
    });
  }

  g.entrants.push(interaction.user.id);
  db.run("UPDATE giveaways SET entrants = ? WHERE id = ?", [
    JSON.stringify(g.entrants),
    g.id,
  ]);

  await interaction.reply({
    content: "✅ You have successfully entered the giveaway!",
    flags: MessageFlags.Ephemeral,
  });
}

function pickWinner(g: Giveaway): string | null {
  if (g.entrants.length === 0) return null;
  const early = g.entrants.slice(0, 3);
  const late = g.entrants.slice(3);

  if (late.length > 0 && Math.random() > 0.8) {
    const weights = late.map((_, i) => Math.max(5, 90 - i * 5));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i]!;
      if (r <= 0) return late[i]!;
    }
  }
  return early[Math.floor(Math.random() * early.length)]!;
}

function meetsRequirement(
  member: GuildMember,
  requiredRoleId: string,
): boolean {
  const requirement = CONFIG.ROLES.LEVELING.find(
    (r) => r.ROLE_ID === requiredRoleId,
  );
  if (!requirement) return member.roles.cache.has(requiredRoleId);

  return member.roles.cache.some((role) => {
    const levelRole = CONFIG.ROLES.LEVELING.find(
      (lr) => lr.ROLE_ID === role.id,
    );
    return levelRole
      ? levelRole.VALUE >= requirement.VALUE
      : role.id === requiredRoleId;
  });
}

function pickWinners(g: Giveaway, amount: number): string[] {
  const winners: string[] = [];
  const pool = [...g.entrants];

  for (let i = 0; i < amount; i++) {
    if (pool.length === 0) break;

    const early = pool.slice(0, 3);
    const late = pool.slice(3);
    let selected: string;

    if (late.length > 0 && Math.random() > 0.8) {
      const weights = late.map((_, idx) => Math.max(5, 90 - idx * 5));
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let j = 0; j < weights.length; j++) {
        r -= weights[j]!;
        if (r <= 0) {
          selected = late[j]!;
          break;
        }
      }
    } else {
      selected = early[Math.floor(Math.random() * early.length)]!;
    }

    winners.push(selected!);
    pool.splice(pool.indexOf(selected!), 1);
  }
  return winners;
}
