'use client';

import { useState, useTransition } from 'react';
import type { EventWithAssignments, FunctionType, EventType, Assignment } from '@/types';
import { FUNCTION_LABELS, SLOT_LIMITS, ACTIVE_FUNCTIONS } from '@/types';
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
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FUNCTION_ICONS: Record<FunctionType, React.ReactNode> = {
    live: <Radio size={16} />,
    fotos: <Camera size={16} />,
    videos: <Video size={16} />,
    stories: <Sparkles size={16} />,
};

interface EventCardProps {
    event: EventWithAssignments;
    currentUserId: string;
    isAdmin: boolean;
}

export function EventCard({ event, currentUserId, isAdmin }: EventCardProps) {
    const [isPending, startTransition] = useTransition();
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const eventDate = parseISO(event.event_date);
    const dayName = format(eventDate, 'EEEE', { locale: ptBR });
    const formattedDate = format(eventDate, "dd 'de' MMMM", { locale: ptBR });
    const isSolenidade = event.event_type === 'solenidade';

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
                showToast('success', `Vaga de ${FUNCTION_LABELS[functionType]} assumida!`);
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
                showToast('success', `Vaga de ${FUNCTION_LABELS[functionType]} liberada.`);
            }
            setActiveAction(null);
        });
    };

    const getAssignmentsForFunction = (functionType: FunctionType): Assignment[] => {
        return event.assignments?.filter(a => a.function_type === functionType) || [];
    };

    const getSlotLimit = (functionType: FunctionType): number => {
        return SLOT_LIMITS[event.event_type as EventType][functionType];
    };

    return (
        <div className="glass-card flex flex-col h-full">
            {/* Header */}
            <div className="p-5 border-b border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                        <Calendar size={14} />
                        {dayName}
                    </div>
                    <span className={`badge ${isSolenidade ? 'badge-solenidade' : 'badge-missa'} px-3 py-1`}>
                        {isSolenidade ? '✦ Solenidade' : 'Missa Padrão'}
                    </span>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                        {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <Clock size={14} />
                        {event.event_time?.slice(0, 5)} • {formattedDate}
                    </div>
                </div>
            </div>

            {/* Slots Section */}
            <div className="p-5 flex-1 space-y-6">
                {ACTIVE_FUNCTIONS.map(func => {
                    const assignments = getAssignmentsForFunction(func);
                    const limit = getSlotLimit(func);
                    const isFull = assignments.length >= limit;
                    const availableSlots = limit - assignments.length;

                    if (limit === 0) return null;

                    return (
                        <div key={func} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <span className={isFull ? 'text-primary' : 'text-zinc-500'}>
                                        {FUNCTION_ICONS[func]}
                                    </span>
                                    <span className="text-sm font-bold tracking-tight">
                                        {FUNCTION_LABELS[func]}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${isFull ? 'border-primary/50 text-primary' : 'border-zinc-800 text-zinc-500'}`}>
                                    {assignments.length} / {limit}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {assignments.map(assignment => {
                                    const isOwnSlot = assignment.user_id === currentUserId;
                                    return (
                                        <div
                                            key={assignment.id}
                                            className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                        ${isOwnSlot
                                                    ? 'bg-primary/20 border-primary/40 text-white shadow-[0_0_15px_rgba(0,0,255,0.1)]'
                                                    : 'bg-zinc-900/50 border-white/5 text-zinc-400'}`}
                                        >
                                            <UserIcon size={12} className={isOwnSlot ? 'text-primary' : 'text-zinc-600'} />
                                            <span className="max-w-[120px] truncate">
                                                {assignment.profiles?.full_name || 'Membro'}
                                            </span>
                                            {isOwnSlot && (
                                                <button
                                                    onClick={() => handleRelease(assignment.id, func)}
                                                    disabled={isPending}
                                                    className="hover:scale-110 transition-transform text-white/50 hover:text-white"
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

                                {Array.from({ length: availableSlots }).map((_, i) => (
                                    <button
                                        key={`available-${i}`}
                                        onClick={() => handleClaim(func)}
                                        disabled={isPending}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-zinc-800 text-zinc-600 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        {activeAction === `claim-${func}` ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Plus size={14} />
                                                Assumir
                                            </>
                                        )}
                                    </button>
                                ))}

                                {isFull && assignments.length > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] text-primary/60 font-bold uppercase tracking-wider pl-1">
                                        <CheckCircle2 size={10} />
                                        Full
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Visual Decor */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {/* Action Toasts */}
            {toast && (
                <div className="absolute top-2 left-2 right-2 z-50">
                    <div className={`px-4 py-3 rounded-xl text-xs font-bold shadow-2xl animate-in
             ${toast.type === 'success' ? 'bg-zinc-900 border border-green-500/50 text-green-500' : 'bg-zinc-900 border border-red-500/50 text-red-500'}`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}
