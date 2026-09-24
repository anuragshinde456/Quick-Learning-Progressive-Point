/**
 * Quick Progressive Career Point - Application Controller
 * Premier 1-on-1 Home Tutoring Network across all of Odisha
 * Cities & Districts Covered: Bhubaneswar, Cuttack, Rourkela, Sambalpur, Berhampur, Balasore, Puri & all 30 Districts
 */

import { store } from './store.js?v=20260925_about1';

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

  async init() {
    let initialPath = window.location.pathname;
    if (window.location.hash) {
      const rawHash = window.location.hash.replace(/^[#/]+/, '');
      if (rawHash === 'about' || rawHash === 'about-us') initialPath = '/about-us';
      else if (rawHash === 'gallery') initialPath = '/gallery';
      else if (rawHash.startsWith('admin')) initialPath = '/' + rawHash;
      else if (rawHash.startsWith('student')) initialPath = '/' + rawHash;
      else if (rawHash.startsWith('teacher')) initialPath = '/' + rawHash;
      else if (rawHash === 'home') initialPath = '/';

      try {
        history.replaceState(null, '', initialPath);
      } catch (_) {}
    }

    if (!this.popstateListenerAttached) {
      window.addEventListener('popstate', () => {
        this.route(window.location.pathname);
      });
      this.popstateListenerAttached = true;
    }

    this.renderHeader();
    this.route(initialPath);

    if (store.supabase) {
      await store.syncFromSupabase();
      this.renderHeader();
      this.route(window.location.pathname);
    }

    if (!this.syncInterval) {
      this.syncInterval = setInterval(async () => {
        const changed = await store.syncFromSupabase();
        if (changed) {
          console.log('⚡ Cross-device live data update synced from Supabase!');
          this.renderHeader();
          const p = window.location.pathname;
          if (p === '/' || p === '/home' || p === '/gallery' || p.startsWith('/admin') || p.startsWith('/student') || p.startsWith('/teacher')) {
            this.renderMainView();
          }
        }
      }, 3000);
    }
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

  closeAllModals() {
    const modalIds = [
      'student-auth-modal',
      'teacher-auth-modal',
      'admin-auth-modal',
      'admin-gallery-modal',
      'privacy-policy-modal',
      'video-demo-modal',
      'student-edit-modal',
      'image-lightbox-modal',
      'supabase-config-modal'
    ];
    modalIds.forEach(id => this.closeModal(id));
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

  openAdminAuth() {
    this.openModal('admin-auth-modal');
  }

  // --- Admin Gallery Upload & Management Methods (100% Server Database Persistent, ZERO LocalStorage) ---
  openAdminGalleryUploadModal() {
    const user = store.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.showToast('Access Denied: Only Administrator can upload gallery photos.', 'error');
      return;
    }

    const form = document.getElementById('admin-gallery-form');
    if (form) form.reset();

    this._galleryTempImageBase64 = null;
    const previewContainer = document.getElementById('gal-preview-container');
    if (previewContainer) previewContainer.style.display = 'none';

    this.toggleGalleryImageSource('file');
    this.openModal('admin-gallery-modal');
  }

  toggleGalleryImageSource(type) {
    const fileGroup = document.getElementById('gal-file-group');
    const urlGroup = document.getElementById('gal-url-group');
    const fileInput = document.getElementById('gal-photo-file');
    const urlInput = document.getElementById('gal-photo-url');
    const previewContainer = document.getElementById('gal-preview-container');
    const previewImg = document.getElementById('gal-preview-img');

    if (type === 'file') {
      if (fileGroup) fileGroup.style.display = 'block';
      if (urlGroup) urlGroup.style.display = 'none';
      if (fileInput) fileInput.required = true;
      if (urlInput) urlInput.required = false;
      if (this._galleryTempImageBase64 && previewImg && previewContainer) {
        previewImg.src = this._galleryTempImageBase64;
        previewContainer.style.display = 'block';
      } else if (previewContainer) {
        previewContainer.style.display = 'none';
      }
    } else {
      if (fileGroup) fileGroup.style.display = 'none';
      if (urlGroup) urlGroup.style.display = 'block';
      if (fileInput) fileInput.required = false;
      if (urlInput) urlInput.required = true;
      if (urlInput && urlInput.value && previewImg && previewContainer) {
        previewImg.src = urlInput.value;
        previewContainer.style.display = 'block';
      } else if (previewContainer) {
        previewContainer.style.display = 'none';
      }
    }
  }

  handleGalleryFilePreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      this._galleryTempImageBase64 = event.target.result;
      const previewContainer = document.getElementById('gal-preview-container');
      const previewImg = document.getElementById('gal-preview-img');
      if (previewContainer && previewImg) {
        previewImg.src = this._galleryTempImageBase64;
        previewContainer.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }

  handleGalleryUrlPreview(url) {
    const previewContainer = document.getElementById('gal-preview-container');
    const previewImg = document.getElementById('gal-preview-img');
    if (url && url.trim().length > 3) {
      if (previewImg) previewImg.src = url.trim();
      if (previewContainer) previewContainer.style.display = 'block';
    } else {
      if (previewContainer) previewContainer.style.display = 'none';
    }
  }

  async handleAdminGalleryUpload(e) {
    e.preventDefault();
    const user = store.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.showToast('Access Denied: Only Administrator can upload gallery photos.', 'error');
      return;
    }

    const title = document.getElementById('gal-photo-title')?.value?.trim();
    const category = document.getElementById('gal-photo-category')?.value;
    const sourceType = document.getElementById('gal-image-source-type')?.value;
    const desc = document.getElementById('gal-photo-desc')?.value?.trim() || '';
    const submitBtn = document.getElementById('gal-submit-btn');

    let imageUrl = '';
    if (sourceType === 'file') {
      if (!this._galleryTempImageBase64) {
        this.showToast('Please select an image file to upload.', 'warning');
        return;
      }
      imageUrl = this._galleryTempImageBase64;
    } else {
      imageUrl = document.getElementById('gal-photo-url')?.value?.trim();
      if (!imageUrl) {
        this.showToast('Please provide an image URL or local asset path.', 'warning');
        return;
      }
    }

    if (!title) {
      this.showToast('Please enter a photo title.', 'warning');
      return;
    }

    const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving to Database...';
    }

    try {
      await store.addGalleryItem({
        title,
        category,
        imageUrl,
        description: desc
      });

      this.closeModal('admin-gallery-modal');
      this.showToast('Photo successfully published to cloud database!', 'success');

      if (this.currentView === 'gallery') {
        this.renderGalleryPage();
      } else if (this.currentView === 'home' && user.role === 'admin') {
        this.renderMainView();
      }
    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Gallery upload failed.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
      }
    }
  }

  async deleteGalleryPhoto(photoId, photoTitle) {
    const user = store.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.showToast('Access Denied: Only Administrator can delete gallery photos.', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete "${photoTitle}" from the server database? This cannot be undone.`)) {
      return;
    }

    try {
      await store.removeGalleryItem(photoId);
      this.showToast('Photograph permanently removed from database.', 'success');

      if (this.currentView === 'gallery') {
        this.renderGalleryPage();
      } else if (this.currentView === 'home' && user.role === 'admin') {
        this.renderMainView();
      }
    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Failed to delete photo.', 'error');
    }
  }

  // --- DPDP Act 2023 & Privacy Policy Modal Handlers ---
  openPrivacyModal(tab = 'dpdp') {
    this.switchPrivacyTab(tab);
    this.openModal('privacy-policy-modal');
  }

  switchPrivacyTab(tab = 'dpdp') {
    const isDpdp = tab === 'dpdp';
    const dpdpPane = document.getElementById('privacy-pane-dpdp');
    const termsPane = document.getElementById('privacy-pane-terms');
    const dpdpBtn = document.getElementById('privacy-tab-btn-dpdp');
    const termsBtn = document.getElementById('privacy-tab-btn-terms');

    if (dpdpPane && termsPane) {
      if (isDpdp) {
        dpdpPane.style.display = 'block';
        termsPane.style.display = 'none';
        if (dpdpBtn) dpdpBtn.classList.add('active');
        if (termsBtn) termsBtn.classList.remove('active');
      } else {
        dpdpPane.style.display = 'none';
        termsPane.style.display = 'block';
        if (dpdpBtn) dpdpBtn.classList.remove('active');
        if (termsBtn) termsBtn.classList.add('active');
      }
    }
  }

  acceptPrivacyAndClose() {
    const stdConsent = document.getElementById('std-reg-consent');
    const tchConsent = document.getElementById('tch-reg-consent');
    const stdModal = document.getElementById('student-auth-modal');
    const tchModal = document.getElementById('teacher-auth-modal');

    let checkedAny = false;
    if (stdModal && stdModal.classList.contains('active') && stdConsent) {
      stdConsent.checked = true;
      checkedAny = true;
    }
    if (tchModal && tchModal.classList.contains('active') && tchConsent) {
      tchConsent.checked = true;
      checkedAny = true;
    }

    this.closeModal('privacy-policy-modal');
    if (checkedAny) {
      this.showToast('Privacy Policy & Terms agreed and checked!', 'success');
    } else {
      this.showToast('Privacy Policy & Terms acknowledged.', 'info');
    }
  }

  toggleInlinePolicy(panelId, btn) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const isHidden = panel.style.display === 'none' || !panel.style.display;
    if (isHidden) {
      panel.style.display = 'block';
      if (btn) {
        btn.classList.add('expanded');
        const textSpan = btn.querySelector('span');
        if (textSpan) textSpan.textContent = 'Hide Policy & Terms Under It';
      }
    } else {
      panel.style.display = 'none';
      if (btn) {
        btn.classList.remove('expanded');
        const textSpan = btn.querySelector('span');
        if (textSpan) textSpan.textContent = 'View Policy & Terms Under It';
      }
    }
  }

  async handleAdminLogin(e) {
    e.preventDefault();
    const u = document.getElementById('adm-login-user').value;
    const p = document.getElementById('adm-login-pass').value;

    try {
      const user = await store.login(u, p, 'admin');
      if (user.role !== 'admin') {
        throw new Error('Access denied: Administrator privileges required.');
      }
      this.closeModal('admin-auth-modal');
      this.showToast('Welcome to Admin Command Center!', 'success');
      this.navigateTo('/admin/applicants');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --- Clean URL Router (HTML5 History API, 100% Free of /#) ---
  normalizePath(rawPath) {
    if (!rawPath) return '/';
    let p = rawPath.replace(/^[#/]+/, '/');
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1 && p.endsWith('/')) {
      p = p.slice(0, -1);
    }
    return p;
  }

  navigateTo(path = '/', e = null) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const cleanPath = this.normalizePath(path);
    try {
      if (window.location.pathname !== cleanPath) {
        history.pushState(null, '', cleanPath);
      }
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.route(cleanPath);
  }

  updatePageTitle(path) {
    const titles = {
      '/': 'Quick Progressive Career Point - Premier Home Tutoring Across Odisha',
      '/home': 'Quick Progressive Career Point - Premier Home Tutoring Across Odisha',
      '/about-us': 'About Us | Quick Progressive Career Point (Odisha)',
      '/about': 'About Us | Quick Progressive Career Point (Odisha)',
      '/gallery': 'Photo Gallery & Achievements | Quick Progressive Career Point',
      '/find-tutors': 'Find Verified Home Tutors Across Odisha | QPCP',
      '/admin/dashboard': 'Admin Command Center | QPCP Odisha HQ',
      '/admin/applicants': 'Tutor Applications | Admin Command Center | QPCP',
      '/admin/teachers': 'Verified Home Faculty | Admin Command Center | QPCP',
      '/admin/students': 'Student Directory | Admin Command Center | QPCP',
      '/admin/inquiries': 'Lesson Inquiries & Requests | Admin Command Center | QPCP',
      '/admin/assign': 'Assign Home Tutor Matrix | Admin Command Center | QPCP',
      '/admin/gallery': 'Manage Gallery Database | Admin Command Center | QPCP',
      '/student/dashboard': 'Student Learning Portal | QPCP Odisha',
      '/student/inquiries': 'My Applications | Student Learning Portal | QPCP',
      '/student/assigned': 'My Assigned Faculty | Student Learning Portal | QPCP',
      '/student/tutors': 'Find Verified Home Tutors | Student Portal | QPCP',
      '/teacher/dashboard': 'Verified Faculty Dashboard | QPCP Odisha',
      '/teacher/students': 'Available Students | Verified Faculty | QPCP',
      '/teacher/assigned': 'My Assigned Slots | Verified Faculty | QPCP',
      '/teacher/status': 'Application Status | Home Tutor Review | QPCP',
      '/privacy-policy': 'Privacy Policy | Quick Progressive Career Point (Odisha)',
      '/terms': 'Terms of Service & Limitation of Liability | QPCP Odisha'
    };
    document.title = titles[path] || 'Quick Progressive Career Point (Odisha)';
  }

  updateActiveNavLinks(customPath = null) {
    const path = customPath || this.normalizePath(window.location.pathname);
    const desktopLinks = document.querySelectorAll('.nav-links .nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links .mobile-nav-link');

    const updateList = (links) => {
      links.forEach(link => {
        const linkPath = link.getAttribute('data-path') || link.getAttribute('href');
        if (linkPath === path || (linkPath === '/' && (path === '/' || path === '/home')) || (linkPath && linkPath !== '/' && linkPath !== '#' && path.startsWith(linkPath))) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    };

    updateList(desktopLinks);
    updateList(mobileLinks);
  }

  route(path) {
    const cleanPath = this.normalizePath(path);
    const user = store.getCurrentUser();
    this.updatePageTitle(cleanPath);
    this.updateActiveNavLinks(cleanPath);

    // Close any leftover open modals when navigating to content views
    const isAuthRoute = [
      '/student/login', '/student/signup', '/student/register',
      '/teacher/login', '/teacher/signup', '/teacher/register',
      '/admin/login', '/admin/auth',
      '/privacy-policy', '/terms'
    ].includes(cleanPath);

    if (!isAuthRoute) {
      this.closeAllModals();
    }

    // 1. Global Public Views
    if (cleanPath === '/' || cleanPath === '/home') {
      this.currentView = 'home';
      this.renderMainView();
      return;
    }

    if (cleanPath === '/about-us' || cleanPath === '/about') {
      this.currentView = 'about';
      this.renderAboutUsPage();
      return;
    }

    if (cleanPath === '/gallery') {
      this.currentView = 'gallery';
      this.renderGalleryPage();
      return;
    }

    if (cleanPath === '/find-tutors' || cleanPath === '/tutors') {
      this.currentView = 'home';
      this.renderMainView();
      setTimeout(() => {
        const el = document.getElementById('teachers-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    if (cleanPath === '/privacy-policy') {
      this.openPrivacyModal('dpdp');
      return;
    }

    if (cleanPath === '/terms') {
      this.openPrivacyModal('terms');
      return;
    }

    // 2. Auth Modal Routes
    if (cleanPath === '/student/login') {
      this.openStudentAuth('login');
      return;
    }
    if (cleanPath === '/student/signup' || cleanPath === '/student/register') {
      this.openStudentAuth('signup');
      return;
    }
    if (cleanPath === '/teacher/login') {
      this.openTeacherAuth('login');
      return;
    }
    if (cleanPath === '/teacher/signup' || cleanPath === '/teacher/register') {
      this.openTeacherAuth('signup');
      return;
    }
    if (cleanPath === '/admin/login' || cleanPath === '/admin/auth') {
      this.openAdminAuth();
      return;
    }

    // 3. Admin Command Center Modules & Submodules
    if (cleanPath.startsWith('/admin')) {
      if (!user || user.role !== 'admin') {
        this.showToast('Administrator privileges required. Please login.', 'warning');
        this.openAdminAuth();
        this.currentView = 'home';
        this.renderMainView();
        return;
      }
      this.currentView = 'admin';
      const sub = cleanPath.replace('/admin', '').replace(/^\//, '');
      if (['applicants', 'teachers', 'students', 'inquiries', 'assign', 'gallery'].includes(sub)) {
        this.adminActiveTab = sub;
      } else {
        this.adminActiveTab = 'applicants';
      }
      this.renderMainView();
      return;
    }

    // 4. Student Portal Modules & Submodules
    if (cleanPath.startsWith('/student')) {
      if (!user || (user.role !== 'student' && user.role !== 'admin')) {
        this.showToast('Please login to access the Student Portal.', 'info');
        this.openStudentAuth('login');
        this.currentView = 'home';
        this.renderMainView();
        return;
      }
      this.currentView = 'student';
      const sub = cleanPath.replace('/student', '').replace(/^\//, '');
      if (['inquiries', 'assigned', 'tutors'].includes(sub)) {
        this.studentActiveTab = sub;
      } else if (sub === 'applications') {
        this.studentActiveTab = 'inquiries';
      } else if (sub === 'find-tutors') {
        this.studentActiveTab = 'tutors';
      } else {
        this.studentActiveTab = 'inquiries';
      }
      this.renderMainView();
      return;
    }

    // 5. Teacher Portal Modules & Submodules
    if (cleanPath.startsWith('/teacher')) {
      if (!user || (user.role !== 'verified_teacher' && user.role !== 'teacher_applicant' && user.role !== 'admin')) {
        this.showToast('Please login to access the Teacher Portal.', 'info');
        this.openTeacherAuth('login');
        this.currentView = 'home';
        this.renderMainView();
        return;
      }
      if (user.role === 'admin') {
        this.currentView = 'teacher';
        this.teacherActiveTab = 'students';
        this.renderMainView();
        return;
      }
      if (user.role === 'teacher_applicant') {
        this.currentView = 'teacher_applicant';
        this.renderMainView();
        return;
      }
      this.currentView = 'teacher';
      const sub = cleanPath.replace('/teacher', '').replace(/^\//, '');
      if (['students', 'assigned'].includes(sub)) {
        this.teacherActiveTab = sub;
      } else if (sub === 'slots') {
        this.teacherActiveTab = 'assigned';
      } else {
        this.teacherActiveTab = 'students';
      }
      this.renderMainView();
      return;
    }

    // Default Fallback
    this.currentView = 'home';
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



  // --- Header Navigation ---
  renderHeader() {
    const user = store.getCurrentUser();
    const container = document.getElementById('nav-auth-container');
    const mobileContainer = document.getElementById('mobile-auth-container');

    let html = '';
    let mobileHtml = '';

    if (!user) {
      html = `
        <button class="btn btn-secondary btn-sm" onclick="app.navigateTo('/student/login')">
          <i class="fa-solid fa-right-to-bracket"></i> Student Login
        </button>
        <button class="btn btn-teacher-portal btn-sm" onclick="app.navigateTo('/teacher/signup')">
          <i class="fa-solid fa-chalkboard-user"></i> Teacher Portal
        </button>
      `;
      mobileHtml = `
        <button class="btn btn-primary" onclick="app.navigateTo('/student/login'); app.toggleMobileMenu();" style="width: 100%;">
          <i class="fa-solid fa-right-to-bracket"></i> Student Login
        </button>
        <button class="btn btn-teacher-portal" onclick="app.navigateTo('/teacher/signup'); app.toggleMobileMenu();" style="width: 100%;">
          <i class="fa-solid fa-chalkboard-user"></i> Teacher Portal
        </button>
      `;
    } else {
      let roleLabel = user.role.replace('_', ' ');
      let dashboardBtn = '';
      let mobileDashboardBtn = '';

      if (user.role === 'student') {
        dashboardBtn = `<button class="btn btn-primary btn-sm" onclick="app.navigateTo('/student/dashboard')"><i class="fa-solid fa-graduation-cap"></i> Student Portal</button>`;
        mobileDashboardBtn = `<button class="btn btn-primary" onclick="app.navigateTo('/student/dashboard'); app.toggleMobileMenu();" style="width: 100%;"><i class="fa-solid fa-graduation-cap"></i> Student Portal</button>`;
      } else if (user.role === 'admin') {
        dashboardBtn = `<button class="btn btn-primary btn-sm" onclick="app.navigateTo('/admin/dashboard')"><i class="fa-solid fa-gauge-high"></i> Dashboard</button>`;
        mobileDashboardBtn = `<button class="btn btn-primary" onclick="app.navigateTo('/admin/dashboard'); app.toggleMobileMenu();" style="width: 100%;"><i class="fa-solid fa-gauge-high"></i> Dashboard</button>`;
      } else if (user.role === 'verified_teacher' || user.role === 'teacher_applicant') {
        dashboardBtn = `<button class="btn btn-primary btn-sm" onclick="app.navigateTo('/teacher/dashboard')"><i class="fa-solid fa-gauge-high"></i> Dashboard</button>`;
        mobileDashboardBtn = `<button class="btn btn-primary" onclick="app.navigateTo('/teacher/dashboard'); app.toggleMobileMenu();" style="width: 100%;"><i class="fa-solid fa-gauge-high"></i> Dashboard</button>`;
      }

      const avatarMarkup = user.avatar 
        ? `<img src="${user.avatar}" alt="${user.name}" class="user-avatar-tiny">` 
        : `<div class="user-avatar-tiny" style="background: #334155; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;"><i class="fa-solid fa-user-shield"></i></div>`;

      html = `
        <div class="user-menu-pill">
          ${avatarMarkup}
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
            ${avatarMarkup}
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
    this.navigateTo('/');
  }

  // --- Main View Dispatcher ---
  renderMainView() {
    const user = store.getCurrentUser();
    this.updateActiveNavLinks();

    // 1. Global Public Views: About Us & Gallery
    if (this.currentView === 'about' || this.currentView === 'about-us') {
      this.renderAboutUsPage();
      return;
    }
    if (this.currentView === 'gallery') {
      this.renderGalleryPage();
      return;
    }

    // 2. Role Dashboards
    if (this.currentView === 'admin') {
      if (!user || user.role !== 'admin') {
        this.renderGuestLandingView();
        return;
      }
      this.renderAdminDashboard(user);
      return;
    }

    if (this.currentView === 'student') {
      if (!user || user.role !== 'student') {
        this.renderGuestLandingView();
        return;
      }
      this.renderStudentDashboard(user);
      return;
    }

    if (this.currentView === 'teacher') {
      if (!user || (user.role !== 'verified_teacher' && user.role !== 'admin')) {
        this.renderGuestLandingView();
        return;
      }
      this.renderVerifiedTeacherDashboard(user);
      return;
    }

    if (this.currentView === 'teacher_applicant') {
      if (!user || (user.role !== 'teacher_applicant' && user.role !== 'admin')) {
        this.renderGuestLandingView();
        return;
      }
      this.renderTeacherApplicantView(user);
      return;
    }

    // 3. Default Home
    if (!user) {
      this.renderGuestLandingView();
    } else if (user.role === 'student') {
      this.renderStudentDashboard(user);
    } else if (user.role === 'teacher_applicant') {
      this.renderTeacherApplicantView(user);
    } else if (user.role === 'verified_teacher') {
      this.renderVerifiedTeacherDashboard(user);
    } else if (user.role === 'admin') {
      this.renderAdminDashboard(user);
    }
  }

  showHome() {
    this.navigateTo('/');
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
              Quick Progressive Career Point connects students across Bhubaneswar, Cuttack, Rourkela, Sambalpur, Berhampur & all over Odisha with top 1-on-1 home tutors. Watch 30s to 5-min recorded intro videos and apply instantly via WhatsApp.
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
    this.navigateTo(`/student/${tab}`);
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
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.25rem;">Faculty assigned to you by Quick Progressive Career Point Admin for 1-on-1 home tutoring.</p>

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

  // --- 2. Comprehensive About Us Page ---
  renderAboutUsPage() {
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <!-- Hero Section -->
      <section class="about-hero">
        <div class="container" style="max-width: 900px; margin: 0 auto;">
          <div class="about-breadcrumb">
            <a href="/" onclick="app.navigateTo('/', event)"><i class="fa-solid fa-house"></i> Home</a>
            <span>/</span>
            <span>About Us</span>
          </div>

          <div class="about-badge-cluster">
            <span class="hero-tag"><i class="fa-solid fa-map-pin"></i> Serving All 30 Districts of Odisha</span>
            <span class="hero-tag" style="background:#ecfdf5; color:#047857; border-color:#a7f3d0;"><i class="fa-solid fa-shield-halved"></i> 100% In-Person & Video Verified Tutors</span>
            <span class="hero-tag" style="background:#fdf4ff; color:#9333ea; border-color:#f0abfc;"><i class="fa-solid fa-shield-heart"></i> 100% Student Privacy Assured</span>
          </div>

          <h1 class="hero-title" style="font-size: 2.5rem; margin-bottom: 1rem; line-height: 1.2;">
            Pioneering 1-on-1 Home Education Across <span class="gradient-text">All of Odisha</span>
          </h1>

          <p class="hero-desc" style="font-size: 1.05rem; line-height: 1.7; color: var(--text-muted); margin: 0 auto 2rem;">
            <strong>Quick Progressive Career Point (QPCP)</strong> is Odisha's premier dedicated home tutoring network. Founded in Odisha, we bridge the gap between discerning parents and certified, top-tier home tutors across Bhubaneswar, Cuttack, Rourkela, Sambalpur, Berhampur, Balasore, and every district in between.
          </p>

          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="app.openStudentAuth('signup')">
              <i class="fa-solid fa-user-plus"></i> Book a Home Tutor
            </button>
            <button class="btn btn-teacher-portal" onclick="app.openTeacherAuth('signup')">
              <i class="fa-solid fa-chalkboard-user"></i> Join as Faculty
            </button>
            <a href="https://wa.me/917008221300?text=Hello%20QPCP%2C%20I%20would%20like%20to%20inquire%20about%20home%20tutoring%20services%20in%20Odisha" target="_blank" class="btn btn-whatsapp">
              <i class="fa-brands fa-whatsapp"></i> Chat with Counselor
            </a>
          </div>

          <!-- Impact Metrics -->
          <div class="about-stats-grid">
            <div class="about-stat-card">
              <div class="about-stat-num">500+</div>
              <div class="about-stat-label">Verified Home Tutors</div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem;">Interviewed & audited</div>
            </div>
            <div class="about-stat-card">
              <div class="about-stat-num">30</div>
              <div class="about-stat-label">Districts in Odisha</div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem;">Statewide coverage</div>
            </div>
            <div class="about-stat-card">
              <div class="about-stat-num">10,000+</div>
              <div class="about-stat-label">Tutoring Hours</div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem;">Delivered at student homes</div>
            </div>
            <div class="about-stat-card">
              <div class="about-stat-num">98.4%</div>
              <div class="about-stat-label">Parent Satisfaction</div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem;">Grade improvement rate</div>
            </div>
          </div>
        </div>
      </section>

      <!-- The Story & Why QPCP Exists -->
      <section class="section" style="background: #ffffff; border-bottom: 1px solid var(--glass-border);">
        <div class="container">
          <div class="about-story-grid">
            <div class="about-story-card">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: #fef2f2; color: var(--accent-rose); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <h3 style="font-size: 1.3rem; margin: 0; color: var(--text-main);">The Tutoring Problem in Odisha</h3>
                  <span style="font-size: 0.78rem; color: var(--text-dim);">Why Traditional Channels Failed Parents</span>
                </div>
              </div>
              <p style="color: var(--text-muted); line-height: 1.7; font-size: 0.92rem; margin-bottom: 1rem;">
                For decades, parents in Bhubaneswar, Cuttack, and across Odisha struggled with informal broker agencies and unverified classifieds when looking for home tutors.
              </p>
              <ul style="padding-left: 1.2rem; color: var(--text-muted); font-size: 0.88rem; line-height: 1.6;">
                <li style="margin-bottom: 0.5rem;"><strong>Zero Quality Checks:</strong> Parents had no way to gauge an educator's teaching style, communication, or subject command before inviting them home.</li>
                <li style="margin-bottom: 0.5rem;"><strong>Safety & Background Concerns:</strong> Tutors were often dispatched without identity or academic credential verification.</li>
                <li style="margin-bottom: 0.5rem;"><strong>Opaque Middleman Commissions:</strong> Agencies took heavy cuts, leading to tutor dissatisfaction and abrupt dropouts mid-session.</li>
                <li><strong>Privacy Violations:</strong> Student numbers were frequently sold to commercial telemarketing databases.</li>
              </ul>
            </div>

            <div class="about-story-card">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: #ecfdf5; color: var(--accent-emerald); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                  <i class="fa-solid fa-lightbulb"></i>
                </div>
                <div>
                  <h3 style="font-size: 1.3rem; margin: 0; color: var(--text-main);">The QPCP Innovation</h3>
                  <span style="font-size: 0.78rem; color: var(--text-dim);">Transparency, Pedagogy & Technology</span>
                </div>
              </div>
              <p style="color: var(--text-muted); line-height: 1.7; font-size: 0.92rem; margin-bottom: 1rem;">
                Quick Progressive Career Point was founded to create Odisha's most reliable, transparent, and technology-empowered home tutoring network.
              </p>
              <ul style="padding-left: 1.2rem; color: var(--text-muted); font-size: 0.88rem; line-height: 1.6;">
                <li style="margin-bottom: 0.5rem;"><strong>Interactive Video Demonstrations:</strong> Watch every tutor explain core concepts in 30-sec to 5-min intro videos before booking.</li>
                <li style="margin-bottom: 0.5rem;"><strong>Rigorous In-Person Vetting:</strong> Academic degrees, credentials, and pedagogy skills verified by senior educationists.</li>
                <li style="margin-bottom: 0.5rem;"><strong>Direct WhatsApp Matchmaking:</strong> Seamless connections with zero middleman friction and bilateral fee freedom.</li>
                <li><strong>Contact Privacy Protection:</strong> Student mobile numbers remain strictly protected and confidential.</li>
              </ul>
            </div>
          </div>

          <!-- Mission, Vision & Core Values Pillars -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
            <div class="about-pillar-card">
              <div style="width: 52px; height: 52px; border-radius: var(--radius-md); background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1.25rem;">
                <i class="fa-solid fa-bullseye"></i>
              </div>
              <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Our Mission</h3>
              <p style="color: var(--text-muted); line-height: 1.65; font-size: 0.9rem; flex: 1;">
                To deliver bespoke, personalized 1-on-1 home tutoring directly at students' doorsteps across all 30 districts of Odisha. We adapt pedagogy to each child's learning speed across CBSE, ICSE, and CHSE Odisha boards, fostering academic excellence and lifelong intellectual curiosity.
              </p>
            </div>

            <div class="about-pillar-card">
              <div style="width: 52px; height: 52px; border-radius: var(--radius-md); background: #ecfdf5; color: var(--accent-emerald); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1.25rem;">
                <i class="fa-solid fa-eye"></i>
              </div>
              <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Our Vision</h3>
              <p style="color: var(--text-muted); line-height: 1.65; font-size: 0.9rem; flex: 1;">
                To establish Odisha's benchmark educational intermediary ecosystem where any student—whether in urban Bhubaneswar or rural Koraput—can access high-caliber educators with absolute safety, complete credential transparency, and proven pedagogical support.
              </p>
            </div>

            <div class="about-pillar-card">
              <div style="width: 52px; height: 52px; border-radius: var(--radius-md); background: #fdf4ff; color: #9333ea; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1.25rem;">
                <i class="fa-solid fa-gem"></i>
              </div>
              <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Our Core Values</h3>
              <p style="color: var(--text-muted); line-height: 1.65; font-size: 0.9rem; flex: 1;">
                Uncompromising educator vetting, complete student contact privacy and security, transparent bilateral pricing without hidden platform commissions, and dedicated student-centric mentorship.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 4-Step Tutor Verification Process -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <span class="section-subtitle">Rigorous Quality Assurance</span>
            <h2 class="section-title">How QPCP Verifies Every Home Tutor</h2>
            <p class="section-desc">We reject over 60% of applicants to guarantee only passionate, qualified educators step into your home.</p>
          </div>

          <div class="about-step-grid">
            <div class="about-step-card">
              <div class="about-step-badge">1</div>
              <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-file-circle-check" style="color: var(--primary);"></i> Credential Audit</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                Verification of academic degrees (B.Sc, M.Sc, B.Tech, M.Tech, B.Ed, Ph.D), 10th/12th marksheets, and teaching experience certificates.
              </p>
            </div>

            <div class="about-step-card">
              <div class="about-step-badge" style="background: #ecfdf5; color: #047857;">2</div>
              <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-comments" style="color: #047857;"></i> Pedagogy Interview</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                In-depth technical and pedagogical interview evaluating concept clarity, student handling patience, and syllabus proficiency.
              </p>
            </div>

            <div class="about-step-card">
              <div class="about-step-badge" style="background: #eff6ff; color: var(--primary);">3</div>
              <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-video" style="color: var(--primary);"></i> Video Demo Review</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                Every faculty member must submit a recorded 30s-5min concept lecture. We evaluate verbal clarity, board work, and engagement style.
              </p>
            </div>

            <div class="about-step-card">
              <div class="about-step-badge" style="background: #fdf4ff; color: #9333ea;">4</div>
              <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-star" style="color: #9333ea;"></i> Parent Feedback Loop</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                Post-session feedback from parents. Tutors maintain an active standing only when they meet our strict 4.5+ star satisfaction threshold.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Statewide Odisha Coverage Grid -->
      <section class="section" style="background: #ffffff; border-top: 1px solid var(--glass-border); border-bottom: 1px solid var(--glass-border);">
        <div class="container">
          <div class="section-header">
            <span class="section-subtitle">Local Reach Across Odisha</span>
            <h2 class="section-title">Home Tutoring Network in Major Zones</h2>
            <p class="section-desc">Our educators travel directly to your doorstep in all major residential localities and towns across Odisha.</p>
          </div>

          <div class="about-zone-grid">
            <div class="about-zone-card">
              <div class="about-zone-icon"><i class="fa-solid fa-building-columns"></i></div>
              <div class="about-zone-title">Bhubaneswar Capital Zone</div>
              <p class="about-zone-list">
                Patia, Jaydev Vihar, Saheed Nagar, Nayapalli, Infocity, Khandagiri, Chandrasekharpur, Old Town, Rasulgarh, VSS Nagar, Sundarpada & Pokhariput.
              </p>
            </div>

            <div class="about-zone-card">
              <div class="about-zone-icon"><i class="fa-solid fa-landmark"></i></div>
              <div class="about-zone-title">Cuttack Silver City Zone</div>
              <p class="about-zone-list">
                CDA Sectors (1-14), Cantonment Road, Bidanasi, Link Road, Madhupatna, Badambadi, Ranihat, Mangalabag & Chauliaganj.
              </p>
            </div>

            <div class="about-zone-card">
              <div class="about-zone-icon"><i class="fa-solid fa-industry"></i></div>
              <div class="about-zone-title">Western Odisha Zone</div>
              <p class="about-zone-list">
                <strong>Rourkela:</strong> Civil Township, Chhend, Koel Nagar, Panposh, Basanti Colony.<br>
                <strong>Sambalpur:</strong> Burla (VSSUT/VIMSAR), Dhanupali, Ainthapali, Budharaja, Bargarh & Jharsuguda.
              </p>
            </div>

            <div class="about-zone-card">
              <div class="about-zone-icon"><i class="fa-solid fa-map-location-dot"></i></div>
              <div class="about-zone-title">Southern, Eastern & Coastal Odisha</div>
              <p class="about-zone-list">
                <strong>Berhampur:</strong> Gosaninuagaon, Gandhi Nagar, Engineering School Rd.<br>
                <strong>Coastal & Eastern:</strong> Balasore, Bhadrak, Puri, Jajpur, Angul, Dhenkanal, Koraput & all 30 Districts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Comparison: QPCP vs Traditional Coaching -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <span class="section-subtitle">The Clear Advantage</span>
            <h2 class="section-title">QPCP 1-on-1 Home Tutoring vs Traditional Coaching</h2>
            <p class="section-desc">Why personalized at-home learning consistently outperforms crowded commercial batches.</p>
          </div>

          <div class="about-comparison-table-wrap">
            <table class="about-comparison-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Feature</th>
                  <th class="highlight" style="width: 40%;"><i class="fa-solid fa-circle-check" style="color: var(--primary);"></i> QPCP 1-on-1 Home Tutoring</th>
                  <th style="width: 35%;">Traditional Coaching / Local Tuition</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Attention & Focus</strong></td>
                  <td class="highlight"><span style="color: #047857; font-weight: 700;">100% Dedicated Attention:</span> Tutor customizes explanations to your child's pace.</td>
                  <td>1 Teacher for 40-70 students; doubts often ignored or unasked.</td>
                </tr>
                <tr>
                  <td><strong>Educator Transparency</strong></td>
                  <td class="highlight"><span style="color: #047857; font-weight: 700;">Watch Demo Videos:</span> View recorded 30s-5min lectures before hiring.</td>
                  <td>Blind enrollment without knowing who will teach.</td>
                </tr>
                <tr>
                  <td><strong>Safety & Commute</strong></td>
                  <td class="highlight"><span style="color: #047857; font-weight: 700;">Zero Commute Risk:</span> Class happens safely in your living room with parents present.</td>
                  <td>Risky daily travel, traffic fatigue, and wasted travel hours.</td>
                </tr>
                <tr>
                  <td><strong>Privacy & Legal Security</strong></td>
                  <td class="highlight"><span style="color: #047857; font-weight: 700;">Complete Privacy Shield:</span> Student phone/email kept strictly confidential with Admin.</td>
                  <td>Student contacts sold to telemarketers & unsolicited spammers.</td>
                </tr>
                <tr>
                  <td><strong>Curriculum Customization</strong></td>
                  <td class="highlight"><span style="color: #047857; font-weight: 700;">Odisha & National Boards:</span> Precise alignment with CBSE, ICSE, and CHSE Odisha.</td>
                  <td>Rigid, one-size-fits-all lesson pace with zero personal remediation.</td>
                </tr>
                <tr>
                  <td><strong>Pricing Structure</strong></td>
                  <td class="highlight"><span style="color: #047857; font-weight: 700;">Direct & Transparent:</span> Bilateral hourly/monthly terms negotiated directly with tutor.</td>
                  <td>Heavy non-refundable quarterly/annual upfront fees.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Message from the Founders -->
      <section class="section" style="background: #ffffff; border-top: 1px solid var(--glass-border);">
        <div class="container" style="max-width: 860px;">
          <div class="about-quote-box">
            <div style="font-size: 1.8rem; color: #047857; margin-bottom: 0.5rem;"><i class="fa-solid fa-quote-left"></i></div>
            <p class="about-quote-text">
              "Every student in Odisha has the potential to excel in board examinations, Olympiads, and competitive entrance tests like JEE and NEET. When education happens 1-on-1 at home, fear of asking questions evaporates. Concepts stick because teaching is tailored to the child's exact mindset. At Quick Progressive Career Point, our purpose is simple: make premium home tutoring safe, accessible, and transparent across every corner of Odisha."
            </p>
            <div class="about-quote-author">
              <i class="fa-solid fa-signature" style="font-size: 1.2rem;"></i>
              <span>Academic Leadership Desk, Quick Progressive Career Point, Odisha</span>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="section">
        <div class="container" style="max-width: 860px;">
          <div class="section-header">
            <span class="section-subtitle">Got Questions?</span>
            <h2 class="section-title">Frequently Asked Questions</h2>
          </div>

          <div class="about-faq-card">
            <div class="about-faq-q"><i class="fa-solid fa-circle-question" style="color: var(--primary);"></i> How quickly can I get a tutor assigned in my locality?</div>
            <p class="about-faq-a">Most student requests in Bhubaneswar, Cuttack, Rourkela, Sambalpur, and Berhampur are matched within 24 to 48 hours. Once you apply via WhatsApp or register an account, our team coordinates a verified tutor matching your subject and board requirements.</p>
          </div>

          <div class="about-faq-card">
            <div class="about-faq-q"><i class="fa-solid fa-circle-question" style="color: var(--primary);"></i> Can parents watch teacher video demonstrations before deciding?</div>
            <p class="about-faq-a">Yes! Every verified teacher listed in the QPCP directory includes an interactive 30-sec to 5-minute video lecture demonstration. You can evaluate their accent, teaching methodology, board work, and subject clarity prior to scheduling a demo class.</p>
          </div>

          <div class="about-faq-card">
            <div class="about-faq-q"><i class="fa-solid fa-circle-question" style="color: var(--primary);"></i> Which classes and academic boards are supported?</div>
            <p class="about-faq-a">We cater to Class 1 through Class 12 across CBSE, ICSE, and CHSE Odisha state board curricula, as well as competitive entrance foundations (JEE Mains/Advanced, NEET-UG, NTSE, KVPY, and Olympiads).</p>
          </div>

          <div class="about-faq-card">
            <div class="about-faq-q"><i class="fa-solid fa-circle-question" style="color: var(--primary);"></i> How are tuition fees paid and negotiated?</div>
            <p class="about-faq-a">As an educational intermediary under Section 79 of the Information Technology Act 2000, QPCP provides transparent listed hourly rate estimates. Exact lesson fees, monthly schedules, and payment terms are negotiated directly between parents and teachers without hidden platform deductions.</p>
          </div>

          <div class="about-faq-card">
            <div class="about-faq-q"><i class="fa-solid fa-circle-question" style="color: var(--primary);"></i> How does QPCP protect student contact privacy?</div>
            <p class="about-faq-a">Student phone numbers and email addresses are never published publicly. Only verified assigned tutors and admin can communicate directly regarding scheduled home sessions.</p>
          </div>
        </div>
      </section>

      <!-- Bottom Call To Action Banner -->
      <section class="container" style="margin-bottom: 4rem;">
        <div class="about-cta-banner">
          <h2 style="font-size: 2.2rem; margin-bottom: 0.75rem; position: relative;">Ready to Experience Odisha's Best Home Tutoring?</h2>
          <p style="max-width: 680px; margin: 0 auto 2rem; color: #cbd5e1; font-size: 1rem; position: relative; line-height: 1.6;">
            Connect with verified subject experts across all 30 districts of Odisha. Watch intro videos, schedule personalized home demo classes, and boost academic scores with confidence.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; position: relative;">
            <button class="btn btn-primary" onclick="app.navigateTo('/find-tutors', event)" style="background: #ffffff; color: var(--primary); font-weight: 700; box-shadow: 0 4px 14px rgba(0,0,0,0.2);">
              <i class="fa-solid fa-magnifying-glass"></i> Browse All Tutors
            </button>
            <button class="btn btn-teacher-portal" onclick="app.openTeacherAuth('signup')">
              <i class="fa-solid fa-chalkboard-user"></i> Apply as a Teacher
            </button>
            <a href="https://wa.me/917008221300?text=Hello%20QPCP%2C%20I%20am%20looking%20for%20a%20home%20tutor%20in%20Odisha" target="_blank" class="btn btn-whatsapp">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp Support (+91 70082 21300)
            </a>
          </div>
        </div>
      </section>
    `;
  }

  // --- 3. Separate Gallery Page ---
  // --- 3. Separate Gallery Page (Pure Server Database, ZERO LocalStorage) ---
  renderGalleryPage() {
    const root = document.getElementById('app-root');
    const user = store.getCurrentUser();
    const isAdmin = user && user.role === 'admin';

    const allDbItems = store.getGalleryItems('all');
    let filtered = store.getGalleryItems(this.galleryFilter);

    // Categories available for filtering
    const categories = [
      { id: 'all', label: 'All Photos' },
      { id: 'Achievements', label: 'Achievements' },
      { id: 'Classrooms', label: 'Home Sessions' },
      { id: 'Workshops', label: 'Faculty Meetings' },
      { id: 'Celebrations', label: 'Celebrations' },
      { id: 'Labs', label: 'Practical Kits' }
    ];

    root.innerHTML = `
      <section class="hero" style="padding-top: 2rem; padding-bottom: 2.5rem;">
        <div class="container" style="text-align: center; max-width: 780px;">
          <div class="hero-tag"><i class="fa-solid fa-images"></i> QPCP Odisha Gallery & Achievements</div>
          <h1 class="hero-title">Explore Our <span class="gradient-text">Home Tutoring Gallery</span></h1>
          <p class="hero-desc" style="margin: 0 auto 1.5rem;">
            Real moments from 1-on-1 home tutoring sessions, tutor training sessions, and board topper felicitations across Bhubaneswar, Cuttack, and all over Odisha.
          </p>
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.4rem 0.9rem; border-radius: 9999px; font-size: 0.78rem; color: var(--accent-emerald);">
            <i class="fa-solid fa-database"></i> <span>Live Server Database • ${allDbItems.length} Photo${allDbItems.length === 1 ? '' : 's'} Published</span>
          </div>
        </div>
      </section>

      <section class="section" style="padding-top: 1rem;">
        <div class="container">
          ${isAdmin ? `
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; color: #fff; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
              <div style="display: flex; align-items: center; gap: 0.9rem;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0;">
                  <i class="fa-solid fa-user-shield"></i>
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">
                    Admin Gallery Command
                    <span style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: 999px; font-weight: 600;">Authorized</span>
                  </div>
                  <div style="font-size: 0.8rem; color: #94a3b8;">
                    Only administrators can upload and remove photos. Stored in server database (Zero LocalStorage).
                  </div>
                </div>
              </div>
              <button class="btn btn-primary" onclick="app.openAdminGalleryUploadModal()" style="font-weight: 600; padding: 0.65rem 1.3rem;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload New Photo
              </button>
            </div>
          ` : ''}

          <div class="filter-chips" style="justify-content: center; margin-bottom: 2.25rem;">
            ${categories.map(c => `
              <button class="chip ${this.galleryFilter.toLowerCase() === c.id.toLowerCase() ? 'active' : ''}" onclick="app.filterGallery('${c.id}')">
                ${c.label}
              </button>
            `).join('')}
          </div>

          ${filtered.length === 0 ? `
            <div style="text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); max-width: 600px; margin: 0 auto;">
              <div style="font-size: 3rem; color: var(--text-dim); margin-bottom: 1rem;"><i class="fa-solid fa-images"></i></div>
              <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">No Photos Found</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">No photographs in the "${this.galleryFilter}" category yet.</p>
              ${isAdmin ? `
                <button class="btn btn-primary" onclick="app.openAdminGalleryUploadModal()">
                  <i class="fa-solid fa-cloud-arrow-up"></i> Upload First Photo in this Category
                </button>
              ` : `
                <button class="btn btn-secondary" onclick="app.filterGallery('all')">View All Photos</button>
              `}
            </div>
          ` : `
            <div class="responsive-card-grid">
              ${filtered.map(item => `
                <div class="gallery-card" style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--glass-shadow); transition: var(--transition-normal); display: flex; flex-direction: column;">
                  <div style="position: relative; height: 230px; overflow: hidden; cursor: pointer; background: #0f172a;" onclick="app.openLightbox('${item.imageUrl}', '${(item.title || '').replace(/'/g, "\\'")} - ${(item.description || '').replace(/'/g, "\\'")}')">
                    <img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.src='assets/gallery_achievement.jpg'">
                    <span class="role-badge student" style="position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.92); backdrop-filter: blur(4px); font-size: 0.72rem; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">${item.category}</span>
                    <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.65); color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; backdrop-filter: blur(4px);">
                      <i class="fa-solid fa-expand"></i>
                    </div>
                  </div>
                  <div style="padding: 1.25rem; display: flex; flex-direction: column; flex-grow: 1;">
                    <h3 style="font-size: 1.05rem; margin-bottom: 0.45rem; line-height: 1.4;">${item.title}</h3>
                    ${item.description ? `<p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.5; flex-grow: 1; margin-bottom: 1rem;">${item.description}</p>` : ''}
                    <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--glass-border); padding-top: 0.75rem; margin-top: auto;">
                      <span style="font-size: 0.75rem; color: var(--text-dim);"><i class="fa-regular fa-clock"></i> ${new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      ${isAdmin ? `
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); app.deleteGalleryPhoto('${item.id}', '${(item.title || '').replace(/'/g, "\\'")}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                          <i class="fa-solid fa-trash"></i> Delete
                        </button>
                      ` : `
                        <button class="btn btn-secondary btn-sm" onclick="app.openLightbox('${item.imageUrl}', '${(item.title || '').replace(/'/g, "\\'")} - ${(item.description || '').replace(/'/g, "\\'")}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                          <i class="fa-solid fa-eye"></i> View Full
                        </button>
                      `}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
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

    const msg = `Hello Quick Progressive Career Point (Odisha HQ)!

*NEW 1-ON-1 HOME TUTOR APPLICATION*

*STUDENT DETAILS:*
- Name: ${user.name}
- Class/Grade: ${user.grade}
- Locality & City: ${user.location}
- Phone: ${user.phone || 'N/A'}
- Email: ${user.email || 'N/A'}

*HOME TUTOR APPLIED FOR:*
- Faculty Name: ${teacher.name}
- Subjects: ${teacher.subjects.join(', ')}
- Tutor Locality: ${teacher.location}
- Hourly Rate: Rs.${teacher.rate} / hr

Please verify home slot availability, assign a coordinator, and contact us to schedule the first 1-on-1 demo session. Thank you!`;
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
            Welcome, <strong>${user.name}</strong>! Your home tutor application for <strong>Odisha</strong> has been submitted successfully to <strong>Quick Progressive Career Point</strong>.
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
    if (!user || (user.role !== 'verified_teacher' && user.role !== 'admin')) {
      this.showToast('Access denied: Verified Faculty privileges required.', 'error');
      this.navigateTo('/');
      return;
    }

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
    this.navigateTo(`/teacher/${tab}`);
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
    if (!user || user.role !== 'admin') {
      this.showToast('Access denied: Administrator privileges required.', 'error');
      this.navigateTo('/');
      return;
    }

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
              <li class="sidebar-nav-item">
                <button class="sidebar-nav-btn ${this.adminActiveTab === 'gallery' ? 'active' : ''}" onclick="app.switchAdminTab('gallery')">
                  <i class="fa-solid fa-images"></i> Manage Gallery (${(store.data.gallery || []).length})
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
    this.navigateTo(`/admin/${tab}`);
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
                  ${app.cvUrl ? `
                    <div style="margin-top: 0.5rem;">
                      <a href="${app.cvUrl}" download="${(app.name || 'Candidate').replace(/\s+/g, '_')}_CV" target="_blank" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem;">
                        <i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i> View / Download Uploaded CV
                      </a>
                    </div>
                  ` : ''}
                </div>

                <div class="dash-card-actions">
                  <button class="btn btn-secondary btn-sm" onclick="app.openTeacherVideoModal('${app.id}')">
                    <i class="fa-solid fa-film"></i> Review Demo Video
                  </button>

                  <div class="dash-card-btn-group">
                    <a href="https://wa.me/${app.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(app.name)},%20this%20is%20Quick%20Progressive%20Career%20Point%20Odisha%20Admin.%20We%20received%20your%20home%20tutor%20application!" target="_blank" class="btn btn-whatsapp btn-sm">
                      <i class="fa-brands fa-whatsapp"></i> WhatsApp Interview
                    </a>
                    <button class="btn btn-primary btn-sm" onclick="app.handleAdminApproveTeacher('${app.id}')">
                      <i class="fa-solid fa-check"></i> Approve & Publish
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="app.handleAdminRemoveUser('${app.id}', '${app.name}')">
                      <i class="fa-solid fa-user-xmark"></i> Reject & Remove
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
                    <div style="display: flex; gap: 0.4rem;">
                      <button class="btn btn-secondary btn-sm" onclick="app.openTeacherVideoModal('${t.id}')"><i class="fa-solid fa-film"></i> Demo</button>
                      <button class="btn btn-danger btn-sm" onclick="app.handleAdminRemoveUser('${t.id}', '${t.name}')"><i class="fa-solid fa-trash-can"></i> Remove</button>
                    </div>
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
                <th>Actions</th>
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
                  <td>
                    <button class="btn btn-danger btn-sm" onclick="app.handleAdminRemoveUser('${s.id}', '${s.name}')"><i class="fa-solid fa-user-minus"></i> Remove</button>
                  </td>
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
    } else if (this.adminActiveTab === 'gallery') {
      const galleryItems = store.getGalleryItems('all');
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.35rem; margin-bottom: 0.25rem;">Server Database Gallery Management</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">Upload and manage photographs stored permanently in the server database (Zero LocalStorage).</p>
          </div>
          <button class="btn btn-primary" onclick="app.openAdminGalleryUploadModal()">
            <i class="fa-solid fa-cloud-arrow-up"></i> Upload New Photo
          </button>
        </div>

        ${galleryItems.length === 0 ? `
          <div style="text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg);">
            <i class="fa-solid fa-images" style="font-size: 2.5rem; color: var(--text-dim); margin-bottom: 0.75rem;"></i>
            <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem;">No Photos in Database</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.25rem;">Upload the first photograph to showcase across Odisha.</p>
            <button class="btn btn-primary" onclick="app.openAdminGalleryUploadModal()"><i class="fa-solid fa-plus"></i> Upload Photo</button>
          </div>
        ` : `
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Title & Description</th>
                  <th>Category</th>
                  <th>Published Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${galleryItems.map(item => `
                  <tr>
                    <td style="width: 80px;">
                      <img src="${item.imageUrl}" style="width: 70px; height: 50px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); cursor: pointer;" onclick="app.openLightbox('${item.imageUrl}', '${(item.title || '').replace(/'/g, "\\'")}')">
                    </td>
                    <td>
                      <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem;">${item.title}</div>
                      <div style="color: var(--text-muted); font-size: 0.8rem; line-height: 1.4; max-width: 380px;">${item.description}</div>
                    </td>
                    <td><span class="role-badge student">${item.category}</span></td>
                    <td style="font-size: 0.8rem; color: var(--text-dim);">${new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <div style="display: flex; gap: 0.4rem;">
                        <button class="btn btn-secondary btn-sm" onclick="app.openLightbox('${item.imageUrl}', '${(item.title || '').replace(/'/g, "\\'")}')" title="Preview"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteGalleryPhoto('${item.id}', '${(item.title || '').replace(/'/g, "\\'")}')" title="Delete Photo"><i class="fa-solid fa-trash-can"></i> Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      `;
    }
  }

  async handleAdminApproveTeacher(applicantId) {
    try {
      await store.approveTeacherApplicant(applicantId);
      this.showToast('Home tutor approved & published live!', 'success');
      this.renderMainView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async handleAdminRemoveUser(userId, userName) {
    if (confirm(`Are you sure you want to remove "${userName}" from Quick Progressive Career Point? This will delete their profile and all associated data.`)) {
      try {
        await store.removeUser(userId);
        this.showToast(`User "${userName}" has been removed from the platform.`, 'success');
        this.renderMainView();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
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

  // --- Password Policy & Helper Tools ---
  validateStrongPassword(password) {
    if (!password || password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least 1 uppercase letter (A-Z).' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least 1 lowercase letter (a-z).' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least 1 number (0-9).' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      return { valid: false, message: 'Password must contain at least 1 special character (!@#$%^&* etc.).' };
    }
    return { valid: true };
  }

  checkPasswordStrength(val, prefix) {
    const rules = [
      { id: `${prefix}-req-len`, test: val.length >= 8 },
      { id: `${prefix}-req-upper`, test: /[A-Z]/.test(val) },
      { id: `${prefix}-req-lower`, test: /[a-z]/.test(val) },
      { id: `${prefix}-req-num`, test: /[0-9]/.test(val) },
      { id: `${prefix}-req-special`, test: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(val) }
    ];

    rules.forEach(r => {
      const el = document.getElementById(r.id);
      if (!el) return;
      if (r.test) {
        el.className = 'valid';
        el.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${el.textContent.trim()}`;
      } else {
        el.className = '';
        el.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${el.textContent.trim()}`;
      }
    });
  }

  toggleDemoCredentials(type) {
    const boxId = type === 'student' ? 'student-demo-creds-box' : 'teacher-demo-creds-box';
    const box = document.getElementById(boxId);
    if (!box) return;
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }

  handleImageFileSelect(event, previewId, hiddenInputId) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Image file size must be less than 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const previewImg = document.getElementById(previewId);
      const hiddenInput = document.getElementById(hiddenInputId);
      if (previewImg) previewImg.src = dataUrl;
      if (hiddenInput) hiddenInput.value = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  handleCvFileSelect(event, hiddenInputId, nameHintId) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.showToast('CV file size must be less than 10MB.', 'error');
      return;
    }

    const nameHint = document.getElementById(nameHintId);
    if (nameHint) nameHint.textContent = `📄 Selected CV: ${file.name}`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const hiddenInput = document.getElementById(hiddenInputId);
      if (hiddenInput) hiddenInput.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  validatePhone(phone) {
    const cleaned = (phone || '').replace(/[^0-9]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      return { valid: false, message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' };
    }
    return { valid: true };
  }

  validateUsername(username) {
    if (!username || username.length < 3 || username.length > 25) {
      return { valid: false, message: 'Username must be between 3 and 25 characters.' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, message: 'Username can only contain letters, numbers, and underscores.' };
    }
    return { valid: true };
  }

  // --- Auth & Form Handlers ---
  async handleStudentLogin(e) {
    e.preventDefault();
    const u = document.getElementById('std-login-user').value;
    const p = document.getElementById('std-login-pass').value;

    try {
      const user = await store.login(u, p, 'student');
      this.closeModal('student-auth-modal');
      this.closeAllModals();
      if (user.role === 'admin') {
        this.showToast('Administrator logged in! Welcome to Admin Command Center.', 'success');
        this.navigateTo('/admin/dashboard');
      } else {
        this.showToast('Student logged in successfully!', 'success');
        this.navigateTo('/student/dashboard');
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async handleStudentSignup(e) {
    e.preventDefault();

    // Terms and Privacy Policy Agreement Validation
    const consent = document.getElementById('std-reg-consent');
    if (!consent || !consent.checked) {
      this.showToast('Please check the box agreeing to the Terms of Service and Privacy Policy to complete registration.', 'error');
      consent?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      consent?.focus();
      return;
    }

    const username = document.getElementById('std-reg-username').value;
    const phone = document.getElementById('std-reg-phone').value;
    const pass = document.getElementById('std-reg-pass').value;

    const userCheck = this.validateUsername(username);
    if (!userCheck.valid) {
      this.showToast(userCheck.message, 'error');
      return;
    }

    const phoneCheck = this.validatePhone(phone);
    if (!phoneCheck.valid) {
      this.showToast(phoneCheck.message, 'error');
      return;
    }

    const passCheck = this.validateStrongPassword(pass);
    if (!passCheck.valid) {
      this.showToast(passCheck.message, 'error');
      return;
    }

    const base64Avatar = document.getElementById('std-reg-avatar-base64').value;
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(document.getElementById('std-reg-name').value)}&background=2563eb&color=fff`;

    const data = {
      name: document.getElementById('std-reg-name').value,
      username,
      phone: `+91 ${phone.replace(/[^0-9]/g, '')}`,
      email: document.getElementById('std-reg-email').value,
      password: pass,
      grade: document.getElementById('std-reg-grade').value,
      location: document.getElementById('std-reg-location').value,
      avatar: base64Avatar || defaultAvatar,
      privacyConsent: true,
      dpdpConsent: true
    };

    try {
      await store.registerStudent(data);
      this.closeModal('student-auth-modal');
      this.showToast('Student registered & logged in!', 'success');
      this.init();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async handleTeacherLogin(e) {
    e.preventDefault();
    const u = document.getElementById('tch-login-user').value;
    const p = document.getElementById('tch-login-pass').value;

    try {
      const user = await store.login(u, p, 'teacher');
      this.closeModal('teacher-auth-modal');
      this.closeAllModals();
      if (user.role === 'admin') {
        this.showToast('Administrator logged in! Welcome to Admin Command Center.', 'success');
        this.navigateTo('/admin/dashboard');
      } else if (user.role === 'teacher_applicant') {
        this.showToast('Teacher application under review.', 'info');
        this.navigateTo('/teacher/status');
      } else {
        this.showToast('Teacher logged in!', 'success');
        this.navigateTo('/teacher/dashboard');
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async handleTeacherSignup(e) {
    e.preventDefault();

    // Terms and Privacy Policy Agreement Validation
    const consent = document.getElementById('tch-reg-consent');
    if (!consent || !consent.checked) {
      this.showToast('Please check the box agreeing to the Terms of Service and Privacy Policy to submit your application.', 'error');
      consent?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      consent?.focus();
      return;
    }

    const username = document.getElementById('tch-reg-username').value;
    const phone = document.getElementById('tch-reg-phone').value;
    const pass = document.getElementById('tch-reg-pass').value;

    const userCheck = this.validateUsername(username);
    if (!userCheck.valid) {
      this.showToast(userCheck.message, 'error');
      return;
    }

    const phoneCheck = this.validatePhone(phone);
    if (!phoneCheck.valid) {
      this.showToast(phoneCheck.message, 'error');
      return;
    }

    const passCheck = this.validateStrongPassword(pass);
    if (!passCheck.valid) {
      this.showToast(passCheck.message, 'error');
      return;
    }

    const base64Avatar = document.getElementById('tch-reg-avatar-base64').value;
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(document.getElementById('tch-reg-name').value)}&background=2563eb&color=fff`;

    const data = {
      name: document.getElementById('tch-reg-name').value,
      username,
      phone: `+91 ${phone.replace(/[^0-9]/g, '')}`,
      email: document.getElementById('tch-reg-email').value,
      subjects: document.getElementById('tch-reg-subjects').value,
      rate: document.getElementById('tch-reg-rate').value,
      experience: document.getElementById('tch-reg-experience').value,
      location: document.getElementById('tch-reg-location').value,
      videoUrl: document.getElementById('tch-reg-video').value,
      bio: document.getElementById('tch-reg-bio').value,
      cvUrl: document.getElementById('tch-reg-cv-base64') ? document.getElementById('tch-reg-cv-base64').value : '',
      password: pass,
      avatar: base64Avatar || defaultAvatar,
      privacyConsent: true,
      dpdpConsent: true
    };

    try {
      await store.registerTeacher(data);
      this.closeModal('teacher-auth-modal');
      this.showToast('Home tutor application submitted! Under admin review.', 'info');
      this.init();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async handleAdminLogin(e) {
    e.preventDefault();
    const u = document.getElementById('adm-login-user').value;
    const p = document.getElementById('adm-login-pass').value;

    try {
      await store.login(u, p, 'admin');
      this.closeModal('admin-auth-modal');
      this.closeAllModals();
      this.showToast('Administrator logged in successfully!', 'success');
      this.navigateTo('/admin/dashboard');
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
    document.getElementById('edit-std-username').value = user.username || '';

    const preview = document.getElementById('edit-std-avatar-preview');
    if (preview && user.avatar) {
      preview.src = user.avatar;
    }
    const hiddenInput = document.getElementById('edit-std-avatar-base64');
    if (hiddenInput) {
      hiddenInput.value = user.avatar || '';
    }

    this.openModal('student-edit-modal');
  }

  handleUpdateStudentProfile(e) {
    e.preventDefault();
    const user = store.getCurrentUser();
    if (!user) return;

    const base64Avatar = document.getElementById('edit-std-avatar-base64').value;

    const updates = {
      name: document.getElementById('edit-std-name').value,
      phone: document.getElementById('edit-std-phone').value,
      avatar: base64Avatar || user.avatar
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
