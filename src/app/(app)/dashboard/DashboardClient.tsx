'use client';

import { useState, useEffect, useCallback } from 'react';
import { getWeekEvents } from '@/app/(app)/dashboard/actions';
import { EventCard } from '@/components/EventCard';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, RefreshCw } from 'lucide-react';
import type { EventWithAssignments } from '@/types';

interface DashboardClientProps {
    userId: string;
    isAdmin: boolean;
}

export function DashboardClient({ userId, isAdmin }: DashboardClientProps) {
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [events, setEvents] = useState<EventWithAssignments[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

    const fetchEvents = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const startStr = format(weekStart, 'yyyy-MM-dd');
        const endStr = format(weekEnd, 'yyyy-MM-dd');

        try {
            const data = await getWeekEvents(startStr, endStr);
            setEvents(data as EventWithAssignments[]);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [weekStart.toISOString(), weekEnd.toISOString()]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => fetchEvents(true), 60000);
        return () => clearInterval(interval);
    }, [fetchEvents]);

    const goToNextWeek = () => setCurrentWeek(prev => addWeeks(prev, 1));
    const goToPrevWeek = () => setCurrentWeek(prev => subWeeks(prev, 1));
    const goToThisWeek = () => setCurrentWeek(new Date());

    const isCurrentWeek = format(weekStart, 'yyyy-ww') === format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-ww');

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-zinc-900/50 to-black p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors" />

                <div className="relative space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                        Escalas da <span className="text-primary italic">Semana</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium max-w-md">
                        Confira as escalas e assuma sua vaga para contribuir com a nossa missão.
                    </p>
                </div>

                <div className="flex items-center gap-3 relative">
                    <div className="flex bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-xl">
                        <button
                            onClick={goToPrevWeek}
                            className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-white"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-6 flex items-center justify-center min-w-[180px]">
                            <span className="text-sm font-bold tracking-tight text-white block truncate">
                                {format(weekStart, "dd MMM", { locale: ptBR })} — {format(weekEnd, "dd MMM", { locale: ptBR })}
                            </span>
                        </div>
                        <button
                            onClick={goToNextWeek}
                            className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-white"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {!isCurrentWeek && (
                        <button
                            onClick={goToThisWeek}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-xs font-black uppercase tracking-widest"
                        >
                            Hoje
                        </button>
                    )}

                    <button
                        onClick={() => fetchEvents(true)}
                        disabled={refreshing}
                        className="p-3 bg-primary/10 hover:bg-primary/20 rounded-2xl border border-primary/20 transition-all text-primary"
                    >
                        <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Events Feed */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 size={40} className="animate-spin text-primary" />
                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Carregando escalas...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 border border-white/5">
                        <CalendarDays size={32} className="text-zinc-700" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Sem escalas para esta semana</h3>
                    <p className="text-zinc-500 text-sm max-w-xs px-6">
                        Não encontramos missas ou eventos cadastrados no período selecionado.
                    </p>
                    <button
                        onClick={goToNextWeek}
                        className="mt-8 text-primary font-bold text-sm hover:underline"
                    >
                        Ver próxima semana →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 animate-in">
                    {events.map((event, index) => (
                        <div key={event.id} className="transition-all hover:scale-[1.01]">
                            <EventCard
                                event={event}
                                currentUserId={userId}
                                isAdmin={isAdmin}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
