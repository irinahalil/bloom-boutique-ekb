import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, X, Send, Loader2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant' | 'operator';
  content: string;
}

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'register' | 'chat'>('register');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [regForm, setRegForm] = useState({ name: '', phone: '', accepted: false });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Realtime subscription for operator messages
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload: any) => {
        if (payload.new.role === 'operator') {
          setMessages(prev => [...prev, { role: 'operator', content: payload.new.content }]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name.trim() || !regForm.phone.trim() || !regForm.accepted) return;

    const { data, error } = await supabase.from('chat_sessions').insert({
      customer_name: regForm.name.trim(),
      phone: regForm.phone.trim(),
    }).select('id').single();

    if (error || !data) return;
    setSessionId(data.id);
    setStep('chat');
    setMessages([{
      role: 'assistant',
      content: `Здравствуйте, ${regForm.name}! 🌷 Я ваш AI-консультант. Помогу выбрать букет или собрать индивидуальную композицию. Что вас интересует?`,
    }]);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || !sessionId) return;
    const text = input.trim();
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    // Save user message to DB
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: text,
    });

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          session_id: sessionId,
          messages: newMessages.map(m => ({ role: m.role === 'operator' ? 'user' : m.role, content: m.content })),
        },
      });

      if (error) throw error;

      const reply = data?.reply || 'Извините, произошла ошибка.';
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMsg]);

      // Save assistant message to DB
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: reply,
      });

      if (data?.escalated) {
        setEscalated(true);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Произошла ошибка. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, messages]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Открыть чат"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌷</span>
          <div>
            <p className="font-display text-sm font-semibold">Консультант</p>
            <p className="text-xs text-muted-foreground">
              {escalated ? 'Ожидаем оператора...' : 'AI-помощник'}
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {step === 'register' ? (
        <form onSubmit={handleRegister} className="flex-1 flex flex-col p-4 gap-3 justify-center">
          <p className="text-sm text-center text-muted-foreground mb-2">
            Представьтесь, чтобы начать разговор
          </p>
          <Input
            placeholder="Ваше имя"
            value={regForm.name}
            onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
            required
            maxLength={100}
          />
          <Input
            placeholder="Телефон"
            type="tel"
            value={regForm.phone}
            onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
            required
            maxLength={20}
          />
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={regForm.accepted}
              onChange={e => setRegForm(f => ({ ...f, accepted: e.target.checked }))}
              className="mt-0.5"
              required
            />
            <span>
              Принимаю{' '}
              <a href="/privacy" target="_blank" className="underline text-primary">
                политику конфиденциальности
              </a>
            </span>
          </label>
          <Button type="submit" className="rounded-full w-full" disabled={!regForm.accepted}>
            Начать чат
          </Button>
        </form>
      ) : (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : m.role === 'operator'
                        ? 'bg-accent text-accent-foreground rounded-bl-md border'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    {m.role === 'operator' && (
                      <p className="text-xs font-medium text-primary mb-1">Оператор</p>
                    )}
                    <div className="prose prose-sm max-w-none [&>p]:m-0">
                      <ReactMarkdown
                        components={{
                          img: ({ src, alt }) => (
                            <img
                              src={src}
                              alt={alt || ''}
                              className="rounded-xl max-w-full h-auto my-2 shadow-sm"
                              loading="lazy"
                            />
                          ),
                        }}
                      >{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t">
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Напишите сообщение..."
                disabled={loading}
                maxLength={1000}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-full shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWidget;
