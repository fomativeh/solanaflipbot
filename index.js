const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv/config");
const Queue = require("queue-promise");
const { v1: uuidv1 } = require("uuid");
const { Telegraf } = require("telegraf");
const User = require("./models/userModel");
const createUserAccount = require("./helpers/createUserAccount");
const showMenu = require("./helpers/showMenu");
const showBalance = require("./helpers/showBalance");
const deposit = require("./helpers/deposit");
const handleWalletInput = require("./helpers/handleWalletInput");
const newGame = require("./helpers/newGame");
const listenForPayments = require("./helpers/listenForPayments");
const sendSol = require("./helpers/sendSol");
const handleStartGame = require("./helpers/handleStartGame");
const handleEndGame = require("./helpers/handleEndGame");
const handleContinuePlaying = require("./helpers/handleContinuePlaying");
const handleProcessWithdrawal = require("./helpers/handleProcessWithdrawal");
const withdraw = require("./helpers/withdraw");
const handleCreditNotification = require("./helpers/handleCreditNotification");
const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

let entryStatus = { isSendingWalletAddress: false, addressChange: false, isWithdrawing:false };

// Create a queue instance
const queue = new Queue({
  concurrent: 25, // Process 25 requests at in 3 seconds
  interval: 3000, // Interval between dequeue operations (3 seconds)
});

bot.start(async (ctx) => {
  queue.enqueue(async () => {
    try {
      //CHECK IF USER ALREADY EXISTS
      const userExists = await User.findOne({ chatId: ctx.from.id });
      await showMenu(ctx, userExists);
    } catch (error) {
      console.log(error);
    }
  });
});

//HANDLE BALANCE REQUESTS
bot.action("balance", async (ctx) => {
  queue.enqueue(async () => {
    await ctx.deleteMessage();
    await showBalance(ctx);
  });
});

bot.command("balance", async (ctx) => {
  queue.enqueue(async () => {
    await showBalance(ctx);
  });
});

//HANDLE DEPOSIT REQUESTS
bot.action("deposit", async (ctx) => {
  queue.enqueue(async () => {
    await ctx.deleteMessage();
    await deposit(ctx, entryStatus);
  });
});

bot.command("deposit", async (ctx) => {
  queue.enqueue(async () => {
    await deposit(ctx, entryStatus);
  });
});

bot.action("withdraw", async(ctx)=>{
  queue.enqueue(async () => {
    await ctx.deleteMessage();
    await withdraw(ctx, entryStatus);
  });
})

bot.command("withdraw", async(ctx)=>{
  queue.enqueue(async () => {
    await withdraw(ctx, entryStatus);
  });
})

//HANDLE NEW GAME REQUESTS
bot.action("new_game", async (ctx) => {
  queue.enqueue(async () => {
    await ctx.deleteMessage();
    await newGame(ctx);
  });
});

bot.command("new_game", async (ctx) => {
  queue.enqueue(async () => {
    await newGame(ctx);
  });
});

//HANDLE CANCEL-GAME BUTTON
bot.action("cancel-initial", async (ctx) => {
  queue.enqueue(async () => {
    await ctx.deleteMessage();
  });
});

//HANDLE CONFIRM-WITHDRAWAL BUTTON
bot.action("confirm-withdrawal", async (ctx) => {
  queue.enqueue(async () => {
    await ctx.deleteMessage();
    await handleProcessWithdrawal(ctx)
  });
});

//HANDLE START-GAME BUTTON
bot.action("start-game", async (ctx) => {
  queue.enqueue(async () => {
    await ctx.deleteMessage();
    await handleStartGame(ctx);
  });
});

//HANDLE END-GAME BUTTON
bot.action("end-game", async (ctx) => {
  queue.enqueue(async () => {
    await ctx.deleteMessage();
    await handleEndGame(ctx);
  });
});

//HANDLE CONTINUE-PLAYING BUTTON
bot.action("continue-playing", async (ctx) => {
  queue.enqueue(async () => {
    await ctx.deleteMessage();
    await handleContinuePlaying(ctx)
  });
});

//HANDLE CHANGE ADDRESS REQUEST
bot.action("change-address", async (ctx) => {
  queue.enqueue(async () => {
    try {
      entryStatus.isSendingWalletAddress = true;
      entryStatus.addressChange = true;
      return await ctx.reply(
        `Send me your new sol wallet address, you shall use *only this address* to pay for your games.`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      await ctx.reply("An error occured, please try again.");
      console.log(error);
    }
  });
});

//ALL COMMAND HANDLERS AND CALLBACK HANDLERS MUST BE ABOVE THIS FUNCTION
//PROCESS USER INPUT
bot.on("message", async (ctx) => {
  queue.enqueue(async () => {
    try {
      const userInput = ctx.message.text.trim();
      if (!userInput) return;

      if (entryStatus.isSendingWalletAddress) {
        return await handleWalletInput(ctx, userInput, entryStatus);
      }

      
      if (entryStatus.addressChange) {
        return await handleWalletInput(ctx, userInput, entryStatus);
      }

      if (entryStatus.isWithdrawing) {
        return await handleProcessWithdrawal(ctx, userInput, entryStatus);
      }

      ctx.reply("Invalid command. Please use the menu.");
    } catch (error) {
      ctx.reply("An error occured, please try again");
      console.log(error);
    }
  });
});


// SET THE BOT COMMANDS
bot.telegram.setMyCommands([
  { command: "start", description: "Start Solana FlipBot" },
  {
    command: "new_game",
    description: "Start a new flip",
  },
  {
    command: "deposit",
    description: "Deposit Sol to your wallet",
  },
  {
    command: "balance",
    description: "Check your Sol balance",
  },
]);

app.get("/", (req, res)=>{
  res.send("Hello world")
})

const PORT = process.env.PORT || 5000;
//INITIATE SERVER LISTENER
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

//LAUNCH THE BOT
bot.launch();

//INIT PAYMENT LISTENER
listenForPayments();

//INIT CREDIT NOTIFICATION LISTENER
handleCreditNotification()//Checks for new credit alerts every 10 seconds

//CONNECT THE SERVER TO THE DATABASE
mongoose
  .connect(process.env.URI)
  .then(() => console.log("Connected to db"))
  .catch((error) => console.log(error));
