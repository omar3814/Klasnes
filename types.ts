export interface Desk {
  id: string;
  type: 'single' | 'double';
  top: number;
  left: number;
  studentIds: (string | null)[];
}

export interface SavedLayout {
  id: string;
  classroom_id: string;
  name: string;
  layout: Desk[];
  created_at: string;
}

// Whiteboard Object Types for a more robust, object-based canvas
export type Point = { x: number; y: number };

export type Path = {
  type: 'path';
  id: string;
  points: Point[];
  color: string;
  lineWidth: number;
  compositeOperation: GlobalCompositeOperation;
};

export type Shape = 'rectangle' | 'circle' | 'line';

export type ShapeObject = {
  type: 'shape';
  id: string;
  shape: Shape;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lineWidth: number;
};

export type ImageObject = {
  type: 'image';
  id: string;
  src: string; // dataURL
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WhiteboardObject = Path | ShapeObject | ImageObject;

export interface WhiteboardPage {
  id:string;
  name: string;
  state: WhiteboardObject[];
  order: number;
}


export interface Classroom {
  id: string;
  name: string;
  user_id: string;
  layout: Desk[] | null;
  whiteboard_state?: string | null; // Represents a JSON string of {pages: WhiteboardPage[], activePageId: string}
}

export interface Grade {
  student_id: string;
  assignment_id: string;
  score: number | null;
}

export interface BehaviorNote {
  id:string;
  student_id: string;
  created_at: string; // ISO string
  note: string;
}

export interface Student {
  id: string;
  name: string;
  points: number;
  passes_used: number;
  passes_allowed: number;
  avatar_url?: string;
  classroom_id: string;
  grade_level: string;
  contact_info?: string;
  notes?: string;
}

export interface Assignment {
  id: string;
  classroom_id: string;
  name: string;
  description?: string;
  attachments?: { name: string; url: string }[];
  type: 'quiz' | 'exam' | 'homework' | 'project';
  due_date: string; // YYYY-MM-DD
  max_score: number;
}


export interface Group {
  id: string;
  name: string;
  students: Student[];
}

export interface Lesson {
  id: string;
  classroom_id: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  title: string;
  topic: string;
  materials?: string;
  student_ids?: string[];
  recurrence_type: 'once' | 'weekly';
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD for range recurrence
}

export interface Holiday {
  id: string;
  classroom_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_recurring: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  classroom_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  marked_at: string;
}

export type ReportAudience = 'parent' | 'principal' | 'personal';

export type BehaviorRating = 'excellent' | 'good' | 'needs_improvement';
export type ParticipationRating = 'active' | 'sometimes' | 'rarely';
export type AttitudeRating = 'positive' | 'respectful' | 'needs_encouragement';
export type ProgressRating = 'exceeding' | 'meeting' | 'approaching';

export interface Report {
  id: string;
  student_id: string;
  classroom_id: string;
  user_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  created_at: string; // ISO Timestamp
  audience?: ReportAudience;
  behavior_tags: string[];
  comments: string;
  // Deprecated fields, kept for potential data migration
  behavior?: BehaviorRating;
  participation?: ParticipationRating;
  // FIX: Corrected type from ParticipationRating to AttitudeRating.
  attitude?: AttitudeRating;
  progress?: ProgressRating;
}

export interface TeacherProfile {
  id: string; // Corresponds to user_id
  full_name?: string;
  title?: string;
  school?: string;
  contact_email?: string;
  phone?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  terms_accepted?: boolean;
  accepted_at?: string; // ISO timestamp
  last_login?: string; // ISO timestamp
  login_count?: number;
  password_hash?: string; // For display only, never store plaintext
}

export interface PointLog {
  id: string;
  student_id: string;
  classroom_id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface WhiteboardSnapshot {
  id: string;
  classroom_id: string;
  created_at: string;
  image_data: string;
  name: string;
}

export interface HomepageContent {
  id: string;
  type: 'image' | 'text' | 'video';
  content: string;
  order: number;
}


export type GenerateOptions =
  | { type: 'groupCount'; value: number; avoidPrevious: boolean }
  | { type: 'studentCount'; value: number; avoidPrevious: boolean }
  | { type: 'minStudentCount'; value: number; avoidPrevious: boolean }
  | { type: 'maxStudentCount'; value: number; avoidPrevious: boolean }
  | { type: 'existing', existingGroups: Group[] };