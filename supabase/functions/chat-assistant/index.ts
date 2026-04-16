import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, messages } = await req.json();
    if (!session_id || !messages) {
      return new Response(JSON.stringify({ error: "session_id and messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch product catalog
    const { data: products } = await supabase
      .from("products")
      .select("name, price, category, color, in_stock, description, image_url")
      .eq("in_stock", true);

    const catalog = (products ?? [])
      .map((p: any) => `- ${p.name}: ${p.price} ₽, категория: ${p.category}${p.color ? `, цвет: ${p.color}` : ""}${p.description ? ` (${p.description})` : ""}${p.image_url ? ` | фото: ${p.image_url}` : ""}`)
      .join("\n");

    const systemPrompt = `Ты — AI-консультант цветочного магазина «Тюльпаны Екб» в Екатеринбурге.
Ты дружелюбный, вежливый и помогаешь клиентам выбрать цветы и букеты.

Вот актуальный каталог товаров:
${catalog || "Каталог пуст."}

Твои задачи:
1. Помочь выбрать букет или собрать индивидуальный из представленных цветов
2. Считать стоимость заказа
3. Когда клиент готов оформить заказ — вызови инструмент place_order
4. Если не можешь помочь или клиент просит поговорить с человеком — вызови инструмент escalate

Правила:
- Рекомендуй только товары из каталога
- Всегда указывай цены
- Когда рекомендуешь товар, обязательно вставляй его фото в формате ![название](url). URL бери из каталога (поле "фото:")
- Будь кратким, но полезным
- Отвечай на русском языке`;

    const tools = [
      {
        type: "function",
        function: {
          name: "place_order",
          description: "Оформить заказ, когда клиент подтвердил выбор. Спроси имя, телефон, адрес доставки, дату и время.",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_name: { type: "string" },
                    quantity: { type: "number" },
                    price: { type: "number" },
                  },
                  required: ["product_name", "quantity", "price"],
                },
              },
              customer_name: { type: "string" },
              phone: { type: "string" },
              address: { type: "string" },
              delivery_date: { type: "string", description: "YYYY-MM-DD" },
              delivery_time: { type: "string" },
              comment: { type: "string" },
            },
            required: ["items", "customer_name", "phone", "address"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "escalate",
          description: "Передать разговор живому оператору, когда AI не может помочь",
          parameters: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] },
        },
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Сервис временно недоступен" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const result = await aiResponse.json();
    const choice = result.choices?.[0];
    const message = choice?.message;

    // Handle tool calls
    if (message?.tool_calls?.length) {
      for (const tc of message.tool_calls) {
        const args = JSON.parse(tc.function.arguments);

        if (tc.function.name === "place_order") {
          // Find product IDs by name
          const { data: allProducts } = await supabase.from("products").select("id, name, price");
          const productMap = new Map((allProducts ?? []).map((p: any) => [p.name.toLowerCase(), p]));

          const total = args.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
          const orderId = crypto.randomUUID();

          const { error: orderError } = await supabase.from("orders").insert({
            id: orderId,
            customer_name: args.customer_name,
            phone: args.phone,
            address: args.address,
            total,
            comment: args.comment || `Заказ через чат`,
            delivery_date: args.delivery_date || null,
            delivery_time: args.delivery_time || null,
          });

          if (orderError) {
            console.error("Order insert error:", orderError);
            return new Response(JSON.stringify({
              reply: "Произошла ошибка при оформлении заказа. Попробуйте ещё раз или обратитесь к оператору.",
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          // Insert order items
          for (const item of args.items) {
            const found = productMap.get(item.product_name.toLowerCase());
            if (found) {
              await supabase.from("order_items").insert({
                order_id: orderId,
                product_id: found.id,
                quantity: item.quantity,
                price: item.price,
              });
            }
          }

          return new Response(JSON.stringify({
            reply: `✅ Заказ оформлен! Номер: ${orderId.slice(0, 8).toUpperCase()}\n\nСостав:\n${args.items.map((i: any) => `• ${i.product_name} × ${i.quantity} — ${i.price * i.quantity} ₽`).join("\n")}\n\nИтого: ${total} ₽\nДоставка: ${args.address}${args.delivery_date ? `\nДата: ${args.delivery_date}` : ""}${args.delivery_time ? `, ${args.delivery_time}` : ""}\n\nМы свяжемся с вами для подтверждения! 🌷`,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (tc.function.name === "escalate") {
          await supabase.from("chat_sessions").update({ needs_operator: true }).eq("id", session_id);
          return new Response(JSON.stringify({
            reply: "Я передаю ваш разговор нашему специалисту. Оператор подключится в ближайшее время! 🙋‍♀️",
            escalated: true,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    return new Response(JSON.stringify({
      reply: message?.content || "Извините, я не смог сформировать ответ. Попробуйте переформулировать вопрос.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
