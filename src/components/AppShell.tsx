'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import {
    Radio,
    CalendarDays,
    Users,
    Settings,
    LogOut,
    Bell,
    ChevronRight,
    Menu,
    X,
} from 'lucide-react';

interface AppShellProps {
    user: User;
    profile: Profile | null;
    children: React.ReactNode;
}

export function AppShell({ profile, children }: AppShellProps) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isAdmin = profile?.role === 'admin';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const navItems = [
        { href: '/dashboard', label: 'Escalas', icon: CalendarDays },
        ...(isAdmin ? [
            { href: '/membros', label: 'Membros', icon: Users },
            { href: '/admin', label: 'Painel Admin', icon: Settings }
        ] : []),
    ];

    const closeSidebar = () => setIsSidebarOpen(false);

    const NavLink = ({ item }: { item: any }) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
            <button
                onClick={() => {
                    router.push(item.href);
                    closeSidebar();
                }}
                className={`group relative flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all duration-300 overflow-hidden
          ${isActive
                        ? 'bg-primary text-white shadow-[0_8px_20px_rgba(0,0,255,0.3)]'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                    }`}
            >
                {/* Active Glow Decor */}
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                )}

                <div
                    className={`shrink-0 transition-transform duration-300 group-hover:scale-110
          ${isActive ? 'text-white' : 'text-zinc-600 group-hover:text-primary/70'}`}
                >
                    <Icon size={22} />
                </div>

                <span className="flex-1 text-left text-sm font-bold tracking-tight">
                    {item.label}
                </span>

                {isActive ? (
                    <ChevronRight size={18} className="opacity-60" />
                ) : (
                    <div className="w-1 h-1 rounded-full bg-zinc-800 transition-all duration-300 group-hover:w-4 group-hover:bg-primary/40" />
                )}
            </button>
        );
    };

    return (
        <div className="flex min-h-screen bg-black text-white">
            {/* Backdrop for Mobile Sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden animate-in fade-in duration-300"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar - Desktop (Sticky) & Mobile (Overlay) */}
            <aside
                className={`flex flex-col w-[280px] fixed md:sticky inset-y-0 left-0 border-r border-zinc-900/50 bg-[#050505] z-[60] transition-all duration-500 ease-in-out 
          ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:translate-x-0 md:opacity-100'} 
          pointer-events-none md:pointer-events-auto`}
            >
                <div className={`${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none md:pointer-events-auto'} flex flex-col h-full w-full`}>
                    <div className="h-24 px-8 border-b border-zinc-900/50 flex items-center gap-4 group flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <Radio size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-white">PASCOM</h1>
                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Paróquia</p>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
                        <div className="px-5 mb-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Navegação Principal</p>
                        </div>
                        {navItems.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}
                    </nav>

                    <div className="p-4 mt-auto pb-8 flex-shrink-0">
                        <div className="p-4 rounded-3xl bg-zinc-900/20 border border-white/5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-sm font-black shadow-md">
                                    {profile?.full_name?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black truncate text-zinc-200">
                                        {profile?.full_name || 'Usuário'}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-green-500' : 'bg-primary'}`} />
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
                                            {isAdmin ? 'Privilégio Adm' : 'Membro Pascom'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all text-xs font-black uppercase tracking-widest border border-white/5 hover:border-red-500/20"
                            >
                                <LogOut size={14} />
                                Sair da conta
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 md:h-20 bg-black/60 backdrop-blur-2xl flex items-center justify-between px-6 md:px-10 border-b border-zinc-900/40">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors md:hidden"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <div className="hidden md:flex items-center gap-3 text-zinc-400">
                            <div className="w-1 h-5 bg-primary/40 rounded-full" />
                            <h2 className="text-sm font-black uppercase tracking-widest">
                                {navItems.find((i) => i.href === pathname)?.label || 'Escalas'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-full border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ativo</span>
                        </div>
                        <button className="p-2.5 md:p-3 bg-zinc-900 rounded-xl md:rounded-2xl text-zinc-400 hover:text-primary transition-all relative group">
                            <Bell size={20} className="md:size-[22px] group-hover:rotate-12" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-black" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main
                    className={`flex-1 overflow-x-hidden w-full mx-auto transition-all duration-300 ${pathname?.startsWith('/admin') ? 'max-w-none' : 'p-6 md:px-20 md:py-12 max-w-[1400px]'}`}
                    style={pathname?.startsWith('/admin') ? { padding: 0 } : undefined}
                >
                    <div className="animate-in">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-8 md:hidden z-40 pb-safe">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative group
                    ${isActive ? 'text-primary scale-110' : 'text-zinc-600'}`}
                        >
                            {isActive && (
                                <div className="absolute -top-3 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(0,0,255,0.8)]" />
                            )}
                            <Icon size={24} className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,0,255,0.5)]' : ''} />
                            <span className="text-[9px] font-black tracking-widest uppercase">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
