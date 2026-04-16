import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, AlertCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

interface ChatSession {
  id: string;
  customer_name: string;
  phone: string;
  needs_operator: boolean;
  created_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

const AdminChats = () => {
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [operatorMsg, setOperatorMsg] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: sessions } = useQuery({
    queryKey: ['admin-chat-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ChatSession[];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ['admin-chat-messages', selectedSession],
    queryFn: async () => {
      if (!selectedSession) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', selectedSession)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!selectedSession,
  });

  // Realtime for new messages and sessions
  useEffect(() => {
    const ch1 = supabase
      .channel('admin-chat-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-chat-messages', selectedSession] });
      })
      .subscribe();

    const ch2 = supabase
      .channel('admin-chat-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-chat-sessions'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [queryClient, selectedSession]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendOperatorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorMsg.trim() || !selectedSession || sending) return;
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      session_id: selectedSession,
      role: 'operator',
      content: operatorMsg.trim(),
    });
    if (error) {
      toast.error('Ошибка отправки');
    } else {
      setOperatorMsg('');
      queryClient.invalidateQueries({ queryKey: ['admin-chat-messages', selectedSession] });
    }
    setSending(false);
  };

  if (selectedSession) {
    const session = sessions?.find(s => s.id === selectedSession);
    return (
      <div className="flex flex-col h-[60vh]">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedSession(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <p className="font-medium">{session?.customer_name}</p>
            <p className="text-xs text-muted-foreground">{session?.phone}</p>
          </div>
          {session?.needs_operator && (
            <Badge variant="destructive" className="ml-auto">
              <AlertCircle className="w-3 h-3 mr-1" /> Нужен оператор
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1 border rounded-xl p-4 mb-3" ref={scrollRef}>
          <div className="space-y-3">
            {messages?.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary/10 text-foreground rounded-br-md'
                    : m.role === 'operator'
                    ? 'bg-accent text-accent-foreground rounded-bl-md border-2 border-primary/20'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    {m.role === 'user' ? 'Клиент' : m.role === 'operator' ? 'Оператор' : 'AI'}
                    {' · '}
                    {format(new Date(m.created_at), 'HH:mm', { locale: ru })}
                  </p>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form onSubmit={sendOperatorMessage} className="flex gap-2">
          <Input
            value={operatorMsg}
            onChange={e => setOperatorMsg(e.target.value)}
            placeholder="Ответить как оператор..."
            maxLength={1000}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !operatorMsg.trim()} className="rounded-full">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions?.map(s => (
        <button
          key={s.id}
          onClick={() => setSelectedSession(s.id)}
          className="w-full text-left bg-card border rounded-xl p-4 hover:bg-muted/50 transition-colors flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{s.customer_name}</p>
            <p className="text-xs text-muted-foreground">{s.phone}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">
              {format(new Date(s.created_at), 'd MMM HH:mm', { locale: ru })}
            </p>
            {s.needs_operator && (
              <Badge variant="destructive" className="mt-1 text-[10px]">
                <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Оператор
              </Badge>
            )}
          </div>
        </button>
      ))}
      {sessions?.length === 0 && (
        <p className="text-center text-muted-foreground py-12">Чатов пока нет</p>
      )}
    </div>
  );
};

export default AdminChats;
