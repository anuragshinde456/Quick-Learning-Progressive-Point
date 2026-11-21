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
        <div class="container">
          &copy; ${new Date().getFullYear()} Quick Progressive Career Point (QPCP Odisha). All rights reserved.
        </div>
      </div>
    `;
  }
}

export const shared = new SharedUI();
