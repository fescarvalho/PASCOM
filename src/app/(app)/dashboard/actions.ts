'use server';

import { createClient } from '@/lib/supabase/server';
import { SLOT_LIMITS } from '@/types';
import type { FunctionType, EventType } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getWeekEvents(startDate: string, endDate: string) {
    const supabase = await createClient();

    const { data: events, error } = await supabase
        .from('events')
        .select(`
      *,
      assignments (
        *,
        profiles (id, full_name, role)
      )
    `)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true });

    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }

    return events || [];
}

export async function claimSlot(eventId: string, functionType: FunctionType) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Não autenticado.' };
    }

    // Get the event to check type
    const { data: event } = await supabase
        .from('events')
        .select('event_type')
        .eq('id', eventId)
        .single();

    if (!event) {
        return { error: 'Evento não encontrado.' };
    }

    const eventType = event.event_type as EventType;
    const limit = SLOT_LIMITS[eventType][functionType];

    if (limit === 0) {
        return { error: 'Esta função está desativada no momento.' };
    }

    // Count current assignments for this function in this event
    const { count } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('function_type', functionType);

    if ((count ?? 0) >= limit) {
        return { error: `Limite de ${limit} vaga(s) atingido para esta função.` };
    }

    // Check if user already has ANY function in this event
    const { data: existing } = await supabase
        .from('assignments')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (existing) {
        return { error: 'Você já possui uma função nesta escala. Não é possível acumular.' };
    }

    // Create the assignment
    const { error } = await supabase
        .from('assignments')
        .insert({
            event_id: eventId,
            user_id: user.id,
            function_type: functionType,
        });

    if (error) {
        console.error('Error claiming slot:', error);
        return { error: 'Erro ao assumir vaga. Tente novamente.' };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function releaseSlot(assignmentId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Não autenticado.' };
    }

    // Verify the assignment belongs to the user
    const { data: assignment } = await supabase
        .from('assignments')
        .select('user_id')
        .eq('id', assignmentId)
        .single();

    if (!assignment || assignment.user_id !== user.id) {
        return { error: 'Você não pode remover esta escala.' };
    }

    const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

    if (error) {
        console.error('Error releasing slot:', error);
        return { error: 'Erro ao liberar vaga. Tente novamente.' };
    }

    revalidatePath('/dashboard');
    return { success: true };
}
