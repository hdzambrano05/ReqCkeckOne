export interface User {
    id: number;
    username: string;
    email: string;
    role?: 'admin' | 'user' | 'guest';
    last_login?: string;
    created_at?: string;
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    owner_id: number;
    status?: string;
    deadline?: string;
    created_at?: string;
}

export interface Requirement {
    id: number;
    project_id: number;
    title: string;
    text: string;
    context?: string;
    status?: string;
    priority?: string;
    due_date?: string;
    version?: number;
    analysis?: any; // JSONB
    created_by?: number;
    created_at?: string;
    updated_at?: string;
}

export interface RequirementHistory {
    id: number;
    requirement_id: number;
    version: number;
    text: string;
    context?: string;
    analysis?: any;
    changed_by?: number;
    updated_at?: string;
}

export interface Task {
    id: number;
    project_id: number;
    requirement_id?: number;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_id?: number;
    due_date?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Comment {
    id: number;
    user_id?: number;
    requirement_id?: number;
    task_id?: number;
    text: string;
    created_at?: string;
}
