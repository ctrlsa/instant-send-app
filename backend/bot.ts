import { Bot, InlineKeyboard } from "grammy";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function createBot(token: string) {
  const bot = new Bot(token);

  bot.api
    .getMe()
    .then((me) => {
      console.log(`Bot started as ${me.username}`);
    })
    .catch((err) => {
      console.log(err);
    });

  bot.command("start", async (ctx) => {
    if (process.env.WEBAPP_URL) {
      let keyboard = new InlineKeyboard().webApp(
        "Open wallet",
        process.env.WEBAPP_URL
      );
      await ctx.reply('Press "Open wallet" button below ↙️', {
        reply_markup: keyboard,
      });
    }
  });

  bot.on("message", async (ctx) => {
    console.log(ctx.update.message.contact); // Log the contact object
    try {
      if (ctx.update.message.contact) {
        ctx.reply("Got a contact!");

        const contactUserId = ctx.update.message.contact.user_id;
        const contactFirstName = ctx.update.message.contact.first_name || "";
        const contactLastName = ctx.update.message.contact.last_name || "";
        const contactName = `${contactFirstName} ${contactLastName}`.trim();

        if (!contactUserId) {
          return ctx.reply("User ID is missing for the contact.");
        }

        const senderId = ctx.update.message.from.id;
        const senderFirstName = ctx.update.message.from.first_name || "";
        const senderLastName = ctx.update.message.from.last_name || "";
        const senderName = `${senderFirstName} ${senderLastName}`.trim();

        // Ensure the sender exists in the User table
        await prisma.user.upsert({
          where: { id: senderId },
          update: {},
          create: {
            id: senderId,
            name: senderName,
          },
        });

        // Ensure the contact exists in the Contact table
        const contactRecord = await prisma.contact.upsert({
          where: { id: contactUserId },
          update: {},
          create: {
            id: contactUserId,
            name: contactName,
          },
        });

        // Check if the contact is already associated with the sender
        const existingUserContact = await prisma.userContact.findUnique({
          where: {
            userId_contactId: {
              userId: senderId,
              contactId: contactRecord.id,
            },
          },
        });

        if (existingUserContact) {
          ctx.reply("This contact is already saved.");
        } else {
          // Create the association in UserContact table
          await prisma.userContact.create({
            data: {
              userId: senderId,
              contactId: contactRecord.id,
            },
          });

          ctx.reply("Contact saved successfully.");
        }
      }
    } catch (err) {
      console.error(err);
      ctx.reply("An error occurred while processing the message.");
    }
  });

  return bot;
}

if (!process.env.BOT_TOKEN) {
  throw new Error(
    "Please provide a bot token in the environment variable BOT_TOKEN."
  );
}

const bot = createBot(process.env.BOT_TOKEN);

(async () => {
  try {
    await bot.start();
    console.log("Bot started successfully");
  } catch (error) {
    console.error("Failed to start the bot:", error);
  }
})();
