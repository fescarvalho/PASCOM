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

    return <DashboardClient userId={user!.id} isAdmin={profile?.role === 'admin'} />;
}
