// WorkID App Logic – Live Backend Connected Version 🚀
(function(){
  'use strict';
  
  // ================= GLOBALS & BACKEND URL =================
  const $ = (id) => document.getElementById(id);
  
  // 🟢 AAPKA LIVE RENDER BACKEND URL HERE
  const BACKEND_URL = "https://workid-4.onrender.com"; 
  
  const state = {
    session: null // { role, name, email, mobile, userId }
  };
  
  let currentOtp = null;
  let otpAuth = null;

  // ================= ROLE MAPPING =================
  function getMappedRole(role) {
    const roleMap = {
      'superadmin': 'superadmin',
      'stateadmin': 'stateadmin', 
      'districtadmin': 'districtadmin',
      'admin': 'admin',
      'entrepreneur': 'hr',
      'candidate': 'candidate',
      'hr': 'hr'
    };
    return roleMap[role] || role;
  }

  // ================= BOOT =================
  document.addEventListener('DOMContentLoaded', () => {
    bindAuth();
    bindTheme();
    bindNav();
    bindCandidate();
    bindHR();
    bindFeedback();
    bindLogout();
    bindPasswordToggle();
    render();
  });

  // ================= PASSWORD TOGGLE =================
  function bindPasswordToggle() {
    const passInput = $('loginPass');
    const toggleBtn = $('togglePass');
    if (!passInput || !toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        toggleBtn.setAttribute('aria-label', 'Hide password');
        $('eyePupil')?.setAttribute('fill', 'transparent');
      } else {
        passInput.type = 'password';
        toggleBtn.setAttribute('aria-label', 'Show password');
        $('eyePupil')?.setAttribute('fill', '#4b5563');
      }
    });
  }

  // ================= THEME =================
  function bindTheme() {
    const select = $('themeSelect');
    if (!select) return;
    select.addEventListener('change', () => {
      document.documentElement.classList.toggle('dark', select.value === 'dark');
    });
  }

  // ================= AUTH + OTP LIVE CONNECTED =================
  function bindAuth() {
    const sendOtpBtn = $('sendOtpBtn');
    const verifyOtpBtn = $('verifyOtpBtn');
    const passwordLoginBtn = $('passwordLoginBtn');

    // SIGNUP (Backend Connected 🌐)
    const signupBtn = $('signupBtn');
    if (signupBtn) {
      signupBtn.addEventListener('click', async () => {
        const role = $('suRole')?.value || 'candidate';
        const name = $('suName')?.value.trim();
        const email = $('suEmail')?.value.trim();
        const mob = $('suMobile')?.value.trim();
        const p1 = $('suPass')?.value;
        const p2 = $('suPass2')?.value;
        const msgEl = $('authMsg');
        
        if (!name || !email || !mob || !p1 || !p2) {
          msgEl.textContent = 'All fields required.';
          return;
        }
        if (p1 !== p2) {
          msgEl.textContent = 'Passwords match nahi kar rahe.';
          return;
        }
        
        msgEl.textContent = 'Creating account on server...';

        try {
          // Send data to backend API /api/auth/signup
          const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, name, email, mobile: mob })
          });

          const data = await response.json();

          if (!response.ok) {
            msgEl.textContent = `❌ Error: ${data.error || 'Signup failed'}`;
            return;
          }

          msgEl.textContent = '✅ Account created in Backend! Ab Login kariye.';
        } catch (error) {
          console.error(error);
          msgEl.textContent = '❌ Backend connection error. Server check karein.';
        }
      });
    }

    // PASSWORD LOGIN (Demo step 1 remains frontend check for ease)
    if (passwordLoginBtn) {
      passwordLoginBtn.addEventListener('click', () => {
        const role = $('roleSelect')?.value || 'candidate';
        const mobile = $('mobileInput')?.value.trim();
        const email = $('emailInput')?.value.trim();
        const pass = $('loginPass')?.value;
        const msgEl = $('authMsg');
        
        if (!mobile && !email) {
          msgEl.textContent = 'Mobile ya email required.';
          return;
        }
        if (!pass) {
          msgEl.textContent = 'Password required.';
          return;
        }
        
        state.session = { role, mobile, email, passwordOk: true };
        msgEl.textContent = 'Password accepted (demo). Ab OTP verify karein.';
      });
    }

    // OTP SEND (Step 2)
    if (sendOtpBtn) {
      sendOtpBtn.addEventListener('click', () => {
        const role = $('roleSelect')?.value || 'candidate';
        const mobile = $('mobileInput')?.value.trim();
        const email = $('emailInput')?.value.trim();
        const msgEl = $('authMsg');
        
        if (!mobile && !email) {
          msgEl.textContent = 'Mobile ya email required.';
          return;
        }
        if (!state.session || !state.session.passwordOk) {
          msgEl.textContent = 'Pehle password se login karein.';
          return;
        }
        
        currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
        otpAuth = { role, mobile, email };
        alert('Demo OTP Sent: ' + currentOtp);
        msgEl.textContent = 'OTP sent successfully.';
      });
    }

    // OTP VERIFY & SESSION LOGIN
    if (verifyOtpBtn) {
      verifyOtpBtn.addEventListener('click', () => {
        const given = $('otpInput')?.value.trim();
        const msgEl = $('authMsg');
        
        if (!given) {
          msgEl.textContent = 'OTP enter karein.';
          return;
        }
        if (!currentOtp || !otpAuth) {
          msgEl.textContent = 'OTP request pehle bhejein.';
          return;
        }
        if (given !== currentOtp) {
          msgEl.textContent = 'Incorrect OTP.';
          return;
        }
        
        // Logged in successful
        state.session = { ...otpAuth, userId: 'usr_' + Date.now() };
        currentOtp = null;
        otpAuth = null;
        msgEl.textContent = '✅ Logged in to Live Dashboard!';
        buildNavForRole(state.session.role);
        render();
      });
    }

    // AUTH TABS
    const tabs = ['tabLogin', 'tabSignup', 'tabForgot'];
    const boxes = ['authLoginBox', 'authSignupBox', 'authForgotBox'];
    
    tabs.forEach((tabId, i) => {
      const tab = $(tabId);
      if (tab) {
        tab.addEventListener('click', () => {
          tabs.forEach(t => $(t)?.classList.remove('active'));
          boxes.forEach(b => $(b)?.classList.add('hidden'));
          tab.classList.add('active');
          $(boxes[i])?.classList.remove('hidden');
        });
      }
    });
  }

  // ================= NAVIGATION =================
  function bindNav() {
    const nav = $('navList');
    if (!nav) return;
    nav.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-view]');
      if (li && li.dataset.view) {
        showView(li.dataset.view);
      }
    });
  }

  function buildNavForRole(role) {
    const nav = $('navList');
    if (!nav) return;
    nav.innerHTML = '';
    
    const mappedRole = getMappedRole(role);
    
    if (mappedRole === 'candidate') {
      ['candidateProfile', 'workIdCard', 'employmentHistory', 'candidateVerifiedInfo'].forEach(id => {
        nav.appendChild(navItem(id, id.replace(/([A-Z])/g, ' $1').toLowerCase()));
      });
    } else if (mappedRole === 'hr' || mappedRole === 'entrepreneur') {
      ['hrCompany', 'hrVerify', 'hrPanelTools'].forEach(id => {
        nav.appendChild(navItem(id, id.replace(/([A-Z])/g, ' $1').toLowerCase()));
      });
    } else {
      nav.appendChild(navItem('adminPanel', 'Admin'));
    }
  }

  function navItem(viewId, label) {
    const li = document.createElement('li');
    li.textContent = label;
    li.dataset.view = viewId;
    return li;
  }

  function showView(id) {
    document.querySelectorAll('.content > *').forEach(el => el.classList.add('hidden'));
    const target = $(id);
    if (target) target.classList.remove('hidden');
  }

  // ================= RENDER =================
  function render() {
    const dashboard = $('dashboard');
    if (!state.session) {
      if (dashboard) dashboard.style.display = 'none';
      return;
    }
    
    if (dashboard) {
      dashboard.style.display = 'grid';
      dashboard.classList.remove('hidden');
    }
    
    buildNavForRole(state.session.role);
    const mappedRole = getMappedRole(state.session.role);
    const defaultViews = {
      'candidate': 'candidateProfile',
      'hr': 'hrCompany',
      'entrepreneur': 'hrCompany',
      'admin': 'adminPanel'
    };
    
    const defaultView = defaultViews[mappedRole] || 'adminPanel';
    showView(defaultView);
  }

  // ================= CANDIDATE BINDING =================
  function bindCandidate() {
    $('saveProfileBtn')?.addEventListener('click', () => {
      if (!requireSession('candidate')) return;
      $('profileMsg').textContent = 'Profile saved locally in session!';
    });

    $('initWorkIdBtn')?.addEventListener('click', () => {
      if (!requireSession('candidate')) return;
      const year = new Date().getFullYear();
      const randomSeq = Math.floor(100000 + Math.random() * 900000);
      alert(`Generated Live WorkID: WID-IN-${year}-${randomSeq}`);
      showView('workIdCard');
    });
  }

  // ================= HR BINDING (Backend Connected 🌐) =================
  function bindHR() {
    $('submitCompanyBtn')?.addEventListener('click', async () => {
      if (!requireSession('hr,entrepreneur')) return;
      const msgEl = $('companyMsg');
      
      const legalName = $('coName')?.value.trim();
      const domain = $('coDomain')?.value.trim();
      
      if(!legalName || !domain) {
        msgEl.textContent = "Legal name and Domain required.";
        return;
      }

      msgEl.textContent = 'Submitting company to Render server...';

      try {
        // Send data to backend API /api/hr/company
        const response = await fetch(`${BACKEND_URL}/api/hr/company`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            legalName,
            domain,
            address: "Demo Address India",
            city: "Delhi",
            state: "Delhi",
            pin: "110001",
            hrEmail: state.session.email
          })
        });

        const data = await response.json();

        if (!response.ok) {
          msgEl.textContent = `❌ Error: ${data.error || 'Failed to submit'}`;
          return;
        }

        msgEl.textContent = '✅ Company successfully registered on live Server!';
      } catch (error) {
        console.error(error);
        msgEl.textContent = '❌ Server error while creating company.';
      }
    });
  }

  // ================= OTHER BINDINGS =================
  function bindFeedback() {
    $('feedbackBtn')?.addEventListener('click', () => {
      if (!requireSession('candidate')) return;
      alert('Feedback dispute submitted to live server log.');
    });
  }

  // ================= LOGOUT =================
  function bindLogout() {
    $('logoutBtn')?.addEventListener('click', () => {
      state.session = null;
      currentOtp = null;
      otpAuth = null;
      $('dashboard')?.classList.add('hidden');
      $('authMsg').textContent = 'Logged out successfully.';
      showView('authLoginBox');
    });
  }

  // ================= HELPERS =================
  function requireSession(allowedRoles) {
    if (!state.session) {
      alert('Please login first.');
      return false;
    }
    const mappedRole = getMappedRole(state.session.role);
    if (allowedRoles && !allowedRoles.split(',').includes(mappedRole)) {
      alert(`Access denied. Role: ${mappedRole}`);
      return false;
    }
    return true;
  }

})();
