export const parsePaginationId = (customId: string) => {
  const [prefix, pageStr] = customId.split(":");
  if (!prefix || !pageStr) return null;

  const page = parseInt(pageStr);
  if (isNaN(page)) return null;

  return { prefix, page };
};
