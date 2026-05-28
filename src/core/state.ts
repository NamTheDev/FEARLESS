export const economyState = {
  activeClaims: new Map<
    string,
    {
      claimsLeft: number;
      claimedBy: Set<string>;
      messageId: string;
      channelId: string;
      lootName: string;
      value: number;
      duration: number;
      expiryTimestamp: number;
      image: string | null;
    }
  >(),
  shopStock: new Map<string, number>(),
  activeShopMessageId: null as string | null,
  shopExpiryTimestamp: null as number | null,
  merchantActive: false,
  merchantExpiry: null as number | null,
  merchantStock: new Map<string, number>(),
};
