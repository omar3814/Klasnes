
import { createClient } from '@supabase/supabase-js'
import { Classroom, Student, Assignment, Grade, BehaviorNote, SavedLayout, Lesson, AttendanceRecord, Report, PointLog, WhiteboardSnapshot, TeacherProfile, Holiday, HomepageContent } from './types';

// These environment variables must be set in your deployment environment.
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

interface Database {
  public: {
    Tables: {
      classrooms: { Row: Classroom, Insert: Omit<Classroom, 'id'>, Update: Partial<Classroom> },
      students: { Row: Student, Insert: Omit<Student, 'id'>, Update: Partial<Student> },
      assignments: { Row: Assignment, Insert: Omit<Assignment, 'id'>, Update: Partial<Assignment> },
      grades: { Row: Grade, Insert: Grade, Update: Partial<Grade> },
      behavior_notes: { Row: BehaviorNote, Insert: Omit<BehaviorNote, 'id'>, Update: Partial<BehaviorNote> },
      saved_layouts: { Row: SavedLayout, Insert: Omit<SavedLayout, 'id'>, Update: Partial<SavedLayout> },
      lessons: { Row: Lesson, Insert: Omit<Lesson, 'id'>, Update: Partial<Lesson> },
      attendance_records: { Row: AttendanceRecord, Insert: Omit<AttendanceRecord, 'id'>, Update: Partial<AttendanceRecord> },
      reports: { Row: Report, Insert: Omit<Report, 'id'>, Update: Partial<Report> },
      point_logs: { Row: PointLog, Insert: Omit<PointLog, 'id'>, Update: Partial<PointLog> },
      whiteboard_snapshots: { Row: WhiteboardSnapshot, Insert: Omit<WhiteboardSnapshot, 'id'>, Update: Partial<WhiteboardSnapshot> },
      teacher_profiles: { Row: TeacherProfile, Insert: Omit<TeacherProfile, 'id'>, Update: Partial<TeacherProfile> },
      holidays: { Row: Holiday, Insert: Omit<Holiday, 'id'>, Update: Partial<Holiday> },
      homepage_content: { Row: HomepageContent, Insert: Omit<HomepageContent, 'id'>, Update: Partial<HomepageContent> },
      settings: { Row: { key: string, value: string } }
    },
    Views: {
      [_ in never]: never;
    },
    Functions: {
      increment_student_points: {
        Args: { student_id_param: string, amount_param: number },
        Returns: undefined
      },
      award_class_points: {
        Args: { class_id_param: string, amount_param: number, reason_param: string, user_id_param: string },
        Returns: undefined
      }
    }
  }
}


export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
