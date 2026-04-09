import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Users, Shield, User as UserIcon } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function MembrosPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    const adminSupabase = createAdminClient();

    const { data: members } = await adminSupabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

    return (
        <div style={{ paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    marginBottom: '4px',
                }}>
                    Membros
                </h1>
                <p style={{
                    fontSize: '14px',
                    color: '#888',
                }}>
                    {members?.length || 0} membros da Pascom
                </p>
            </div>

            {/* Members Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
            }}>
                {members?.map((member, index) => (
                    <div
                        key={member.id}
                        className="glass-card"
                        style={{
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            animation: `fadeIn 0.3s ease ${index * 50}ms forwards`,
                            opacity: 0,
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: member.role === 'admin'
                                ? 'linear-gradient(135deg, #0000FF, #0000CC)'
                                : 'linear-gradient(135deg, #1a1a2e, #16213e)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: member.role === 'admin'
                                ? '0 0 16px rgba(0,0,255,0.3)'
                                : 'none',
                        }}>
                            {member.role === 'admin' ? (
                                <Shield size={22} color="#FFFFFF" />
                            ) : (
                                <UserIcon size={22} color="#888" />
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#FFFFFF',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {member.full_name}
                            </p>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '4px',
                            }}>
                                {member.role === 'admin' && (
                                    <span className="badge-admin">Admin</span>
                                )}
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                    {member.email}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
