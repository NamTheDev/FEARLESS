export interface UserData {
  userId: string;
  xp: number;
  level: number;
  bloodern: number;
  gorelith: number;
  xpBlockedUntil: number;
  activeBuffs: {
    xpMultiplier: number;
    moneyMultiplier: number;
    expiry: number;
  } | null;
}
