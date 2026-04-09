'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: {
    title: string;
    event_type: string;
    event_date: string;
    event_time: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Não autenticado.' };

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Acesso negado. Somente admins.' };
    }

    const { error } = await supabase
        .from('events')
        .insert({
            title: formData.title,
            event_type: formData.event_type,
            event_date: formData.event_date,
            event_time: formData.event_time,
            created_by: user.id,
        });

    if (error) {
        console.error('Error creating event:', error);
        return { error: 'Erro ao criar evento.' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true };
}

export async function deleteEvent(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Não autenticado.' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Acesso negado.' };
    }

    // Delete assignments first
    await supabase
        .from('assignments')
        .delete()
        .eq('event_id', eventId);

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

    if (error) {
        console.error('Error deleting event:', error);
        return { error: 'Erro ao deletar evento.' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true };
}

export async function adminRemoveAssignment(assignmentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Não autenticado.' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Acesso negado.' };
    }

    const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

    if (error) {
        console.error('Error removing assignment:', error);
        return { error: 'Erro ao remover escala.' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true };
}

export async function getUpcomingEvents() {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
        .from('events')
        .select(`
      *,
      assignments (
        *,
        profiles (id, full_name)
      )
    `)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(20);

    return data || [];
}

export async function generateRecurringEvents(weeksAhead: number = 4) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Não autenticado.' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Acesso negado.' };
    }

    const events = [];
    const today = new Date();

    for (let week = 0; week < weeksAhead; week++) {
        const baseDate = new Date(today);
        baseDate.setDate(baseDate.getDate() + (week * 7));

        // Find next Thursday
        const thursday = new Date(baseDate);
        const dayOfWeek = thursday.getDay();
        const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
        thursday.setDate(thursday.getDate() + (daysUntilThursday === 0 && week > 0 ? 7 : daysUntilThursday));

        // Find next Sunday
        const sunday = new Date(baseDate);
        const daysUntilSunday = (0 - dayOfWeek + 7) % 7;
        sunday.setDate(sunday.getDate() + (daysUntilSunday === 0 && week > 0 ? 7 : daysUntilSunday));

        if (thursday >= today) {
            events.push({
                title: 'Missa de Quinta-feira',
                event_type: 'missa_padrao',
                event_date: thursday.toISOString().split('T')[0],
                event_time: '19:30',
                created_by: user.id,
            });
        }

        if (sunday >= today) {
            events.push({
                title: 'Missa de Domingo',
                event_type: 'missa_padrao',
                event_date: sunday.toISOString().split('T')[0],
                event_time: '08:00',
                created_by: user.id,
            });
        }
    }

    if (events.length === 0) {
        return { error: 'Nenhum evento para gerar.' };
    }

    // Check for duplicates
    const dates = events.map(e => e.event_date);
    const { data: existing } = await supabase
        .from('events')
        .select('event_date, event_time')
        .in('event_date', dates);

    const existingSet = new Set(existing?.map(e => `${e.event_date}-${e.event_time}`) || []);
    const newEvents = events.filter(e => !existingSet.has(`${e.event_date}-${e.event_time}`));

    if (newEvents.length === 0) {
        return { error: 'Todos os eventos já existem.' };
    }

    const { error } = await supabase
        .from('events')
        .insert(newEvents);

    if (error) {
        console.error('Error generating events:', error);
        return { error: 'Erro ao gerar eventos.' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true, count: newEvents.length };
}

export async function registerMember(formData: {
    full_name: string;
    email: string;
    role: 'member' | 'admin';
    password?: string;
}) {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado.' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Acesso negado.' };
    }

    // Generate a temporary random password if not provided
    const finalPassword = formData.password || (Math.random().toString(36).slice(-10) + 'A1!');

    // 1. Create Auth User (Admin Client)
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: formData.email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { full_name: formData.full_name }
    });

    if (authError) {
        console.error('Auth Error:', authError);
        return { error: `Erro ao criar usuário: ${authError.message}` };
    }

    // 2. Create Profile
    const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
            id: authUser.user.id,
            full_name: formData.full_name,
            email: formData.email,
            role: formData.role
        });

    if (profileError) {
        console.error('Profile Error:', profileError);
        // Clean up auth user if profile fail
        await adminClient.auth.admin.deleteUser(authUser.user.id);
        return { error: 'Erro ao criar perfil do usuário.' };
    }

    revalidatePath('/admin');
    revalidatePath('/membros');
    return { success: true, tempPassword: finalPassword };
}

export async function deleteMember(memberId: string) {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado.' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Acesso negado.' };
    }

    // 1. Delete Auth User (cascades or we handle profiles manually if needed)
    const { error: authError } = await adminClient.auth.admin.deleteUser(memberId);

    if (authError) {
        return { error: 'Erro ao deletar usuário do Auth.' };
    }

    // Profile usually cascades if DB is set up right, but we can be explicit
    await adminClient.from('profiles').delete().eq('id', memberId);

    revalidatePath('/admin');
    revalidatePath('/membros');
    return { success: true };
}
