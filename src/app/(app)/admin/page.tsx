import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AdminClient } from './AdminClient';

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    const adminSupabase = createAdminClient();

    const { data: allMembers } = await adminSupabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

    const { data: functions } = await supabase
        .from('functions')
        .select('*')
        .order('id', { ascending: true });

    const defaultFunctions: any[] = [
        { id: 'live', label: 'Live', type: 'live', limit_padrao: 1, limit_solenidade: 1, is_active: true },
        { id: 'fotos', label: 'Fotos', type: 'fotos', limit_padrao: 1, limit_solenidade: 2, is_active: true },
        { id: 'videos', label: 'Vídeos', type: 'videos', limit_padrao: 0, limit_solenidade: 1, is_active: true },
        { id: 'stories', label: 'Stories', type: 'stories', limit_padrao: 1, limit_solenidade: 1, is_active: true }
    ];

    return <AdminClient profiles={allMembers || []} sysFunctions={functions || defaultFunctions} />;
}
