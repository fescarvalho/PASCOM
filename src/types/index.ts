export type EventType = 'missa_padrao' | 'solenidade';
export type FunctionType = string;
export type UserRole = 'member' | 'admin';

export interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
}

export interface SysFunction {
    id: string;
    label: string;
    limit_padrao: number;
    limit_solenidade: number;
    is_active: boolean;
}

export interface Event {
    id: string;
    title: string;
    event_type: EventType;
    event_date: string;
    event_time: string;
    created_by: string;
    created_at: string;
}

export interface Assignment {
    id: string;
    event_id: string;
    user_id: string;
    function_type: FunctionType;
    created_at: string;
    profiles?: Profile;
}

export interface EventWithAssignments extends Event {
    assignments: Assignment[];
}
