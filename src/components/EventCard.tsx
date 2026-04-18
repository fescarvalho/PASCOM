'use client';

import { useState, useTransition, useEffect } from 'react';
import type { EventWithAssignments, FunctionType, EventType, Assignment, SysFunction } from '@/types';
import { claimSlot, releaseSlot } from '@/app/(app)/dashboard/actions';
import {
    Calendar,
    Clock,
    Radio,
    Camera,
    Video,
    Plus,
    X,
    Loader2,
    Sparkles,
    User as UserIcon,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FUNCTION_ICONS: Record<FunctionType, React.ReactNode> = {
    live: <Radio size={14} />,
    fotos: <Camera size={14} />,
    videos: <Video size={14} />,
    stories: <Sparkles size={14} />,
};

const FUNCTION_COLORS: Record<FunctionType, { bg: string; border: string; text: string; bar: string }> = {
    live: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        bar: 'bg-blue-500',
    },
    fotos: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        bar: 'bg-purple-500',
    },
    videos: {
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/30',
        text: 'text-pink-400',
        bar: 'bg-pink-500',
    },
    stories: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        bar: 'bg-amber-500',
    },
};

interface EventCardProps {
    event: EventWithAssignments;
    currentUserId: string;
    isAdmin: boolean;
    sysFunctions: SysFunction[];
}

export function EventCard({ event, currentUserId, isAdmin, sysFunctions }: EventCardProps) {
    const [isPending, startTransition] = useTransition();
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [localAssignments, setLocalAssignments] = useState<Assignment[]>(event.assignments || []);

    useEffect(() => {
        setLocalAssignments(event.assignments || []);
    }, [event.assignments]);

    const eventDate = parseISO(event.event_date);
    const dayName = format(eventDate, 'EEEE', { locale: ptBR });
    const formattedDate = format(eventDate, "dd 'de' MMMM", { locale: ptBR });
    const isSolenidade = event.event_type === 'solenidade';
    const isTempoPascal = event.title.toLowerCase().includes('tempo pascal');

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleClaim = (functionType: FunctionType) => {
        setActiveAction(`claim-${functionType}`);
        startTransition(async () => {
            const result = await claimSlot(event.id, functionType);
            if (result.error) {
                showToast('error', result.error);
            } else {
                setLocalAssignments(prev => [...prev, {
                    id: `temp-${Date.now()}`,
                    event_id: event.id,
                    user_id: currentUserId,
                    function_type: functionType,
                    profiles: { id: currentUserId, full_name: 'Você (Carregando...)', role: 'member' }
                } as any]);
                const funcLabel = sysFunctions.find(f => f.id === functionType)?.label || functionType;
                showToast('success', `Vaga de ${funcLabel} assumida!`);
            }
            setActiveAction(null);
        });
    };

    const handleRelease = (assignmentId: string, functionType: FunctionType) => {
        setActiveAction(`release-${assignmentId}`);
        startTransition(async () => {
            const result = await releaseSlot(assignmentId);
            if (result.error) {
                showToast('error', result.error);
            } else {
                setLocalAssignments(prev => prev.filter(a => a.id !== assignmentId));
                const funcLabel = sysFunctions.find(f => f.id === functionType)?.label || functionType;
                showToast('success', `Vaga de ${funcLabel} liberada.`);
            }
            setActiveAction(null);
        });
    };

    const getAssignmentsForFunction = (functionType: FunctionType): Assignment[] =>
        localAssignments.filter(a => a.function_type === functionType);

    const getSlotLimit = (sysFunc: SysFunction): number =>
        event.event_type === 'solenidade' ? sysFunc.limit_solenidade : sysFunc.limit_padrao;

    // Calculate overall fill progress
    const totalSlots = sysFunctions.reduce((acc, f) => acc + getSlotLimit(f), 0);
    const filledSlots = localAssignments.filter(a => sysFunctions.some(f => f.id === a.function_type)).length;
    const overallPercent = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
    const isFullyStaffed = filledSlots >= totalSlots && totalSlots > 0;
    const hasMySlot = localAssignments.some(a => a.user_id === currentUserId);

    return (
        <div className={`relative flex flex-col rounded-3xl border backdrop-blur-sm overflow-hidden group transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,0,0,0.4)] ${
            isSolenidade 
                ? 'bg-zinc-900/60 border-amber-500/20 shadow-[0_0_20px_rgba(191,149,63,0.1)] hover:border-amber-500/40' 
                : 'bg-zinc-900/40 border-white/5 hover:border-white/10'
        }`}>

            {/* Top accent bar */}
            <div className={`h-1 w-full ${
                isSolenidade 
                    ? 'bg-gradient-to-r from-amber-600 via-yellow-200 to-amber-600' 
                    : 'bg-gradient-to-r from-primary/60 via-primary to-primary/60'
            }`} />

            {/* Header */}
            <div className="p-5 pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Date block */}
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border shrink-0 transition-colors duration-500 ${
                            isSolenidade
                                ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/40'
                                : isTempoPascal
                                    ? 'bg-white/5 border-white/10'
                                    : 'bg-primary/10 border-primary/20'
                        }`}>
                            <span className={`text-lg font-black leading-none transition-colors duration-500 ${
                                isSolenidade 
                                    ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                                    : isTempoPascal
                                        ? 'text-white'
                                        : 'text-primary'
                            }`}>
                                {format(eventDate, 'dd')}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors duration-500 ${
                                isSolenidade 
                                    ? 'text-amber-500/80' 
                                    : isTempoPascal
                                        ? 'text-white/60'
                                        : 'text-primary/60'
                            }`}>
                                {format(eventDate, 'MMM', { locale: ptBR })}
                            </span>
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-0.5 transition-colors duration-500 ${
                                isSolenidade 
                                    ? 'text-amber-400' 
                                    : isTempoPascal
                                        ? 'text-white/40'
                                        : 'text-primary'
                            }`}>
                                {dayName}
                            </p>
                            <h3 className={`text-base font-black tracking-tight leading-tight transition-colors duration-500 ${
                                isSolenidade ? 'text-amber-50/90' : 'text-white'
                            }`}>
                                {event.title}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1 text-zinc-500">
                                <Clock size={11} />
                                <span className="text-xs font-medium">{event.event_time?.slice(0, 5)}</span>
                                <span className="text-zinc-700">•</span>
                                <span className="text-xs">{formattedDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Type badge */}
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all duration-500 ${
                        isSolenidade
                            ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}>
                        {isSolenidade ? '✦ Solenidade' : 'Padrão'}
                    </span>
                </div>

                {/* Overall progress */}
                <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${isFullyStaffed ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${overallPercent}%` }}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {isFullyStaffed ? (
                            <CheckCircle2 size={13} className="text-green-500" />
                        ) : filledSlots === 0 ? (
                            <AlertCircle size={13} className="text-zinc-600" />
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                            isFullyStaffed ? 'text-green-500' : filledSlots === 0 ? 'text-zinc-600' : 'text-zinc-400'
                        }`}>
                            {isFullyStaffed ? 'Completo' : `${filledSlots}/${totalSlots} vagas`}
                        </span>
                    </div>
                </div>

                {/* "You're in" indicator */}
                {hasMySlot && (
                    <div className="mt-2.5 flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5">
                        <CheckCircle2 size={12} className="text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Você está escalado</span>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-white/5" />

            {/* Function Slots */}
            <div className="p-5 flex-1 space-y-4">
                {sysFunctions.map(func => {
                    const assignments = getAssignmentsForFunction(func.id);
                    const limit = getSlotLimit(func);
                    const isFull = assignments.length >= limit;
                    const availableSlots = limit - assignments.length;
                    const fillPercent = limit > 0 ? (assignments.length / limit) * 100 : 0;
                    
                    const defaultColor = { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', bar: 'bg-indigo-500' };
                    const defaultIcon = <Radio size={14} />;
                    const colors = FUNCTION_COLORS[func.id] || defaultColor;
                    const icon = FUNCTION_ICONS[func.id] || defaultIcon;
                    
                    const myAssignment = assignments.find(a => a.user_id === currentUserId);

                    if (limit === 0) return null;

                    return (
                        <div key={func.id} className={`rounded-2xl border p-3.5 transition-all ${colors.bg} ${colors.border}`}>
                            {/* Function header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className={`flex items-center gap-2 ${colors.text}`}>
                                    {icon}
                                    <span className="text-xs font-black tracking-tight">{func.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Mini progress */}
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: limit }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-4 h-1.5 rounded-full transition-all duration-500 ${i < assignments.length ? colors.bar : 'bg-white/10'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className={`text-[10px] font-black tabular-nums ${isFull ? colors.text : 'text-zinc-600'}`}>
                                        {assignments.length}/{limit}
                                    </span>
                                </div>
                            </div>

                            {/* Assigned people */}
                            <div className="space-y-1.5">
                                {assignments.map(assignment => {
                                    const isOwnSlot = assignment.user_id === currentUserId;
                                    const initials = assignment.profiles?.full_name
                                        ?.split(' ')
                                        .slice(0, 2)
                                        .map(n => n[0])
                                        .join('') || '?';
                                    return (
                                        <div
                                            key={assignment.id}
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                                                isOwnSlot
                                                    ? 'bg-white/10 border border-white/15'
                                                    : 'bg-black/20'
                                            }`}
                                        >
                                            {/* Avatar */}
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                                isOwnSlot
                                                    ? `${colors.bg} ${colors.text} border ${colors.border}`
                                                    : 'bg-zinc-800 text-zinc-400'
                                            }`}>
                                                {initials}
                                            </div>
                                            <span className={`text-xs font-bold flex-1 truncate ${isOwnSlot ? 'text-white' : 'text-zinc-400'}`}>
                                                {isOwnSlot ? `${assignment.profiles?.full_name || 'Você'} (você)` : assignment.profiles?.full_name || 'Membro'}
                                            </span>
                                            {isOwnSlot && (
                                                <button
                                                    onClick={() => handleRelease(assignment.id, func.id)}
                                                    disabled={isPending}
                                                    className="shrink-0 p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                    title="Liberar vaga"
                                                >
                                                    {activeAction === `release-${assignment.id}` ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <X size={12} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Available slots */}
                                {availableSlots > 0 && (
                                    <button
                                        onClick={() => handleClaim(func.id)}
                                        disabled={isPending || !!myAssignment}
                                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-dashed transition-all
                                            ${myAssignment
                                                ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                                                : `${colors.border} ${colors.text} hover:bg-white/5 active:scale-[0.98]`
                                            }`}
                                    >
                                        {activeAction === `claim-${func.id}` ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Plus size={13} />
                                                {availableSlots === 1 ? '1 vaga disponível' : `${availableSlots} vagas disponíveis`}
                                            </>
                                        )}
                                    </button>
                                )}

                                {isFull && (
                                    <div className={`flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-widest ${colors.text} opacity-70`}>
                                        <CheckCircle2 size={10} />
                                        Equipe completa
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Toast */}
            {toast && (
                <div className="absolute top-3 left-3 right-3 z-50">
                    <div className={`px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl border flex items-center gap-2
                        ${toast.type === 'success'
                            ? 'bg-zinc-900 border-green-500/40 text-green-400'
                            : 'bg-zinc-900 border-red-500/40 text-red-400'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}
