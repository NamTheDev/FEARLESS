export interface Giveaway {
  id: string;
  channelId: string;
  prize: string;
  endTime: number;
  entrants: string[];
  active: boolean;
  winnerCount: number;
  requiredRoleId?: string;
}
