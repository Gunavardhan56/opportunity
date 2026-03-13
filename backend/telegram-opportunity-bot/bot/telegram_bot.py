import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes

from bot.config import BOT_TOKEN
from utils.api_client import send_message_to_backend


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):

    message = update.message
    if message is None:
        print("Update received without a message. Skipping.")
        return

    user_message = message.text or ""

    if not user_message.strip():
        print("Received empty text message. Skipping backend forwarding.")
        return

    print("Received opportunity message from Telegram")
    print("Message text:", user_message)

    # Forward message to backend
    result = send_message_to_backend(user_message)

    print("Backend response:", result)

    await message.reply_text(
        "✅ Message received and forwarded to backend."
    )


def main():

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(MessageHandler(filters.TEXT, handle_message))

    print("Bot is running...")

    app.run_polling()


if __name__ == "__main__":
    main()