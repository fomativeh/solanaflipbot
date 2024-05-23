const Notification = require("../models/notificationModel");
const handleError = require("./handleError");
const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
const Queue = require("queue-promise");

// Create a queue instance
const queue = new Queue({
  concurrent: 25, // Process 25 requests at in 3 seconds
  interval: 3000, // Interval between dequeue operations (3 seconds)
});
module.exports = handleCreditNotification = async () => {
  setInterval(async () => {
    try {
      const notifications = await Notification.find();
      if (!notifications || notifications.length == 0) return;

      // Enqueue all the requests outside the loop
      notifications.forEach((eachNotification) => {
        queue.enqueue(async () => {
          bot.telegram.sendMessage(
            eachNotification.chatId,
            eachNotification.message
          );
        });
      });
    } catch (error) {
      handleError(null, error);
    }
  }, 20000);
};