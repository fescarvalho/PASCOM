'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    createEvent,
    deleteEvent,
    adminRemoveAssignment,
    getUpcomingEvents,
    generateRecurringEvents,
} from './actions';
import { FUNCTION_LABELS } from '@/types';
import type { FunctionType } from '@/types';
import {
    Plus,
    Trash2,
    Calendar,
    Clock,
    Loader2,
    RefreshCw,
    CalendarPlus,
    ChevronDown,
    ChevronUp,
    Target,
    Shield,
    CalendarDays,
    User as UserIcon,
    X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminClient() {
    const [isPending, startTransition] = useTransition();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [eventType, setEventType] = useState('missa_padrao');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('19:30');

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchEvents = async () => {
        setLoading(true);
        const data = await getUpcomingEvents();
        setEvents(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCreateEvent = () => {
        if (!title || !eventDate || !eventTime) {
            showToast('error', 'Preencha todos os campos.');
            return;
        }

        startTransition(async () => {
            const result = await createEvent({
                title,
                event_type: eventType,
                event_date: eventDate,
                event_time: eventTime,
            });

            if (result.error) {
                showToast('error', result.error);
            } else {
                showToast('success', 'Evento criado com sucesso!');
                setTitle('');
                setEventDate('');
                setShowCreateForm(false);
                fetchEvents();
            }
        });
    };

    const handleDeleteEvent = (eventId: string) => {
        if (!confirm('Tem certeza que deseja deletar este evento e todas as escalas?')) return;

        startTransition(async () => {
            const result = await deleteEvent(eventId);
            if (result.error) {
                showToast('error', result.error);
            } else {
                showToast('success', 'Evento deletado.');
                fetchEvents();
            }
        });
    };

    const handleRemoveAssignment = (assignmentId: string) => {
        startTransition(async () => {
            const result = await adminRemoveAssignment(assignmentId);
            if (result.error) {
                showToast('error', result.error);
            } else {
                showToast('success', 'Escala removida.');
                fetchEvents();
            }
        });
    };

    const handleGenerateEvents = () => {
        startTransition(async () => {
            const result = await generateRecurringEvents(4);
            if (result.error) {
                showToast('error', result.error);
            } else {
                showToast('success', `${result.count} eventos gerados!`);
                fetchEvents();
            }
        });
    };

    return (
        <div className="pb-32 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
                            Painel Admin
                        </h1>
                    </div>
                    <p className="text-zinc-500 font-medium ml-4.5">
                        Central de comando para gestão de eventos e escalas paroquiais
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                        onClick={handleGenerateEvents}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
                        Gerar 4 Semanas
                    </button>
                    <button
                        className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white shadow-[0_10px_25px_rgba(0,0,255,0.25)] hover:shadow-[0_15px_30px_rgba(0,0,255,0.35)] transition-all duration-300 flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                    >
                        {showCreateForm ? <X size={18} /> : <Plus size={18} />}
                        {showCreateForm ? 'Fechar Form' : 'Novo Evento'}
                    </button>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center gap-5 group hover:bg-white/[0.04] transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Total Eventos</p>
                        <p className="text-2xl font-black text-white">{events.length}</p>
                    </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center gap-5 group hover:bg-white/[0.04] transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                        <UserIcon size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Membros Escalados</p>
                        <p className="text-2xl font-black text-white">
                            {events.reduce((acc, ev) => acc + (ev.assignments?.length || 0), 0)}
                        </p>
                    </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center gap-5 group hover:bg-white/[0.04] transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Status Sistema</p>
                        <p className="text-2xl font-black text-white">100%</p>
                    </div>
                </div>
            </div>

            {/* Create Event Form */}
            {showCreateForm && (
                <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 md:p-10 mb-10 animate-in slide-in-from-top duration-500 overflow-hidden relative group">
                    {/* Subtle Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/[0.05] blur-3xl pointer-events-none" />

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                            <Plus size={20} />
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight">
                            Criar Novo Evento
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500 ml-1">Título do Evento</label>
                            <input
                                className="w-full h-[56px] bg-white/[0.03] border border-white/5 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all placeholder:text-zinc-700"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Missa de Quinta-feira"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500 ml-1">Tipo</label>
                            <div className="relative">
                                <select
                                    className="w-full h-[56px] bg-white/[0.03] border border-white/5 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all appearance-none cursor-pointer"
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                >
                                    <option value="missa_padrao">Missa Padrão</option>
                                    <option value="solenidade">Solenidade / Evento</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500 ml-1">Data</label>
                            <input
                                type="date"
                                className="w-full h-[56px] bg-white/[0.03] border border-white/5 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500 ml-1">Horário</label>
                            <input
                                type="time"
                                className="w-full h-[56px] bg-white/[0.03] border border-white/5 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]"
                                value={eventTime}
                                onChange={(e) => setEventTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                            className="px-6 py-3 rounded-xl text-zinc-500 hover:text-zinc-300 font-bold text-xs uppercase tracking-widest transition-colors"
                            onClick={() => setShowCreateForm(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/10 disabled:opacity-50 flex items-center gap-2"
                            onClick={handleCreateEvent}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Finalizar Cadastro
                        </button>
                    </div>
                </div>
            )}

            {/* Events List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 size={48} className="animate-spin text-blue-600/50" />
                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Carregando Dashboard...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 px-6 bg-white/[0.02] border border-dashed border-white/5 rounded-[40px] text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
                        <Calendar size={32} className="text-zinc-700" />
                    </div>
                    <p className="text-2xl font-black text-white mb-2">Nenhum evento futuro</p>
                    <p className="text-zinc-500 font-medium max-w-[300px] mx-auto text-sm">
                        Não existem missas ou eventos cadastrados no momento.
                        Clique em <span className="text-blue-500 cursor-pointer hover:underline" onClick={handleGenerateEvents}>Gerar 4 Semanas</span> para popular o sistema.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event: any) => {
                        const isExpanded = expandedEvent === event.id;
                        const eventDateObj = parseISO(event.event_date);
                        const isSolenidade = event.event_type === 'solenidade';

                        return (
                            <div
                                key={event.id}
                                className={`group flex flex-col bg-white/[0.03] border ${isExpanded ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-white/5'} rounded-[32px] overflow-hidden transition-all duration-500 hover:bg-white/[0.05] hover:border-white/10`}
                            >
                                {/* Card Header / Summary */}
                                <div
                                    className="p-6 cursor-pointer"
                                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        {/* Date Badge */}
                                        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${isSolenidade
                                            ? 'bg-amber-500/10 text-amber-500'
                                            : 'bg-blue-500/10 text-blue-500'
                                            } transition-transform duration-500 group-hover:scale-105`}>
                                            <span className="text-xl font-black leading-none mb-0.5">
                                                {format(eventDateObj, 'dd')}
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-tighter">
                                                {format(eventDateObj, 'MMM', { locale: ptBR })}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteEvent(event.id);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-red-500/5 hover:bg-red-500/20 text-red-500 transition-all flex items-center justify-center"
                                                disabled={isPending}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="min-w-0">
                                            <h4 className="text-lg font-black text-white leading-tight mb-2 truncate">
                                                {event.title}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] rounded-lg border border-white/5">
                                                    <Clock size={12} className="text-zinc-500" />
                                                    <span className="text-[11px] font-bold text-zinc-400">
                                                        {event.event_time?.slice(0, 5)}h
                                                    </span>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${isSolenidade
                                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                    }`}>
                                                    {isSolenidade ? 'Solenidade' : 'Missa'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex -space-x-3 overflow-hidden">
                                                {event.assignments?.slice(0, 5).map((a: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-[#0a0c12] flex items-center justify-center text-[10px] font-bold text-blue-500"
                                                        title={a.profiles?.full_name}
                                                    >
                                                        {a.profiles?.full_name?.charAt(0)}
                                                    </div>
                                                ))}
                                                {event.assignments?.length > 5 && (
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#0a0c12] flex items-center justify-center text-[8px] font-black text-zinc-500 uppercase">
                                                        +{event.assignments.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                                {event.assignments?.length || 0} Escalados
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Assignments Detail */}
                                <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[1000px] border-t border-white/5' : 'max-h-0'}`}>
                                    <div className="p-6 bg-white/[0.01]">
                                        <div className="flex items-center justify-between mb-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Membros da Escala</h5>
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        </div>

                                        {(!event.assignments || event.assignments.length === 0) ? (
                                            <div className="py-4 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                                <p className="text-xs font-bold text-zinc-600 italic">Vazia</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {event.assignments.map((assignment: any) => (
                                                    <div
                                                        key={assignment.id}
                                                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 group/assign hover:bg-white/[0.05] transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                                <UserIcon size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-white leading-none mb-1">
                                                                    {assignment.profiles?.full_name || 'Membro'}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest leading-none">
                                                                    {FUNCTION_LABELS[assignment.function_type as FunctionType]}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                                            disabled={isPending}
                                                            className="w-8 h-8 rounded-lg bg-zinc-900/50 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center opacity-0 group-hover/assign:opacity-100"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Toast System */}
            {toast && (
                <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-50 animate-in slide-in-from-right duration-500">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all ${toast.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-500'
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        <span className="text-sm font-black uppercase tracking-widest">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
