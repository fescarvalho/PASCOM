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
        <div style={{ paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <div>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#FFFFFF',
                        marginBottom: '4px',
                    }}>
                        Painel Admin
                    </h1>
                    <p style={{ fontSize: '14px', color: '#888' }}>
                        Gerencie eventos e escalas
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        className="btn-outline"
                        onClick={handleGenerateEvents}
                        disabled={isPending}
                    >
                        <CalendarPlus size={18} />
                        Gerar Missas (4 semanas)
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                    >
                        <Plus size={18} />
                        Novo Evento
                    </button>
                </div>
            </div>

            {/* Create Event Form */}
            {showCreateForm && (
                <div className="glass-card animate-slide-up" style={{
                    padding: '24px',
                    marginBottom: '24px',
                }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        marginBottom: '20px',
                    }}>
                        Criar Novo Evento
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '20px',
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                color: '#888',
                                marginBottom: '6px',
                            }}>Título</label>
                            <input
                                className="input-field"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Missa de Quinta-feira"
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                color: '#888',
                                marginBottom: '6px',
                            }}>Tipo</label>
                            <select
                                className="input-field"
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                            >
                                <option value="missa_padrao">Missa Padrão</option>
                                <option value="solenidade">Solenidade/Evento</option>
                            </select>
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                color: '#888',
                                marginBottom: '6px',
                            }}>Data</label>
                            <input
                                type="date"
                                className="input-field"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                color: '#888',
                                marginBottom: '6px',
                            }}>Horário</label>
                            <input
                                type="time"
                                className="input-field"
                                value={eventTime}
                                onChange={(e) => setEventTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                            className="btn-outline"
                            onClick={() => setShowCreateForm(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleCreateEvent}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            Criar Evento
                        </button>
                    </div>
                </div>
            )}

            {/* Events List */}
            {loading ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '60px',
                }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: '#0000FF' }} />
                </div>
            ) : events.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#666',
                }}>
                    <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p style={{ fontSize: '16px' }}>Nenhum evento futuro</p>
                    <p style={{ fontSize: '13px', marginTop: '8px' }}>
                        Clique em &quot;Gerar Missas&quot; para criar eventos automaticamente
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {events.map((event: any) => {
                        const isExpanded = expandedEvent === event.id;
                        const eventDate = parseISO(event.event_date);
                        const isSolenidade = event.event_type === 'solenidade';

                        return (
                            <div key={event.id} className="glass-card" style={{ overflow: 'hidden' }}>
                                {/* Event header */}
                                <div
                                    style={{
                                        padding: '16px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        gap: '12px',
                                    }}
                                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '12px',
                                            background: isSolenidade
                                                ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))'
                                                : 'linear-gradient(135deg, rgba(0,0,255,0.15), rgba(0,0,255,0.05))',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <span style={{
                                                fontSize: '14px',
                                                fontWeight: '700',
                                                color: isSolenidade ? '#FFD700' : '#6666FF',
                                                lineHeight: 1,
                                            }}>
                                                {format(eventDate, 'dd')}
                                            </span>
                                            <span style={{
                                                fontSize: '10px',
                                                color: isSolenidade ? '#FFD700' : '#6666FF',
                                                textTransform: 'uppercase',
                                            }}>
                                                {format(eventDate, 'MMM', { locale: ptBR })}
                                            </span>
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                color: '#FFFFFF',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {event.title}
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                marginTop: '4px',
                                            }}>
                                                <span style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> {event.event_time?.slice(0, 5)}
                                                </span>
                                                <span className={`badge-type ${isSolenidade ? 'badge-solenidade' : 'badge-missa'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                                    {isSolenidade ? 'Solenidade' : 'Padrão'}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#666' }}>
                                                    {event.assignments?.length || 0} escalados
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteEvent(event.id);
                                            }}
                                            className="btn-danger"
                                            style={{ padding: '6px 10px' }}
                                            disabled={isPending}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        {isExpanded ? <ChevronUp size={20} color="#666" /> : <ChevronDown size={20} color="#666" />}
                                    </div>
                                </div>

                                {/* Expanded: Assignments */}
                                {isExpanded && (
                                    <div style={{
                                        padding: '0 20px 20px',
                                        borderTop: '1px solid var(--color-border)',
                                        paddingTop: '16px',
                                    }}>
                                        {(!event.assignments || event.assignments.length === 0) ? (
                                            <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                                                Nenhuma escala neste evento
                                            </p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {event.assignments.map((assignment: any) => (
                                                    <div
                                                        key={assignment.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '10px 14px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            border: '1px solid rgba(255,255,255,0.04)',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <UserIcon size={16} color="#666" />
                                                            <span style={{ fontSize: '14px', color: '#FFFFFF' }}>
                                                                {assignment.profiles?.full_name || 'Membro'}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                color: '#0000FF',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                background: 'rgba(0,0,255,0.1)',
                                                            }}>
                                                                {FUNCTION_LABELS[assignment.function_type as FunctionType]}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                                            disabled={isPending}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#ff3333',
                                                                cursor: 'pointer',
                                                                padding: '4px',
                                                                borderRadius: '6px',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                            title="Remover escala"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}
