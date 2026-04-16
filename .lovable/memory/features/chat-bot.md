---
name: AI Chat Bot
description: Floating chat widget with AI assistant, product catalog context, order placement, and operator escalation
type: feature
---
- ChatWidget in bottom-right corner, always visible (added to App.tsx outside routes)
- Registration step: name + phone + privacy policy acceptance → creates chat_session
- AI uses google/gemini-3-flash-preview via Lovable AI gateway
- Edge function `chat-assistant` loads product catalog, has `place_order` and `escalate` tools
- place_order creates order + order_items directly in DB
- escalate sets `needs_operator=true` on chat_session
- Admin panel has "Чаты" tab (AdminChats component) with session list, message history, operator reply
- Realtime enabled on chat_messages and chat_sessions for live updates
- Tables: chat_sessions, chat_messages (with open INSERT RLS, admin SELECT/UPDATE)
