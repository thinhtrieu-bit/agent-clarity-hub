CREATE TABLE public.agents (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  avatar_color TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_task_id TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks (
  id TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  stage TEXT NOT NULL,
  assigned_agent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  handoffs JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE public.messages (
  id TEXT NOT NULL PRIMARY KEY,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  content TEXT NOT NULL,
  task_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL DEFAULT 'response'
);

CREATE TABLE public.emails (
  id TEXT NOT NULL PRIMARY KEY,
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  read_by TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'read'
);

CREATE TABLE public.events (
  id TEXT NOT NULL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  entities JSONB NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Allow all insert on agents" ON public.agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on agents" ON public.agents FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on agents" ON public.agents FOR DELETE USING (true);

CREATE POLICY "Allow all select on tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow all insert on tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on tasks" ON public.tasks FOR DELETE USING (true);

CREATE POLICY "Allow all select on messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow all insert on messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on messages" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on messages" ON public.messages FOR DELETE USING (true);

CREATE POLICY "Allow all select on emails" ON public.emails FOR SELECT USING (true);
CREATE POLICY "Allow all insert on emails" ON public.emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on emails" ON public.emails FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on emails" ON public.emails FOR DELETE USING (true);

CREATE POLICY "Allow all select on events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow all insert on events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on events" ON public.events FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;