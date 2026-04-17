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

    return <AdminClient profiles={allMembers || []} sysFunctions={functions || []} />;
}
