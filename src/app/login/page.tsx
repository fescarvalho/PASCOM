'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Radio, Loader2, Lock, Mail, EyeOff, User, ShieldCheck, Network, Target, Shield } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError('Email ou senha inválidos.');
            setLoading(false);
            return;
        }

        router.push('/dashboard');
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-[#02040a] text-white selection:bg-blue-600/30 overflow-y-auto flex flex-col items-center justify-center px-10 py-12 relative">

            {/* Ambient Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-1/2 bg-blue-600/[0.03] rounded-full blur-[120px]" />
            </div>

            {/* Content Wrapper */}
            <div className="w-[90%] md:w-full max-w-[500px] flex flex-col items-center z-10 animate-in fade-in duration-1000">

                {/* Branding Section (Icon + Logo) */}
                <div className="flex flex-col items-center w-full">
                    {/* Icon with Glow */}
                    <div className="relative mb-8 group">
                        <div className="absolute inset-0 bg-blue-600/20 blur-[40px] rounded-full group-hover:bg-blue-600/30 transition-all duration-700" />
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[28px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,255,0.3)] relative z-10 border border-white/10 transition-transform duration-500 hover:scale-105">
                            <Radio className="text-white w-8 h-8 md:w-10 md:h-10" />
                        </div>
                    </div>

                    {/* Logo Image with Blend Mode Fix */}
                    <div className="w-full flex items-center justify-center">
                        <img
                            src="/logo.jpg"

                            alt="PASCOM"
                            width={300}
                            height={90}
                            className="max-h-16 md:max-h-24 w-auto brightness-110 contrast-125 transition-opacity duration-700"
                            style={{
                                mixBlendMode: 'screen',
                                filter: 'grayscale(0.1)',
                                maskImage: 'linear-gradient(to bottom, transparent, blue 50%, blue 50%, transparent), linear-gradient(to right, transparent, blue 5%, blue 95%, transparent)',
                                maskComposite: 'intersect'
                            }}
                        />
                    </div>
                </div>

                {/* --- FORCED SPACER BLOCK --- */}
                <div className="h-10 md:h-10 w-full pointer-events-none" aria-hidden="true" />
                {/* --------------------------- */}

                {/* Form Section */}
                <div className="w-full backdrop-blur-sm md:rounded-[40px] p-2">
                    <div className="rounded-[30px] md:rounded-[38px] p-6 md:p-10">
                        <form onSubmit={handleLogin} className="flex flex-col gap-y-6 md:gap-y-8">

                            {/* Credential Field */}
                            <div className="flex flex-col gap-y-3">
                                <div className="flex items-center h-[56px] md:h-[64px] bg-white/[0.03] rounded-2xl md:rounded-[22px] border border-white/[0.08] focus-within:border-blue-500/40 focus-within:bg-white/[0.06] transition-all duration-300 px-5 md:px-8 group/input gap-x-3 md:gap-x-4">
                                    <User className="w-5 h-5 text-zinc-500 group-focus-within/input:text-blue-500 transition-colors shrink-0" />
                                    <input
                                        type="email"
                                        placeholder="Digite sua credencial"
                                        className="flex-1 h-full bg-transparent text-white text-sm md:text-base outline-none placeholder:text-zinc-600 font-medium tracking-wide w-full"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col gap-y-3">
                                <div className="flex items-center h-[56px] md:h-[64px] bg-white/[0.03] rounded-2xl md:rounded-[22px] border border-white/[0.08] focus-within:border-blue-500/40 focus-within:bg-white/[0.06] transition-all duration-300 px-5 md:px-8 group/input gap-x-3 md:gap-x-4">
                                    <Lock className="w-5 h-5 text-zinc-500 group-focus-within/input:text-blue-500 transition-colors shrink-0" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="flex-1 h-full bg-transparent text-white text-lg md:text-xl outline-none placeholder:text-zinc-600 font-medium md:tracking-[0.4em] tracking-[0.2em] pt-1"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <EyeOff className="w-4 h-4 text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors" />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 bg-gradient-to-br from-[#0066FF] via-[#0052D1] to-[#003BB3] hover:from-[#0052D1] hover:to-[#002B85] text-white font-black h-[56px] md:h-[64px] rounded-2xl md:rounded-[24px] text-[13px] md:text-[14px] uppercase tracking-[0.25em] transition-all duration-300 transform active:scale-[0.98] shadow-[0_15px_40px_rgba(0,102,255,0.25)] hover:shadow-[0_25px_50px_rgba(0,102,255,0.35)] flex items-center justify-center gap-3 border border-white/10"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5 opacity-80" />
                                        ENTRAR NO SISTEMA
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- BOTTOM SPACER --- */}
                <div className="h-12 md:h-20" aria-hidden="true" />

                {/* Parish Branding */}
                <div className="mt-auto text-center pb-8 border-b border-white/5 w-full max-w-[300px]">
                    <p className="text-[9px] md:text-[11px] font-black text-zinc-200 tracking-wide uppercase leading-tight">
                        Paróquia Santuario Diocesano Nossa Senhora da Natividade
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2 opacity-50">
                        <Shield className="w-3 h-3 text-blue-500" />
                        <p className="text-[9px] font-bold text-zinc-500 tracking-[0.2em] uppercase">
                            Ambiente Restrito e Pastoral
                        </p>
                    </div>
                </div>

            </div>

            {/* Scroll Indicator at bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/[0.05] rounded-full md:hidden" />
        </div>
    );
}
