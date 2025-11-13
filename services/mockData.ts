
import { Classroom, Student, Assignment, Grade, BehaviorNote, SavedLayout, Lesson, AttendanceRecord, Report, PointLog, WhiteboardSnapshot, TeacherProfile, Holiday, ReportAudience, HomepageContent } from '../types';

// --- USERS & ADMIN ---
export const mockAdmin: TeacherProfile = {
  id: 'admin-007',
  full_name: 'Omar3814',
  title: 'Site Administrator',
  school: 'District Office',
  contact_email: 'omar@example.com',
  phone: '555-000-0000',
  avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=Admin`,
  role: 'admin',
  terms_accepted: true,
  accepted_at: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
  last_login: new Date().toISOString(),
  login_count: 210,
  password_hash: '$2b$12$Z1yX.wVuT.sRqPoN.mLkJiHgFeDcBaZyXwVuTsRqPoNmLkJiHgFeDc',
};

export const mockUsers: TeacherProfile[] = [
  {
    id: 'user-123',
    full_name: 'Dr. Evelyn Reed',
    title: 'Lead Educator',
    school: 'Innovation Academy',
    contact_email: 'e.reed@innovation.edu',
    phone: '555-123-4567',
    avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=Evelyn%20Reed`,
    role: 'user',
    terms_accepted: true,
    accepted_at: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
    last_login: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    login_count: 152,
    password_hash: '$2b$12$L8Kq.g8hVz9zFp.gR9yKHeOq1u5J7l.I9yKHe.gR9zFp.gR9yKHe',
  },
  {
    id: 'user-456',
    full_name: 'David Chen',
    title: '5th Grade Teacher',
    school: 'Northwood Elementary',
    contact_email: 'd.chen@northwood.edu',
    phone: '555-987-6543',
    avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=David%20Chen`,
    role: 'user',
    terms_accepted: true,
    accepted_at: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
    last_login: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    login_count: 89,
    password_hash: '$2b$12$A4bC.d5eF.g6hI.j7kL8mN.oPqRsTuVwXyZaBcDeFgHiJkLmNoPq',
  },
  mockAdmin
];

// --- WEBSITE CONTENT ---
export const mockWebsiteLogo = null; // Initially no custom logo
export const mockHomepageContent: HomepageContent[] = [
    { id: 'hc-1', type: 'text', content: 'Welcome to the new school year! We are excited to use Klasen to enhance our classroom management and communication.', order: 1 }
];

// --- ALL DATA (BELONGS TO DIFFERENT USERS) ---

const page1Id = `page-${Date.now()}-1`;
const page2Id = `page-${Date.now()}-2`;
const page3Id = `page-${Date.now()}-3`;

export const mockAllClassrooms: Classroom[] = [
  { id: 'class-1', name: 'Grade 4 Math', user_id: 'user-123', layout: [], whiteboard_state: JSON.stringify({ pages: [{ id: page1Id, name: 'Page 1', state: [], order: 0 }], activePageId: page1Id }) },
  { id: 'class-2', name: 'Grade 4 Science', user_id: 'user-123', layout: [], whiteboard_state: JSON.stringify({ pages: [{ id: page2Id, name: 'Default Page', state: [], order: 0 }], activePageId: page2Id }) },
  { id: 'class-3', name: 'Grade 5 History', user_id: 'user-456', layout: [], whiteboard_state: JSON.stringify({ pages: [{ id: page3Id, name: 'Main', state: [], order: 0 }], activePageId: page3Id }) },
];

export const mockAllStudents: Student[] = [
  // Evelyn Reed's Students (class-1 & class-2)
  { id: 'student-1', classroom_id: 'class-1', name: 'Liam Smith', points: 85, passes_used: 1, passes_allowed: 5, grade_level: '4', avatar_url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Liam' },
  { id: 'student-2', classroom_id: 'class-1', name: 'Olivia Johnson', points: 92, passes_used: 0, passes_allowed: 5, grade_level: '4', avatar_url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Olivia' },
  { id: 'student-3', classroom_id: 'class-1', name: 'Noah Williams', points: 78, passes_used: 2, passes_allowed: 5, grade_level: '4' },
  { id: 'student-4', classroom_id: 'class-1', name: 'Emma Brown', points: 105, passes_used: 0, passes_allowed: 5, grade_level: '4', avatar_url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Emma' },
  { id: 'student-5', classroom_id: 'class-2', name: 'Oliver Jones', points: 65, passes_used: 4, passes_allowed: 5, grade_level: '4' },
  { id: 'student-6', classroom_id: 'class-2', name: 'Ava Garcia', points: 95, passes_used: 1, passes_allowed: 5, grade_level: '4' },

  // David Chen's Students (class-3)
  { id: 'student-9', classroom_id: 'class-3', name: 'James Rodriguez', points: 110, passes_used: 0, passes_allowed: 4, grade_level: '5', avatar_url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=James' },
  { id: 'student-10', classroom_id: 'class-3', name: 'Sophia Martinez', points: 89, passes_used: 1, passes_allowed: 4, grade_level: '5' },
  { id: 'student-11', classroom_id: 'class-3', name: 'Benjamin Hernandez', points: 76, passes_used: 2, passes_allowed: 4, grade_level: '5' },
  { id: 'student-12', classroom_id: 'class-3', name: 'Isabella Lopez', points: 98, passes_used: 0, passes_allowed: 4, grade_level: '5', avatar_url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Isabella' },
];

export const mockAllAssignments: Assignment[] = [
  { id: 'asg-1', classroom_id: 'class-1', name: 'Fractions Homework', type: 'homework', due_date: '2024-06-20', max_score: 20 },
  { id: 'asg-2', classroom_id: 'class-1', name: 'Multiplication Quiz', type: 'quiz', due_date: '2024-06-25', max_score: 50 },
  { id: 'asg-3', classroom_id: 'class-3', name: 'American Revolution Project', type: 'project', due_date: '2024-07-05', max_score: 100 },
  { id: 'asg-4', classroom_id: 'class-2', name: 'Photosynthesis Exam', type: 'exam', due_date: '2024-06-28', max_score: 100 },
];

export const mockAllGrades: Grade[] = [
  { student_id: 'student-1', assignment_id: 'asg-1', score: 18 },
  { student_id: 'student-2', assignment_id: 'asg-1', score: 20 },
  { student_id: 'student-3', assignment_id: 'asg-1', score: 15 },
  { student_id: 'student-1', assignment_id: 'asg-2', score: 45 },
  { student_id: 'student-2', assignment_id: 'asg-2', score: 48 },
  { student_id: 'student-9', assignment_id: 'asg-3', score: 95 },
  { student_id: 'student-10', assignment_id: 'asg-3', score: 88 },
];

export const mockAllBehaviorNotes: BehaviorNote[] = [
  { id: 'note-1', student_id: 'student-3', created_at: new Date().toISOString(), note: 'Distracted during group work.' },
  { id: 'note-2', student_id: 'student-4', created_at: new Date().toISOString(), note: 'Helped another student with their assignment.' },
  { id: 'note-3', student_id: 'student-11', created_at: new Date().toISOString(), note: 'Forgot textbook at home.' },
];

export const mockAllPointLogs: PointLog[] = [
    { id: 'pl-1', student_id: 'student-4', classroom_id: 'class-1', user_id: 'user-123', amount: 5, reason: 'Helping a classmate', created_at: new Date().toISOString() },
    { id: 'pl-2', student_id: 'student-5', classroom_id: 'class-2', user_id: 'user-123', amount: -2, reason: 'Disruptive behavior', created_at: new Date().toISOString() },
    { id: 'pl-3', student_id: 'student-9', classroom_id: 'class-3', user_id: 'user-456', amount: 10, reason: 'Excellent presentation', created_at: new Date().toISOString() },
];

export const mockAllAttendance: AttendanceRecord[] = [
    {id: 'att-1', student_id: 'student-1', classroom_id: 'class-1', user_id: 'user-123', date: new Date().toISOString().split('T')[0], status: 'present', marked_at: new Date().toISOString() },
    {id: 'att-2', student_id: 'student-3', classroom_id: 'class-1', user_id: 'user-123', date: new Date().toISOString().split('T')[0], status: 'late', marked_at: new Date().toISOString() },
    {id: 'att-3', student_id: 'student-10', classroom_id: 'class-3', user_id: 'user-456', date: new Date().toISOString().split('T')[0], status: 'absent', marked_at: new Date().toISOString() },
];

export const mockAllReports: Report[] = [
    {
        id: 'report-1',
        student_id: 'student-1',
        classroom_id: 'class-1',
        user_id: 'user-123',
        start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        audience: 'parent' as ReportAudience,
        behavior: 'good',
        participation: 'active',
        attitude: 'positive',
        progress: 'meeting',
        comments: 'Liam is a pleasure to have in class and works well with others.',
        behavior_tags: ['good', 'active', 'positive', 'meeting'],
    },
     {
        id: 'report-2',
        student_id: 'student-9',
        classroom_id: 'class-3',
        user_id: 'user-456',
        start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        audience: 'principal' as ReportAudience,
        behavior: 'excellent',
        participation: 'active',
        attitude: 'positive',
        progress: 'exceeding',
        comments: 'James shows great leadership qualities and is a role model for his peers.',
        behavior_tags: ['excellent', 'active', 'positive', 'exceeding'],
    }
];

export const mockAllLessons: Lesson[] = [
    { id: 'lesson-1', classroom_id: 'class-1', day_of_week: 'Monday', title: 'Intro to Geometry', topic: 'Shapes and Angles', recurrence_type: 'weekly', start_date: '2024-01-01'},
    { id: 'lesson-2', classroom_id: 'class-2', day_of_week: 'Wednesday', title: 'The Water Cycle', topic: 'Evaporation, Condensation', recurrence_type: 'weekly', start_date: '2024-01-01' },
    { id: 'lesson-3', classroom_id: 'class-3', day_of_week: 'Tuesday', title: 'The 13 Colonies', topic: 'Colonial America', recurrence_type: 'weekly', start_date: '2024-01-01' },
];

export const mockAllSavedLayouts: SavedLayout[] = [];
export const mockAllHolidays: Holiday[] = [];
export const mockAllSnapshots: WhiteboardSnapshot[] = [];