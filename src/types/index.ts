export type EventType = 'missa_padrao' | 'solenidade';
export type FunctionType = 'live' | 'fotos' | 'videos' | 'stories';
export type UserRole = 'member' | 'admin';

export interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
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

export const FUNCTION_LABELS: Record<FunctionType, string> = {
    live: 'Live/Transmissão',
    fotos: 'Fotos',
    videos: 'Vídeos',
    stories: 'Stories',
};

export const SLOT_LIMITS: Record<EventType, Record<FunctionType, number>> = {
    missa_padrao: { live: 2, fotos: 1, videos: 1, stories: 0 },
    solenidade: { live: 2, fotos: 3, videos: 1, stories: 0 },
};

export const ACTIVE_FUNCTIONS: FunctionType[] = ['live', 'fotos', 'videos'];
