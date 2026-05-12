"""
ListWorks Telegram Bot — polling-based agent notification bot.

Handles:
- /start — welcome message with setup link
- /link <email> — link a Telegram chat to a listworks account
- /help — command reference
- /status — show linked account status
- Buyer lead notifications (forwarded from server)

Run: python telegram_bot.py (background process alongside FastAPI)
Uses polling (no webhook needed, works behind Railway's port restrictions).
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import httpx
import telegram as tg
from telegram import Update, InlineKeyboardButton, InlineKeyboardButton
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
    ConversationHandler,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("telegram_bot")


@dataclass
class BotConfig:
    token: str = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    backend_url: str = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:3000").rstrip("/")
    site_url: str = os.environ.get("SITE_URL", "https://listworks.pro").rstrip("/")
    mongo_url: str = os.environ.get("MONGO_URL", "")
    db_name: str = os.environ.get("DB_NAME", "listworks")


STATE_LINK_EMAIL = 1


def _build_menu(keyboard: list[list[InlineKeyboardButton]]) -> list[list[InlineKeyboardButton]]:
    return keyboard


async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat = update.effective_chat
    await update.message.reply_text(
        "👋 Welcome to ListWorks PRO Bot.\n\n"
        "I'll send you notifications when buyers engage with your listings — "
        "no checking email, no missed leads.\n\n"
        "To get started, link your Telegram to your ListWorks account:\n\n"
        "/link <your@email.com>\n\n"
        "Or visit your dashboard: " + ctx.bot_data.get("site_url", "https://listworks.pro") + "\n\n"
        "/help for all commands.",
        parse_mode="HTML",
    )


async def cmd_help(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📋 <b>ListWorks Bot Commands</b>\n\n"
        "/start — Get started\n"
        "/link &lt;email&gt; — Connect your Telegram to your ListWorks account\n"
        "/unlink — Disconnect your Telegram from ListWorks\n"
        "/status — Check your linked account and notification settings\n"
        "/help — This menu\n\n"
        "You'll get a message when:\n"
        "• A buyer shares or views your listing\n"
        "• A lead submits an inquiry via your listing\n"
        "• You make a sale (affiliate commission notification)\n",
        parse_mode="HTML",
    )


async def cmd_link(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if ctx.args and ctx.args[0]:
        email = ctx.args[0].strip().lower()
        if "@" not in email or "." not in email:
            await update.message.reply_text("❌ That doesn't look like a valid email. Try: /link agent@brokerage.com")
            return

        try:
            backend_url = ctx.bot_data.get("backend_url", "http://localhost:8000")
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{backend_url}/api/telegram/link",
                    json={"email": email, "telegram_chat_id": update.effective_chat.id},
                )
            if resp.status_code == 200:
                data = resp.json()
                await update.message.reply_text(
                    f"✅ Linked! Your Telegram is now connected to <b>{email}</b>.\n\n"
                    f"You'll receive lead notifications for: {data.get('session_count', 1)} session(s).\n\n"
                    f"Start using the tool at: {ctx.bot_data.get('site_url', 'https://listworks.pro')}",
                    parse_mode="HTML",
                )
            elif resp.status_code == 404:
                await update.message.reply_text(
                    "❌ No ListWorks account found for that email.\n\n"
                    "Try the free tool first, then link: " + ctx.bot_data.get("site_url", "https://listworks.pro"),
                    parse_mode="HTML",
                )
            else:
                await update.message.reply_text("⚠️ Link failed. Try again in a moment.")
        except Exception as e:
            logger.exception("Telegram link failed: %s", e)
            await update.message.reply_text("⚠️ Could not reach ListWorks. Try again shortly.")
    else:
        await update.message.reply_text(
            "Send your ListWorks email: /link agent@brokerage.com\n\n"
            "Need an account? Use the free tool: " + ctx.bot_data.get("site_url", "https://listworks.pro"),
        )


async def cmd_unlink(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        backend_url = ctx.bot_data.get("backend_url", "http://localhost:8000")
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{backend_url}/api/telegram/unlink",
                json={"telegram_chat_id": update.effective_chat.id},
            )
        if resp.status_code == 200:
            await update.message.reply_text("🔓 Unlinked. You won't receive further notifications.")
        else:
            await update.message.reply_text("⚠️ Unlink failed. Try again.")
    except Exception as e:
        logger.exception("Telegram unlink failed: %s", e)
        await update.message.reply_text("⚠️ Could not reach ListWorks.")


async def cmd_status(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        backend_url = ctx.bot_data.get("backend_url", "http://localhost:8000")
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{backend_url}/api/telegram/status/{update.effective_chat.id}",
            )
        if resp.status_code == 200:
            data = resp.json()
            linked = data.get("linked_email") or "Not linked"
            leads = data.get("recent_leads", 0)
            await update.message.reply_text(
                f"📊 Status\n\n"
                f"Account: <b>{linked}</b>\n"
                f"Leads received: <b>{leads}</b>\n\n"
                f"{ctx.bot_data.get('site_url', 'https://listworks.pro')}",
                parse_mode="HTML",
            )
        else:
            await update.message.reply_text("📊 Not linked yet. Use /link <email> to connect.")
    except Exception as e:
        logger.exception("Telegram status failed: %s", e)
        await update.message.reply_text("📊 Could not fetch status. Try again shortly.")


async def handle_unknown(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🤖 I'm the ListWorks PRO Bot.\n\n"
        "/help to see what I can do.",
    )


async def error_handler(update: object, ctx: ContextTypes.DEFAULT_TYPE):
    logger.exception("Telegram error: %s", ctx.error)


def run_polling(config: BotConfig):
    from motor.motor_asyncio import AsyncIOMotorClient
    from dotenv import load_dotenv

    ROOT = Path(__file__).parent
    load_dotenv(ROOT / ".env")

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        logger.warning("TELEGRAM_BOT_TOKEN not set — bot not starting")
        return

    application = Application.builder().token(token).build()
    application.bot_data["backend_url"] = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:3000").rstrip("/")
    application.bot_data["site_url"] = os.environ.get("SITE_URL", "https://listworks.pro").rstrip("/")

    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(CommandHandler("help", cmd_help))
    application.add_handler(CommandHandler("link", cmd_link))
    application.add_handler(CommandHandler("unlink", cmd_unlink))
    application.add_handler(CommandHandler("status", cmd_status))
    application.add_handler(MessageHandler(filters.COMMAND, handle_unknown))
    application.add_error_handler(error_handler)

    logger.info("Telegram bot polling started")
    application.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    cfg = BotConfig()
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        if not cfg.token:
            print("ERROR: TELEGRAM_BOT_TOKEN not set")
            sys.exit(1)
        print("OK: bot token configured")
    else:
        run_polling(cfg)
