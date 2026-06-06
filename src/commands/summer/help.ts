export const command = {
  data: { name: "help" },
  category: "summer",
  async executeMessage(message: any) {
    message.reply("Redheat commands: build, splash, sell, shop, buy, give, help");
  }
};
