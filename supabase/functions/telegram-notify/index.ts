import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

  const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!TELEGRAM_CHAT_ID) throw new Error("TELEGRAM_CHAT_ID is not configured");

  try {
    const { type, data } = await req.json();
    let text = "";

    if (type === "new_order") {
      const { order_id, customer_name, phone, address, total, items, delivery_date, delivery_time } = data;
      const itemsList = (items || []).map((i: any) => `  • ${i.product_name} × ${i.quantity} — ${i.price * i.quantity} ₽`).join("\n");
      text = `🛒 <b>Новый заказ!</b>\n\n` +
        `📋 Номер: <code>${order_id}</code>\n` +
        `👤 ${customer_name}\n📞 ${phone}\n📍 ${address}\n` +
        (delivery_date ? `📅 ${delivery_date}${delivery_time ? ` ${delivery_time}` : ""}\n` : "") +
        `\n${itemsList}\n\n💰 <b>Итого: ${total} ₽</b>`;
    } else if (type === "operator_request") {
      const { session_id, customer_name, phone } = data;
      text = `🙋 <b>Запрос оператора!</b>\n\n` +
        `👤 ${customer_name}\n📞 ${phone}\n` +
        `💬 Сессия: <code>${session_id}</code>`;
    } else if (type === "new_chat") {
      const { session_id, customer_name, phone } = data;
      text = `💬 <b>Новый чат</b>\n\n` +
        `👤 ${customer_name}\n📞 ${phone}\n` +
        `🆔 <code>${session_id}</code>`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown notification type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Telegram API error:", response.status, JSON.stringify(result));
      throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("telegram-notify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
