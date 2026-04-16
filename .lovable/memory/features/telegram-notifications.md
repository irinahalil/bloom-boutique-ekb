---
name: Telegram Notifications
description: Bot sends order, operator request, and new chat notifications to admin via Telegram connector gateway
type: feature
---
- Edge function `telegram-notify` sends formatted HTML messages via connector gateway
- Three notification types: new_order, operator_request, new_chat
- Called from: chat-assistant (orders), ChatWidget (new chats, operator requests)
- Uses secrets: TELEGRAM_API_KEY (connector), TELEGRAM_CHAT_ID (admin's chat/group ID)
- Gateway URL: https://connector-gateway.lovable.dev/telegram/sendMessage
