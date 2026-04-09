'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    createEvent,
    deleteEvent,
    adminRemoveAssignment,
    getUpcomingEvents,
    generateRecurringEvents,
    registerMember,
    deleteMember,
} from './actions';
import { FUNCTION_LABELS } from '@/types';
import type { FunctionType } from '@/types';
import {
    Plus,
    Trash2,
    Calendar,
    Clock,
    Loader2,
    CalendarPlus,
    ChevronDown,
    X,
    UserPlus,
    Users,
    Search,
    Bell,
    HelpCircle,
    LayoutDashboard,
    Settings,
    MoreVertical,
    CheckCircle2,
    Clock3,
    Send,
    LogOut,
    Church,
    Book,
    Music,
    Video,
    Share2,
    Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminClientProps {
    profiles: any[];
}

export function AdminClient({ profiles }: AdminClientProps) {
    const [isPending, startTransition] = useTransition();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'events' | 'members'>('events');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
    const [viewFilter, setViewFilter] = useState<'semana' | 'mes' | 'equipes'>('mes');
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form state for Event
    const [title, setTitle] = useState('');
    const [eventType, setEventType] = useState('missa_padrao');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('19:30');

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
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
            showToast('Preencha todos os campos.', 'error');
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
                showToast(result.error, 'error');
            } else {
                showToast('Evento criado com sucesso!', 'success');
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
                showToast(result.error, 'error');
            } else {
                showToast('Evento deletado.', 'success');
                fetchEvents();
            }
        });
    };

    const handleRemoveAssignment = (assignmentId: string) => {
        startTransition(async () => {
            const result = await adminRemoveAssignment(assignmentId);
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Escala removida.', 'success');
                fetchEvents();
            }
        });
    };

    const handleGenerateEvents = async () => {
        setLoading(true);
        const res = await generateRecurringEvents(4);
        if (res.success) {
            showToast(`Sucesso! ${res.count} eventos gerados.`, 'success');
            fetchEvents();
        } else {
            showToast(res.error || 'Erro ao gerar eventos.', 'error');
        }
        setLoading(false);
    };

    const handleRegisterMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = {
            full_name: formData.get('full_name') as string,
            email: formData.get('email') as string,
            role: formData.get('role') as 'member' | 'admin',
            password: formData.get('password') as string | undefined,
        };

        const res = await registerMember(data);
        if (res.success) {
            showToast(`Membro cadastrado com sucesso! SENHA: ${res.tempPassword}`, 'success');
            (e.target as HTMLFormElement).reset();
            setIsFormOpen(false);
        } else {
            showToast(res.error || 'Erro ao cadastrar.', 'error');
        }
        setLoading(false);
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este membro definitivamente?')) return;
        setLoading(true);
        const res = await deleteMember(id);
        if (res.success) {
            showToast('Membro removido do sistema.', 'success');
        } else {
            showToast(res.error || 'Erro ao remover membro.', 'error');
        }
        setLoading(false);
    };

    const nextEvent = events[0];

    return (
        <div className="flex min-h-screen bg-surface-dim font-body selection:bg-primary/30 w-full">
            {/* Main Content Area */}
            <main className="main-content flex-1 flex flex-col relative w-full max-w-full overflow-hidden">
                {/* TopAppBar */}
                <header className="sticky top-0 right-0 w-full h-20 bg-surface-dim/60 backdrop-blur-xl flex justify-between items-center px-6 md:px-10 z-40 border-b border-outline-variant/5">
                    <div className="flex bg-surface-container-low p-1 rounded-full border border-outline-variant/10 shadow-inner">
                        <button onClick={() => setActiveTab('events')} className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'events' ? 'bg-surface-container-highest text-primary shadow-sm border border-primary/10' : 'text-gray-500 hover:text-white'}`}>
                            Escalas
                        </button>
                        <button onClick={() => setActiveTab('members')} className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-surface-container-highest text-primary shadow-sm border border-primary/10' : 'text-gray-500 hover:text-white'}`}>
                            Membros
                        </button>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={() => setShowCreateForm(true)} className="bg-primary text-on-primary font-black px-4 md:px-6 py-2.5 md:py-3 rounded-full flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                            <Plus size={16} />
                            <span className="hidden md:inline">Novo Evento</span>
                        </button>
                        <button onClick={() => setIsFormOpen(true)} className="bg-surface-container-highest text-primary border border-primary/20 font-black px-4 md:px-6 py-2.5 md:py-3 rounded-full flex items-center justify-center gap-2 hover:bg-primary/10 active:scale-95 transition-all text-[9px] md:text-[10px] uppercase tracking-widest">
                            <UserPlus size={16} />
                            <span className="hidden md:inline">Novo Membro</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-10 max-w-7xl">
                    {activeTab === 'events' ? (
                        <>
                            {/* Hero Header */}
                            <section className="mb-12">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-7xl font-black font-manrope tracking-tighter text-white mb-2 leading-none">Escalas do Grupo</h2>
                                        <div className="flex items-center gap-4">
                                            <span className="text-primary font-bold tracking-[0.2em] uppercase text-[10px]">{format(new Date(), "MMMM yyyy", { locale: ptBR })}</span>
                                            <div className="h-px w-24 bg-surface-container-highest"></div>
                                            <span className="text-on-surface-variant text-xs font-medium">Organizando o serviço da juventude</span>
                                        </div>
                                    </div>

                                    <div className="flex bg-surface-container-low p-1.5 rounded-full border border-outline-variant/10 shadow-inner">
                                        <button onClick={() => setViewFilter('semana')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewFilter === 'semana' ? 'bg-surface-container-highest text-primary shadow-sm border border-primary/10' : 'text-gray-500 hover:text-white'}`}>Semana</button>
                                        <button onClick={() => setViewFilter('mes')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewFilter === 'mes' ? 'bg-surface-container-highest text-primary shadow-sm border border-primary/10' : 'text-gray-500 hover:text-white'}`}>Mês</button>
                                        <button onClick={() => setViewFilter('equipes')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewFilter === 'equipes' ? 'bg-surface-container-highest text-primary shadow-sm border border-primary/10' : 'text-gray-500 hover:text-white'}`}>Equipes</button>
                                    </div>
                                </div>
                            </section>

                            <div className="grid grid-cols-12 gap-8">
                                {/* Featured Next Event Bento Card */}
                                <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-3xl p-10 flex flex-col md:flex-row gap-8 relative overflow-hidden border border-outline-variant/5 shadow-2xl">
                                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 blur-[100px] rounded-full"></div>

                                    <div className="relative z-10 flex-1 flex flex-col">
                                        <div className="inline-flex items-center gap-2 bg-secondary-container/20 px-4 py-1.5 rounded-full mb-8 border border-secondary-container/30 w-fit">
                                            <div className="w-2 h-2 rounded-full bg-secondary-dim shadow-[0_0_10px_#9093ff] animate-pulse"></div>
                                            <span className="text-[10px] font-black text-on-secondary-container uppercase tracking-[0.3em]">Em destaque</span>
                                        </div>

                                        {nextEvent ? (
                                            <>
                                                <h3 className="text-5xl font-black font-manrope mb-8 leading-tight text-white">{nextEvent.title}</h3>
                                                <div className="flex flex-wrap gap-10 mt-auto">
                                                    <div className="flex items-center gap-4 group">
                                                        <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary transition-all group-hover:scale-110">
                                                            <Calendar size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Data</p>
                                                            <p className="font-bold text-lg">{format(parseISO(nextEvent.event_date), "EEE, dd MMM", { locale: ptBR })}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 group">
                                                        <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary transition-all group-hover:scale-110">
                                                            <Clock size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Horário</p>
                                                            <p className="font-bold text-lg">{nextEvent.event_time.slice(0, 5)}h</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 group">
                                                        <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary transition-all group-hover:scale-110">
                                                            <Church size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Local</p>
                                                            <p className="font-bold text-lg">Santuário</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-gray-400 font-bold p-12 text-center border-2 border-dashed border-outline-variant/10 rounded-3xl">Nenhum evento próximo</p>
                                        )}
                                    </div>

                                    {nextEvent?.assignments?.length > 0 && (
                                        <div className="w-full md:w-[280px] bg-surface-container-highest/50 backdrop-blur-md rounded-2xl p-6 relative z-10 border border-outline-variant/10">
                                            <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">Equipe Escalada</p>
                                            <div className="space-y-5">
                                                {nextEvent.assignments.map((as: any) => (
                                                    <div key={as.id} className="flex items-center gap-4 group">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary overflow-hidden transition-all group-hover:border-primary">
                                                            {as.profiles?.avatar_url ? (
                                                                <img src={as.profiles.avatar_url} className="w-full h-full object-cover" />
                                                            ) : as.profiles?.full_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white leading-tight">{as.profiles?.full_name}</p>
                                                            <p className="text-[10px] text-primary uppercase font-black tracking-tighter opacity-70">
                                                                {FUNCTION_LABELS[as.function_type as FunctionType]}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Mini Grid */}
                                <div className="col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="bg-surface-container-low rounded-3xl p-5 md:p-8 flex flex-col justify-between border border-outline-variant/10 group hover:bg-surface-container-high transition-all">
                                        <CheckCircle2 size={32} className="text-primary group-hover:scale-110 transition-transform shrink-0" />
                                        <div className="mt-4">
                                            <p className="text-4xl md:text-5xl font-black font-manrope text-white mb-1">
                                                {events.reduce((acc, e) => acc + (e.assignments?.length || 0), 0)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest truncate">Confirmados</p>
                                        </div>
                                    </div>
                                    <div className="bg-surface-container-low rounded-3xl p-5 md:p-8 flex flex-col justify-between border border-outline-variant/10 group hover:bg-surface-container-high transition-all">
                                        <Clock3 size={32} className="text-tertiary group-hover:scale-110 transition-transform shrink-0" />
                                        <div className="mt-4">
                                            <p className="text-4xl md:text-5xl font-black font-manrope text-white mb-1">07</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest truncate">Pendentes</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGenerateEvents}
                                        className="col-span-2 bg-primary text-on-primary rounded-3xl p-8 flex items-center justify-between group hover:brightness-110 transition-all shadow-xl shadow-primary/10"
                                    >
                                        <div className="text-left">
                                            <p className="text-lg font-black leading-tight uppercase tracking-tighter">Gerar Lembretes do WhatsApp</p>
                                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Toda a escala da semana pronta</p>
                                        </div>
                                        <Send size={32} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </div>

                                {/* List Section Header */}
                                <div className="col-span-12 mt-12 flex items-center justify-between border-b border-outline-variant/10 pb-6">
                                    <h3 className="text-3xl font-black font-manrope tracking-tighter text-white">Listagem de Escalas</h3>
                                    <div className="flex gap-4">
                                        <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-low rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-all border border-outline-variant/10 shadow-sm">
                                            <Filter size={16} />
                                            Filtrar Função
                                        </button>
                                        <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-low rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-all border border-outline-variant/10 shadow-sm">
                                            <Share2 size={16} />
                                            Exportar PDF
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Event List */}
                                <div className="col-span-12 space-y-4">
                                    {events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="bg-surface-container rounded-2xl p-6 flex flex-col md:flex-row items-center hover:bg-surface-container-high transition-all group border border-transparent hover:border-outline-variant/10"
                                        >
                                            <div className="w-16 h-16 flex flex-col items-center justify-center bg-surface-container-highest rounded-2xl text-primary font-black mr-8 border border-outline-variant/10 gap-0.5 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                                <span className="text-lg leading-none">{format(parseISO(event.event_date), "dd")}</span>
                                                <span className="text-[9px] uppercase font-bold tracking-widest">{format(parseISO(event.event_date), "MMM")}</span>
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-8 items-center w-full mt-4 md:mt-0">
                                                <div className="md:col-span-1">
                                                    <h4 className="font-black text-white text-base tracking-tight truncate group-hover:text-primary transition-colors">{event.title}</h4>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{event.event_time.slice(0, 5)}h</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {event.assignments?.slice(0, 2).map((as: any) => (
                                                        <span key={as.id} className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-highest rounded-full text-[9px] font-black uppercase tracking-wider text-primary border border-primary/10 overflow-hidden max-w-[150px]">
                                                            {as.function_type === 'live' && <Music size={12} className="shrink-0" />}
                                                            {as.function_type === 'fotos' && <Book size={12} className="shrink-0" />}
                                                            {as.function_type === 'videos' && <Video size={12} className="shrink-0" />}
                                                            <span className="truncate">{FUNCTION_LABELS[as.function_type as FunctionType] || as.function_type}</span>
                                                        </span>
                                                    ))}
                                                    {event.assignments?.length > 2 && (
                                                        <span className="text-[9px] font-bold text-gray-500 self-center">+{event.assignments.length - 2}</span>
                                                    )}
                                                </div>

                                                <div className="flex -space-x-3 overflow-hidden">
                                                    {event.assignments?.map((as: any) => (
                                                        <div key={as.id} className="flex-shrink-0 h-10 w-10 rounded-full ring-4 ring-surface-container bg-surface-container-highest flex items-center justify-center text-[10px] font-black text-gray-400 border border-outline-variant/20 overflow-hidden">
                                                            {as.profiles?.avatar_url ? (
                                                                <img src={as.profiles.avatar_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                as.profiles?.full_name?.charAt(0)
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex justify-end items-center gap-4">
                                                    <div className="flex items-center gap-2 text-secondary-dim">
                                                        <div className="w-2 h-2 rounded-full bg-secondary-dim shadow-[0_0_8px_#9093ff] animate-pulse"></div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ativo</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="p-2.5 text-outline hover:text-red-500 hover:bg-red-500/5 rounded-full transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <section className="mb-12">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-7xl font-black font-manrope tracking-tighter text-white mb-2 leading-none">Membros Pascom</h2>
                                        <div className="flex items-center gap-4">
                                            <span className="text-primary font-bold tracking-[0.2em] uppercase text-[10px]">Time de Elite</span>
                                            <div className="h-px w-24 bg-surface-container-highest"></div>
                                            <span className="text-on-surface-variant text-xs font-medium">Gestão de voluntários e acessos</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsFormOpen(true)}
                                        className="h-16 px-10 rounded-full bg-white text-black font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-white/5 text-[11px] flex items-center gap-3"
                                    >
                                        <UserPlus size={18} />
                                        Cadastrar Membro
                                    </button>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {profiles.map((profile) => (
                                    <div key={profile.id} className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 group hover:bg-surface-container-high transition-all shadow-sm">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="w-16 h-16 rounded-2xl bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-2xl font-black text-primary overflow-hidden group-hover:scale-105 transition-transform">
                                                {profile.avatar_url ? <img src={profile.avatar_url} /> : profile.full_name?.charAt(0)}
                                            </div>
                                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${profile.role === 'admin' ? 'border-primary/50 text-primary bg-primary/5' : 'border-outline/30 text-outline'}`}>
                                                {profile.role}
                                            </span>
                                        </div>
                                        <h4 className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tight line-clamp-1 uppercase">{profile.full_name}</h4>
                                        <p className="text-xs text-gray-500 font-bold lowercase tracking-wider mt-1">{profile.email}</p>

                                        <div className="mt-8 pt-8 border-t border-outline-variant/10 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Desde</span>
                                                <span className="text-xs font-bold text-white">{format(parseISO(profile.created_at), "MMM yyyy")}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMember(profile.id)}
                                                className="p-3 text-outline hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Overlays / Modals */}
                {(showCreateForm || isFormOpen) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface-container-lowest/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-surface-container-low w-full max-w-2xl rounded-3xl border border-outline-variant/20 shadow-4xl animate-in zoom-in-95 duration-500 overflow-hidden">
                            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-high">
                                <h3 className="text-3xl font-black font-manrope text-white tracking-tighter">
                                    {showCreateForm ? 'Novo Evento' : 'Novo Membro'}
                                </h3>
                                <button onClick={() => { setShowCreateForm(false); setIsFormOpen(false); }} className="p-2 text-gray-400 hover:text-white rounded-full bg-surface-container hover:bg-surface-container-highest transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-10">
                                {showCreateForm ? (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Título do Evento</label>
                                                <input
                                                    className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-white font-bold outline-none"
                                                    placeholder="Ex: Missa de Domingo"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Categoria</label>
                                                <select
                                                    className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-white font-bold outline-none appearance-none"
                                                    value={eventType}
                                                    onChange={(e) => setEventType(e.target.value)}
                                                >
                                                    <option value="missa_padrao">Missa Padrão</option>
                                                    <option value="solenidade">Solenidade</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Data</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-white font-bold outline-none [color-scheme:dark]"
                                                    value={eventDate}
                                                    onChange={(e) => setEventDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Horário</label>
                                                <input
                                                    type="time"
                                                    className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-white font-bold outline-none [color-scheme:dark]"
                                                    value={eventTime}
                                                    onChange={(e) => setEventTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCreateEvent}
                                            disabled={isPending}
                                            className="w-full py-6 bg-primary text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-4 text-xs"
                                        >
                                            {isPending ? <Loader2 className="animate-spin" /> : <CalendarPlus size={20} />}
                                            Confirmar Criação
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRegisterMember} className="space-y-8">
                                        <div className="flex flex-col gap-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Nome Completo</label>
                                            <input
                                                name="full_name"
                                                required
                                                className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary transition-all text-white font-bold outline-none"
                                                placeholder="Ex: Pedro Henrique"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Email Profissional</label>
                                            <input
                                                name="email"
                                                type="email"
                                                required
                                                className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary transition-all text-white font-bold outline-none"
                                                placeholder="membro@pascom.com"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Cargo</label>
                                            <select
                                                name="role"
                                                required
                                                className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary transition-all text-white font-bold outline-none appearance-none"
                                            >
                                                <option value="member">Membro Regular (Servas)</option>
                                                <option value="admin">Administrador (PASCOM)</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Senha de Acesso (Opcional)</label>
                                            <input
                                                name="password"
                                                type="password"
                                                className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary transition-all text-white font-bold outline-none"
                                                placeholder="Deixe em branco para gerar aleatória"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-6 bg-primary text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-4 text-xs"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                                            Cadastrar Usuário
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Toast Notifications */}
            {toast && (
                <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right-full duration-500">
                    <div className={`px-10 py-6 rounded-3xl shadow-4xl flex items-center gap-6 border-l-8 backdrop-blur-3xl transition-all
                        ${toast.type === 'success' ? 'bg-surface-container-high border-primary text-white' : 'bg-red-950/40 border-red-600 text-white'}`}>
                        <div className={`w-3 h-3 rounded-full ${toast.type === 'success' ? 'bg-primary' : 'bg-red-500'} animate-pulse shadow-[0_0_10px_currentColor]`} />
                        <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
