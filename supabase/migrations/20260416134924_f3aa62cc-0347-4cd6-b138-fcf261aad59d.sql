
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  needs_operator boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can start a chat session
CREATE POLICY "Anyone can create chat sessions" ON public.chat_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admins see all sessions
CREATE POLICY "Admins can view chat sessions" ON public.chat_sessions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Admins can update sessions (e.g. needs_operator)
CREATE POLICY "Admins can update chat sessions" ON public.chat_sessions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Anyone can insert messages
CREATE POLICY "Anyone can create chat messages" ON public.chat_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Anyone can read chat messages (filtered by session_id on client)
CREATE POLICY "Anyone can read chat messages" ON public.chat_messages
  FOR SELECT TO anon, authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
