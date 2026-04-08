// Script para criar usuário admin no Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://kjgygxgtmsbypfygbxlo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZ3lneGd0bXNieXBmeWdieGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjkzODksImV4cCI6MjA5MTI0NTM4OX0.7mlmYUazkFfgg9JqR-NZPtsDgIir9h0uN0rgzoZceis'
);

async function createAdmin() {
    // 1. Criar usuário
    const { data, error } = await supabase.auth.signUp({
        email: 'supervisor@gmail.com',
        password: 'Pascom2026!',
        options: {
            data: {
                full_name: 'Supervisor Pascom'
            }
        }
    });

    if (error) {
        console.error('Erro ao criar usuário:', error.message);
        return;
    }

    console.log('Usuário criado com sucesso!');
    console.log('ID:', data.user?.id);
    console.log('Email: supervisor@gmail.com');
    console.log('Senha: Pascom2026!');

    if (data.user?.id) {
        // Tentar fazer login
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: 'supervisor@gmail.com',
            password: 'Pascom2026!',
        });

        if (loginError) {
            console.log('\n⚠ Pode ser necessário desativar "Confirm email" no Supabase:');
            console.log('  Dashboard → Authentication → Providers → Email → Desmarcar "Confirm email"');
            console.log('\nOu execute no SQL Editor:');
            console.log(`UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'supervisor@gmail.com';`);
            console.log(`UPDATE profiles SET role = 'admin', full_name = 'Supervisor Pascom' WHERE id = '${data.user.id}';`);
            return;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin', full_name: 'Supervisor Pascom' })
            .eq('id', data.user.id);

        if (updateError) {
            console.log('\nExecute no SQL Editor:');
            console.log(`UPDATE profiles SET role = 'admin' WHERE id = '${data.user.id}';`);
        } else {
            console.log('\n✅ Usuário promovido a ADMIN!');
        }
    }
}

createAdmin();
