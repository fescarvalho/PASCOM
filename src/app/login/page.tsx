'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Radio, Loader2, Lock, Mail } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black text-white selection:bg-blue-600/30 overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Cinematic Atmosphere */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-full bg-blue-600/[0.03] rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[380px] md:max-w-[440px] flex flex-col items-center z-10 transition-all duration-500">
                {/* Branding Header */}
                <div className="flex flex-col items-center mb-10 w-full animate-in">
                    <div className="relative mb-10">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-[28px] md:rounded-[36px] bg-blue-600 flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,255,0.3)] border border-white/10 relative z-10">
                            <Radio className="text-white w-10 h-10 md:w-14 md:h-14" />
                        </div>
                    </div>

                    <div className="w-full flex items-center justify-center py-12">
                        <img
                            src="/logo.jpg"
                            alt="PASCOM"
                            width={300}
                            height={90}
                            className="max-h-14 md:max-h-20 w-auto filter grayscale brightness-125 contrast-125 transition-all duration-700"
                            style={{
                                mixBlendMode: 'screen',
                                maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent), linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                                maskComposite: 'intersect'
                            }}
                        />
                    </div>
                </div>

                {/* Form Card */}
                <div className="w-full bg-[#0a0a0f]/80 backdrop-blur-3xl rounded-[48px] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in" style={{ animationDelay: '0.1s' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                    <form onSubmit={handleLogin} className="flex flex-col gap-y-14 md:gap-y-20">
                        <div className="flex flex-col gap-y-12 md:gap-y-16">
                            <div className="flex items-center h-[72px] md:h-[84px] bg-white/[0.04] rounded-[28px] md:rounded-[32px] border border-white/[0.03] focus-within:bg-white/[0.07] transition-all duration-300 group/input">
                                <div className="w-16 md:w-24 flex items-center justify-center text-zinc-600 group-focus-within/input:text-blue-500 transition-colors">
                                    <Mail className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Credencial"
                                    className="flex-1 h-full bg-transparent pr-8 text-white text-base md:text-lg outline-none placeholder:text-zinc-600 font-medium tracking-wide"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex items-center h-[72px] md:h-[84px] bg-white/[0.04] rounded-[28px] md:rounded-[32px] border border-white/[0.03] focus-within:bg-white/[0.07] transition-all duration-300 group/input">
                                <div className="w-16 md:w-24 flex items-center justify-center text-zinc-600 group-focus-within/input:text-blue-500 transition-colors">
                                    <Lock className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <input
                                    type="password"
                                    placeholder="Senha"
                                    className="flex-1 h-full bg-transparent pr-8 text-white text-base md:text-lg outline-none placeholder:text-zinc-600 font-medium tracking-wide"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 md:py-6 rounded-[28px] md:rounded-[32px] text-[11px] md:text-sm uppercase tracking-[0.35em] transition-all transform active:scale-[0.98] shadow-[0_20px_40px_rgba(0,0,255,0.3)] flex items-center justify-center min-h-[60px] md:min-h-[72px]"
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : 'AUTENTICAR'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Branding Footer */}
                <div className="mt-12 text-center space-y-2 opacity-50 animate-in" style={{ animationDelay: '0.2s' }}>
                    <p className="text-[10px] md:text-[12px] font-bold text-zinc-500 tracking-[0.2em] uppercase leading-tight">
                        SANTUÁRIO DIOCESANO <br />
                        <span className="text-blue-500">NOSSA SENHORA DA NATIVIDADE</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
