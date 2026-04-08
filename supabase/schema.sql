-- =============================================
-- PASCOM - Sistema de Gestão de Escalas
-- Schema SQL para Supabase
-- =============================================

-- 1. Tabela de Perfis (vinculada ao auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Eventos
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('missa_padrao', 'solenidade')),
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Escalas (Assignments)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    function_type TEXT NOT NULL CHECK (function_type IN ('live', 'fotos', 'videos', 'stories')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id, function_type)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_assignments_event ON public.assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON public.assignments(user_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- PROFILES: Todos autenticados podem ver
CREATE POLICY "profiles_select_authenticated" ON public.profiles
    FOR SELECT TO authenticated USING (true);

-- PROFILES: Apenas o próprio usuário pode atualizar
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- EVENTS: Todos autenticados podem ver
CREATE POLICY "events_select_authenticated" ON public.events
    FOR SELECT TO authenticated USING (true);

-- EVENTS: Somente admins podem inserir
CREATE POLICY "events_insert_admin" ON public.events
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- EVENTS: Somente admins podem deletar
CREATE POLICY "events_delete_admin" ON public.events
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- EVENTS: Somente admins podem atualizar
CREATE POLICY "events_update_admin" ON public.events
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ASSIGNMENTS: Todos autenticados podem ver
CREATE POLICY "assignments_select_authenticated" ON public.assignments
    FOR SELECT TO authenticated USING (true);

-- ASSIGNMENTS: Usuários podem inserir suas próprias escalas
CREATE POLICY "assignments_insert_own" ON public.assignments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ASSIGNMENTS: Usuários podem deletar suas próprias escalas OU admins podem deletar qualquer
CREATE POLICY "assignments_delete_own_or_admin" ON public.assignments
    FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- TRIGGER: Auto-criar perfil ao registrar
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'member'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
