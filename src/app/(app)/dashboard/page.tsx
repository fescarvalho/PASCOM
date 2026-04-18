import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

    const { data: functions } = await supabase
        .from('functions')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

    // Fallback completo baseado na interface SysFunction
    const defaultFunctions: any[] = [
        { id: 'live', label: 'Transmissão Ao Vivo', type: 'live', limit_padrao: 1, limit_solenidade: 2, is_active: true },
        { id: 'fotos', label: 'Fotografia', type: 'fotos', limit_padrao: 1, limit_solenidade: 2, is_active: true },
        { id: 'videos', label: 'Captação de Vídeo', type: 'videos', limit_padrao: 1, limit_solenidade: 2, is_active: true },
        { id: 'stories', label: 'Cobertura Stories', type: 'stories', limit_padrao: 1, limit_solenidade: 1, is_active: true }
    ];

    return <DashboardClient userId={user!.id} isAdmin={profile?.role === 'admin'} sysFunctions={functions || defaultFunctions} />;
}
