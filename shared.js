/**
 * Quick Progressive Career Point - Shared Navigation, Auth & UI Helpers
 * Used across all separate pages (index, about, gallery, login, dashboards, signups)
 */

import { store } from './store.js';

export class SharedUI {
  constructor() {
    this.toastContainer = null;
  }

  // --- Initialize Shared Components on Page Load ---
  init(activePage = '') {
    this.ensureToastContainer();
    this.ensurePrivacyModal();
    this.renderHeader(activePage);
    this.renderFooter();
    this.attachMobileMenu();
    this.attachModalClosers();
  }

  // --- Ensure Toast Container Exists in DOM ---
  ensureToastContainer() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }

  // --- Show Toast Notification ---
  showToast(message, type = 'info') {
    this.ensureToastContainer();
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

  // --- Render Dynamic Header Navigation ---
  renderHeader(activePage = '') {
    const navAuth = document.getElementById('nav-auth-container');
    const mobileAuth = document.getElementById('mobile-auth-container');
    const user = store.getCurrentUser();

    // Update active nav links
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      const page = link.getAttribute('data-page');
      if (page && page === activePage) {
        link.classList.add('active');
      } else if (page) {
        link.classList.remove('active');
      }
    });

    let desktopHtml = '';
    let mobileHtml = '';

    if (!user) {
      desktopHtml = `
        <a href="login.html" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-right-to-bracket"></i> Login
        </a>
        <a href="signup-student.html" class="btn btn-primary btn-sm">
          <i class="fa-solid fa-user-plus"></i> Student Sign Up
        </a>
        <a href="signup-teacher.html" class="btn btn-teacher-portal btn-sm">
          <i class="fa-solid fa-chalkboard-user"></i> Become a Tutor
        </a>
      `;
      mobileHtml = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%;">
          <a href="login.html" class="btn btn-secondary" style="width: 100%; text-align: center;">
            <i class="fa-solid fa-right-to-bracket"></i> Login
          </a>
          <a href="signup-student.html" class="btn btn-primary" style="width: 100%; text-align: center;">
            <i class="fa-solid fa-user-plus"></i> Join as Student
          </a>
          <a href="signup-teacher.html" class="btn btn-teacher-portal" style="width: 100%; text-align: center;">
            <i class="fa-solid fa-chalkboard-user"></i> Become a Tutor
          </a>
        </div>
      `;
    } else {
      let roleLabel = user.role ? user.role.replace('_', ' ') : 'User';
      let dashboardUrl = 'student-dashboard.html';
      let dashboardIcon = 'fa-graduation-cap';
      let dashboardText = 'Student Portal';

      if (user.role === 'verified_teacher' || user.role === 'teacher_applicant') {
        dashboardUrl = 'teacher-dashboard.html';
        dashboardIcon = 'fa-chalkboard-user';
        dashboardText = 'Teacher Portal';
      } else if (user.role === 'admin') {
        dashboardUrl = 'admin-dashboard.html';
        dashboardIcon = 'fa-gauge-high';
        dashboardText = 'Admin HQ';
      }

      const avatarMarkup = user.avatar
        ? `<img src="${user.avatar}" alt="${user.name}" class="user-avatar-tiny">`
        : `<div class="user-avatar-tiny" style="background: #334155; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;"><i class="fa-solid fa-user"></i></div>`;

      desktopHtml = `
        <div class="user-menu-pill">
          ${avatarMarkup}
          <div style="line-height: 1.2;">
            <strong style="font-size: 0.85rem; color: var(--text-main);">${user.name || 'User'}</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted);">@${user.username || ''}</div>
          </div>
          <span class="role-badge ${user.role || ''}">${roleLabel}</span>
        </div>
        <a href="${dashboardUrl}" class="btn btn-primary btn-sm">
          <i class="fa-solid ${dashboardIcon}"></i> ${dashboardText}
        </a>
        <button class="btn btn-secondary btn-sm" id="logout-btn" title="Log Out">
          <i class="fa-solid fa-power-off"></i>
        </button>
      `;

      mobileHtml = `
        <div class="user-menu-pill" style="justify-content: space-between; margin-bottom: 0.75rem; width: 100%;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${avatarMarkup}
            <div>
              <strong style="font-size: 0.9rem; color: var(--text-main);">${user.name || 'User'}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">@${user.username || ''}</div>
            </div>
          </div>
          <span class="role-badge ${user.role || ''}">${roleLabel}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
          <a href="${dashboardUrl}" class="btn btn-primary" style="width: 100%; text-align: center;">
            <i class="fa-solid ${dashboardIcon}"></i> ${dashboardText}
          </a>
          <button class="btn btn-secondary" id="mobile-logout-btn" style="width: 100%; text-align: center;">
            <i class="fa-solid fa-power-off"></i> Log Out
          </button>
        </div>
      `;
    }

    if (navAuth) navAuth.innerHTML = desktopHtml;
    if (mobileAuth) mobileAuth.innerHTML = mobileHtml;

    // Attach logout event listeners
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  // --- Attach Mobile Drawer Toggle ---
  attachMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const drawer = document.getElementById('mobile-drawer');
    const menuIcon = document.getElementById('mobile-menu-icon');

    if (!menuBtn || !drawer) return;

    // Clone to remove previous duplicate listeners
    const newBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newBtn, menuBtn);

    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = drawer.classList.contains('active');
      if (isActive) {
        drawer.classList.remove('active');
        if (menuIcon) menuIcon.className = 'fa-solid fa-bars';
      } else {
        drawer.classList.add('active');
        if (menuIcon) menuIcon.className = 'fa-solid fa-xmark';
      }
    });

    // Close on tapping outside
    document.addEventListener('click', (e) => {
      if (drawer.classList.contains('active') && !drawer.contains(e.target) && !newBtn.contains(e.target)) {
        drawer.classList.remove('active');
        if (menuIcon) menuIcon.className = 'fa-solid fa-bars';
      }
    });
  }

  // --- Attach Modal Closers ---
  attachModalClosers() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          document.body.classList.remove('modal-open');
        }
      });
    });

    document.querySelectorAll('.modal-close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        const modal = closeBtn.closest('.modal-overlay');
        if (modal) {
          modal.classList.remove('active');
          document.body.classList.remove('modal-open');
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          modal.classList.remove('active');
          document.body.classList.remove('modal-open');
        });
      }
    });
  }

  // --- Modal Control Helpers ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('modal-open');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
  }

  // --- Handle Logout ---
  handleLogout() {
    store.logout();
    this.showToast('You have been logged out successfully.', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 400);
  }

  // --- Ensure Privacy & Terms Modal Exists in DOM ---
  ensurePrivacyModal() {
    if (document.getElementById('privacy-policy-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'privacy-policy-modal';
    modal.innerHTML = `
      <div class="modal-card lg" style="max-width: 860px;">
        <button class="modal-close" type="button"><i class="fa-solid fa-xmark"></i></button>
        
        <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.85rem;">
          <div style="width: 46px; height: 46px; border-radius: 12px; background: #eff6ff; color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid var(--primary-border); flex-shrink: 0;">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h2 class="modal-title" style="margin-bottom: 0.15rem; font-size: 1.35rem;">Privacy Policy & Terms of Service</h2>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span class="dpdp-badge"><i class="fa-solid fa-shield-halved"></i> Official Policy & Terms</span>
              <span style="font-size: 0.74rem; color: var(--text-dim);">Quick Progressive Career Point • Odisha, India</span>
            </div>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="tab-switcher" style="margin-bottom: 1.1rem;">
          <button class="tab-btn" id="privacy-tab-btn-terms" type="button">
            <i class="fa-solid fa-scale-balanced"></i> Terms of Service & Disclaimer
          </button>
          <button class="tab-btn active" id="privacy-tab-btn-dpdp" type="button">
            <i class="fa-solid fa-user-shield"></i> Privacy Policy (DPDP Act)
          </button>
        </div>

        <!-- Scrollable Policy Container -->
        <div class="policy-doc-container" style="max-height: 55vh; overflow-y: auto; padding-right: 0.5rem;">
          
          <!-- PANE 1: TERMS OF SERVICE -->
          <div id="privacy-pane-terms" style="display: none;">
            <div class="policy-doc-section">
              <h3><i class="fa-solid fa-key" style="color: var(--accent-rose);"></i> 1. User Sole Responsibility for Credentials & Device Security</h3>
              <p>Every registered user (Student, Parent, Tutor) is solely and exclusively responsible for safeguarding their login credentials and account access:</p>
              <ul>
                <li>You must maintain the strict confidentiality of your password, username, email account, and mobile number.</li>
                <li>You must create a strong, compliant password meeting the platform's security policy.</li>
                <li>You are strictly prohibited from sharing your login credentials with any third party, friend, or unauthorized individual.</li>
                <li>All activities, inquiries, communications, and transactions initiated under your registered credentials are deemed to have been executed by you.</li>
              </ul>
            </div>

            <div class="policy-doc-section">
              <h3><i class="fa-solid fa-shield-slash" style="color: var(--accent-rose);"></i> 2. Complete Disclaimer of Liability: If Credentials or Data are Lost, QPCP is NOT to Blame</h3>
              <div class="policy-alert-box" style="background: #fff1f2; border-left: 4px solid #e11d48; padding: 0.85rem; border-radius: 6px; color: #881337; margin: 0.75rem 0;">
                <strong>EXPRESS LEGAL RELEASE:</strong> If a user's password, login credentials, phone, SIM card, computer, or personal devices are lost, misplaced, stolen, compromised, hacked, or accessed without authorization due to user negligence or device sharing:
                <br><br>
                <strong>QUICK PROGRESSIVE CAREER POINT, ITS OPERATORS, AND ADMINISTRATORS SHALL BEAR ZERO RESPONSIBILITY OR LIABILITY AND ARE NOT TO BLAME.</strong> Under no circumstances will QPCP be held accountable or liable for unauthorized access, account takeover, or loss of personal data.
              </div>
            </div>

            <div class="policy-doc-section">
              <h3><i class="fa-solid fa-handshake-slash" style="color: var(--text-main);"></i> 3. Intermediary Status & Offline Tutoring Disclaimer</h3>
              <p>Quick Progressive Career Point operates strictly as a digital matching platform connecting independent freelance tutors with students/parents across Odisha:</p>
              <ul>
                <li><strong>Independent Educators:</strong> Tutors listed on QPCP are independent freelance educators and not employees of QPCP.</li>
                <li><strong>Offline Home Lessons:</strong> Lessons take place at the student's residence. Parents and guardians must exercise normal prudence and presence during sessions.</li>
                <li><strong>Fee Arrangements:</strong> Tuition fee schedules negotiated between parents and tutors are bilateral. QPCP holds zero liability for payment defaults or disputes.</li>
              </ul>
            </div>

            <div class="policy-doc-section">
              <h3><i class="fa-solid fa-gavel" style="color: var(--primary);"></i> 4. Governing Law & Dispute Jurisdiction</h3>
              <p>These terms and all related policies are governed by the substantive laws of India (including the Digital Personal Data Protection Act, 2023). Any dispute shall be subject to the exclusive jurisdiction of the competent courts situated in <strong>Bhubaneswar / Cuttack, Odisha, India</strong>.</p>
            </div>
          </div>

          <!-- PANE 2: PRIVACY POLICY -->
          <div id="privacy-pane-dpdp" style="display: block;">
            <div class="policy-alert-box" style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 0.85rem; border-radius: 6px; color: #065f46; margin: 0.75rem 0;">
              <strong>Digital Personal Data Protection Act, 2023 Notice (Section 5):</strong> Quick Progressive Career Point ("QPCP", Data Fiduciary) provides this statutory notice to students, parents, and tutors ("Data Principals") across Odisha before processing digital personal data.
            </div>

            <div class="policy-doc-section">
              <h3><i class="fa-solid fa-database" style="color: var(--primary);"></i> 1. Itemized Personal Data Collected</h3>
              <p>In accordance with Section 5(1)(i) of the DPDP Act 2023, QPCP collects only strictly necessary data voluntarily provided during registration:</p>
              <ul>
                <li><strong>Students / Parents:</strong> Full name, 10-digit mobile number, email address, grade/exam goal, locality/city in Odisha, and optional profile photo. Used solely to match with verified home tutors.</li>
                <li><strong>Faculty / Tutors:</strong> Full name, mobile number, email, subjects, hourly fee, teaching experience, locality in Odisha, bio, demo video URL, CV file, and profile photo. Used to vet teaching proficiency and feature profiles to students.</li>
              </ul>
            </div>

            <div class="policy-doc-section">
              <h3><i class="fa-solid fa-user-lock" style="color: var(--primary);"></i> 2. Rights of Data Principals & Grievances</h3>
              <p>Under the DPDP Act 2023, you retain full rights to access, update, rectify, or request the deletion of your personal data at any time.</p>
              <p>For inquiries or grievances, contact our Grievance Officer: <strong>support@quickprogressive.edu.in</strong> or WhatsApp: <strong>+91 70082 21300</strong>.</p>
            </div>
          </div>

        </div>

        <!-- Modal Footer Action Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.15rem; padding-top: 1rem; border-top: 1px solid var(--glass-border); flex-wrap: wrap; gap: 0.75rem;">
          <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-circle-check" style="color: var(--accent-emerald);"></i> 
            <span>Standard agreement required for registration</span>
          </div>
          <div style="display: flex; gap: 0.6rem;">
            <button type="button" class="btn btn-secondary btn-sm" id="close-privacy-btn">Close</button>
            <button type="button" class="btn btn-primary btn-sm" id="accept-privacy-btn">
              <i class="fa-solid fa-check"></i> I Understand & Agree
            </button>
          </div>
        </div>

      </div>
    `;
    document.body.appendChild(modal);

    // Attach internal listeners
    const termsBtn = modal.querySelector('#privacy-tab-btn-terms');
    const dpdpBtn = modal.querySelector('#privacy-tab-btn-dpdp');
    if (termsBtn) termsBtn.addEventListener('click', () => this.switchPrivacyTab('terms'));
    if (dpdpBtn) dpdpBtn.addEventListener('click', () => this.switchPrivacyTab('dpdp'));

    const closeBtn = modal.querySelector('#close-privacy-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal('privacy-policy-modal'));

    const acceptBtn = modal.querySelector('#accept-privacy-btn');
    if (acceptBtn) acceptBtn.addEventListener('click', () => this.acceptPrivacyAndClose());
  }

  // --- Open Privacy Modal to Tab ---
  openPrivacyModal(tab = 'terms') {
    this.ensurePrivacyModal();
    this.switchPrivacyTab(tab);
    this.openModal('privacy-policy-modal');
  }

  // --- Switch Privacy Tab ---
  switchPrivacyTab(tab = 'terms') {
    const isTerms = tab === 'terms';
    const dpdpPane = document.getElementById('privacy-pane-dpdp');
    const termsPane = document.getElementById('privacy-pane-terms');
    const dpdpBtn = document.getElementById('privacy-tab-btn-dpdp');
    const termsBtn = document.getElementById('privacy-tab-btn-terms');

    if (dpdpPane && termsPane) {
      if (isTerms) {
        termsPane.style.display = 'block';
        dpdpPane.style.display = 'none';
        if (termsBtn) termsBtn.classList.add('active');
        if (dpdpBtn) dpdpBtn.classList.remove('active');
      } else {
        termsPane.style.display = 'none';
        dpdpPane.style.display = 'block';
        if (termsBtn) termsBtn.classList.remove('active');
        if (dpdpBtn) dpdpBtn.classList.add('active');
      }
    }
  }

  // --- Accept Privacy and Check Consent Checkboxes ---
  acceptPrivacyAndClose() {
    let checkedAny = false;
    const stdConsent = document.getElementById('std-reg-consent');
    const tchConsent = document.getElementById('tch-reg-consent');

    if (stdConsent) {
      stdConsent.checked = true;
      checkedAny = true;
    }
    if (tchConsent) {
      tchConsent.checked = true;
      checkedAny = true;
    }

    this.closeModal('privacy-policy-modal');
    if (checkedAny) {
      this.showToast('Terms of Service & Privacy Policy agreed and checked!', 'success');
    } else {
      this.showToast('Terms of Service & Privacy Policy acknowledged.', 'info');
    }
  }

  // --- Protect Pages Based on User Role ---
  requireAuth(allowedRoles = []) {
    const user = store.getCurrentUser();
    if (!user) {
      this.showToast('Please log in to access this page.', 'error');
      const current = window.location.pathname.split('/').pop() || 'index.html';
      setTimeout(() => {
        window.location.href = `login.html?redirect=${encodeURIComponent(current)}`;
      }, 500);
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      this.showToast('Access denied: You do not have permission for this portal.', 'error');
      setTimeout(() => {
        if (user.role === 'admin') window.location.href = 'admin-dashboard.html';
        else if (user.role === 'verified_teacher' || user.role === 'teacher_applicant') window.location.href = 'teacher-dashboard.html';
        else window.location.href = 'student-dashboard.html';
      }, 600);
      return false;
    }

    return true;
  }

  // --- Render Universal Footer (Consistent across all pages) ---
  renderFooter() {
    const footer = document.querySelector('footer.footer');
    if (!footer) return;

    footer.innerHTML = `
      <div class="container footer-grid">
        <div class="footer-col">
          <div class="brand-logo" style="margin-bottom: 1rem;">
            <img src="assets/logo.png" alt="QPCP Odisha Logo" class="brand-logo-img">
            <div class="brand-title">Quick Progressive <span>Career Point</span></div>
          </div>
          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
            Odisha's premier 1-on-1 home tutoring platform. Connecting students across Bhubaneswar, Cuttack, Rourkela, Sambalpur & all 30 districts of Odisha with verified home tutors.
          </p>
          <div style="margin-top: 1rem; display: flex; gap: 0.75rem;">
            <a href="https://wa.me/917008221300" target="_blank" class="btn btn-whatsapp btn-sm">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp Helpdesk
            </a>
          </div>
        </div>

        <div class="footer-col">
          <h4>Explore</h4>
          <ul class="footer-links">
            <li><a href="index.html">Find Home Tutors</a></li>
            <li><a href="about.html">About QPCP Odisha</a></li>
            <li><a href="gallery.html">Tutoring Gallery</a></li>
            <li><a href="login.html">Login Portal</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Portals & Registration</h4>
          <ul class="footer-links">
            <li><a href="signup-student.html">Student Registration</a></li>
            <li><a href="signup-teacher.html">Teacher Application</a></li>
            <li><a href="student-dashboard.html">Student Learning Portal</a></li>
            <li><a href="teacher-dashboard.html">Teacher Faculty Portal</a></li>
            <li><a href="admin-dashboard.html">Admin Command Center</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Helpline & Office</h4>
          <ul class="footer-links">
            <li><a href="https://wa.me/917008221300" target="_blank"><i class="fa-brands fa-whatsapp" style="color: #22c55e;"></i> +91 70082 21300</a></li>
            <li><a href="tel:+917008221300"><i class="fa-solid fa-phone" style="color: var(--primary);"></i> +91 70082 21300</a></li>
            <li><a href="mailto:support@quickprogressive.edu.in"><i class="fa-solid fa-envelope" style="color: var(--primary);"></i> support@quickprogressive.edu.in</a></li>
            <li><span style="color: var(--text-muted); font-size: 0.85rem;"><i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> Patia & CDA, Bhubaneswar / Cuttack, Odisha</span></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container footer-bottom-flex" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            &copy; ${new Date().getFullYear()} Quick Progressive Career Point (QPCP Odisha). All rights reserved.
          </div>
          <div class="footer-legal-links" style="display: flex; gap: 0.85rem; font-size: 0.82rem;">
            <a href="javascript:void(0)" onclick="shared.openPrivacyModal('terms')" style="color: var(--text-muted); text-decoration: underline;">Terms of Service</a>
            <span style="color: var(--glass-border);">|</span>
            <a href="javascript:void(0)" onclick="shared.openPrivacyModal('dpdp')" style="color: var(--text-muted); text-decoration: underline;">Privacy Policy (DPDP)</a>
          </div>
        </div>
      </div>
    `;
  }
}

export const shared = new SharedUI();
if (typeof window !== 'undefined') {
  window.shared = shared;
}
