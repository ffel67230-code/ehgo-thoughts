
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 300 AND char_length(content) > 0),
  color TEXT NOT NULL DEFAULT '#1f1f1f',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.comments TO anon, authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Anyone can post comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE INDEX comments_created_at_idx ON public.comments (created_at DESC);
