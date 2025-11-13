

import React, { useState, useCallback, useEffect } from 'react';
import { Classroom, Student, Assignment, Grade, BehaviorNote, Desk, SavedLayout, Group, Lesson, AttendanceRecord, Report, PointLog, WhiteboardSnapshot, TeacherProfile, Holiday, HomepageContent, AttendanceStatus, ReportAudience } from './types.ts';
import { useGroupGenerator } from './hooks/useGroupGenerator.ts';
import { generateStudentSummary, generateAIGroups, generateFinalReport, generateReportAdvice, generateMassReport } from './services/geminiService.ts';
import { supabase } from './supabaseClient.ts';
import { Session } from '@supabase/supabase-js';

import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import { Toast, ToastProps } from './components/Toast.tsx';
import HomePage from './components/HomePage.tsx';
import ClassManager from './components/ClassManager.tsx';
import ClassroomStats from './components/ClassroomStats.tsx';
import DashboardView from './components/views/DashboardView.tsx';
import StudentsView from './components/views/StudentsView.tsx';
import StudentAnalyticsView from './components/views/StudentAnalyticsView.tsx';
import AssignmentsView from './components/views/AssignmentsView.tsx';
import WhiteboardView from './components/views/WhiteboardView.tsx';
import AttendanceView from './components/views/AttendanceView.tsx';
import LayoutView from './components/views/LayoutView.tsx';
import PointsView from './components/views/PointsView.tsx';
import GroupsView from './components/views/GroupsView.tsx';
import ReportsView from './components/views/ReportsView.tsx';
import ScheduleView from './components/views/ScheduleView.tsx';
import TeacherProfileView from './components/views/TeacherProfileView.tsx';
import Auth from './components/Auth.tsx';
import AdminDashboard from './components/admin/AdminDashboard.tsx';
import ViewWrapper from './components/navigation/ViewWrapper.tsx';
import InteractiveBackground from './components/InteractiveBackground.tsx';
import ConfirmEmail from './components/ConfirmEmail.tsx';

export type Page = 'dashboard' | 'students' | 'studentAnalytics' | 'assignments' | 'whiteboard' | 'attendance' | 'layout' | 'points' | 'groups' | 'reports' | 'schedule' | 'profile';
export type ViewState = {
  page: Page;
  studentId?: string;
}

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [adminSession, setAdminSession] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthedView, setUnauthedView] = useState<'home' | 'auth'>('home');
  const [viewState, setViewState] = useState<ViewState>({ page: 'dashboard' });
  const [history, setHistory] = useState<ViewState[]>([]);
  const [showConfirmEmail, setShowConfirmEmail] = useState(false);
  
  const [users, setUsers] = useState<TeacherProfile[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [behaviorNotes, setBehaviorNotes] = useState<BehaviorNote[]>([]);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
  const [snapshots, setSnapshots] = useState<WhiteboardSnapshot[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  
  const [websiteLogo, setWebsiteLogo] = useState<string | null>(null);
  const [homepageContent, setHomepageContent] = useState<HomepageContent[]>([]);
  
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  const { groups, setGroups, generateGroups, clearGroups } = useGroupGenerator();
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const [toast, setToast] = useState<Omit<ToastProps, 'onDismiss'> | null>(null);
  
  const teacherProfile = users.find(u => u.id === session?.user.id);
  const userClassrooms = classrooms.filter(c => c.user_id === session?.user.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user.email_confirmed_at === undefined && session?.user.created_at !== session?.user.updated_at) {
        setShowConfirmEmail(true);
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setShowConfirmEmail(session?.user.email_confirmed_at === undefined && session?.user.created_at !== session?.user.updated_at);
      if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED') {
         fetchUserProfile(session?.user?.id);
      }
      if (_event === 'SIGNED_OUT') {
        setAdminSession(null);
      }
      setLoading(false);
    });
    
    const fetchWebsiteContent = async () => {
      const { data: logoData } = await supabase.from('settings').select('value').eq('key', 'website_logo').single();
      if(logoData) setWebsiteLogo(logoData.value);
      
      const { data: contentData } = await supabase.from('homepage_content').select('*').order('order');
      if(contentData) setHomepageContent(contentData);
    };

    fetchWebsiteContent();

    return () => authListener.subscription.unsubscribe();
  }, []);
  
  const fetchUserProfile = async (userId?: string) => {
    if(!userId) return;
    const { data, error } = await supabase.from('teacher_profiles').select('*').eq('id', userId).single();
    if(data) {
        if(data.role === 'admin') {
            setAdminSession(data);
            setSession(null);
        } else {
            setAdminSession(null);
        }
    }
  };

  useEffect(() => {
    if (session?.user || adminSession) {
      fetchUserProfile(session?.user.id);
    }
  }, [session]);
  
  useEffect(() => {
    // FIX: Moved setters object out of fetchAllData to be accessible by subscriptions.
    const setters: any = {
      classrooms: setClassrooms, students: setStudents, assignments: setAssignments, grades: setGrades, behavior_notes: setBehaviorNotes, saved_layouts: setSavedLayouts, lessons: setLessons, attendance_records: setAttendanceRecords, reports: setReports, point_logs: setPointLogs, whiteboard_snapshots: setSnapshots, holidays: setHolidays
    };

    const fetchAllData = async () => {
      if(!adminSession && !session?.user) {
        // Clear all data on logout
        setClassrooms([]); setStudents([]); setAssignments([]); setGrades([]); setBehaviorNotes([]); setSavedLayouts([]); setLessons([]); setAttendanceRecords([]); setReports([]); setPointLogs([]); setSnapshots([]); setHolidays([]);
        return;
      };

      setLoading(true);

      const tables = ['classrooms', 'students', 'assignments', 'grades', 'behavior_notes', 'saved_layouts', 'lessons', 'attendance_records', 'reports', 'point_logs', 'whiteboard_snapshots', 'holidays'];
      
      let query;
      if (adminSession) {
        query = supabase.from('users_view').select('*'); // A view that joins all tables for admins
        const { data, error } = await query;
        if(data) {
          // This assumes users_view returns arrays for each table type
          Object.keys(setters).forEach(table => setters[table](data[0][table] || []));
          setUsers(data[0].teacher_profiles || []);
        }
      } else if (session?.user) {
        for (const table of tables) {
          query = supabase.from(table).select('*').eq('user_id', session.user.id);
          const { data } = await query;
          if(data) setters[table](data);
        }
        const {data: usersData} = await supabase.from('teacher_profiles').select('*');
        if (usersData) setUsers(usersData);
      }
      
      setLoading(false);
    };

    fetchAllData();

    // Set up real-time subscriptions
    const subscriptions = Object.keys(setters).map(tableName => {
      return supabase.channel(`public:${tableName}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => fetchAllData())
        .subscribe();
    });
    
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [session, adminSession]);


  const handleCreateClass = async (name: string) => {
    if (!name.trim() || !session) return;
    const newPageId = `page-${Date.now()}`;
    const { data, error } = await supabase.from('classrooms').insert({
      name,
      user_id: session.user.id,
      layout: [],
      whiteboard_state: JSON.stringify({ pages: [{id: newPageId, name: 'Page 1', state: [], order: 0}], activePageId: newPageId }),
    }).select().single();

    if (error) setToast({ type: 'error', message: error.message });
    else {
      setClassrooms(prev => [...prev, data]);
      setSelectedClassroomId(data.id);
      setToast({ type: 'success', message: `Class "${name}" created.` });
    }
  };

  const handleSelectClass = (classroomId: string) => {
    setSelectedClassroomId(classroomId);
    navigateTo('dashboard');
    clearGroups();
  };

  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'classroom_id' | 'avatar_url' | 'points'>) => {
    if (!selectedClassroomId || !session) return;
    const { data, error } = await supabase.from('students').insert({ ...studentData, classroom_id: selectedClassroomId, user_id: session.user.id }).select().single();
    if(error) setToast({type: 'error', message: error.message});
    else {
      setStudents(p => [...p, data]);
      setToast({ type: 'success', message: `Student "${data.name}" added.` });
    }
  };
  
  const handleUsePass = async (studentId: string, isOverride: boolean = false) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (isOverride) {
      const pointsToDeduct = 1;
      if ((student.points || 0) < pointsToDeduct) {
          setToast({ type: 'error', message: `${student.name} does not have enough points.` });
          return;
      }
      const newPoints = (student.points || 0) - pointsToDeduct;
      const { error } = await supabase.from('students').update({ points: newPoints, passes_used: student.passes_used + 1 }).eq('id', studentId);
      if(error) { setToast({ type: 'error', message: error.message }); return; }
      
      await supabase.from('point_logs').insert({ student_id: studentId, classroom_id: student.classroom_id, user_id: session?.user.id, amount: -pointsToDeduct, reason: "Extra toilet pass used" });
      setToast({ type: 'info', message: `Extra pass for ${student.name}. 1 point deducted.` });
    } else {
      if (student.passes_used >= student.passes_allowed) {
          setToast({ type: 'error', message: `${student.name} has no passes left.` });
          return;
      }
      const { error } = await supabase.from('students').update({ passes_used: student.passes_used + 1 }).eq('id', studentId);
      if(error) setToast({type: 'error', message: error.message});
      else setToast({ type: 'info', message: `${student.name} used a pass.` });
    }
  };

  const handleSetAllowance = async (allowance: number) => {
    if (allowance < 0 || !selectedClassroomId) return;
    const { error } = await supabase.from('students').update({ passes_allowed: allowance }).eq('classroom_id', selectedClassroomId);
    if(error) setToast({type: 'error', message: error.message});
    else setToast({ type: 'success', message: `Weekly pass allowance set.` });
  };

  const handleResetPasses = async () => {
    if (!selectedClassroomId) return;
    const { error } = await supabase.from('students').update({ passes_used: 0 }).eq('classroom_id', selectedClassroomId);
    if(error) setToast({type: 'error', message: error.message});
    else setToast({ type: 'success', message: 'All passes for this class have been reset.' });
  };

  const handleUpdateStudentAvatar = async (studentId: string, avatarUrl: string) => {
    const { error } = await supabase.from('students').update({ avatar_url: avatarUrl }).eq('id', studentId);
    if(error) setToast({type: 'error', message: error.message});
    else setToast({ type: 'success', message: 'Avatar updated!' });
  };

  const handleUpdateStudentDetails = async (studentId: string, updatedDetails: Partial<Omit<Student, 'id' | 'classroom_id'>>) => {
     const { error } = await supabase.from('students').update(updatedDetails).eq('id', studentId);
     if(error) setToast({type: 'error', message: error.message});
     else setToast({ type: 'success', message: 'Student details updated.' });
  };
  
  const handleUpdateStudentPoints = async (studentId: string, amount: number, reason: string) => {
    if (!reason.trim()) return;
    const { error: logError } = await supabase.from('point_logs').insert({ student_id: studentId, classroom_id: students.find(s=>s.id === studentId)?.classroom_id, user_id: session?.user.id, amount, reason });
    if(logError) { setToast({type: 'error', message: logError.message}); return; }

    const { error: rpcError } = await supabase.rpc('increment_student_points', { student_id_param: studentId, amount_param: amount });
    if(rpcError) setToast({type: 'error', message: rpcError.message});
    else setToast({ type: amount > 0 ? 'success' : 'info', message: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} point(s).` });
  };

  const handleAwardClassPoints = async (amount: number, reason: string) => {
    if (!reason.trim() || !selectedClassroomId || !session) return;
    const studentsInClass = students.filter(s => s.classroom_id === selectedClassroomId);
    if (studentsInClass.length === 0) return;
    
    const { error } = await supabase.rpc('award_class_points', { class_id_param: selectedClassroomId, amount_param: amount, reason_param: reason, user_id_param: session.user.id });
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: `Awarded ${amount} point(s) to the whole class!` });
  };

  const handleAddAssignment = async (assignment: Omit<Assignment, 'id' | 'classroom_id'>) => {
    if (!selectedClassroomId || !session) return;
    const { error } = await supabase.from('assignments').insert({ ...assignment, classroom_id: selectedClassroomId, user_id: session.user.id });
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: `Assignment added.` });
  };
  
  const handleUpdateAssignment = async (assignmentId: string, updatedData: Partial<Omit<Assignment, 'id' | 'classroom_id'>>) => {
    const { error } = await supabase.from('assignments').update(updatedData).eq('id', assignmentId);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: 'Assignment updated.' });
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'info', message: 'Assignment deleted.' });
  };
  
  const handleAddBehaviorNote = async (studentId: string, note: string, date?: string) => {
    if (!note.trim() || !session) return;
    const created_at = date ? new Date(date).toISOString() : new Date().toISOString();
    const { error } = await supabase.from('behavior_notes').insert({ student_id: studentId, note: note.trim(), created_at, user_id: session.user.id });
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'info', message: `Note added.` });
  };
  
  const handleUpdateGrade = async (studentId: string, assignmentId: string, score: number | null) => {
    const { error } = await supabase.from('grades').upsert({ student_id: studentId, assignment_id: assignmentId, score }, { onConflict: 'student_id, assignment_id' });
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: 'Grade updated.' });
  };
  
  const handleUpdateLayout = async (classroomId: string, layout: Desk[]) => {
      await supabase.from('classrooms').update({ layout }).eq('id', classroomId);
  };

  const handleUpdateWhiteboard = async (classroomId: string, whiteboardState: string) => {
      await supabase.from('classrooms').update({ whiteboard_state: whiteboardState }).eq('id', classroomId);
  };

  const handleSaveSnapshot = async (classroomId: string, imageData: string, name: string) => {
    if (!classroomId || !session) return;
    const { error } = await supabase.from('whiteboard_snapshots').insert({ classroom_id: classroomId, image_data: imageData, name, user_id: session.user.id });
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: 'Whiteboard snapshot saved!' });
  };

  const handleSaveCurrentLayout = async (classroomId: string, name: string, layout: Desk[]) => {
    if (!name.trim() || !session) return;
    const { error } = await supabase.from('saved_layouts').insert({ classroom_id: classroomId, name: name.trim(), layout, user_id: session.user.id });
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: `Arrangement saved.` });
  };
  
  const handleDeleteSavedLayout = async (layoutId: string) => {
    const { error } = await supabase.from('saved_layouts').delete().eq('id', layoutId);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'info', message: 'Arrangement deleted.' });
  };

  const handleGenerateSummary = async (student: Student) => {
    const classAssignments = assignments.filter(a => a.classroom_id === student.classroom_id);
    const studentGrades = grades.filter(g => g.student_id === student.id);
    const studentNotes = behaviorNotes.filter(n => n.student_id === student.id);
    setToast({ type: 'info', message: 'Generating AI summary...' });
    try {
      const summary = await generateStudentSummary(student, classAssignments, studentGrades, studentNotes);
      return summary;
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to generate summary.' });
      return null;
    }
  };

  const handleGenerateAIGroups = async (prompt: string) => {
    if (!selectedClassroomId) return;
    setIsGeneratingGroups(true);
    setToast({ type: 'info', message: 'Generating AI groups...' });
    const currentStudents = students.filter(s => s.classroom_id === selectedClassroomId);
    const currentAssignments = assignments.filter(a => a.classroom_id === selectedClassroomId);
    try {
      const aiResult = await generateAIGroups(currentStudents, currentAssignments, grades, behaviorNotes, prompt);
      const allStudentIdsInClass = new Set(currentStudents.map(s => s.id));
      const assignedIds = new Set(aiResult.flatMap(g => g.studentIds));
      if (allStudentIdsInClass.size !== assignedIds.size) throw new Error("AI did not assign all students to a group.");
      const newGroups: Group[] = aiResult.map((g, i) => ({
        id: `group-ai-${Date.now()}-${i}`, name: g.groupName,
        students: g.studentIds.map(id => students.find(s => s.id === id)!)
      }));
      setGroups(newGroups);
      setToast({ type: 'success', message: 'AI groups generated!' });
    } catch (error: any) {
      setToast({ type: 'error', message: `Failed to generate AI groups: ${error.message}` });
    } finally {
      setIsGeneratingGroups(false);
    }
  };

  const handleAddLesson = async (lessonData: Omit<Lesson, 'id' | 'classroom_id'>) => {
    if (!selectedClassroomId || !session) return;
    const { error } = await supabase.from('lessons').insert({ ...lessonData, classroom_id: selectedClassroomId, user_id: session.user.id });
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: 'Lesson added.' });
  };

  const handleUpdateLesson = async (lessonId: string, updatedData: Partial<Omit<Lesson, 'id' | 'classroom_id'>>) => {
    const { error } = await supabase.from('lessons').update(updatedData).eq('id', lessonId);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: 'Lesson updated.' });
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'info', message: 'Lesson deleted.' });
  };

  const handleSetAttendance = async (studentId: string, classroomId: string, status: AttendanceStatus, date: string) => {
    if (!session && !adminSession) return;
    const { error } = await supabase.from('attendance_records').upsert({ student_id: studentId, classroom_id: classroomId, date: date, status: status, user_id: session?.user.id }, { onConflict: 'student_id, date' });
    if(error) setToast({ type: 'error', message: error.message });
  };
  
  const handleSaveReport = async (reportData: Omit<Report, 'id' | 'created_at' | 'user_id' | 'classroom_id'>) => {
    if (!selectedClassroomId || !session) return;
    const { error } = await supabase.from('reports').upsert({ ...reportData, classroom_id: selectedClassroomId, user_id: session.user.id }, { onConflict: 'student_id, start_date, end_date' });
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: 'Report saved.' });
  };
  
  const handleGenerateFinalReport = async (reportData: Omit<Report, 'id' | 'created_at' | 'user_id' | 'classroom_id'>, studentName: string, studentDataSummary: string): Promise<string | null> => {
    setToast({ type: 'info', message: 'Generating final report...' });
    try {
      const finalReport = await generateFinalReport(reportData, studentName, teacherProfile, studentDataSummary);
      setToast({ type: 'success', message: 'Final report generated!' });
      return finalReport;
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to generate final report.' });
      return null;
    }
  };

  const handleGenerateReportAdvice = async (behavior_tags: string[], audience: ReportAudience): Promise<string | null> => {
    try {
      return await generateReportAdvice(behavior_tags, audience);
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to get advice.' });
      return null;
    }
  };

  const handleUpdateProfile = async (profileData: Partial<Omit<TeacherProfile, 'id' | 'role'>>) => {
    if (!session) return;
    const { error } = await supabase.from('teacher_profiles').update(profileData).eq('id', session.user.id);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: 'Profile updated!' });
  };

  const handleAdminUpdateUser = async (userId: string, data: Partial<TeacherProfile>) => {
    const { error } = await supabase.from('teacher_profiles').update(data).eq('id', userId);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: "User profile updated." });
  };

  const handleAdminDeleteUser = async (userId: string) => {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'info', message: "User and all their data have been deleted." });
  };

  const handleAdminUpdateLogo = async (logoUrl: string) => {
    const { error } = await supabase.from('settings').upsert({ key: 'website_logo', value: logoUrl }, { onConflict: 'key' });
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: "Website logo updated." });
  };

  const handleAdminUpdateHomepageContent = async (content: HomepageContent[]) => {
    await supabase.from('homepage_content').delete().neq('id', 'placeholder'); // Clear old content
    const { error } = await supabase.from('homepage_content').insert(content);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'success', message: "Homepage content updated." });
  };

  const handleAdminDeleteStudent = async (studentId: string) => {
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'info', message: "Student deleted." });
  };
  const handleAdminDeleteReport = async (reportId: string) => {
    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if(error) setToast({ type: 'error', message: error.message });
    else setToast({ type: 'info', message: "Report deleted." });
  };
  
  const navigateTo = (page: Page, studentId?: string) => {
    if (page === 'dashboard') {
        setHistory([]);
        setViewState({ page: 'dashboard' });
    } else {
        if (viewState.page === page && viewState.studentId === studentId) return;
        setHistory(prev => [...prev, viewState]);
        setViewState({ page, studentId });
    }
    window.scrollTo(0, 0);
  };

  const navigateBack = () => {
    if (history.length > 0) {
        const lastState = history[history.length - 1];
        setViewState(lastState);
        setHistory(prev => prev.slice(0, -1));
        window.scrollTo(0, 0);
    }
  };

  const renderContent = () => {
    const currentStudents = students.filter(s => s.classroom_id === selectedClassroomId);
    const commonReportProps = { assignments, grades, behaviorNotes, pointLogs, attendanceRecords };
    const canGoBack = history.length > 0;
    
    switch (viewState.page) {
      case 'dashboard':
        return <DashboardView navigateTo={navigateTo} classrooms={userClassrooms.length} selectedClassroom={!!selectedClassroomId}/>;
      case 'students':
        return <ViewWrapper title="Students" subtitle="Manage your student roster" canGoBack={canGoBack} onBack={navigateBack}><StudentsView selectedClassroomId={selectedClassroomId} students={currentStudents} onAddStudent={handleAddStudent} onUsePass={handleUsePass} onSetAllowance={handleSetAllowance} onResetPasses={handleResetPasses} onUpdateAvatar={handleUpdateStudentAvatar} onUpdateDetails={handleUpdateStudentDetails} onUpdateStudentPoints={handleUpdateStudentPoints} onShowAnalytics={(studentId) => navigateTo('studentAnalytics', studentId)} /></ViewWrapper>;
      case 'studentAnalytics':
        const student = students.find(s => s.id === viewState.studentId);
        if (!student) { navigateTo('students'); return null; }
        return <ViewWrapper title={student.name} subtitle="Student Analytics" canGoBack={canGoBack} onBack={navigateBack}><StudentAnalyticsView student={student} assignments={assignments.filter(a => a.classroom_id === student.classroom_id)} grades={grades.filter(g => g.student_id === student.id)} behaviorNotes={behaviorNotes.filter(n => n.student_id === student.id)} pointLogs={pointLogs.filter(p => p.student_id === student.id)} attendanceRecords={attendanceRecords.filter(a => a.student_id === student.id)} onAddBehaviorNote={handleAddBehaviorNote} onUpdateGrade={handleUpdateGrade} onGenerateSummary={handleGenerateSummary} onUpdateDetails={handleUpdateStudentDetails} onUpdateStudentPoints={handleUpdateStudentPoints} onUsePass={handleUsePass} /></ViewWrapper>;
      case 'assignments':
        return <ViewWrapper title="Assignments" subtitle="Manage homework, quizzes, and projects for your class" canGoBack={canGoBack} onBack={navigateBack}><AssignmentsView assignments={currentStudents.length > 0 ? assignments.filter(a => a.classroom_id === selectedClassroomId) : []} onAddAssignment={handleAddAssignment} students={currentStudents} grades={grades} onUpdateGrade={handleUpdateGrade} onUpdateAssignment={handleUpdateAssignment} onDeleteAssignment={handleDeleteAssignment} /></ViewWrapper>;
      case 'whiteboard':
        const selectedClassroomWb = classrooms.find(c => c.id === selectedClassroomId);
        return <ViewWrapper title="Interactive Whiteboard" subtitle="A real-time canvas for your classroom" canGoBack={canGoBack} onBack={navigateBack}><WhiteboardView classroomId={selectedClassroomId} initialState={selectedClassroomWb?.whiteboard_state ?? null} snapshots={snapshots.filter(s => s.classroom_id === selectedClassroomId)} onSaveState={(state) => handleUpdateWhiteboard(selectedClassroomId!, state)} onSaveSnapshot={handleSaveSnapshot} /></ViewWrapper>;
      case 'attendance':
        return <ViewWrapper title="Attendance" subtitle="Mark daily attendance for your students" canGoBack={canGoBack} onBack={navigateBack}><AttendanceView classroomId={selectedClassroomId!} students={currentStudents} records={attendanceRecords.filter(r => r.classroom_id === selectedClassroomId)} onSetAttendance={handleSetAttendance} /></ViewWrapper>;
      case 'layout':
        const selectedClassroomL = classrooms.find(c => c.id === selectedClassroomId);
        return <ViewWrapper title="Seating Layout" subtitle="Design and manage your classroom seating arrangements" canGoBack={canGoBack} onBack={navigateBack}><LayoutView classroomId={selectedClassroomId!} students={currentStudents} layout={selectedClassroomL?.layout ?? []} savedLayouts={savedLayouts.filter(s => s.classroom_id === selectedClassroomId)} onUpdateLayout={(layout) => handleUpdateLayout(selectedClassroomId!, layout)} onSaveLayout={handleSaveCurrentLayout} onDeleteLayout={handleDeleteSavedLayout} /></ViewWrapper>;
      case 'points':
        return <ViewWrapper title="Points & Behavior" subtitle="Track and manage student points for positive reinforcement" canGoBack={canGoBack} onBack={navigateBack}><PointsView pointLogs={pointLogs.filter(p => p.classroom_id === selectedClassroomId)} students={currentStudents} onAwardClassPoints={handleAwardClassPoints} onUpdateStudentPoints={handleUpdateStudentPoints} /></ViewWrapper>;
      case 'groups':
        return <ViewWrapper title="Group Generator" subtitle="Create student groups manually or with AI assistance" canGoBack={canGoBack} onBack={navigateBack}><GroupsView students={currentStudents} groups={groups} setGroups={setGroups} isGeneratingGroups={isGeneratingGroups} onGenerateGroups={generateGroups} onGenerateAIGroups={handleGenerateAIGroups} onClearGroups={clearGroups} /></ViewWrapper>;
      case 'reports':
        return <ViewWrapper title="Report Creator" subtitle="Generate insightful student progress reports with AI assistance" canGoBack={canGoBack} onBack={navigateBack}><ReportsView students={currentStudents} reports={reports.filter(r => r.classroom_id === selectedClassroomId)} onSaveReport={handleSaveReport} onGenerateFinalReport={handleGenerateFinalReport} onGenerateReportAdvice={handleGenerateReportAdvice} teacherProfile={teacherProfile} {...commonReportProps} /></ViewWrapper>;
      case 'schedule':
        return <ViewWrapper title="Weekly Schedule" subtitle="Plan your lessons for the week ahead" canGoBack={canGoBack} onBack={navigateBack}><ScheduleView lessons={lessons.filter(l => l.classroom_id === selectedClassroomId)} students={currentStudents} holidays={holidays.filter(h => h.classroom_id === selectedClassroomId)} onAddLesson={handleAddLesson} onUpdateLesson={handleUpdateLesson} onDeleteLesson={handleDeleteLesson} /></ViewWrapper>;
      case 'profile':
        return <ViewWrapper title="Your Profile" subtitle="This information will be used on reports and exports" canGoBack={canGoBack} onBack={navigateBack}><TeacherProfileView profile={teacherProfile} onUpdateProfile={handleUpdateProfile} /></ViewWrapper>;
      default:
        return <DashboardView navigateTo={navigateTo} classrooms={userClassrooms.length} selectedClassroom={!!selectedClassroomId} />;
    }
  };
  
  const renderAppBody = () => {
    if (loading) {
      return <div className="flex-grow flex items-center justify-center"><p>Loading Classroom...</p></div>;
    }
    
    if (adminSession) {
      return <AdminDashboard 
        admin={adminSession}
        users={users}
        allClassrooms={classrooms}
        allStudents={students}
        allAssignments={assignments}
        allGrades={grades}
        allBehaviorNotes={behaviorNotes}
        allPointLogs={pointLogs}
        allAttendanceRecords={attendanceRecords}
        allReports={reports}
        allLessons={lessons}
        homepageContent={homepageContent}
        websiteLogo={websiteLogo}
        onUpdateUser={handleAdminUpdateUser}
        onDeleteUser={handleAdminDeleteUser}
        onDeleteStudent={handleAdminDeleteStudent}
        onDeleteReport={handleAdminDeleteReport}
        onUpdateLogo={handleAdminUpdateLogo}
        onUpdateHomepageContent={handleAdminUpdateHomepageContent}
        onLogout={handleSignOut}
        setToast={setToast}
        />;
    }

    if (!session) {
      switch (unauthedView) {
        case 'auth':
          return <main className="flex-grow container mx-auto p-4 md:p-8 animate-page-enter"><Auth setToast={setToast}/></main>;
        case 'home':
        default:
          return <main className="flex-grow container mx-auto p-4 md:p-8 animate-page-enter"><HomePage onGetStartedClick={() => setUnauthedView('auth')} homepageContent={homepageContent}/></main>;
      }
    }

    if (showConfirmEmail) {
      return <ConfirmEmail session={session} setToast={setToast} />;
    }

    const currentStudents = students.filter(s => s.classroom_id === selectedClassroomId);

    return (
      <div className="container mx-auto p-4 md:p-8 flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              <aside className="lg:col-span-1 flex flex-col gap-0 sticky top-24 bg-card rounded-2xl border border-border overflow-hidden shadow-lg shadow-black/5">
                  <div className="p-6">
                    <ClassManager
                        classrooms={userClassrooms}
                        selectedClassroomId={selectedClassroomId}
                        onCreateClass={handleCreateClass}
                        onSelectClass={handleSelectClass}
                    />
                  </div>
                  {selectedClassroomId && (
                      <div className="p-6 border-t border-border">
                        <ClassroomStats 
                            students={currentStudents}
                            onAwardClassPoints={handleAwardClassPoints}
                        />
                      </div>
                  )}
              </aside>
              <main key={viewState.page + (viewState.studentId || '')} className="lg:col-span-3 animate-page-enter">
                  {renderContent()}
              </main>
          </div>
      </div>
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAdminSession(null);
    setUnauthedView('home');
  };

  return (
    <div className="min-h-screen flex flex-col font-['Inter'] bg-background text-foreground-muted transition-colors duration-300">
      <InteractiveBackground />
      {!adminSession && <Header session={session} onSignInClick={() => setUnauthedView('auth')} navigateTo={navigateTo} onSignOut={handleSignOut} websiteLogo={websiteLogo}/>}
      {renderAppBody()}
      {!adminSession && <Footer />}
      {toast && <Toast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />}
    </div>
  );
};

export default App;