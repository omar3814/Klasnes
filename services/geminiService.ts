
import { GoogleGenAI, Type } from "@google/genai";
import { Student, Assignment, Grade, BehaviorNote, Report, ReportAudience, PointLog, AttendanceRecord, TeacherProfile } from '../types.ts';

// Ensure the API_KEY is available in the environment variables.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  // In a real app, you might want to handle this more gracefully.
  // For this example, we log an error. The app will still function,
  // but AI features will fail.
  console.error("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateGroupNames(studentGroups: string[][]): Promise<string[]> {
  const studentGroupsText = studentGroups
    .map((group, i) => `Group ${i + 1}: ${group.join(', ')}`)
    .join('\n');
    
  const prompt = `
    You are a creative assistant for a teacher. 
    Generate ${studentGroups.length} fun, creative, and school-appropriate names for these student project groups.
    The names should be short and inspiring. Themes could be science, literature, animals, exploration, etc.
    Do not use the students' names in the group names.
    
    Here are the groups:
    ${studentGroupsText}

    Return ONLY a JSON array of strings, where each string is a group name.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        },
        temperature: 0.8,
      }
    });

    const jsonString = response.text.trim();
    const names = JSON.parse(jsonString);

    if (Array.isArray(names) && names.every(item => typeof item === 'string')) {
      return names;
    } else {
      throw new Error("Invalid response format from Gemini API.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate names from Gemini API.");
  }
}

export async function generateAIGroups(
  students: Student[], 
  assignments: Assignment[], 
  grades: Grade[], 
  behaviorNotes: BehaviorNote[],
  instructions: string
): Promise<{ groupName: string; studentIds: string[] }[]> {

  const studentDataForPrompt = students.map(student => {
    const studentGrades = grades
      .filter(g => g.student_id === student.id)
      .map(g => {
        const assignment = assignments.find(a => a.id === g.assignment_id);
        const score = g.score ?? 'N/A';
        const maxScore = assignment?.max_score ?? 'N/A';
        return `${assignment?.name || 'Assignment'}: ${score}/${maxScore}`;
      }).join(', ');

    const studentNotes = behaviorNotes
      .filter(n => n.student_id === student.id)
      .map(n => n.note)
      .join('; ');

    return `
      - Student ID: ${student.id}
        Name: ${student.name}
        Grades Summary: ${studentGrades || 'No grades'}
        Behavior Notes: ${studentNotes || 'No notes'}
        Other Info: ${student.notes || 'None'}
    `;
  }).join('');
  
  const prompt = `
    You are an expert teaching assistant responsible for creating balanced and effective student groups.
    
    Here is the list of all students in the class with their data:
    ${studentDataForPrompt}

    Here are the teacher's instructions for grouping:
    "${instructions}"

    Based on all the student data and the teacher's instructions, create the optimal groups.
    Your main goal is to follow the teacher's instructions. If instructions are vague, use the student data to make intelligent decisions (e.g., balancing academic strengths, separating disruptive students).
    
    - Give each group a creative, short, school-appropriate name.
    - Ensure every single student from the list is assigned to exactly one group. Do not leave any students out.
    
    Return a JSON object with a single key "groups".
    The value of "groups" must be an array of group objects.
    Each group object must have two keys: "groupName" (the creative name) and "studentIds" (an array of student ID strings).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            groups: {
              type: Type.ARRAY,
              description: "An array of student groups.",
              items: {
                type: Type.OBJECT,
                properties: {
                  groupName: {
                    type: Type.STRING,
                    description: "A creative name for the group."
                  },
                  studentIds: {
                    type: Type.ARRAY,
                    description: "An array of student IDs belonging to this group.",
                    items: { type: Type.STRING }
                  }
                },
                required: ['groupName', 'studentIds']
              }
            }
          },
          required: ['groups']
        }
      }
    });
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString) as { groups: { groupName: string, studentIds: string[] }[] };

    if (result.groups && Array.isArray(result.groups)) {
      return result.groups;
    } else {
      throw new Error("Invalid response structure from AI.");
    }

  } catch (error) {
    console.error("Error calling Gemini API for AI groups:", error);
    throw new Error("Failed to generate groups from Gemini API.");
  }
}

export async function generateStudentSummary(student: Student, assignments: Assignment[], grades: Grade[], behaviorNotes: BehaviorNote[]): Promise<string> {
    const gradesText = grades.map(grade => {
        const assignment = assignments.find(a => a.id === grade.assignment_id);
        if (!assignment) return null;
        return `- ${assignment.name} (${assignment.type}): ${grade.score ?? 'Not Graded'}/${assignment.max_score}`;
    }).filter(Boolean).join('\n');

    const behaviorText = behaviorNotes.map(note => {
        return `- On ${new Date(note.created_at).toLocaleDateString()}: ${note.note}`;
    }).join('\n');

    const prompt = `
        You are an experienced teaching assistant, skilled at observing and summarizing student progress.
        Analyze the following data for a student named ${student.name} and write a brief, constructive summary (2-3 sentences).
        Focus on identifying patterns, strengths, and areas for growth. The tone should be professional and helpful for a teacher's internal review.

        Student Data:
        - Name: ${student.name}
        - Grade Level: ${student.grade_level || 'Not specified'}
        - General Notes: ${student.notes || 'None'}

        Grades:
        ${gradesText || 'No grades recorded.'}

        Behavioral Notes:
        ${behaviorText || 'No behavior notes recorded.'}

        Provide a summary based on this data.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for summary:", error);
        throw new Error("Failed to generate summary from Gemini API.");
    }
}

export async function generateFinalReport(
  reportData: Omit<Report, 'id' | 'created_at' | 'user_id' | 'classroom_id'>,
  studentName: string,
  teacherProfile: TeacherProfile | null,
  studentDataSummary: string
): Promise<string> {

  const audience = reportData.audience || 'parent';
  let audienceInstructions = '';
  switch (audience) {
    case 'parent':
      audienceInstructions = "The report is for the student's parents/guardians. The tone should be professional, supportive, and easy to understand, avoiding educational jargon. Start with a positive observation if possible.";
      break;
    case 'principal':
      audienceInstructions = "The report is for the school principal. The tone should be formal, objective, and data-driven, highlighting progress and any areas requiring administrative awareness.";
      break;
    case 'personal':
      audienceInstructions = "This is a personal note for your own records. The tone should be direct and concise, summarizing key points and action items for future reference.";
      break;
  }
  
  const prompt = `
    You are an experienced and eloquent educator tasked with writing a comprehensive student progress report.
    ${audienceInstructions}

    Synthesize all the following information into a single, cohesive, well-structured report. 
    Use headings, paragraphs, and bullet points where appropriate to create a professional and readable document.
    Expand on the teacher's selections and raw comments to form complete sentences and provide context. Do not just list the selections.
    
    Crucially, you must incorporate the data from the 'Data Summary' to provide concrete evidence and examples for your comments. Analyze the specific assignments, grades, attendance, and point changes to make your report more impactful and data-driven.

    The final output should be a complete report, ready to be shared with the intended audience. Start with the teacher's profile information.

    Teacher's Profile:
    - Name: ${teacherProfile?.full_name || 'N/A'}
    - Title: ${teacherProfile?.title || 'Teacher'}
    - School: ${teacherProfile?.school || 'N/A'}

    Report Details:
    - Student Name: ${studentName}
    - Reporting Period: ${reportData.start_date} to ${reportData.end_date}
    
    Data Summary for the Period:
    """
    ${studentDataSummary}
    """

    Teacher's Selections (Behavior Tags):
    - ${reportData.behavior_tags.join(', ')}

    Teacher's Raw Comments:
    """
    ${reportData.comments || "No additional comments were provided."}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // Using a more powerful model for better structure and language
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API for final report:", error);
    throw new Error("Failed to generate final report from Gemini API.");
  }
}

export async function generateReportAdvice(
  behavior_tags: string[],
  audience: ReportAudience
): Promise<string> {
  const audienceMap = {
    parent: "the student's parent/guardian",
    principal: 'the school principal',
    personal: 'their own personal records'
  };

  const prompt = `
    You are an Instructional Coach AI. Your role is to provide brief, actionable advice to teachers as they write student reports.
    A teacher is preparing a report for ${audienceMap[audience]}.
    
    Here are the teacher's current selections:
    - ${behavior_tags.join(', ')}
    
    Based on these selections and the intended audience, provide ONE concise, helpful tip (1-2 sentences) to help the teacher write more effective comments.
    Focus on pedagogy, communication strategies, and framing. Do not write the comment for them, but advise them on HOW to write it.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API for report advice:", error);
    throw new Error("Failed to generate advice from Gemini API.");
  }
}

interface StudentDataForReport {
  student: Student;
  grades: Grade[];
  assignments: Assignment[];
  attendance: AttendanceRecord[];
  points: PointLog[];
  notes: BehaviorNote[];
}

export async function generateMassReport(
  classData: StudentDataForReport[],
  teacherProfile: TeacherProfile | null,
  startDate: string,
  endDate: string
): Promise<{studentId: string; reportText: string}[]> {
  const prompt = `
    You are an AI teaching assistant tasked with generating end-of-term summary reports for an entire class.
    I will provide you with a JSON object containing data for all students.
    For EACH student in the array, you must generate a concise, professional, and well-structured summary report.

    The final report for each student should include:
    1.  An overall summary of their performance.
    2.  Highlights of their academic achievements, citing specific assignments.
    3.  A summary of their attendance record.
    4.  A note on their behavior, citing specific point changes or notes.
    5.  A concluding remark with suggestions for improvement if necessary.

    RULES:
    - The tone must be professional and constructive, suitable for a parent-teacher conference.
    - Every data point in the final report must be cited with its source and date. For example: "achieved a score of 18/20 on the 'Photosynthesis Quiz' (2023-10-15)" or "received +2 points for 'Helping a classmate' (2023-10-12)".
    - The output MUST be a JSON object with a single key "reports". The value must be an array of objects, where each object has "studentId" and "reportText".
    - You MUST generate a report for EVERY student provided in the input data.

    DATA:
    Teacher: ${teacherProfile?.full_name || 'N/A'} (${teacherProfile?.title || 'Teacher'})
    School: ${teacherProfile?.school || 'N/A'}
    Reporting Period: ${startDate} to ${endDate}
    
    Student Data:
    ${JSON.stringify(classData, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                reports: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            studentId: { type: Type.STRING },
                            reportText: { type: Type.STRING }
                        },
                        required: ["studentId", "reportText"]
                    }
                }
            },
            required: ["reports"]
        }
      }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString) as { reports: { studentId: string, reportText: string }[] };

    if (result.reports && Array.isArray(result.reports)) {
        return result.reports;
    } else {
        throw new Error("Invalid response structure from AI for mass report generation.");
    }
  } catch (error) {
      console.error("Error calling Gemini API for mass report:", error);
      throw new Error("Failed to generate mass report from Gemini API.");
  }
}