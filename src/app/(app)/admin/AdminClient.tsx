'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    createEvent,
    deleteEvent,
    adminRemoveAssignment,
    getUpcomingEvents,
    generateRecurringEvents,
    registerMember,
    updateMemberRole,
    updateMember,
    createOrUpdateFunction,
    deleteFunction,
    deleteMember,
} from './actions';
import type { FunctionType, SysFunction } from '@/types';
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
    Edit2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminClientProps {
    profiles: any[];
    sysFunctions: SysFunction[];
}

export function AdminClient({ profiles, sysFunctions }: AdminClientProps) {
    const [isPending, startTransition] = useTransition();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'events' | 'members' | 'functions'>('events');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState<string>('');
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

    const handleShareReminders = async () => {
        try {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const inSevenDays = new Date(now);
            inSevenDays.setDate(now.getDate() + 7);
            
            const weekEvents = events.filter(e => {
                const eDate = parseISO(e.event_date);
                return eDate >= now && eDate <= inSevenDays;
            });
            
            if (weekEvents.length === 0) {
                showToast('Nenhum evento na próxima semana para lembrar.', 'error');
                return;
            }

            let text = `📅 *ESCALA PASCOM DA SEMANA*\n\n`;
            weekEvents.forEach(e => {
                text += `*${e.title}* - ${format(parseISO(e.event_date), 'dd/MM')} às ${e.event_time?.slice(0, 5)}h\n`;
                if (!e.assignments || e.assignments.length === 0) {
                    text += `_Ninguém escalado ainda_\n\n`;
                    return;
                }
                const asByFunc = sysFunctions.filter(f => f.is_active).map(f => {
                    const as = e.assignments.filter((a: any) => a.function_type === f.id);
                    if (as.length === 0) return null;
                    return `> ${f.label}: ${as.map((a: any) => a.profiles?.full_name?.split(' ')[0] || 'Sem nome').join(', ')}`;
                }).filter(Boolean);

                if (asByFunc.length > 0) {
                    text += asByFunc.join('\n') + '\n\n';
                } else {
                    text += `_Ninguém escalado ainda_\n\n`;
                }
            });

            text += `Deus abençoe a doação do serviço de cada um! 🙏`;

            if (navigator.share) {
                await navigator.share({
                    title: 'Escala Pascom',
                    text: text
                });
            } else {
                await navigator.clipboard.writeText(text);
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao compartilhar lembretes', 'error');
        }
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

        try {
            const res = await registerMember(data);
            if (res.success) {
                showToast(`Membro cadastrado com sucesso! SENHA: ${res.tempPassword}`, 'success');
                (e.target as HTMLFormElement).reset();
                setIsFormOpen(false);
            } else {
                showToast(res.error || 'Erro ao cadastrar.', 'error');
            }
        } catch (error: any) {
            console.error('Crash in registerMember:', error);
            showToast(error.message || 'Erro inesperado no servidor. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditMemberSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = {
            full_name: formData.get('full_name') as string,
            email: formData.get('email') as string,
            role: formData.get('role') as 'member' | 'admin',
        };

        try {
            const res = await updateMember(editingMember.id, data);
            if (res.success) {
                showToast(`Membro atualizado com sucesso!`, 'success');
                setEditingMember(null);
            } else {
                showToast(res.error || 'Erro ao atualizar.', 'error');
            }
        } catch (error: any) {
            console.error('Crash in updateMember:', error);
            showToast(error.message || 'Erro inesperado no servidor. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (id: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'member' : 'admin';
        if (!confirm(`Tem certeza que deseja alterar a permissão deste usuário para ${newRole.toUpperCase()}?`)) return;
        
        setLoading(true);
        const res = await updateMemberRole(id, newRole);
        if (res.success) {
            showToast(`Permissão alterada para ${newRole}.`, 'success');
        } else {
            showToast(res.error || 'Erro ao alterar permissão.', 'error');
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

    const handleExportPDF = async () => {
        try {
            setLoading(true);
            showToast('Gerando documento PDF...', 'success');
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.getElementById('pdf-export-container');
            if (!element) return;

            element.style.display = 'block';

            const opt = {
                margin: 0,
                filename: `Escala_Pascom_${format(new Date(), "MMM_yyyy")}.pdf`,
                image: { type: 'jpeg' as const, quality: 1.0 },
                html2canvas: { scale: 2, useCORS: true, logging: false, width: 1123 },
                jsPDF: { unit: 'px', format: [1587, 1123] as [number, number], orientation: 'landscape' as const, hotfixes: ['px_scaling'] }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('PDF error:', error);
            showToast('Erro ao exportar PDF', 'error');
        } finally {
            const element = document.getElementById('pdf-export-container');
            if (element) element.style.display = 'none';
            setLoading(false);
        }
    };

    const nextEvent = events[0];

    return (
        <div className="flex min-h-screen bg-surface-dim font-inter selection:bg-primary/30 w-full">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative w-full max-w-full overflow-hidden">
                {/* TopAppBar */}
                <header className="sticky top-0 right-0 w-full min-h-[80px] bg-surface-dim/60 backdrop-blur-xl flex flex-col md:flex-row justify-center md:justify-between items-center px-4 md:px-10 z-40 border-b border-outline-variant/5 gap-4 py-4 md:py-0">
                    <div className="flex bg-surface-container-low p-1 rounded-full border border-outline-variant/10 shadow-inner overflow-hidden">
                        <button onClick={() => setActiveTab('events')} className={`px-4 sm:px-6 md:px-8 py-2 md:py-3 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'events' ? 'bg-surface-container-highest text-primary shadow-sm border border-primary/10' : 'text-gray-500 hover:text-white'}`}>
                            Escalas
                        </button>
                        <button onClick={() => setActiveTab('members')} className={`px-4 sm:px-6 md:px-8 py-2 md:py-3 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-surface-container-highest text-primary shadow-sm border border-primary/10' : 'text-gray-500 hover:text-white'}`}>
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

                <div className="flex-1 p-4 sm:p-6 lg:p-10 w-full max-w-7xl">
                    {activeTab === 'events' ? (
                        <>
                            {/* Hero Header */}
                            <section className="mb-6 sm:mb-10 lg:mb-12">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col items-start w-full">
                                        <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black font-manrope tracking-tighter text-white mb-2 leading-none">Escalas do Grupo</h2>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-primary font-bold tracking-[0.2em] uppercase text-[10px]">{format(new Date(), "MMMM yyyy", { locale: ptBR })}</span>
                                            <div className="h-px w-12 bg-surface-container-highest"></div>
                                            <span className="text-on-surface-variant text-xs font-medium">Organizando o serviço da juventude</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                                {/* Featured Next Event Bento Card */}
                                <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-3xl p-5 sm:p-8 lg:p-10 flex flex-col gap-6 relative overflow-hidden border border-outline-variant/5 shadow-2xl">
                                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 blur-[100px] rounded-full"></div>

                                    <div className="relative z-10 flex-1 flex flex-col">
                                        <div className="inline-flex items-center gap-2 bg-secondary-container/20 px-4 py-1.5 rounded-full mb-8 border border-secondary-container/30 w-fit">
                                            <div className="w-2 h-2 rounded-full bg-secondary-dim shadow-[0_0_10px_#9093ff] animate-pulse"></div>
                                            <span className="text-[10px] font-black text-on-secondary-container uppercase tracking-[0.3em]">Em destaque</span>
                                        </div>

                                        {nextEvent ? (
                                            <>
                                                <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black font-manrope mb-4 sm:mb-8 leading-tight text-white">{nextEvent.title}</h3>
                                                <div className="flex flex-wrap gap-4 sm:gap-8 lg:gap-10 mt-auto">
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
                                                                {sysFunctions.find(f => f.id === as.function_type)?.label || as.function_type}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Mini Grid */}
                                <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4 sm:gap-6">
                                    <div className="bg-surface-container-low rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col justify-between border border-outline-variant/10 group hover:bg-surface-container-high transition-all">
                                        <CheckCircle2 size={28} className="text-primary group-hover:scale-110 transition-transform shrink-0" />
                                        <div className="mt-3 sm:mt-4">
                                            <p className="text-3xl sm:text-4xl lg:text-5xl font-black font-manrope text-white mb-1">
                                                {events.reduce((acc, e) => acc + (e.assignments?.length || 0), 0)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-tight">Confirmados</p>
                                        </div>
                                    </div>
                                    <div className="bg-surface-container-low rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col justify-between border border-outline-variant/10 group hover:bg-surface-container-high transition-all">
                                        <Clock3 size={28} className="text-tertiary group-hover:scale-110 transition-transform shrink-0" />
                                        <div className="mt-3 sm:mt-4">
                                            <p className="text-3xl sm:text-4xl lg:text-5xl font-black font-manrope text-white mb-1">
                                                {(() => {
                                                    const confirmed = events.reduce((acc, e) => acc + (e.assignments?.length || 0), 0);
                                                    const totalSlots = events.reduce((acc, e) => {
                                                        const isSolenidade = e.event_type === 'solenidade';
                                                        const lim = sysFunctions.filter(f => f.is_active).reduce((s, f) => s + (isSolenidade ? f.limit_solenidade : f.limit_padrao), 0);
                                                        return acc + lim;
                                                    }, 0);
                                                    return Math.max(0, totalSlots - confirmed);
                                                })()}
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-tight">Pendentes</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleShareReminders}
                                        className="col-span-2 bg-primary text-on-primary rounded-3xl p-5 sm:p-8 flex items-center justify-between group hover:brightness-110 transition-all shadow-xl shadow-primary/10"
                                    >
                                        <div className="text-left">
                                            <p className="text-sm sm:text-lg font-black leading-tight uppercase tracking-tighter">Gerar Lembretes</p>
                                            <p className="text-[9px] sm:text-[10px] font-bold opacity-80 uppercase tracking-widest">Escala da semana pronta</p>
                                        </div>
                                        <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </div>

                                {/* List Section Header */}
                                <div className="col-span-12 mt-6 sm:mt-10 lg:mt-12 flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-outline-variant/10 pb-4 sm:pb-6 gap-4">
                                    <h3 className="text-2xl sm:text-3xl font-black font-manrope tracking-tighter text-white">Listagem de Escalas</h3>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <div className="flex bg-surface-container-low rounded-full border border-outline-variant/10 shadow-sm overflow-hidden flex-1 sm:flex-none h-10 items-center transition-colors group focus-within:border-primary/50 focus-within:bg-surface-container-high hover:bg-surface-container-high cursor-pointer">
                                            <div className="pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                                                <Calendar size={14} />
                                            </div>
                                            <input 
                                                type="month" 
                                                value={filterMonth}
                                                onChange={(e) => setFilterMonth(e.target.value)}
                                                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white outline-none w-full cursor-pointer pl-3 pr-2 h-full color-scheme-dark" 
                                            />
                                            {filterMonth && (
                                                <button onClick={() => setFilterMonth('')} className="pr-4 text-gray-500 hover:text-red-400 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <button onClick={handleExportPDF} className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-surface-container-low rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-all border border-outline-variant/10 shadow-sm flex-1 sm:flex-none">
                                            <Share2 size={14} />
                                            Exportar
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Event List */}
                                <div className="col-span-12 space-y-4">
                                    {events.filter((e) => {
                                        if (filterMonth) {
                                            return e.event_date.startsWith(filterMonth);
                                        }
                                        return true;
                                    }).map((event) => (
                                        <div
                                            key={event.id}
                                            className="bg-surface-container rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center hover:bg-surface-container-high transition-all group border border-transparent hover:border-outline-variant/10 gap-4 sm:gap-6"
                                        >
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="w-14 h-14 flex flex-col items-center justify-center bg-surface-container-highest rounded-2xl text-primary font-black border border-outline-variant/10 gap-0.5 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                                    <span className="text-base leading-none">{format(parseISO(event.event_date), "dd")}</span>
                                                    <span className="text-[9px] uppercase font-bold tracking-widest">{format(parseISO(event.event_date), "MMM")}</span>
                                                </div>
                                                <div className="sm:hidden flex-1">
                                                    <h4 className="font-black text-white text-sm tracking-tight group-hover:text-primary transition-colors">{event.title}</h4>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{event.event_time.slice(0, 5)}h</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    className="sm:hidden ml-auto p-2 text-outline hover:text-red-500 hover:bg-red-500/5 rounded-full transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="flex-1 flex flex-col gap-3 w-full">
                                                <div className="hidden sm:block">
                                                    <h4 className="font-black text-white text-base tracking-tight truncate group-hover:text-primary transition-colors">{event.title}</h4>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{event.event_time.slice(0, 5)}h</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {event.assignments?.length > 0 ? event.assignments.map((as: any) => (
                                                        <div key={as.id} className="flex items-center gap-2 bg-surface-container-highest px-2.5 py-1.5 rounded-full border border-outline-variant/10 shadow-sm hover:border-primary/30 transition-colors">
                                                            <div className="w-4 h-4 rounded-full bg-surface-container overflow-hidden flex flex-shrink-0 items-center justify-center text-[8px] font-black text-white border border-outline-variant/20">
                                                                {as.profiles?.avatar_url ? (
                                                                    <img src={as.profiles.avatar_url} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    as.profiles?.full_name?.charAt(0) || '?'
                                                                )}
                                                            </div>
                                                            <span className="text-[11px] font-bold text-white truncate max-w-[80px] sm:max-w-[120px]">{as.profiles?.full_name || 'Sem nome'}</span>
                                                            <span className="text-[9px] font-black uppercase text-primary tracking-widest bg-primary/10 px-1.5 py-0.5 rounded-md">{sysFunctions.find(f => f.id === as.function_type)?.label || as.function_type}</span>
                                                        </div>
                                                    )) : (
                                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Nenhuma equipe escalada</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="hidden sm:flex items-center gap-4 shrink-0">
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
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <section className="mb-6 sm:mb-10 lg:mb-12">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col items-start w-full">
                                        <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black font-manrope tracking-tighter text-white mb-2 leading-none">Membros Pascom</h2>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-primary font-bold tracking-[0.2em] uppercase text-[10px]">Time de Elite</span>
                                            <div className="h-px w-12 bg-surface-container-highest"></div>
                                            <span className="text-on-surface-variant text-xs font-medium">Gestão de voluntários e acessos</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsFormOpen(true)}
                                        className="w-full sm:w-auto h-12 sm:h-16 px-6 sm:px-10 rounded-full bg-white text-black font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-white/5 text-[11px] flex items-center justify-center gap-3"
                                    >
                                        <UserPlus size={18} />
                                        Cadastrar Membro
                                    </button>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {profiles.map((profile) => (
                                    <div key={profile.id} className="bg-surface-container-low rounded-3xl p-5 sm:p-8 border border-outline-variant/10 group hover:bg-surface-container-high transition-all shadow-sm">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="w-16 h-16 rounded-2xl bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-2xl font-black text-primary overflow-hidden group-hover:scale-105 transition-transform">
                                                {profile.avatar_url ? <img src={profile.avatar_url} /> : profile.full_name?.charAt(0)}
                                            </div>
                                            <button 
                                                onClick={() => handleUpdateRole(profile.id, profile.role)}
                                                className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer hover:scale-105 active:scale-95 ${profile.role === 'admin' ? 'border-primary/50 text-primary bg-primary/5 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50' : 'border-outline/30 text-outline hover:border-primary/50 hover:text-primary'}`}
                                                title={`Alterar para ${profile.role === 'admin' ? 'Membro' : 'Admin'}`}
                                            >
                                                {profile.role}
                                            </button>
                                        </div>
                                        <h4 className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tight line-clamp-1 uppercase">{profile.full_name}</h4>
                                        <p className="text-xs text-gray-500 font-bold lowercase tracking-wider mt-1">{profile.email}</p>

                                        <div className="mt-8 pt-8 border-t border-outline-variant/10 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Desde</span>
                                                <span className="text-xs font-bold text-white">{format(parseISO(profile.created_at), "MMM yyyy")}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingMember(profile)}
                                                    className="p-3 text-outline hover:text-blue-500 hover:bg-blue-500/5 rounded-2xl transition-all"
                                                    title="Editar Membro"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMember(profile.id)}
                                                    className="p-3 text-outline hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all"
                                                    title="Remover Membro"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
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

                            <div className="p-5 sm:p-8 lg:p-10">
                                {showCreateForm ? (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
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

                {editingMember && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface-container-lowest/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-surface-container-low w-full max-w-2xl rounded-3xl border border-outline-variant/20 shadow-4xl animate-in zoom-in-95 duration-500 overflow-hidden">
                            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-high">
                                <h3 className="text-3xl font-black font-manrope text-white tracking-tighter">
                                    Editar Membro
                                </h3>
                                <button onClick={() => setEditingMember(null)} className="p-2 text-gray-400 hover:text-white rounded-full bg-surface-container hover:bg-surface-container-highest transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-5 sm:p-8 lg:p-10">
                                <form onSubmit={handleEditMemberSubmit} className="space-y-8">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Nome Completo</label>
                                        <input
                                            name="full_name"
                                            required
                                            defaultValue={editingMember.full_name}
                                            className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary transition-all text-white font-bold outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            defaultValue={editingMember.email}
                                            className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary transition-all text-white font-bold outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Cargo</label>
                                        <select
                                            name="role"
                                            required
                                            defaultValue={editingMember.role}
                                            className="w-full bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant/10 focus:border-primary transition-all text-white font-bold outline-none appearance-none"
                                        >
                                            <option value="member">Membro Regular (Servas)</option>
                                            <option value="admin">Administrador (PASCOM)</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-6 bg-primary text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-4 text-xs"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <Edit2 size={20} />}
                                        Salvar Alterações
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Hidden PDF Export Structure - A4 Landscape Professional Layout */}
            <div
                id="pdf-export-container"
                style={{
                    display: 'none',
                    background: '#ffffff',
                    color: '#111',
                    fontFamily: "Arial, Helvetica, sans-serif",
                    boxSizing: 'border-box',
                    width: '1123px',
                    minHeight: '794px',
                    padding: '32px 40px',
                    overflow: 'hidden',
                }}
            >
                {/* PDF Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '16px', borderBottom: '3px solid #111' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: '#4361ee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ color: '#fff', fontSize: '18px', fontWeight: '900', lineHeight: 1 }}>P</span>
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: 1 }}>PASCOM</h1>
                            <p style={{ margin: 0, fontSize: '9px', color: '#666', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>Pastoral de Comunicação</p>
                        </div>
                        <div style={{ marginLeft: '20px', paddingLeft: '20px', borderLeft: '1px solid #ddd' }}>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#222', textTransform: 'capitalize' }}>
                                Escala Operacional — {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#888', fontWeight: '600' }}>
                                Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {[
                            { label: 'Eventos', value: String(events.length), color: '#4361ee' },
                            { label: 'Confirmados', value: String(events.reduce((acc, e) => acc + (e.assignments?.length || 0), 0)), color: '#10b981' },
                            { label: 'Solenidades', value: String(events.filter((e: any) => e.event_type === 'solenidade').length), color: '#f59e0b' },
                            { label: 'Missas', value: String(events.filter((e: any) => e.event_type === 'missa_padrao').length), color: '#06b6d4' },
                        ].map((stat, i) => (
                            <div key={i} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '8px 14px', borderTop: `3px solid ${stat.color}`, textAlign: 'center', minWidth: '70px' }}>
                                <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#111', lineHeight: 1 }}>{stat.value}</p>
                                <p style={{ margin: '3px 0 0', fontSize: '8px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Events Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '28%' }} />
                        <col style={{ width: '7%' }} />
                        <col style={{ width: '6%' }} />
                        <col style={{ width: '7%' }} />
                        <col style={{ width: '17%' }} />
                        <col style={{ width: '17%' }} />
                        <col style={{ width: '18%' }} />
                    </colgroup>
                    <thead>
                        <tr style={{ background: '#111', color: '#fff' }}>
                            {[
                                { label: 'Evento / Missa' },
                                { label: 'Data', center: true },
                                { label: 'Hora', center: true },
                                { label: 'Tipo', center: true },
                                ...sysFunctions.filter(f => f.is_active).map(f => ({ label: f.label, left: true }))
                            ].map((col, i) => (
                                <th key={i} style={{
                                    padding: '10px 12px',
                                    textAlign: ('center' in col && col.center) ? 'center' : 'left',
                                    fontWeight: '800',
                                    fontSize: '8px',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    borderRight: i < 3 ? '1px solid #333' : i >= 4 ? '1px solid #333' : 'none',
                                    whiteSpace: 'nowrap',
                                }}>{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event: any, index: number) => {
                            const isSolenidade = event.event_type === 'solenidade';
                            const liveAssignments = event.assignments?.filter((a: any) => a.function_type === 'live') || [];
                            const fotosAssignments = event.assignments?.filter((a: any) => a.function_type === 'fotos') || [];
                            const videosAssignments = event.assignments?.filter((a: any) => a.function_type === 'videos') || [];
                            const rowBg = index % 2 === 0 ? '#ffffff' : '#f5f7ff';

                            const memberCell = (assignments: any[], limit: number) => {
                                if (assignments.length === 0) {
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                                            <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '9px' }}>Vaga em aberto</span>
                                        </div>
                                    );
                                }
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {assignments.map((a: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#4361ee15', border: '1.5px solid #4361ee50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '900', color: '#4361ee', flexShrink: 0 }}>
                                                    {a.profiles?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <span style={{ fontWeight: '700', fontSize: '10px', color: '#222', wordBreak: 'break-word' }}>
                                                    {a.profiles?.full_name?.split(' ').slice(0, 2).join(' ') || 'Sem nome'}
                                                </span>
                                            </div>
                                        ))}
                                        {assignments.length < limit && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                                                <span style={{ color: '#f59e0b', fontSize: '8px', fontWeight: '700' }}>+{limit - assignments.length} vaga em aberto</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            };

                            return (
                                <tr key={event.id} style={{ background: rowBg }}>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e8e8e8', verticalAlign: 'middle' }}>
                                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#111', lineHeight: 1.4, wordBreak: 'break-word' }}>{event.title}</p>
                                    </td>
                                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e8e8e8', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #eee' }}>
                                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#222' }}>{format(parseISO(event.event_date), 'dd/MM', { locale: ptBR })}</p>
                                        <p style={{ margin: '1px 0 0', fontSize: '8px', color: '#999', textTransform: 'capitalize' }}>{format(parseISO(event.event_date), 'EEE', { locale: ptBR })}</p>
                                    </td>
                                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e8e8e8', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #eee' }}>
                                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#222' }}>{event.event_time?.slice(0, 5)}h</p>
                                    </td>
                                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e8e8e8', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #eee' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            fontSize: '7px',
                                            fontWeight: '800',
                                            padding: '3px 6px',
                                            borderRadius: '10px',
                                            background: isSolenidade ? '#fef3c7' : '#e0e7ff',
                                            color: isSolenidade ? '#92400e' : '#3730a3',
                                            border: `1px solid ${isSolenidade ? '#fde68a' : '#c7d2fe'}`,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.3px',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {isSolenidade ? 'Solenidade' : 'Padrão'}
                                        </span>
                                    </td>
                                    {sysFunctions.filter(f => f.is_active).map((f, i) => {
                                        const assignments = event.assignments?.filter((a: any) => a.function_type === f.id) || [];
                                        const limit = isSolenidade ? f.limit_solenidade : f.limit_padrao;
                                        return (
                                            <td key={f.id} style={{ padding: '10px 12px', borderBottom: '1px solid #e8e8e8', verticalAlign: 'middle', borderLeft: i === 0 ? '2px solid #eee' : '1px solid #eee' }}>
                                                {memberCell(assignments, limit)}
                                            </td>
                                        );
                                   })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Footer */}
                <div style={{ marginTop: '20px', borderTop: '1px dashed #ddd', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ fontSize: '8px', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Legenda:</span>
                        {[
                            { bg: '#e0e7ff', border: '#c7d2fe', label: 'Missa Padrão' },
                            { bg: '#fef3c7', border: '#fde68a', label: 'Solenidade' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.bg, border: `1px solid ${item.border}`, display: 'inline-block' }} />
                                <span style={{ fontSize: '9px', fontWeight: '700', color: '#555' }}>{item.label}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                            <span style={{ fontSize: '9px', fontWeight: '700', color: '#555' }}>Vaga em aberto</span>
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '8px', color: '#bbb', fontWeight: '600' }}>
                        PASCOM • Pastoral de Comunicação • {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                </div>
            </div>

            {/* Toast Notifications */}
            {toast && (
                <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-[200] animate-in slide-in-from-bottom-4 sm:slide-in-from-right-full duration-500">
                    <div className={`px-5 sm:px-8 py-4 sm:py-5 rounded-2xl shadow-2xl flex items-center gap-4 border-l-4 sm:border-l-8 backdrop-blur-3xl transition-all
                        ${toast.type === 'success' ? 'bg-surface-container-high border-primary text-white' : 'bg-red-950/40 border-red-600 text-white'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-primary' : 'bg-red-500'} animate-pulse shadow-[0_0_10px_currentColor]`} />
                        <span className="text-[11px] font-black uppercase tracking-widest flex-1 leading-snug">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 shrink-0">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
