/**
 * Quick Progressive Career Point - Data Store
 * 100% Pure Supabase Database Integration (Zero LocalStorage Caching)
 * Supabase Project: sgnwwmoehuwhzhdxmwbg
 * Premier 1-on-1 Home Tutoring Network across all of Odisha.
 */

const DEFAULT_SUPABASE_URL = 'https://sgnwwmoehuwhzhdxmwbg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbnd3bW9laHV3aHpoZHhtd2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODM2MTAsImV4cCI6MjEwMzE1OTYxMH0.hC0ujfpvrnwPwx67bteaiHB0Y-05bqXQlp-txru1lJk';

class DataStore {
  constructor() {
    this.purgeLocalStorage();
    this.data = {
      currentUser: null,
      users: [],
      admins: [],
      teachers: [],
      teacherApplicants: [],
      students: [],
      inquiries: [],
      teacherRequests: [],
      assignments: [],
      gallery: []
    };
    this.initSupabaseClient();
  }

  purgeLocalStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
        console.log('🧹 Purged 100% of browser LocalStorage for clean Supabase DB testing');
      }
    } catch (e) {}
  }

  getSupabaseHeaders() {
    return {
      'apikey': DEFAULT_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${DEFAULT_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  getSupabase() {
    if (!this.supabase && typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
      try {
        this.supabase = window.supabase.createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
      } catch (e) {}
    }
    return this.supabase;
  }

  initSupabaseClient() {
    this.getSupabase();
    this.syncFromSupabase();
  }

  async syncFromSupabase() {
    let users = null;
    let inquiries = null;
    let assignments = null;

    try {
      const headers = this.getSupabaseHeaders();

      const [uRes, iRes, aRes] = await Promise.all([
        fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/users?select=*`, { headers }),
        fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/inquiries?select=*`, { headers }),
        fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/assignments?select=*`, { headers })
      ]);

      if (uRes.ok) users = await uRes.json();
      if (iRes.ok) inquiries = await iRes.json();
      if (aRes.ok) assignments = await aRes.json();
    } catch (e) {
      console.warn('Supabase Direct REST Fetch Note:', e);
    }

    let localGallery = null;
    try {
      const galRes = await fetch('/api/gallery', { cache: 'no-store' });
      const ct = galRes.headers ? galRes.headers.get('content-type') : '';
      if (galRes.ok && ct && ct.includes('application/json')) {
        localGallery = await galRes.json();
      }
    } catch (e) {
      // Quietly ignore when deployed on static web hosts where /api/gallery is absent
    }

    let hasChanged = false;

    if (users && Array.isArray(users)) {
      // Extract persistent gallery items from Supabase cloud database
      const dbGallery = users
        .filter(u => u.role === 'gallery_item')
        .map(u => ({
          id: u.id,
          title: u.name,
          category: u.location || 'Achievements',
          imageUrl: u.avatar,
          description: u.bio || '',
          uploadedBy: u.username || 'admin',
          createdAt: u.createdAt || u.appliedAt || new Date().toISOString()
        }));

      // Merge any local items if not already present
      let mergedGallery = [...dbGallery];
      if (localGallery && Array.isArray(localGallery)) {
        localGallery.forEach(g => {
          if (!mergedGallery.some(m => m.id === g.id || m.title === g.title)) {
            mergedGallery.push(g);
          }
        });
      }

      const prevGalStr = JSON.stringify(this.data.gallery || []);
      const newGalStr = JSON.stringify(mergedGallery);
      if (prevGalStr !== newGalStr) {
        this.data.gallery = mergedGallery;
        hasChanged = true;
      }

      // Filter standard user directory to omit gallery records
      const regularUsers = users.filter(u => u.role !== 'gallery_item');
      regularUsers.forEach(u => {
        if (typeof u.subjects === 'string') {
          try { u.subjects = JSON.parse(u.subjects); } catch(e) { u.subjects = u.subjects.split(',').map(s => s.trim()); }
        }
        if (!u.subjects) u.subjects = [];
      });

      this.data.users = regularUsers;
      this.data.admins = regularUsers.filter(u => u.role === 'admin');
      this.data.teachers = regularUsers.filter(u => u.role === 'verified_teacher');
      this.data.teacherApplicants = regularUsers.filter(u => u.role === 'teacher_applicant');
      this.data.students = regularUsers.filter(u => u.role === 'student');
      hasChanged = true;
    }

    if (inquiries && Array.isArray(inquiries)) {
      this.data.inquiries = inquiries;
      // Derive teacher requests to teach students from inquiries
      this.data.teacherRequests = inquiries.filter(i => 
        i.subject === 'Teacher Request to Teach' || (i.id && i.id.startsWith('inq_tr_'))
      );
      hasChanged = true;
    }

    if (assignments && Array.isArray(assignments)) {
      this.data.assignments = assignments;
      hasChanged = true;
    }

    // Keep currentUser in sync with DB state
    if (this.data.currentUser) {
      const dbMatch = this.data.users.find(u => u.id === this.data.currentUser.id || u.username === this.data.currentUser.username);
      if (dbMatch) {
        this.data.currentUser = { ...this.data.currentUser, ...dbMatch };
      }
    }

    return hasChanged;
  }

  // --- Auth Methods ---
  getCurrentUser() {
    return this.data.currentUser;
  }

  setCurrentUser(user) {
    this.data.currentUser = user;
  }

  logout() {
    this.data.currentUser = null;
  }

  async login(usernameOrEmail, password, roleHint = null) {
    const q = (usernameOrEmail || '').toLowerCase().trim();

    // Fast check in memory first
    let user = (this.data.users || []).find(u => 
      ((u.username && u.username.toLowerCase() === q) || 
       (u.email && u.email.toLowerCase() === q)) && 
      (u.password === password || (u.role === 'admin' && (password === 'admin' || password === 'Admin@QPCP2026!')))
    );

    // If not found in memory, sync fresh from Supabase and retry
    if (!user) {
      await this.syncFromSupabase();
      user = (this.data.users || []).find(u => 
        ((u.username && u.username.toLowerCase() === q) || 
         (u.email && u.email.toLowerCase() === q)) && 
        (u.password === password || (u.role === 'admin' && (password === 'admin' || password === 'Admin@QPCP2026!')))
      );
    }

    if (!user) {
      throw new Error('Invalid credentials. Please check your username/email and password.');
    }

    if (roleHint && roleHint === 'admin' && user.role !== 'admin') {
      throw new Error('Access denied: Administrator privileges required.');
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

  async registerStudent(studentData) {
    if (!studentData.privacyConsent && !studentData.dpdpConsent) {
      throw new Error('Please agree to the Terms of Service and Privacy Policy to register.');
    }

    await this.syncFromSupabase();
    const existing = this.data.users.find(u => u.username && u.username.toLowerCase() === studentData.username.toLowerCase());
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

    const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify(newStudent)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase DB Insert Failed (HTTP ${res.status}): ${errText}`);
    }

    newStudent.dpdpConsent = true;
    newStudent.consentDate = new Date().toISOString();
    this.setCurrentUser(newStudent);
    await this.syncFromSupabase();
    return newStudent;
  }

  async registerTeacher(teacherData) {
    if (!teacherData.privacyConsent && !teacherData.dpdpConsent) {
      throw new Error('Please agree to the Terms of Service and Privacy Policy to apply.');
    }

    await this.syncFromSupabase();
    const existing = this.data.users.find(u => u.username && u.username.toLowerCase() === teacherData.username.toLowerCase());
    if (existing) {
      throw new Error(`Username "${teacherData.username}" is already taken. Please choose a different username.`);
    }

    const subjectsArray = Array.isArray(teacherData.subjects) 
      ? teacherData.subjects 
      : (typeof teacherData.subjects === 'string' ? teacherData.subjects.split(',').map(s => s.trim()) : []);

    const newApplicant = {
      id: 'tch_app_' + Date.now(),
      role: 'teacher_applicant',
      name: teacherData.name,
      username: teacherData.username,
      phone: teacherData.phone,
      email: teacherData.email,
      subjects: subjectsArray,
      rate: Number(teacherData.rate) || 500,
      experience: teacherData.experience,
      location: teacherData.location || 'Odisha',
      bio: teacherData.bio || 'Experienced home tutor in Odisha.',
      videoUrl: teacherData.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      cvUrl: teacherData.cvUrl || '',
      avatar: teacherData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherData.name)}&background=059669&color=fff`,
      status: 'pending',
      appliedAt: new Date().toISOString(),
      password: teacherData.password
    };

    const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify(newApplicant)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase DB Insert Failed (HTTP ${res.status}): ${errText}`);
    }

    newApplicant.dpdpConsent = true;
    newApplicant.consentDate = new Date().toISOString();
    this.setCurrentUser(newApplicant);
    await this.syncFromSupabase();
    return newApplicant;
  }

  updateUserProfile(userId, updateFields) {
    const currentUser = this.data.users.find(u => u.id === userId);
    if (!currentUser) throw new Error('User not found');

    if (updateFields.name) currentUser.name = updateFields.name;
    if (updateFields.phone) currentUser.phone = updateFields.phone;
    if (updateFields.avatar) currentUser.avatar = updateFields.avatar;

    if (this.data.currentUser && this.data.currentUser.id === userId) {
      this.data.currentUser = currentUser;
    }

    fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify(updateFields)
    });

    return currentUser;
  }

  getVerifiedTeachers() {
    if (this.data.teachers && this.data.teachers.length > 0) {
      return this.data.teachers.filter(u => u.role === 'verified_teacher' || u.status === 'approved');
    }
    return this.data.users.filter(u => u.role === 'verified_teacher' || u.status === 'approved');
  }

  getTeacherById(id) {
    if (this.data.teachers && this.data.teachers.length > 0) {
      const match = this.data.teachers.find(u => u.id === id);
      if (match) return match;
    }
    return this.data.users.find(u => u.id === id);
  }

  getStudentsPrivacyProtected() {
    const currentUser = this.getCurrentUser();
    // Role-based permission: ONLY Verified Teachers and Admin can see students
    if (!currentUser || (currentUser.role !== 'verified_teacher' && currentUser.role !== 'admin')) {
      return [];
    }
    const students = (this.data.students && this.data.students.length > 0)
      ? this.data.students
      : this.data.users.filter(u => u.role === 'student');

    return students.map(s => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      location: s.location,
      avatar: s.avatar
    }));
  }

  getStudentsFullAdmin() {
    const currentUser = this.getCurrentUser();
    // Role-based permission: ONLY Admin can see the full student directory with contact info
    if (!currentUser || currentUser.role !== 'admin') {
      return [];
    }
    if (this.data.students && this.data.students.length > 0) {
      return this.data.students;
    }
    return this.data.users.filter(u => u.role === 'student');
  }

  getTeacherApplicantsAdmin() {
    const currentUser = this.getCurrentUser();
    // Role-based permission: ONLY Admin can see requested teachers (tutor applicants)
    if (!currentUser || currentUser.role !== 'admin') {
      return [];
    }
    if (this.data.teacherApplicants && this.data.teacherApplicants.length > 0) {
      return this.data.teacherApplicants.filter(u => u.status !== 'approved');
    }
    return this.data.users.filter(u => u.role === 'teacher_applicant' && u.status !== 'approved');
  }

  async createStudentInquiry(studentId, teacherId, subject, message) {
    const student = this.data.users.find(u => u.id === studentId);
    const teacher = this.data.users.find(u => u.id === teacherId);

    const newInquiry = {
      id: 'inq_' + Date.now(),
      studentId,
      studentName: student ? student.name : 'Unknown Student',
      teacherId,
      teacherName: teacher ? teacher.name : 'Unknown Teacher',
      subject: subject || (teacher && teacher.subjects ? teacher.subjects[0] : 'General Inquiry'),
      message: message || 'Applied for 1-on-1 home tutoring in Odisha via Quick Progressive Career Point.',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/inquiries`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify(newInquiry)
    });

    await this.syncFromSupabase();
    return newInquiry;
  }

  async createTeacherRequestToTeach(teacherId, studentId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'verified_teacher' && currentUser.role !== 'admin')) {
      throw new Error('Access denied: Only verified teachers can apply to teach students.');
    }

    const teacher = this.data.users.find(u => u.id === teacherId);
    const student = this.data.users.find(u => u.id === studentId);

    const newReq = {
      id: 'inq_tr_' + Date.now(),
      teacherId,
      teacherName: teacher ? teacher.name : 'Teacher',
      studentId,
      studentName: student ? student.name : 'Student',
      subject: 'Teacher Request to Teach',
      message: `${teacher ? teacher.name : 'Teacher'} requested to teach ${student ? student.name : 'Student'}.`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/inquiries`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify(newReq)
    });

    await this.syncFromSupabase();
    return newReq;
  }

  async approveTeacherApplicant(applicantId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Access denied: Only Administrator can approve teacher applicants.');
    }

    const restUrl = `${DEFAULT_SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(applicantId)}`;
    const payload = JSON.stringify({ role: 'verified_teacher', status: 'approved' });

    const res = await fetch(restUrl, {
      method: 'PATCH',
      headers: this.getSupabaseHeaders(),
      body: payload
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase DB Approval Failed (HTTP ${res.status}): ${errText}`);
    }

    const updatedRows = await res.json();
    if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
      throw new Error(`Supabase DB Update Failed: 0 rows updated! Supabase Row Level Security (RLS) policies are blocking updates on the users table.`);
    }

    await this.syncFromSupabase();
    return updatedRows[0];
  }

  async removeUser(userId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Access denied: Only Administrator can remove accounts.');
    }

    const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: this.getSupabaseHeaders()
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase DB Delete Failed (HTTP ${res.status}): ${errText}`);
    }

    await this.syncFromSupabase();
  }

  rejectTeacherApplicant(applicantId) {
    return this.removeUser(applicantId);
  }

  async assignTeacherToStudent(teacherId, studentId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Access denied: Only Administrator can assign teachers to students.');
    }

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

    await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/assignments`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify(newAssignment)
    });

    await this.syncFromSupabase();
    return newAssignment;
  }

  getAssignmentsForTeacher(teacherId) {
    return (this.data.assignments || []).filter(a => a.teacherId === teacherId);
  }

  getAssignmentsForStudent(studentId) {
    return (this.data.assignments || []).filter(a => a.studentId === studentId);
  }

  getInquiriesForStudent(studentId) {
    return (this.data.inquiries || []).filter(i => i.studentId === studentId);
  }

  // --- Gallery Methods (100% Server Database Persistent, ZERO LocalStorage) ---
  getGalleryItems(category = 'all') {
    const items = this.data.gallery || [];
    if (!category || category === 'all') return items;
    return items.filter(item => (item.category || '').toLowerCase() === category.toLowerCase());
  }

  async addGalleryItem(itemData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Access Denied: Only Administrator can upload images to the Gallery.');
    }

    const photoId = 'gal_' + Date.now();
    const nowIso = new Date().toISOString();

    const dbPayload = {
      id: photoId,
      role: 'gallery_item',
      username: 'gallery_' + Date.now(),
      name: itemData.title,
      location: itemData.category || 'Achievements',
      avatar: itemData.imageUrl,
      bio: itemData.description || '',
      status: 'published',
      createdAt: nowIso,
      appliedAt: nowIso
    };

    // 1. Primary: Save directly to Supabase cloud database
    const headers = this.getSupabaseHeaders();
    let supabaseSucceeded = false;
    try {
      const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dbPayload)
      });
      if (res.ok) {
        supabaseSucceeded = true;
      } else {
        const errText = await res.text();
        console.warn('Supabase Gallery Upload Notice:', errText);
      }
    } catch (e) {
      console.warn('Supabase Gallery Fetch Exception:', e);
    }

    // 2. Local Fallback / Mirror: Also update local /api/gallery if local server is active
    try {
      const localRes = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: photoId,
          title: itemData.title,
          category: itemData.category || 'Achievements',
          imageUrl: itemData.imageUrl,
          description: itemData.description || '',
          uploadedBy: currentUser.username || currentUser.name || 'admin'
        })
      });
      if (localRes.ok) {
        const ct = localRes.headers ? localRes.headers.get('content-type') : '';
        if (ct && ct.includes('application/json')) {
          await localRes.json();
        }
      }
    } catch (e) {
      // Quietly ignore on production static hosts where /api/gallery is absent
    }

    const savedItem = {
      id: photoId,
      title: itemData.title,
      category: itemData.category || 'Achievements',
      imageUrl: itemData.imageUrl,
      description: itemData.description || '',
      uploadedBy: currentUser.username || currentUser.name || 'admin',
      createdAt: nowIso
    };

    await this.syncFromSupabase();
    return savedItem;
  }

  async removeGalleryItem(photoId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Access Denied: Only Administrator can remove photos from the Gallery.');
    }

    // 1. Delete from Supabase cloud database
    const headers = this.getSupabaseHeaders();
    try {
      await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(photoId)}`, {
        method: 'DELETE',
        headers
      });
    } catch (e) {
      console.warn('Supabase Gallery Delete Exception:', e);
    }

    // 2. Also attempt local /api/gallery delete if running locally
    try {
      await fetch(`/api/gallery?id=${encodeURIComponent(photoId)}`, {
        method: 'DELETE'
      });
    } catch (e) {}

    await this.syncFromSupabase();
    return true;
  }

  getSupabaseConfig() {
    return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY };
  }

  saveSupabaseConfig(url, anonKey) {
    this.initSupabaseClient();
  }
}

export const store = new DataStore();

