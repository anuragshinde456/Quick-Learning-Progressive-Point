/**
 * Quick Progressive Carrier Point - Data Store
 * Reactive LocalStorage persistence with sample demo data & privacy filter helpers
 * Integrated with Supabase database (Project: sgnwwmoehuwhzhdxmwbg).
 * Premier 1-on-1 Home Tutoring Network across all of Odisha.
 */

const STORAGE_KEY = 'QPCP_APP_DATA_V6';
const SUPABASE_CONFIG_KEY = 'QPCP_SUPABASE_CONFIG';

const DEFAULT_SUPABASE_URL = 'https://sgnwwmoehuwhzhdxmwbg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbnd3bW9laHV3aHpoZHhtd2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODM2MTAsImV4cCI6MjEwMzE1OTYxMH0.hC0ujfpvrnwPwx67bteaiHB0Y-05bqXQlp-txru1lJk';

const initialDemoData = {
  currentUser: null,
  users: [
    // Students (Across Odisha)
    {
      id: 'std_1',
      role: 'student',
      name: 'Rohan Sharma',
      username: 'rohan_s10',
      phone: '+91 98765 43210',
      email: 'rohan.sharma@example.com',
      grade: 'Class 12 CHSE/CBSE (Physics & Math)',
      location: 'Patia, Bhubaneswar, Odisha',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      password: '123'
    },
    {
      id: 'std_2',
      role: 'student',
      name: 'Ananya Gupta',
      username: 'ananya_g',
      phone: '+91 98123 45678',
      email: 'ananya.gupta@example.com',
      grade: 'JEE Mains & Advanced Prep',
      location: 'CDA Sector 9, Cuttack, Odisha',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      password: '123'
    },
    {
      id: 'std_3',
      role: 'student',
      name: 'Vikram Verma',
      username: 'vikram_v',
      phone: '+91 97112 23344',
      email: 'vikram.verma@example.com',
      grade: 'Class 10 ICSE (Science Stream)',
      location: 'Civil Township, Rourkela, Odisha',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      password: '123'
    },

    // Verified Home Tutors (Across Odisha)
    {
      id: 'tch_1',
      role: 'verified_teacher',
      name: 'Dr. Rajesh Verma',
      username: 'dr_rajesh',
      phone: '+91 99887 76655',
      email: 'rajesh.verma@qpcp.edu',
      subjects: ['Physics', 'Mathematics', 'JEE Prep'],
      rate: 650,
      experience: '12 Years',
      location: 'Infocity, Patia, Bhubaneswar, Odisha',
      bio: 'Ph.D in Applied Physics. 12+ years experience in 1-on-1 home tutoring for JEE & Board exams.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&auto=format&fit=crop&q=80',
      rating: 4.9,
      totalStudents: 140,
      status: 'approved',
      password: '123'
    },
    {
      id: 'tch_2',
      role: 'verified_teacher',
      name: 'Priya Sundaram',
      username: 'priya_chem',
      phone: '+91 98711 22334',
      email: 'priya.s@qpcp.edu',
      subjects: ['Chemistry', 'Organic Chemistry', 'NEET Prep'],
      rate: 550,
      experience: '8 Years',
      location: 'Cantonment Road, Cuttack, Odisha',
      bio: 'M.Sc Chemistry Gold Medalist. Dedicated home tutor for NEET & CHSE Chemistry across Cuttack & Bhubaneswar.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80',
      rating: 4.8,
      totalStudents: 98,
      status: 'approved',
      password: '123'
    },
    {
      id: 'tch_3',
      role: 'verified_teacher',
      name: 'Amitab Bhasin',
      username: 'amitab_math',
      phone: '+91 98990 01122',
      email: 'amitab.math@qpcp.edu',
      subjects: ['Mathematics', 'Calculus', 'Class 9-12 Foundation'],
      rate: 480,
      experience: '6 Years',
      location: 'Chhend Colony, Rourkela, Odisha',
      bio: 'Interactive home tutor specializing in building strong math foundations in Rourkela & Western Odisha.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
      rating: 4.7,
      totalStudents: 75,
      status: 'approved',
      password: '123'
    },

    // Pending Teacher Applicant (Odisha)
    {
      id: 'tch_app_1',
      role: 'teacher_applicant',
      name: 'Suresh Raina',
      username: 'suresh_bio',
      phone: '+91 99112 23344',
      email: 'suresh.raina@example.com',
      subjects: ['Biology', 'Zoology', 'Class 11-12'],
      rate: 420,
      experience: '4 Years',
      location: 'Budharaja, Sambalpur, Odisha',
      bio: 'Passionate biology home tutor for Class 11-12 & NEET in Sambalpur & Burla.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
      status: 'pending',
      appliedAt: '2026-08-05T14:30:00Z',
      password: '123'
    },

    // Admin
    {
      id: 'adm_1',
      role: 'admin',
      name: 'QPCP Central Admin (Odisha HQ)',
      username: 'admin',
      phone: '+91 70082 21300',
      email: 'admin@quickprogressive.edu.in',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      password: 'admin'
    }
  ],

  inquiries: [
    {
      id: 'inq_1',
      studentId: 'std_1',
      studentName: 'Rohan Sharma',
      teacherId: 'tch_1',
      teacherName: 'Dr. Rajesh Verma',
      subject: 'Physics',
      message: 'Looking for 1-on-1 home tutoring in Odisha for Class 12 Boards & JEE via Quick Progressive Carrier Point.',
      status: 'pending',
      createdAt: '2026-08-06T10:15:00Z'
    },
    {
      id: 'inq_2',
      studentId: 'std_2',
      studentName: 'Ananya Gupta',
      teacherId: 'tch_2',
      teacherName: 'Priya Sundaram',
      subject: 'Chemistry',
      message: 'Need urgent home tutor for Organic Chemistry NEET prep in Cuttack.',
      status: 'assigned',
      createdAt: '2026-08-05T16:00:00Z'
    }
  ],

  teacherRequests: [
    {
      id: 'tr_1',
      teacherId: 'tch_3',
      teacherName: 'Amitab Bhasin',
      studentId: 'std_3',
      studentName: 'Vikram Verma',
      status: 'pending',
      createdAt: '2026-08-06T11:00:00Z'
    }
  ],

  assignments: [
    {
      id: 'asg_1',
      teacherId: 'tch_2',
      teacherName: 'Priya Sundaram',
      studentId: 'std_2',
      studentName: 'Ananya Gupta',
      assignedBy: 'admin',
      assignedAt: '2026-08-06T09:00:00Z'
    }
  ]
};

class DataStore {
  constructor() {
    this.data = this.loadData();
    this.saveData();
    this.initSupabaseClient();
  }

  loadData() {
    try {
      localStorage.removeItem('QLPP_APP_DATA_V1');
      localStorage.removeItem('QLPP_APP_DATA_V2');
      localStorage.removeItem('QLPP_APP_DATA_V3');
      localStorage.removeItem('QPCP_APP_DATA_V4');
      localStorage.removeItem('QPCP_APP_DATA_V5');
      localStorage.removeItem(SUPABASE_CONFIG_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const locationMap = {
          'std_1': 'Patia, Bhubaneswar, Odisha',
          'std_2': 'CDA Sector 9, Cuttack, Odisha',
          'std_3': 'Civil Township, Rourkela, Odisha',
          'tch_1': 'Infocity, Patia, Bhubaneswar, Odisha',
          'tch_2': 'Cantonment Road, Cuttack, Odisha',
          'tch_3': 'Chhend Colony, Rourkela, Odisha',
          'tch_app_1': 'Budharaja, Sambalpur, Odisha'
        };
        if (parsed.users) {
          parsed.users.forEach(u => {
            if (locationMap[u.id]) {
              u.location = locationMap[u.id];
            } else if (!u.location || !u.location.includes('Odisha')) {
              u.location = u.location ? `${u.location}, Odisha` : 'Bhubaneswar, Odisha';
            }
          });
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read from LocalStorage:', e);
    }
    return JSON.parse(JSON.stringify(initialDemoData));
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Error saving data:', e);
    }
  }

  initSupabaseClient() {
    const config = this.getSupabaseConfig();
    const url = config.url || DEFAULT_SUPABASE_URL;
    const key = config.anonKey || DEFAULT_SUPABASE_ANON_KEY;

    if (window.supabase && window.supabase.createClient) {
      try {
        this.supabase = window.supabase.createClient(url, key);
        console.log('⚡ Supabase Client initialized for Quick Progressive Carrier Point (Odisha)');
      } catch (e) {
        console.warn('Could not initialize Supabase client:', e);
      }
    }
  }

  resetToDemo() {
    this.data = JSON.parse(JSON.stringify(initialDemoData));
    this.saveData();
  }

  // --- Auth Methods ---
  getCurrentUser() {
    return this.data.currentUser;
  }

  setCurrentUser(user) {
    this.data.currentUser = user;
    this.saveData();
  }

  logout() {
    this.data.currentUser = null;
    this.saveData();
  }

  login(usernameOrEmail, password, roleHint = null) {
    const user = this.data.users.find(u => 
      (u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
       u.email.toLowerCase() === usernameOrEmail.toLowerCase()) && 
      u.password === password
    );

    if (!user) {
      throw new Error('Invalid credentials. Please check your username/email and password.');
    }

    if (roleHint && roleHint === 'teacher' && user.role !== 'verified_teacher' && user.role !== 'teacher_applicant' && user.role !== 'admin') {
      throw new Error('This account is registered as a Student. Please login using the Student Portal.');
    }

    if (roleHint && roleHint === 'student' && user.role !== 'student' && user.role !== 'admin') {
      throw new Error('This account is registered as a Teacher. Please login using the Teacher Portal.');
    }

    this.setCurrentUser(user);
    return user;
  }

  registerStudent(studentData) {
    const existing = this.data.users.find(u => u.username.toLowerCase() === studentData.username.toLowerCase());
    if (existing) {
      throw new Error(`Username "${studentData.username}" is already taken. Please choose a different username.`);
    }

    const newStudent = {
      id: 'std_' + Date.now(),
      role: 'student',
      name: studentData.name,
      username: studentData.username,
      phone: studentData.phone,
      email: studentData.email,
      grade: studentData.grade,
      location: studentData.location || 'Bhubaneswar, Odisha',
      avatar: studentData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=2563eb&color=fff`,
      password: studentData.password
    };

    this.data.users.push(newStudent);
    this.setCurrentUser(newStudent);
    this.saveData();

    if (this.supabase) {
      this.supabase.from('users').insert([newStudent]).then(res => {
        if (res.error) console.info('Supabase Sync Note:', res.error.message);
      });
    }

    return newStudent;
  }

  registerTeacher(teacherData) {
    const existing = this.data.users.find(u => u.username.toLowerCase() === teacherData.username.toLowerCase());
    if (existing) {
      throw new Error(`Username "${teacherData.username}" is already taken. Please choose a different username.`);
    }

    const newApplicant = {
      id: 'tch_app_' + Date.now(),
      role: 'teacher_applicant',
      name: teacherData.name,
      username: teacherData.username,
      phone: teacherData.phone,
      email: teacherData.email,
      subjects: Array.isArray(teacherData.subjects) ? teacherData.subjects : teacherData.subjects.split(',').map(s => s.trim()),
      rate: Number(teacherData.rate) || 500,
      experience: teacherData.experience,
      location: teacherData.location || 'Odisha',
      bio: teacherData.bio,
      videoUrl: teacherData.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      avatar: teacherData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherData.name)}&background=059669&color=fff`,
      status: 'pending',
      appliedAt: new Date().toISOString(),
      password: teacherData.password
    };

    this.data.users.push(newApplicant);
    this.setCurrentUser(newApplicant);
    this.saveData();

    if (this.supabase) {
      this.supabase.from('users').insert([newApplicant]).then(res => {
        if (res.error) console.info('Supabase Sync Note:', res.error.message);
      });
    }

    return newApplicant;
  }

  updateUserProfile(userId, updateFields) {
    const userIndex = this.data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const currentUser = this.data.users[userIndex];

    if (updateFields.name) currentUser.name = updateFields.name;
    if (updateFields.phone) currentUser.phone = updateFields.phone;
    if (updateFields.avatar) currentUser.avatar = updateFields.avatar;

    if (this.data.currentUser && this.data.currentUser.id === userId) {
      this.data.currentUser = currentUser;
    }

    this.saveData();
    return currentUser;
  }

  getVerifiedTeachers() {
    return this.data.users.filter(u => u.role === 'verified_teacher');
  }

  getTeacherById(id) {
    return this.data.users.find(u => u.id === id);
  }

  getStudentsPrivacyProtected() {
    const students = this.data.users.filter(u => u.role === 'student');
    return students.map(s => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      location: s.location,
      avatar: s.avatar
    }));
  }

  getStudentsFullAdmin() {
    return this.data.users.filter(u => u.role === 'student');
  }

  getTeacherApplicantsAdmin() {
    return this.data.users.filter(u => u.role === 'teacher_applicant');
  }

  createStudentInquiry(studentId, teacherId, subject, message) {
    const student = this.data.users.find(u => u.id === studentId);
    const teacher = this.data.users.find(u => u.id === teacherId);

    const newInquiry = {
      id: 'inq_' + Date.now(),
      studentId,
      studentName: student ? student.name : 'Unknown Student',
      teacherId,
      teacherName: teacher ? teacher.name : 'Unknown Teacher',
      subject: subject || (teacher ? teacher.subjects[0] : 'General Inquiry'),
      message: message || 'Applied for 1-on-1 home tutoring in Odisha via Quick Progressive Carrier Point.',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.data.inquiries.push(newInquiry);
    this.saveData();

    if (this.supabase) {
      this.supabase.from('inquiries').insert([newInquiry]).then(res => {
        if (res.error) console.info('Supabase Sync Note:', res.error.message);
      });
    }

    return newInquiry;
  }

  createTeacherRequestToTeach(teacherId, studentId) {
    const teacher = this.data.users.find(u => u.id === teacherId);
    const student = this.data.users.find(u => u.id === studentId);

    const newReq = {
      id: 'tr_' + Date.now(),
      teacherId,
      teacherName: teacher ? teacher.name : 'Teacher',
      studentId,
      studentName: student ? student.name : 'Student',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.data.teacherRequests.push(newReq);
    this.saveData();
    return newReq;
  }

  approveTeacherApplicant(applicantId) {
    const userIndex = this.data.users.findIndex(u => u.id === applicantId);
    if (userIndex === -1) throw new Error('Applicant not found');

    this.data.users[userIndex].role = 'verified_teacher';
    this.data.users[userIndex].status = 'approved';
    this.data.users[userIndex].rating = 5.0;
    this.data.users[userIndex].totalStudents = 0;

    if (this.data.currentUser && this.data.currentUser.id === applicantId) {
      this.data.currentUser.role = 'verified_teacher';
      this.data.currentUser.status = 'approved';
    }

    this.saveData();
    return this.data.users[userIndex];
  }

  rejectTeacherApplicant(applicantId) {
    this.data.users = this.data.users.filter(u => u.id !== applicantId);
    this.saveData();
  }

  assignTeacherToStudent(teacherId, studentId) {
    const teacher = this.data.users.find(u => u.id === teacherId);
    const student = this.data.users.find(u => u.id === studentId);

    if (!teacher || !student) throw new Error('Teacher or Student not found');

    const newAssignment = {
      id: 'asg_' + Date.now(),
      teacherId,
      teacherName: teacher.name,
      studentId,
      studentName: student.name,
      assignedBy: 'admin',
      assignedAt: new Date().toISOString()
    };

    this.data.assignments.push(newAssignment);

    this.data.inquiries.forEach(inq => {
      if (inq.studentId === studentId && inq.teacherId === teacherId) {
        inq.status = 'assigned';
      }
    });

    this.saveData();
    return newAssignment;
  }

  getAssignmentsForTeacher(teacherId) {
    return this.data.assignments.filter(a => a.teacherId === teacherId);
  }

  getAssignmentsForStudent(studentId) {
    return this.data.assignments.filter(a => a.studentId === studentId);
  }

  getInquiriesForStudent(studentId) {
    return (this.data.inquiries || []).filter(i => i.studentId === studentId);
  }

  getSupabaseConfig() {
    try {
      const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY };
  }

  saveSupabaseConfig(url, anonKey) {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, anonKey }));
    this.initSupabaseClient();
  }
}

export const store = new DataStore();
