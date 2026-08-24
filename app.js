/**
 * Quick Progressive Carrier Point - Application Controller
 * Premier 1-on-1 Home Tutoring Network across all of Odisha
 * Cities & Districts Covered: Bhubaneswar, Cuttack, Rourkela, Sambalpur, Berhampur, Balasore, Puri & all 30 Districts
 */

import { store } from './store.js';

class AppController {
  constructor() {
    this.currentView = 'home'; // 'home' | 'about' | 'gallery'
    this.currentSubjectFilter = 'all';
    this.searchQuery = '';
    this.adminActiveTab = 'applicants';
    this.teacherActiveTab = 'students';
    this.studentActiveTab = 'inquiries';
    this.galleryFilter = 'all';
  }

  init() {
    this.renderHeader();
    this.renderMainView();
  }

  // --- Toast Notifications ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- Modal Helpers ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  openLightbox(imgUrl, caption) {
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    if (img) img.src = imgUrl;
    if (cap) cap.textContent = caption || '';
    this.openModal('image-lightbox-modal');
  }

  switchAuthTab(type, tab) {
    const isStudent = type === 'student';
    const loginForm = document.getElementById(isStudent ? 'student-login-form' : 'teacher-login-form');
    const signupForm = document.getElementById(isStudent ? 'student-signup-form' : 'teacher-signup-form');
    const loginBtn = document.getElementById(isStudent ? 'student-tab-login' : 'teacher-tab-login');
    const signupBtn = document.getElementById(isStudent ? 'student-tab-signup' : 'teacher-tab-signup');

    if (tab === 'login') {
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
      loginBtn.classList.add('active');
      signupBtn.classList.remove('active');
    } else {
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
      loginBtn.classList.remove('active');
      signupBtn.classList.add('active');
    }
  }

  openStudentAuth(tab = 'login') {
    this.switchAuthTab('student', tab);
    this.openModal('student-auth-modal');
  }

  openTeacherAuth(tab = 'login') {
    this.switchAuthTab('teacher', tab);
    this.openModal('teacher-auth-modal');
  }

  // --- Page Navigation Router ---
  navigateTo(viewName) {
    this.currentView = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderMainView();
  }

  toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    const icon = document.getElementById('mobile-menu-icon');
    if (!drawer) return;

    const isActive = drawer.classList.contains('active');
    if (isActive) {
      drawer.classList.remove('active');
      if (icon) {
        icon.className = 'fa-solid fa-bars';
      }
    } else {
      drawer.classList.add('active');
      if (icon) {
        icon.className = 'fa-solid fa-xmark';
      }
    }
  }

  // --- Quick Demo Switcher ---
  switchDemoRole(role) {
    try {
      if (role === 'guest') {
        store.logout();
        this.showToast('Logged out to Guest view.', 'info');
      } else if (role === 'student') {
        store.login('rohan_s10', '123', 'student');
        this.showToast('Logged in as Student (Rohan Sharma, Patia, Bhubaneswar)', 'success');
      } else if (role === 'applicant') {
        store.login('suresh_bio', '123', 'teacher');
        this.showToast('Logged in as Teacher Applicant (Suresh Raina, Sambalpur)', 'info');
      } else if (role === 'teacher') {
        store.login('dr_rajesh', '123', 'teacher');
        this.showToast('Logged in as Verified Faculty (Dr. Rajesh Verma, Infocity)', 'success');
      } else if (role === 'admin') {
        store.login('admin', 'admin');
        this.showToast('Logged in as System Admin (QPCP Odisha HQ)', 'success');
      }
      this.init();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --- Header Navigation ---
  renderHeader() {
    const user = store.getCurrentUser();
    const container = document.getElementById('nav-auth-container');
    const mobileContainer = document.getElementById('mobile-auth-container');

    let html = '';
    let mobileHtml = '';

    if (!user) {
      html = `
        <button class="btn btn-secondary btn-sm" onclick="app.openStudentAuth('login')">
          <i class="fa-solid fa-right-to-bracket"></i> Student Login
        </button>
        <button class="btn btn-teacher-portal btn-sm" onclick="app.openTeacherAuth('signup')">
          <i class="fa-solid fa-chalkboard-user"></i> Teacher Portal
        </button>
      `;
      mobileHtml = `
        <button class="btn btn-primary" onclick="app.openStudentAuth('login'); app.toggleMobileMenu();" style="width: 100%;">
          <i class="fa-solid fa-right-to-bracket"></i> Student Login
        </button>
        <button class="btn btn-teacher-portal" onclick="app.openTeacherAuth('signup'); app.toggleMobileMenu();" style="width: 100%;">
          <i class="fa-solid fa-chalkboard-user"></i> Teacher Portal
        </button>
      `;
    } else {
      let roleLabel = user.role.replace('_', ' ');
      let dashboardBtn = '';
      let mobileDashboardBtn = '';

      if (user.role === 'student') {
        dashboardBtn = `<button class="btn btn-primary btn-sm" onclick="app.renderMainView()"><i class="fa-solid fa-graduation-cap"></i> Student Portal</button>`;
        mobileDashboardBtn = `<button class="btn btn-primary" onclick="app.renderMainView(); app.toggleMobileMenu();" style="width: 100%;"><i class="fa-solid fa-graduation-cap"></i> Student Portal</button>`;
      } else if (user.role === 'admin' || user.role === 'verified_teacher' || user.role === 'teacher_applicant') {
        dashboardBtn = `<button class="btn btn-primary btn-sm" onclick="app.renderMainView()"><i class="fa-solid fa-gauge-high"></i> Dashboard</button>`;
        mobileDashboardBtn = `<button class="btn btn-primary" onclick="app.renderMainView(); app.toggleMobileMenu();" style="width: 100%;"><i class="fa-solid fa-gauge-high"></i> Dashboard</button>`;
      }

      html = `
        <div class="user-menu-pill">
          <img src="${user.avatar}" alt="${user.name}" class="user-avatar-tiny">
          <div style="line-height: 1.2;">
            <strong style="font-size: 0.85rem; color: var(--text-main);">${user.name}</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted);">@${user.username}</div>
          </div>
          <span class="role-badge ${user.role}">${roleLabel}</span>
        </div>
        ${dashboardBtn}
        <button class="btn btn-secondary btn-sm" onclick="app.handleLogout()"><i class="fa-solid fa-power-off"></i></button>
      `;

      mobileHtml = `
        <div class="user-menu-pill" style="justify-content: space-between; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <img src="${user.avatar}" alt="${user.name}" class="user-avatar-tiny">
            <div>
              <strong style="font-size: 0.9rem; color: var(--text-main);">${user.name}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">@${user.username}</div>
            </div>
          </div>
          <span class="role-badge ${user.role}">${roleLabel}</span>
        </div>
        ${mobileDashboardBtn}
        <button class="btn btn-secondary" onclick="app.handleLogout(); app.toggleMobileMenu();" style="width: 100%;"><i class="fa-solid fa-power-off"></i> Log Out</button>
      `;
    }

    if (container) container.innerHTML = html;
    if (mobileContainer) mobileContainer.innerHTML = mobileHtml;
  }

  handleLogout() {
    store.logout();
    this.showToast('You have been logged out.', 'info');
    this.init();
  }

  // --- Main View Dispatcher ---
  renderMainView() {
    const user = store.getCurrentUser();
    const root = document.getElementById('app-root');

    if (!user) {
      if (this.currentView === 'about') {
        this.renderAboutUsPage();
      } else if (this.currentView === 'gallery') {
        this.renderGalleryPage();
      } else {
        this.renderGuestLandingView();
      }
    } else if (user.role === 'student') {
      if (this.currentView === 'about') {
        this.renderAboutUsPage();
      } else if (this.currentView === 'gallery') {
        this.renderGalleryPage();
      } else {
        this.renderStudentDashboard(user);
      }
    } else if (user.role === 'teacher_applicant') {
      this.renderTeacherApplicantView(user);
    } else if (user.role === 'verified_teacher') {
      this.renderVerifiedTeacherDashboard(user);
    } else if (user.role === 'admin') {
      this.renderAdminDashboard(user);
    }
  }

  showHome() {
    this.navigateTo('home');
  }

  // --- 1. Guest Landing View ---
  renderGuestLandingView() {
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-content">
            <div class="hero-tag">
              <i class="fa-solid fa-user-check"></i> #1 Home Tutoring Network Across Odisha
            </div>
            <h1 class="hero-title">
              Find Premier <span class="gradient-text">Home Tutors in Odisha</span>
            </h1>
            <p class="hero-desc">
              Quick Progressive Carrier Point connects students across Bhubaneswar, Cuttack, Rourkela, Sambalpur, Berhampur & all over Odisha with top 1-on-1 home tutors. Watch 30s to 5-min recorded intro videos and apply instantly via WhatsApp.
            </p>
            <div class="hero-actions">
              <button class="btn btn-primary" onclick="app.openStudentAuth('signup')">
                <i class="fa-solid fa-user-plus"></i> Join as Student
              </button>
              <button class="btn btn-teacher-portal" onclick="app.openTeacherAuth('signup')">
                <i class="fa-solid fa-chalkboard-user"></i> Become a Teacher
              </button>
            </div>

            <div class="hero-stats">
              <div class="stat-item">
                <h3>500+</h3>
                <p>Home Tutors</p>
              </div>
              <div class="stat-item">
                <h3>30 Districts</h3>
                <p>Odisha Coverage</p>
              </div>
              <div class="stat-item">
                <h3>1-on-1</h3>
                <p>At-Home Mentoring</p>
              </div>
            </div>
          </div>

          <div class="hero-image-wrapper">
            <img src="assets/hero_education.jpg" alt="Home Tutoring Across Odisha" class="hero-img">
            <div class="floating-badge">
              <i class="fa-solid fa-circle-check" style="color: var(--accent-emerald); font-size: 1.8rem;"></i>
              <div>
                <strong style="color: var(--text-main); font-size: 0.95rem;">100% Admin Verified Tutors</strong>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0;">Interviewed for Home Tutoring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="tutors-section">
        <div class="container">
          <div class="section-header">
            <span class="section-subtitle">Top Odisha Home Faculty</span>
            <h2 class="section-title">Browse Verified Home Tutors</h2>
            <p class="section-desc">Explore tutor profiles, hourly charges, experience across Odisha cities (Bhubaneswar, Cuttack, Rourkela, Sambalpur), and watch their recorded 30s to 5-min intro videos.</p>
          </div>

          <div class="filter-bar">
            <div class="search-input-wrap">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" id="teacher-search-input" placeholder="Search by tutor name, subject, or city in Odisha (e.g. Bhubaneswar, Cuttack, Rourkela)..." onkeyup="app.filterTeachers()">
            </div>

            <div class="filter-chips">
              <button class="chip ${this.currentSubjectFilter === 'all' ? 'active' : ''}" onclick="app.filterBySubject('all', this)">All Subjects</button>
              <button class="chip ${this.currentSubjectFilter === 'Physics' ? 'active' : ''}" onclick="app.filterBySubject('Physics', this)">Physics</button>
              <button class="chip ${this.currentSubjectFilter === 'Mathematics' ? 'active' : ''}" onclick="app.filterBySubject('Mathematics', this)">Mathematics</button>
              <button class="chip ${this.currentSubjectFilter === 'Chemistry' ? 'active' : ''}" onclick="app.filterBySubject('Chemistry', this)">Chemistry</button>
              <button class="chip ${this.currentSubjectFilter === 'Biology' ? 'active' : ''}" onclick="app.filterBySubject('Biology', this)">Biology</button>
            </div>
          </div>

          <div class="teachers-grid" id="teachers-grid"></div>
        </div>
      </section>
    `;

    this.renderTeachersGrid();
  }

  // --- Dedicated Student Dashboard ---
  renderStudentDashboard(user) {
    const root = document.getElementById('app-root');

    const myInquiries = store.getInquiriesForStudent(user.id);
    const myAssignments = store.getAssignmentsForStudent(user.id);
    const verifiedTeachers = store.getVerifiedTeachers();

    root.innerHTML = `
      <div class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
        <div class="page-header-wrap">
          <div>
            <span class="role-badge student"><i class="fa-solid fa-graduation-cap"></i> Student Learning Portal</span>
            <h1 class="page-title">Welcome back, ${user.name}! 👋</h1>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
              <i class="fa-solid fa-book-open" style="color: var(--primary);"></i> ${user.grade} &nbsp;•&nbsp; <i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> ${user.location}
            </div>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-secondary btn-sm" onclick="app.openStudentProfileModal()"><i class="fa-solid fa-user-gear"></i> Edit Profile</button>
            <button class="btn btn-primary btn-sm" onclick="app.switchStudentTab('tutors')"><i class="fa-solid fa-magnifying-glass"></i> Find Home Tutors</button>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="sidebar-card">
            <div class="user-profile-header">
              <img src="${user.avatar}" alt="${user.name}" class="user-profile-avatar">
              <h3>${user.name}</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem;">@${user.username}</p>
              <div style="font-size: 0.82rem; color: var(--primary); font-weight: 700; margin-top: 0.25rem;">${user.grade}</div>
              <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 0.2rem;">${user.location}</div>
            </div>

            <ul class="sidebar-nav">
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.studentActiveTab === 'inquiries' ? 'active' : ''}" onclick="app.switchStudentTab('inquiries')">
                  <i class="fa-solid fa-paper-plane"></i> My Applications (${myInquiries.length})
                </button>
              </li>
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.studentActiveTab === 'assigned' ? 'active' : ''}" onclick="app.switchStudentTab('assigned')">
                  <i class="fa-solid fa-user-check"></i> Assigned Faculty (${myAssignments.length})
                </button>
              </li>
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.studentActiveTab === 'tutors' ? 'active' : ''}" onclick="app.switchStudentTab('tutors')">
                  <i class="fa-solid fa-chalkboard-user"></i> Find Tutors (${verifiedTeachers.length})
                </button>
              </li>
            </ul>
          </div>

          <div class="main-dash-content" id="student-dash-content"></div>
        </div>
      </div>
    `;

    this.renderStudentTabContent(user, myInquiries, myAssignments, verifiedTeachers);
  }

  switchStudentTab(tab) {
    this.studentActiveTab = tab;
    this.renderMainView();
  }

  renderStudentTabContent(user, myInquiries, myAssignments, verifiedTeachers) {
    const container = document.getElementById('student-dash-content');
    if (!container) return;

    if (this.studentActiveTab === 'inquiries') {
      container.innerHTML = `
        <h2 style="font-size: 1.35rem; margin-bottom: 0.85rem;">My Home Tutor Applications</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.25rem;">Track the status of your 1-on-1 home tutor applications across Odisha.</p>

        ${myInquiries.length === 0 ? `
          <div style="background: var(--bg-card); border: 1px solid var(--glass-border); padding: 2.5rem; text-align: center; border-radius: var(--radius-lg);">
            <i class="fa-solid fa-folder-open" style="font-size: 2.8rem; color: var(--text-dim); margin-bottom: 1rem;"></i>
            <h3>No Tutor Applications Yet</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.25rem;">Explore verified faculty and apply for 1-on-1 home tutoring in Odisha!</p>
            <button class="btn btn-primary btn-sm" onclick="app.switchStudentTab('tutors')"><i class="fa-solid fa-magnifying-glass"></i> Browse Verified Tutors</button>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${myInquiries.map(inq => {
              const teacher = store.getTeacherById(inq.teacherId);
              return `
                <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--glass-shadow);">
                  <div class="dash-card-header">
                    <div class="dash-user-info">
                      <img src="${teacher ? teacher.avatar : 'https://ui-avatars.com/api/?name=Faculty'}" class="dash-user-avatar" alt="${inq.teacherName}">
                      <div>
                        <h3 style="font-size: 1.15rem;">Applied for ${inq.teacherName}</h3>
                        <div style="font-size: 0.85rem; color: var(--primary); font-weight: 700;">Subject: ${inq.subject}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Applied on ${new Date(inq.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span class="role-badge ${inq.status === 'assigned' ? 'verified_teacher' : 'teacher_applicant'}">
                      ${inq.status === 'assigned' ? 'Slot Confirmed' : 'Pending Admin Call'}
                    </span>
                  </div>

                  <div style="background: var(--bg-main); border: 1px solid var(--glass-border); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1rem; word-break: break-word;">
                    <strong>Inquiry Message:</strong> ${inq.message}
                  </div>

                  <div class="dash-card-actions">
                    ${teacher ? `
                      <button class="btn btn-secondary btn-sm" onclick="app.openTeacherVideoModal('${teacher.id}')">
                        <i class="fa-solid fa-film"></i> Review Demo Video
                      </button>
                    ` : ''}
                    <a href="https://wa.me/917008221300?text=Hello%20QPCP%20Admin,%20I%20am%20${encodeURIComponent(user.name)}.%20Checking%20status%20of%20my%20home%20tutor%20application%20for%20${encodeURIComponent(inq.teacherName)}." target="_blank" class="btn btn-whatsapp btn-sm">
                      <i class="fa-brands fa-whatsapp"></i> Chat with Admin
                    </a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      `;
    } else if (this.studentActiveTab === 'assigned') {
      container.innerHTML = `
        <h2 style="font-size: 1.35rem; margin-bottom: 0.85rem;">Official Assigned Home Tutors</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.25rem;">Faculty assigned to you by Quick Progressive Carrier Point Admin for 1-on-1 home tutoring.</p>

        ${myAssignments.length === 0 ? `
          <div style="background: var(--bg-card); border: 1px solid var(--glass-border); padding: 2.5rem; text-align: center; border-radius: var(--radius-lg);">
            <i class="fa-solid fa-user-clock" style="font-size: 2.8rem; color: var(--text-dim); margin-bottom: 1rem;"></i>
            <h3>No Tutors Assigned Yet</h3>
            <p style="color: var(--text-muted);">When Admin approves your application and assigns your home tutor, they will appear here with full contact details.</p>
          </div>
        ` : `
          <div class="responsive-card-grid">
            ${myAssignments.map(a => {
              const teacher = store.getTeacherById(a.teacherId);
              return `
                <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--glass-shadow);">
                  <div style="display: flex; gap: 0.85rem; align-items: center; margin-bottom: 0.85rem;">
                    <img src="${teacher ? teacher.avatar : 'https://ui-avatars.com/api/?name=Tutor'}" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover;">
                    <div>
                      <h3 style="font-size: 1.1rem;">${a.teacherName}</h3>
                      <span class="role-badge verified_teacher">Active Home Faculty</span>
                    </div>
                  </div>

                  ${teacher ? `
                    <div style="background: var(--bg-main); border: 1px solid var(--glass-border); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1rem;">
                      <div><strong>Subjects:</strong> ${teacher.subjects.join(', ')}</div>
                      <div style="margin-top: 0.25rem;"><strong>Phone:</strong> ${teacher.phone}</div>
                      <div style="margin-top: 0.25rem;"><strong>Email:</strong> ${teacher.email}</div>
                      <div style="margin-top: 0.25rem; color: var(--accent-emerald); font-weight: 700;">Rate: ₹${teacher.rate}/hr</div>
                    </div>
                  ` : ''}

                  <a href="https://wa.me/${teacher ? teacher.phone.replace(/[^0-9]/g, '') : '917008221300'}?text=Hello%20${encodeURIComponent(a.teacherName)},%20I%20am%20${encodeURIComponent(user.name)}.%20QPCP%20Admin%20has%20assigned%20you%20as%20my%20home%20tutor!" target="_blank" class="btn btn-whatsapp btn-sm" style="width: 100%;">
                    <i class="fa-brands fa-whatsapp"></i> WhatsApp Teacher
                  </a>
                </div>
              `;
            }).join('')}
          </div>
        `}
      `;
    } else if (this.studentActiveTab === 'tutors') {
      container.innerHTML = `
        <h2 style="font-size: 1.35rem; margin-bottom: 0.85rem;">Browse & Apply for Expert Home Tutors</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.25rem;">Watch demo videos and apply for top 1-on-1 home tutors across Odisha.</p>

        <div class="filter-bar">
          <div class="search-input-wrap">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="teacher-search-input" placeholder="Search by tutor name, subject, or city in Odisha..." onkeyup="app.filterTeachers()">
          </div>

          <div class="filter-chips">
            <button class="chip ${this.currentSubjectFilter === 'all' ? 'active' : ''}" onclick="app.filterBySubject('all', this)">All Subjects</button>
            <button class="chip ${this.currentSubjectFilter === 'Physics' ? 'active' : ''}" onclick="app.filterBySubject('Physics', this)">Physics</button>
            <button class="chip ${this.currentSubjectFilter === 'Mathematics' ? 'active' : ''}" onclick="app.filterBySubject('Mathematics', this)">Mathematics</button>
            <button class="chip ${this.currentSubjectFilter === 'Chemistry' ? 'active' : ''}" onclick="app.filterBySubject('Chemistry', this)">Chemistry</button>
            <button class="chip ${this.currentSubjectFilter === 'Biology' ? 'active' : ''}" onclick="app.filterBySubject('Biology', this)">Biology</button>
          </div>
        </div>

        <div class="teachers-grid" id="teachers-grid"></div>
      `;

      this.renderTeachersGrid();
    }
  }

  // --- 2. Separate About Us Page ---
  renderAboutUsPage() {
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <section class="hero" style="padding-top: 2rem; padding-bottom: 3rem;">
        <div class="container" style="text-align: center; max-width: 820px;">
          <div class="hero-tag"><i class="fa-solid fa-map-pin"></i> Serving All 30 Districts of Odisha</div>
          <h1 class="hero-title">About <span class="gradient-text">Quick Progressive Carrier Point</span></h1>
          <p class="hero-desc" style="margin: 0 auto 2rem;">
            Quick Progressive Carrier Point is Odisha's premier 1-on-1 home tutoring platform, connecting ambitious students with verified expert home tutors across Bhubaneswar, Cuttack, Rourkela, Sambalpur, Berhampur, Balasore & all 30 districts of Odisha.
          </p>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="grid-2-col" style="margin-bottom: 3rem;">
            <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 2rem; box-shadow: var(--glass-shadow);">
              <div style="width: 54px; height: 54px; border-radius: var(--radius-md); background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin-bottom: 1.25rem;">
                <i class="fa-solid fa-bullseye"></i>
              </div>
              <h2 style="font-size: 1.5rem; margin-bottom: 0.85rem;">Our Mission</h2>
              <p style="color: var(--text-muted); line-height: 1.7; font-size: 0.95rem;">
                To provide top quality 1-on-1 home tutoring at students' doorsteps across all major cities & districts in Odisha. We interview every tutor in person and review 30s-5min demo video lectures before publishing them.
              </p>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 2rem; box-shadow: var(--glass-shadow);">
              <div style="width: 54px; height: 54px; border-radius: var(--radius-md); background: var(--accent-emerald-light); color: var(--accent-emerald); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin-bottom: 1.25rem;">
                <i class="fa-solid fa-eye"></i>
              </div>
              <h2 style="font-size: 1.5rem; margin-bottom: 0.85rem;">Our Vision</h2>
              <p style="color: var(--text-muted); line-height: 1.7; font-size: 0.95rem;">
                To become the most trusted home tutoring network in Odisha, where parents & students can evaluate home tutors via recorded video intros while maintaining complete contact privacy.
              </p>
            </div>
          </div>

          <div class="section-header">
            <span class="section-subtitle">Statewide Network</span>
            <h2 class="section-title">Home Tutoring Across Odisha</h2>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; text-align: center;">
            <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.35rem; box-shadow: var(--glass-shadow);">
              <i class="fa-solid fa-location-dot" style="color: var(--primary); font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
              <h3 style="font-size: 1.05rem; margin-bottom: 0.2rem;">Bhubaneswar Zone</h3>
              <p style="color: var(--text-muted); font-size: 0.82rem;">Patia, Jaydev Vihar, Acharya Vihar, Infocity & Nayapalli</p>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.35rem; box-shadow: var(--glass-shadow);">
              <i class="fa-solid fa-location-dot" style="color: var(--primary); font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
              <h3 style="font-size: 1.05rem; margin-bottom: 0.2rem;">Cuttack Zone</h3>
              <p style="color: var(--text-muted); font-size: 0.82rem;">CDA Sectors, Cantonment Road, Link Road & Bidanasi</p>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.35rem; box-shadow: var(--glass-shadow);">
              <i class="fa-solid fa-location-dot" style="color: var(--primary); font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
              <h3 style="font-size: 1.05rem; margin-bottom: 0.2rem;">Rourkela & Sambalpur</h3>
              <p style="color: var(--text-muted); font-size: 0.82rem;">Civil Township, Chhend, Burla & Sambalpur City</p>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.35rem; box-shadow: var(--glass-shadow);">
              <i class="fa-solid fa-location-dot" style="color: var(--primary); font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
              <h3 style="font-size: 1.05rem; margin-bottom: 0.2rem;">Southern & Eastern Odisha</h3>
              <p style="color: var(--text-muted); font-size: 0.82rem;">Berhampur, Balasore, Puri, Jajpur & all 30 Districts</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // --- 3. Separate Gallery Page ---
  renderGalleryPage() {
    const root = document.getElementById('app-root');

    const galleryItems = [
      {
        id: 'g1',
        title: 'Home Tutoring Session in Odisha',
        category: 'Classrooms',
        img: 'assets/gallery_classroom.jpg',
        desc: '1-on-1 personalized home tutoring session at student residence in Odisha.'
      },
      {
        id: 'g2',
        title: 'Odisha Faculty Pedagogy Workshop',
        category: 'Workshops',
        img: 'assets/gallery_workshop.jpg',
        desc: 'Our Odisha home faculty discussing progressive coaching methods.'
      },
      {
        id: 'g3',
        title: 'Odisha Board & Entrance Toppers Felicitation',
        category: 'Celebrations',
        img: 'assets/gallery_achievement.jpg',
        desc: 'Honoring top CHSE Odisha, CBSE & JEE/NEET rankers across Odisha.'
      },
      {
        id: 'g4',
        title: 'Home Practical Science Experiment Kit',
        category: 'Labs',
        img: 'assets/gallery_lab.jpg',
        desc: 'Hands-on practical physics and chemistry experiment kit sessions.'
      }
    ];

    let filtered = galleryItems;
    if (this.galleryFilter !== 'all') {
      filtered = galleryItems.filter(item => item.category === this.galleryFilter);
    }

    root.innerHTML = `
      <section class="hero" style="padding-top: 2rem; padding-bottom: 3rem;">
        <div class="container" style="text-align: center; max-width: 750px;">
          <div class="hero-tag"><i class="fa-solid fa-images"></i> QPCP Odisha Tutoring Highlights</div>
          <h1 class="hero-title">Explore Our <span class="gradient-text">Home Tutoring Gallery</span></h1>
          <p class="hero-desc" style="margin: 0 auto 1.5rem;">
            Glimpses of 1-on-1 home tutoring sessions, tutor workshops, and board topper felicitations across Odisha.
          </p>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="filter-chips" style="justify-content: center; margin-bottom: 2.5rem;">
            <button class="chip ${this.galleryFilter === 'all' ? 'active' : ''}" onclick="app.filterGallery('all')">All Photos</button>
            <button class="chip ${this.galleryFilter === 'Classrooms' ? 'active' : ''}" onclick="app.filterGallery('Classrooms')">Home Sessions</button>
            <button class="chip ${this.galleryFilter === 'Workshops' ? 'active' : ''}" onclick="app.filterGallery('Workshops')">Faculty Meetings</button>
            <button class="chip ${this.galleryFilter === 'Labs' ? 'active' : ''}" onclick="app.filterGallery('Labs')">Practical Kits</button>
            <button class="chip ${this.galleryFilter === 'Celebrations' ? 'active' : ''}" onclick="app.filterGallery('Celebrations')">Topper Celebrations</button>
          </div>

          <div class="responsive-card-grid">
            ${filtered.map(item => `
              <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--glass-shadow); transition: var(--transition-normal); cursor: pointer;" onclick="app.openLightbox('${item.img}', '${item.title} - ${item.desc}')">
                <div style="position: relative; height: 220px; overflow: hidden;">
                  <img src="${item.img}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;">
                  <span class="role-badge student" style="position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px);">${item.category}</span>
                </div>
                <div style="padding: 1.25rem;">
                  <h3 style="font-size: 1.1rem; margin-bottom: 0.35rem;">${item.title}</h3>
                  <p style="color: var(--text-muted); font-size: 0.85rem;">${item.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  filterGallery(cat) {
    this.galleryFilter = cat;
    this.renderGalleryPage();
  }

  renderTeachersGrid() {
    const grid = document.getElementById('teachers-grid');
    if (!grid) return;

    let teachers = store.getVerifiedTeachers();

    if (this.currentSubjectFilter !== 'all') {
      teachers = teachers.filter(t => t.subjects.includes(this.currentSubjectFilter));
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      teachers = teachers.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.location.toLowerCase().includes(q) || 
        t.subjects.some(s => s.toLowerCase().includes(q))
      );
    }

    if (teachers.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 2.8rem; color: var(--text-dim); margin-bottom: 1rem;"></i>
          <h3>No Home Tutors Found</h3>
          <p style="color: var(--text-muted);">Try searching for cities or localities in Odisha (e.g. Bhubaneswar, Cuttack, Rourkela, Sambalpur).</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = teachers.map(t => `
      <div class="teacher-card">
        <div class="teacher-header">
          <div class="teacher-avatar-wrap">
            <img src="${t.avatar}" alt="${t.name}" class="teacher-avatar">
            <button class="play-demo-btn" onclick="app.openTeacherVideoModal('${t.id}')" title="Watch Demo Video">
              <i class="fa-solid fa-play"></i>
            </button>
          </div>
          <div class="teacher-info">
            <h3>${t.name}</h3>
            <div class="teacher-rating">
              <i class="fa-solid fa-star"></i> ${t.rating} <span>(${t.totalStudents}+ Home Students)</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              <i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> ${t.location}
            </div>
          </div>
        </div>

        <div class="subject-tag-list">
          ${t.subjects.map(s => `<span class="subject-tag">${s}</span>`).join('')}
        </div>

        <p class="teacher-bio">${t.bio}</p>

        <div class="teacher-meta">
          <div class="meta-item">
            <span>EXPERIENCE</span>
            <strong>${t.experience}</strong>
          </div>
          <div class="meta-item" style="text-align: right;">
            <span>PER HOUR</span>
            <strong class="price">₹${t.rate}/hr</strong>
          </div>
        </div>

        <div class="teacher-card-actions">
          <button class="btn btn-secondary btn-sm" onclick="app.openTeacherVideoModal('${t.id}')">
            <i class="fa-solid fa-film"></i> 30s-5m Demo
          </button>
          <button class="btn btn-whatsapp btn-sm" onclick="app.handleStudentApplyTeacher('${t.id}')">
            <i class="fa-brands fa-whatsapp"></i> Apply Home Tutor
          </button>
        </div>
      </div>
    `).join('');
  }

  filterBySubject(subject, btn) {
    this.currentSubjectFilter = subject;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.renderTeachersGrid();
  }

  filterTeachers() {
    const input = document.getElementById('teacher-search-input');
    this.searchQuery = input ? input.value : '';
    this.renderTeachersGrid();
  }

  // --- Demo Video Modal Player (30s to 5min recorded demo) ---
  openTeacherVideoModal(teacherId) {
    const teacher = store.getTeacherById(teacherId);
    if (!teacher) return;

    const content = document.getElementById('video-modal-content');
    content.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.25rem;">
        <img src="${teacher.avatar}" alt="${teacher.name}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover;">
        <div>
          <h2 style="font-size: 1.3rem; margin: 0;">${teacher.name} - Recorded Intro Demo (30s - 5m)</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">${teacher.subjects.join(', ')} • ₹${teacher.rate}/hr • ${teacher.location}</p>
        </div>
      </div>

      <div class="video-responsive">
        <iframe src="${teacher.videoUrl}" title="${teacher.name} Recorded Demo Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>

      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.25rem;">${teacher.bio}</p>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
        <div>
          <span style="color: var(--text-dim); font-size: 0.78rem; display: block;">HOME TUTORING RATE</span>
          <strong style="color: var(--accent-emerald); font-size: 1.25rem;">₹${teacher.rate} / hour</strong>
        </div>
        <button class="btn btn-whatsapp" onclick="app.closeModal('video-demo-modal'); app.handleStudentApplyTeacher('${teacher.id}');">
          <i class="fa-brands fa-whatsapp"></i> Book Home Tutor (${teacher.name})
        </button>
      </div>
    `;

    this.openModal('video-demo-modal');
  }

  // --- Student Applies for Teacher (WhatsApp + Backend Inquiry) ---
  handleStudentApplyTeacher(teacherId) {
    const user = store.getCurrentUser();
    if (!user || user.role !== 'student') {
      this.showToast('Please log in as a student to apply for home tutors in Odisha.', 'info');
      this.openStudentAuth('login');
      return;
    }

    const teacher = store.getTeacherById(teacherId);
    if (!teacher) return;

    const inquiry = store.createStudentInquiry(
      user.id,
      teacher.id,
      teacher.subjects[0],
      `Applied for 1-on-1 home tutoring in Odisha (${user.location}) with ${teacher.name}.`
    );

    const msg = `Hello Quick Progressive Carrier Point (Odisha)! 👋\n\nI am *${user.name}* (Studying: ${user.grade}, Locality/City: ${user.location}).\nI want to apply for 1-on-1 Home Tutor *${teacher.name}* (${teacher.subjects.join(', ')}) at ₹${teacher.rate}/hr.\n\nPlease confirm home slot and coordinator details.`;
    const waUrl = `https://wa.me/917008221300?text=${encodeURIComponent(msg)}`;

    this.showToast(`Inquiry created! Opening WhatsApp to request Home Tutor ${teacher.name}...`, 'success');
    window.open(waUrl, '_blank');
  }

  // --- Teacher Applicant View ---
  renderTeacherApplicantView(user) {
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <div class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
        <div class="status-card">
          <div class="status-icon-glow">
            <i class="fa-solid fa-hourglass-half"></i>
          </div>
          <h2 style="font-size: 1.75rem; margin-bottom: 0.85rem;">Home Tutor Application Under Review</h2>
          <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 1.5rem; line-height: 1.6;">
            Welcome, <strong>${user.name}</strong>! Your home tutor application for <strong>Odisha</strong> has been submitted successfully to <strong>Quick Progressive Carrier Point</strong>.
          </p>

          <div style="background: var(--bg-main); border: 1px solid var(--glass-border); padding: 1.1rem; border-radius: var(--radius-md); text-align: left; margin-bottom: 1.5rem;">
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;"><i class="fa-solid fa-list-check" style="color: var(--primary);"></i> Application Summary:</div>
            <ul style="list-style: none; color: var(--text-muted); font-size: 0.88rem; line-height: 1.7;">
              <li><strong>Teaching Locality / City:</strong> ${user.location}</li>
              <li><strong>Subjects:</strong> ${Array.isArray(user.subjects) ? user.subjects.join(', ') : user.subjects}</li>
              <li><strong>Experience:</strong> ${user.experience}</li>
              <li><strong>Hourly Fee:</strong> ₹${user.rate}/hr</li>
              <li><strong>Phone:</strong> ${user.phone}</li>
            </ul>
          </div>

          <div class="privacy-alert" style="justify-content: center; text-align: center;">
            <i class="fa-solid fa-headset" style="font-size: 1.2rem;"></i>
            <span>Our Admin team will review your 30s-5m demo video & call/WhatsApp you for interview. Thank you for your patience!</span>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: center;">
            <a href="https://wa.me/917008221300?text=Hello%20Admin,%20I%20have%20submitted%20my%20home%20tutor%20application%20in%20Odisha%20(${encodeURIComponent(user.name)})" target="_blank" class="btn btn-whatsapp">
              <i class="fa-brands fa-whatsapp"></i> Chat with Admin on WhatsApp
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // --- Verified Teacher Dashboard (Strict Privacy Filters) ---
  renderVerifiedTeacherDashboard(user) {
    const root = document.getElementById('app-root');
    const studentsPrivacy = store.getStudentsPrivacyProtected();
    const myAssignments = store.getAssignmentsForTeacher(user.id);

    root.innerHTML = `
      <div class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
        <div class="page-header-wrap">
          <div>
            <span class="role-badge verified_teacher"><i class="fa-solid fa-user-check"></i> Verified Home Faculty</span>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.35rem;"><i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> ${user.location}</div>
            <h1 class="page-title">Welcome, ${user.name}</h1>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-secondary btn-sm" onclick="app.showHome()"><i class="fa-solid fa-eye"></i> View Public Site</button>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="sidebar-card">
            <div class="user-profile-header">
              <img src="${user.avatar}" alt="${user.name}" class="user-profile-avatar">
              <h3>${user.name}</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem;">${user.subjects.join(', ')}</p>
              <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.2rem;">${user.location}</div>
              <div style="margin-top: 0.5rem; color: var(--accent-emerald); font-weight: 700;">₹${user.rate}/hr</div>
            </div>

            <ul class="sidebar-nav">
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.teacherActiveTab === 'students' ? 'active' : ''}" onclick="app.switchTeacherTab('students')">
                  <i class="fa-solid fa-users"></i> Available Students
                </button>
              </li>
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.teacherActiveTab === 'assigned' ? 'active' : ''}" onclick="app.switchTeacherTab('assigned')">
                  <i class="fa-solid fa-user-check"></i> My Assigned Home Slots (${myAssignments.length})
                </button>
              </li>
            </ul>
          </div>

          <div class="main-dash-content" id="teacher-dash-content"></div>
        </div>
      </div>
    `;

    this.renderTeacherTabContent(user, studentsPrivacy, myAssignments);
  }

  switchTeacherTab(tab) {
    this.teacherActiveTab = tab;
    this.renderMainView();
  }

  renderTeacherTabContent(user, studentsPrivacy, myAssignments) {
    const container = document.getElementById('teacher-dash-content');
    if (!container) return;

    if (this.teacherActiveTab === 'students') {
      container.innerHTML = `
        <div class="privacy-alert">
          <i class="fa-solid fa-lock" style="font-size: 1.2rem;"></i>
          <span><strong>Privacy Rule Enforced:</strong> As per security policy, student contact numbers & emails are kept confidential by Admin. You can apply to teach students below.</span>
        </div>

        <h2 style="font-size: 1.35rem; margin-bottom: 1.25rem;">Students Seeking Home Tutors (Odisha)</h2>

        <div class="responsive-card-grid">
          ${studentsPrivacy.map(s => `
            <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--glass-shadow);">
              <div>
                <div style="display: flex; gap: 0.85rem; align-items: center; margin-bottom: 0.85rem;">
                  <img src="${s.avatar}" alt="${s.name}" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover;">
                  <div>
                    <h3 style="font-size: 1.05rem;">${s.name}</h3>
                    <div style="font-size: 0.78rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> ${s.location}</div>
                  </div>
                </div>
                <div style="background: var(--bg-main); border: 1px solid var(--glass-border); padding: 0.65rem; border-radius: var(--radius-md); font-size: 0.82rem; margin-bottom: 0.85rem;">
                  <strong>Grade:</strong> ${s.grade}
                </div>
                <div style="margin-bottom: 0.85rem;">
                  <span class="privacy-lock-tag"><i class="fa-solid fa-user-secret"></i> Phone & Email Hidden</span>
                </div>
              </div>

              <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="app.handleTeacherApplyToTeach('${user.id}', '${s.id}', '${s.name}')">
                <i class="fa-solid fa-paper-plane"></i> Apply to Teach Student
              </button>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      container.innerHTML = `
        <h2 style="font-size: 1.35rem; margin-bottom: 1.25rem;">Official Home Student Assignments (Assigned by Admin)</h2>
        ${myAssignments.length === 0 ? `
          <div style="background: var(--bg-card); border: 1px solid var(--glass-border); padding: 2.5rem; text-align: center; border-radius: var(--radius-lg);">
            <i class="fa-solid fa-clipboard-user" style="font-size: 2.8rem; color: var(--text-dim); margin-bottom: 1rem;"></i>
            <h3>No Assignments Yet</h3>
            <p style="color: var(--text-muted);">When Admin approves your request and assigns a home student to you, they will appear here.</p>
          </div>
        ` : `
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Assigned Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${myAssignments.map(a => `
                  <tr>
                    <td><strong>${a.studentName}</strong></td>
                    <td>${new Date(a.assignedAt).toLocaleDateString()}</td>
                    <td><span class="role-badge verified_teacher">Active Home Slot</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      `;
    }
  }

  handleTeacherApplyToTeach(teacherId, studentId, studentName) {
    store.createTeacherRequestToTeach(teacherId, studentId);
    this.showToast(`Application sent to Admin! Requesting to teach ${studentName}.`, 'success');
  }

  // --- Admin Command Center ---
  renderAdminDashboard(user) {
    const root = document.getElementById('app-root');

    const applicants = store.getTeacherApplicantsAdmin();
    const verifiedTeachers = store.getVerifiedTeachers();
    const students = store.getStudentsFullAdmin();
    const inquiries = store.data.inquiries;
    const teacherRequests = store.data.teacherRequests;

    root.innerHTML = `
      <div class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
        <div class="page-header-wrap">
          <div>
            <span class="role-badge admin"><i class="fa-solid fa-user-gear"></i> System Administrator (QPCP Odisha HQ)</span>
            <h1 class="page-title">Admin Command Center</h1>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-secondary btn-sm" onclick="app.openModal('supabase-config-modal')"><i class="fa-solid fa-database"></i> Supabase Config</button>
            <button class="btn btn-secondary btn-sm" onclick="app.showHome()"><i class="fa-solid fa-eye"></i> Public View</button>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="sidebar-card">
            <ul class="sidebar-nav">
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.adminActiveTab === 'applicants' ? 'active' : ''}" onclick="app.switchAdminTab('applicants')">
                  <i class="fa-solid fa-id-card"></i> Tutor Applications (${applicants.length})
                </button>
              </li>
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.adminActiveTab === 'teachers' ? 'active' : ''}" onclick="app.switchAdminTab('teachers')">
                  <i class="fa-solid fa-chalkboard-user"></i> Verified Home Faculty (${verifiedTeachers.length})
                </button>
              </li>
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.adminActiveTab === 'students' ? 'active' : ''}" onclick="app.switchAdminTab('students')">
                  <i class="fa-solid fa-user-graduate"></i> Student Directory (${students.length})
                </button>
              </li>
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.adminActiveTab === 'inquiries' ? 'active' : ''}" onclick="app.switchAdminTab('inquiries')">
                  <i class="fa-solid fa-comments"></i> Inquiries & Requests
                </button>
              </li>
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.adminActiveTab === 'assign' ? 'active' : ''}" onclick="app.switchAdminTab('assign')">
                  <i class="fa-solid fa-link"></i> Assign Home Tutor
                </button>
              </li>
            </ul>
          </div>

          <div class="main-dash-content" id="admin-dash-content"></div>
        </div>
      </div>
    `;

    this.renderAdminTabContent(applicants, verifiedTeachers, students, inquiries, teacherRequests);
  }

  switchAdminTab(tab) {
    this.adminActiveTab = tab;
    this.renderMainView();
  }

  renderAdminTabContent(applicants, verifiedTeachers, students, inquiries, teacherRequests) {
    const container = document.getElementById('admin-dash-content');
    if (!container) return;

    if (this.adminActiveTab === 'applicants') {
      container.innerHTML = `
        <h2 style="font-size: 1.35rem; margin-bottom: 0.85rem;">Pending Home Tutor Applications (Odisha)</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.25rem;">Review recorded 30s-5m demo videos, contact applicants via WhatsApp for interview, and click Approve to make them active home tutors.</p>

        ${applicants.length === 0 ? `
          <div style="background: var(--bg-card); border: 1px solid var(--glass-border); padding: 2.5rem; text-align: center; border-radius: var(--radius-lg);">
            <i class="fa-solid fa-circle-check" style="font-size: 2.8rem; color: var(--accent-emerald); margin-bottom: 1rem;"></i>
            <h3>No Pending Applications</h3>
            <p style="color: var(--text-muted);">All home tutor applications across Odisha have been reviewed!</p>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${applicants.map(app => `
              <div style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--glass-shadow);">
                <div class="dash-card-header">
                  <div class="dash-user-info">
                    <img src="${app.avatar}" alt="${app.name}" class="dash-user-avatar">
                    <div>
                      <h3 style="font-size: 1.15rem;">${app.name} <span style="font-size: 0.78rem; color: var(--text-dim);">(Username: @${app.username})</span></h3>
                      <div style="color: var(--accent-emerald); font-weight: 700; font-size: 0.9rem;">₹${app.rate}/hr • ${app.experience} Exp</div>
                      <div style="font-size: 0.82rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> ${app.location}</div>
                    </div>
                  </div>
                  <span class="role-badge teacher_applicant">Pending Admin Review</span>
                </div>

                <div style="background: var(--bg-main); border: 1px solid var(--glass-border); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1rem; word-break: break-word;">
                  <div><strong>Subjects:</strong> ${Array.isArray(app.subjects) ? app.subjects.join(', ') : app.subjects}</div>
                  <div style="margin-top: 0.25rem;"><strong>Phone:</strong> ${app.phone}</div>
                  <div style="margin-top: 0.25rem; word-break: break-all;"><strong>Email:</strong> ${app.email}</div>
                  <div style="margin-top: 0.4rem;"><strong>Bio:</strong> ${app.bio}</div>
                </div>

                <div class="dash-card-actions">
                  <button class="btn btn-secondary btn-sm" onclick="app.openTeacherVideoModal('${app.id}')">
                    <i class="fa-solid fa-film"></i> Review Demo Video
                  </button>

                  <div class="dash-card-btn-group">
                    <a href="https://wa.me/${app.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(app.name)},%20this%20is%20Quick%20Progressive%20Carrier%20Point%20Odisha%20Admin.%20We%20received%20your%20home%20tutor%20application!" target="_blank" class="btn btn-whatsapp btn-sm">
                      <i class="fa-brands fa-whatsapp"></i> WhatsApp Interview
                    </a>
                    <button class="btn btn-primary btn-sm" onclick="app.handleAdminApproveTeacher('${app.id}')">
                      <i class="fa-solid fa-check"></i> Approve & Publish
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      `;
    } else if (this.adminActiveTab === 'teachers') {
      container.innerHTML = `
        <h2 style="font-size: 1.35rem; margin-bottom: 1.25rem;">Active Verified Home Faculty (Odisha)</h2>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tutor</th>
                <th>City / Locality in Odisha</th>
                <th>Subjects</th>
                <th>Rate / Hr</th>
                <th>Contact Info</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${verifiedTeachers.map(t => `
                <tr>
                  <td>
                    <div class="table-user-cell">
                      <img src="${t.avatar}" class="table-avatar">
                      <div>
                        <strong>${t.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td>${t.location}</td>
                  <td>${t.subjects.join(', ')}</td>
                  <td><strong style="color: var(--accent-emerald);">₹${t.rate}</strong></td>
                  <td>${t.phone}<br><span style="font-size: 0.8rem; color: var(--text-muted);">${t.email}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="app.openTeacherVideoModal('${t.id}')"><i class="fa-solid fa-film"></i> Demo</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.adminActiveTab === 'students') {
      container.innerHTML = `
        <h2 style="font-size: 1.35rem; margin-bottom: 1.25rem;">Registered Student Directory (Full Admin View)</h2>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>City / Locality in Odisha</th>
                <th>Grade / Study</th>
                <th>Phone Number</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td>
                    <div class="table-user-cell">
                      <img src="${s.avatar}" class="table-avatar">
                      <div>
                        <strong>${s.name}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-dim);">@${s.username}</div>
                      </div>
                    </div>
                  </td>
                  <td><i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> ${s.location}</td>
                  <td>${s.grade}</td>
                  <td><strong style="color: var(--text-main);">${s.phone}</strong></td>
                  <td>${s.email}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.adminActiveTab === 'inquiries') {
      container.innerHTML = `
        <h2 style="font-size: 1.35rem; margin-bottom: 1.25rem;">Student Home Inquiries & Tutor Requests</h2>
        
        <h3 style="font-size: 1.05rem; margin-bottom: 0.85rem; color: var(--primary);">Student Applied for Home Tutor:</h3>
        <div class="data-table-wrap" style="margin-bottom: 1.75rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Tutor Applied For</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${inquiries.map(inq => `
                <tr>
                  <td><strong>${inq.studentName}</strong></td>
                  <td>${inq.teacherName}</td>
                  <td>${inq.subject}</td>
                  <td>${new Date(inq.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="app.handleAdminQuickAssign('${inq.teacherId}', '${inq.studentId}')">
                      <i class="fa-solid fa-link"></i> Confirm Home Slot
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h3 style="font-size: 1.05rem; margin-bottom: 0.85rem; color: var(--accent-emerald);">Teacher Requests to Teach Students:</h3>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tutor Name</th>
                <th>Requested Student</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${teacherRequests.map(tr => `
                <tr>
                  <td><strong>${tr.teacherName}</strong></td>
                  <td>${tr.studentName}</td>
                  <td>${new Date(tr.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="app.handleAdminQuickAssign('${tr.teacherId}', '${tr.studentId}')">
                      <i class="fa-solid fa-check"></i> Assign Home Pair
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.adminActiveTab === 'assign') {
      container.innerHTML = `
        <h2 style="font-size: 1.35rem; margin-bottom: 1.25rem;">Manual Home Tutor - Student Assignment Matrix</h2>
        <div style="background: var(--bg-card); border: 1px solid var(--glass-border); padding: 1.75rem; border-radius: var(--radius-lg); max-width: 600px; box-shadow: var(--glass-shadow);">
          <form onsubmit="app.handleAdminManualAssign(event)">
            <div class="form-group">
              <label class="form-label">Select Verified Home Tutor</label>
              <select class="form-control" id="assign-teacher-select" required style="background: #ffffff;">
                ${verifiedTeachers.map(t => `<option value="${t.id}">${t.name} (${t.location} • ${t.subjects.join(', ')})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Select Student</label>
              <select class="form-control" id="assign-student-select" required style="background: #ffffff;">
                ${students.map(s => `<option value="${s.id}">${s.name} (${s.location} • ${s.grade})</option>`).join('')}
              </select>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
              <i class="fa-solid fa-link"></i> Assign Home Tutor to Student
            </button>
          </form>
        </div>
      `;
    }
  }

  handleAdminApproveTeacher(applicantId) {
    try {
      store.approveTeacherApplicant(applicantId);
      this.showToast('Home tutor approved & published live!', 'success');
      this.renderMainView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleAdminQuickAssign(teacherId, studentId) {
    try {
      store.assignTeacherToStudent(teacherId, studentId);
      this.showToast('Successfully assigned home tutor to student!', 'success');
      this.renderMainView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleAdminManualAssign(e) {
    e.preventDefault();
    const tId = document.getElementById('assign-teacher-select').value;
    const sId = document.getElementById('assign-student-select').value;
    this.handleAdminQuickAssign(tId, sId);
  }

  // --- Auth & Form Handlers ---
  handleStudentLogin(e) {
    e.preventDefault();
    const u = document.getElementById('std-login-user').value;
    const p = document.getElementById('std-login-pass').value;

    try {
      store.login(u, p, 'student');
      this.closeModal('student-auth-modal');
      this.showToast('Student logged in successfully!', 'success');
      this.init();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleStudentSignup(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('std-reg-name').value,
      username: document.getElementById('std-reg-username').value,
      phone: document.getElementById('std-reg-phone').value,
      email: document.getElementById('std-reg-email').value,
      password: document.getElementById('std-reg-pass').value,
      grade: document.getElementById('std-reg-grade').value,
      location: document.getElementById('std-reg-location').value,
      avatar: document.getElementById('std-reg-avatar').value
    };

    try {
      store.registerStudent(data);
      this.closeModal('student-auth-modal');
      this.showToast('Student registered & logged in!', 'success');
      this.init();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleTeacherLogin(e) {
    e.preventDefault();
    const u = document.getElementById('tch-login-user').value;
    const p = document.getElementById('tch-login-pass').value;

    try {
      store.login(u, p, 'teacher');
      this.closeModal('teacher-auth-modal');
      this.showToast('Teacher logged in!', 'success');
      this.init();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleTeacherSignup(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('tch-reg-name').value,
      username: document.getElementById('tch-reg-username').value,
      phone: document.getElementById('tch-reg-phone').value,
      email: document.getElementById('tch-reg-email').value,
      subjects: document.getElementById('tch-reg-subjects').value,
      rate: document.getElementById('tch-reg-rate').value,
      experience: document.getElementById('tch-reg-experience').value,
      location: document.getElementById('tch-reg-location').value,
      videoUrl: document.getElementById('tch-reg-video').value,
      bio: document.getElementById('tch-reg-bio').value,
      password: document.getElementById('tch-reg-pass').value,
      avatar: document.getElementById('tch-reg-avatar').value
    };

    try {
      store.registerTeacher(data);
      this.closeModal('teacher-auth-modal');
      this.showToast('Home tutor application submitted! Under admin review.', 'info');
      this.init();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --- Student Profile Modal ---
  openStudentProfileModal() {
    const user = store.getCurrentUser();
    if (!user) return;

    document.getElementById('edit-std-name').value = user.name || '';
    document.getElementById('edit-std-phone').value = user.phone || '';
    document.getElementById('edit-std-avatar').value = user.avatar || '';
    document.getElementById('edit-std-username').value = user.username || '';

    this.openModal('student-edit-modal');
  }

  handleUpdateStudentProfile(e) {
    e.preventDefault();
    const user = store.getCurrentUser();
    if (!user) return;

    const updates = {
      name: document.getElementById('edit-std-name').value,
      phone: document.getElementById('edit-std-phone').value,
      avatar: document.getElementById('edit-std-avatar').value
    };

    try {
      store.updateUserProfile(user.id, updates);
      this.closeModal('student-edit-modal');
      this.showToast('Profile updated successfully!', 'success');
      this.init();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleSaveSupabaseConfig(e) {
    e.preventDefault();
    const url = document.getElementById('sup-url-input').value;
    const key = document.getElementById('sup-key-input').value;

    store.saveSupabaseConfig(url, key);
    this.closeModal('supabase-config-modal');
    this.showToast('Supabase configuration saved!', 'success');
  }
}

export const app = new AppController();
window.app = app;

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
