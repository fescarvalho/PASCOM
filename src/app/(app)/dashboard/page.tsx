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

    return <DashboardClient userId={user!.id} isAdmin={profile?.role === 'admin'} sysFunctions={functions || []} />;
}
