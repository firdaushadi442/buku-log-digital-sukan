
export type UserRole = 'murid' | 'guru' | 'admin';
export type ClubType = 'Badminton' | 'Bola Tampar' | 'Bola Jaring' | 'Olahraga/Permainan Dalaman' | null;

export interface User {
    email: string;
    name: string;
    ic: string;
    form: string;
    role: UserRole;
    club: ClubType;
}

export interface ActivitySchedule {
    id: number;
    date: string;
    activity: string;
    place: string;
}

export interface WeeklyLog {
    id: number;
    date: string;
    time: string;
    place: string;
    type: string;
    objective: string;
    content: string;
    reflection: string;
    teacherNote?: string;
    teacherSignature?: string;
    img1?: string;
    img2?: string;
    attendance?: string;
    // Loading states for UI
    img1_loading?: boolean;
    img2_loading?: boolean;
}

export interface Achievement {
    id: number;
    name: string;
    level: string;
    result: string;
}

export interface AppData {
    // 1. Cover
    schoolName: string;
    studentName: string;
    ic: string;
    form: string;
    memberId: string;
    year: number;

    // Club Context (Editable by User)
    clubName: string;
    customLogo?: string;
    customFlag?: string;
    customMisi?: string;
    customVisi?: string;
    customSong?: string;
    customMoto?: string;
    customRules?: { title: string, items: string[] }[]; // If user creates custom rules

    // 2. Biodata
    dob: string;
    address: string;
    phone: string;
    guardian: string;
    teacher: string;
    profileImage: string;

    // 6. Organization
    principal: string;
    teacherAdvisor: string;
    chairman: string;
    secretary: string;
    treasurer: string;
    committee: string;

    // 8. Schedule
    schedule: ActivitySchedule[];

    // 9. Logs
    logs: WeeklyLog[];

    // 10. Skills (Generic Dict)
    skills: Record<string, boolean>;
    skillsNotes: string;

    // 11. Achievements
    achievements: Achievement[];

    // 12. Closing
    studentSummary: string;
    teacherComment: string;
    teacherSignature?: string;
}

export type ViewMode = 'edit' | 'preview' | 'teacher_dashboard';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface TeacherProfile {
    email: string;
    profileImage: string;
    name: string;
    ic: string;
    dob: string;
    address: string;
    phone: string;

    positionKRS: string;
    rankKRS: string;
    commissionNo: string;
    school: string;
    districtState: string;

    highestEdu: string;
    option: string;

    basicCourse: string;
    advCourse: string;
    courseDetails: string;
    experience: string;

    heldPositions: string;
    contributions: string;
}

// Dashboard Types
export interface DashboardStudent {
    name: string;
    email: string;
    ic: string;
    form: string;
    club: string;
    logCount: number;
    completeness: number;
    teacher: string;
    isReviewed: boolean;
}

export interface DashboardTeacher {
    name: string;
    email: string;
    role: string;
    club: string;
    profileCompleteness: number;
    rank?: string;
    school?: string;
}
