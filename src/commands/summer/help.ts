export const command = {
  data: { name: "help" },
  async executeMessage(message: any) {
    message.reply("Redheat commands: build, splash, sell, shop, buy, give, help");
  }
};
