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
const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

let entryStatus = { isSendingWalletAddress: false, addressChange: false, isWithdrawing:false };

// Create a queue instance
const queue = new Queue({
  concurrent: 25, // Process one request at a time
  interval: 3000, // Interval between dequeue operations (1 second)
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
    await deposit(ctx, entryStatus);
  });
});

bot.command("deposit", async (ctx) => {
  queue.enqueue(async () => {
    await deposit(ctx, entryStatus);
  });
});

bot.command("withdraw", async(ctx)=>{
  queue.enqueue(async () => {
    await withdraw(ctx, entryStatus);
  });
})

//HANDLE NEW GAME REQUESTS
bot.action("new_game", async (ctx) => {
  queue.enqueue(async () => {
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
    await handleStartGame(ctx);
  });
});

//HANDLE END-GAME BUTTON
bot.action("end-game", async (ctx) => {
  queue.enqueue(async () => {
    await handleEndGame(ctx);
  });
});

//HANDLE CONTINUE-PLAYING BUTTON
bot.action("continue-playing", async (ctx) => {
  queue.enqueue(async () => {
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

// setInterval(()=>console.log(isSendingWalletAddress), 200)

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

const PORT = process.env.PORT || 5000;
//INITIATE SERVER LISTENER
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

//LAUNCH THE BOT
bot.launch();

//INIT PAYMENT LISTENER
listenForPayments();

//CONNECT THE SERVER TO THE DATABASE
mongoose
  .connect(process.env.URI)
  .then(() => console.log("Connected to db"))
  .catch((error) => console.log(error));

// const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");

// // Replace with your Solana network connection endpoint (e.g., devnet, mainnet-beta)
// const connection = new Connection("http://api.devnet.solana.com");

// async function checkBalance() {
//   try {
//     console.log("Started checking");
//     const balance = await connection.getBalance(
//       new PublicKey("AWuFtxvfTjwvYUTAfnmGspAchF9Jjhswu6hHzgg3vVVU")
//     );
//     const solBalance = balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
//     console.log(`Wallet balance: ${solBalance} SOL`);
//   } catch (error) {
//     console.error(`Error getting balance: ${error}`);
//   }
//   // generateKey();
// }

// checkBalance();
let key = [
  98, 245, 202, 235, 213, 205, 62, 157, 196, 23, 1, 78, 75, 157, 166, 237, 36,
  54, 63, 250, 177, 52, 52, 38, 89, 35, 45, 73, 159, 229, 67, 73, 177, 202, 172,
  89, 91, 42, 141, 81, 31, 100, 191, 138, 108, 134, 90, 111, 16, 231, 60, 152,
  180, 84, 159, 61, 22, 132, 22, 165, 9, 111, 216, 99,
];

// sendSol(0.01, key, "AWuFtxvfTjwvYUTAfnmGspAchF9Jjhswu6hHzgg3vVVU")
