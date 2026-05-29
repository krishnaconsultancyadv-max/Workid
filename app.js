// WorkID Demo App Logic – localStorage POC (FULLY FIXED)
(function(){
  'use strict';
  
  // ================= GLOBALS =================
  const $ = (id) => document.getElementById(id);
  
  const state = {
    session: null, // {role, userId, email, mobile}
    seqByYear: {}
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
    setTimeout(syncAdminData, 100);
    bindAuth();
    bindTheme();
    bindNav();
    bindCandidate();
    bindHR();
    bindAdmin();
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

  // ================= AUTH + OTP + TABS + FORGOT PASSWORD =================
  function bindAuth() {
    const sendOtpBtn = $('sendOtpBtn');
    const verifyOtpBtn = $('verifyOtpBtn');
    const passwordLoginBtn = $('passwordLoginBtn');
    const forgotBtn = $('forgotBtn');
    const resetPasswordBtn = $('resetPasswordBtn');

    // PASSWORD LOGIN (step 1)
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
        
        const auth = { role, mobile, email };
        const user = getUserByEmailOrMobile(auth);
        
        if (!user) {
          msgEl.textContent = 'User not found. Pehle sign-up karein.';
          return;
        }
        
        state.session = { ...auth, userId: user.id, passwordOk: true };
        msgEl.textContent = 'Password accepted (demo). Ab OTP verify karein.';
      });
    }

    // OTP SEND (step 2)
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
        
        currentOtp = generateOtp();
        otpAuth = { role, mobile, email };
        alert('Demo OTP: ' + currentOtp);
        msgEl.textContent = 'OTP sent.';
      });
    }

    // OTP VERIFY
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
        
        const auth = otpAuth;
        const user = getUserByEmailOrMobile(auth);
        
        if (!user) {
          msgEl.textContent = 'User not found. Pehle sign-up karein.';
          return;
        }
        
        state.session = { ...auth, userId: user.id };
        currentOtp = null;
        otpAuth = null;
        msgEl.textContent = '✅ Logged in!';
        buildNavForRole(auth.role);
        render();
      });
    }

    // FORGOT PASSWORD - Send OTP
    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        const email = $('fpEmail')?.value.trim();
        const mobile = $('fpMobile')?.value.trim();
        const msgEl = $('authMsg');
        
        if (!email && !mobile) {
          msgEl.textContent = 'Email ya mobile enter kariye.';
          return;
        }
        
        const resetOtp = generateOtp();
        sessionStorage.setItem('resetOtp', resetOtp);
        sessionStorage.setItem('resetEmailOrMobile', email || mobile);
        
        alert(`Demo Reset OTP: ${resetOtp}
(${email || mobile} pe bheja)`);
        msgEl.textContent = 'OTP bhej diya. Niche enter kariye.';
        
        const resetSection = $('resetOtpSection');
        if (resetSection) resetSection.style.display = 'flex';
      });
    }

    // PASSWORD RESET COMPLETE
    if (resetPasswordBtn) {
      resetPasswordBtn.addEventListener('click', () => {
        const otp = $('resetOtpInput')?.value.trim();
        const newPass = $('newPasswordInput')?.value;
        const confirmPass = $('newPasswordConfirm')?.value;
        const msgEl = $('resetMsg') || $('authMsg');
        
        if (!otp || !newPass || !confirmPass) {
          msgEl.textContent = 'OTP aur new password required.';
          return;
        }
        if (newPass.length < 6) {
          msgEl.textContent = 'Password minimum 6 characters.';
          return;
        }
        if (newPass !== confirmPass) {
          msgEl.textContent = 'Passwords match nahi kar rahe.';
          return;
        }
        
        const storedOtp = sessionStorage.getItem('resetOtp');
        if (!storedOtp || otp !== storedOtp) {
          msgEl.textContent = '❌ Invalid OTP.';
          return;
        }
        
        const resetEmailOrMobile = sessionStorage.getItem('resetEmailOrMobile');
        const users = getStore('users') || [];
        const user = users.find(u => 
          u.email === resetEmailOrMobile || u.mobile === resetEmailOrMobile
        );
        
        if (!user) {
          msgEl.textContent = '❌ User not found.';
          return;
        }
        
        user.password = newPass;
        setStore('users', users);
        
        sessionStorage.removeItem('resetOtp');
        sessionStorage.removeItem('resetEmailOrMobile');
        
        msgEl.textContent = '✅ Password reset successful!';
        $('authMsg').textContent = 'Login tab se new password use kariye.';
        
        setTimeout(() => {
          $('resetOtpSection').style.display = 'none';
        }, 2000);
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

    // SIGNUP
    const signupBtn = $('signupBtn');
    if (signupBtn) {
      signupBtn.addEventListener('click', () => {
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
        
        const auth = { role, email, mobile: mob };
        const existing = getUserByEmailOrMobile(auth);
        
        if (existing) {
          msgEl.textContent = 'Email/mobile already registered.';
          return;
        }
        
        createUser(auth);
        msgEl.textContent = '✅ Account created! Ab login kariye.';
      });
    }
  }

  function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ================= STORAGE =================
  function getStore(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  function setStore(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function getUserByEmailOrMobile(auth) {
    const users = getStore('users');
    return users.find(u => 
      (auth.email && u.email === auth.email) || 
      (auth.mobile && u.mobile === auth.mobile)
    ) || null;
  }

  function createUser(auth) {
    const users = getStore('users');
    const user = {
      id: 'usr_' + Date.now(),
      role: auth.role,
      email: auth.email,
      mobile: auth.mobile,
      password: 'demo123', // Default for demo
      profile: {},
      workId: null,
      qrNonce: null
    };
    users.push(user);
    setStore('users', users);
    return user;
  }

  function saveUser(user) {
    const users = getStore('users');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    setStore('users', users);
  }

  function currentUser() {
    if (!state.session) return null;
    const users = getStore('users');
    return users.find(u => u.id === state.session.userId) || null;
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

  // ================= RENDER (FIXED - DASHBOARD SHOW!) =================
function render() {
  const dashboard = $('dashboard');
  
  if (!state.session) {
    // Hide dashboard completely when not logged in
    if (dashboard) {
      dashboard.style.display = 'none';
    }
    return;
  }
  
  // ✅ SHOW DASHBOARD when logged in
  if (dashboard) {
    dashboard.style.display = 'grid';  // grid-2 layout
    dashboard.classList.remove('hidden');
  }
  
  // ✅ Build sidebar navigation
  buildNavForRole(state.session.role);
  
  // ✅ Show default panel based on role
  const mappedRole = getMappedRole(state.session.role);
  const defaultViews = {
    'candidate': 'candidateProfile',
    'hr': 'hrCompany',
    'entrepreneur': 'hrCompany',
    'admin': 'adminPanel'
  };
  
  const defaultView = defaultViews[mappedRole] || 'adminPanel';
  showView(defaultView);
  
  console.log('✅ Rendered for role:', mappedRole, 'Panel:', defaultView);
}

  // ================= CANDIDATE BINDING =================
  function bindCandidate() {
    // Profile save
    $('saveProfileBtn')?.addEventListener('click', () => {
      if (!requireSession('candidate')) return;
      const user = currentUser();
      if (!user) return;
      
      user.profile = {
        name: $('cName')?.value.trim(),
        father: $('cFather')?.value.trim(),
        dob: $('cDob')?.value,
        country: $('cCountry')?.value.trim() || 'IN',
        address: $('cAddr')?.value.trim(),
        phone: $('cPhone')?.value.trim(),
        email: $('cEmail')?.value.trim(),
        qualification: $('cQual')?.value.trim()
      };
      saveUser(user);
      $('profileMsg').textContent = 'Profile saved!';
    });

    // WorkID generate
    $('initWorkIdBtn')?.addEventListener('click', () => {
      if (!requireSession('candidate')) return;
      const user = currentUser();
      if (!user.profile?.country) {
        $('profileMsg').textContent = 'Complete profile first.';
        return;
      }
      user.workId = generateWorkId(user.profile.country);
      user.qrNonce = Math.random().toString(36).slice(2, 10);
      saveUser(user);
      showView('workIdCard');
      $('profileMsg').textContent = 'WorkID generated!';
    });

    // Add employment claim
    $('addClaimBtn')?.addEventListener('click', () => {
      if (!requireSession('candidate')) return;
      const claim = {
        id: 'clm_' + Date.now(),
        candidateId: state.session.userId,
        companyId: $('eCompany')?.value.trim(),
        jobTitle: $('eTitle')?.value.trim(),
        startDate: $('eStart')?.value,
        endDate: $('eEnd')?.value,
        status: 'pending'
      };
      const claims = getStore('claims') || [];
      claims.push(claim);
      setStore('claims', claims);
      $('claimsList').innerHTML = '<div class="item">Claim added!</div>';
    });
  }

  // ================= HR BINDING =================
  function bindHR() {
    $('submitCompanyBtn')?.addEventListener('click', () => {
      if (!requireSession('hr,entrepreneur')) return;
      const company = {
        id: 'cmp_' + Date.now(),
        legalName: $('coName')?.value.trim(),
        domain: $('coDomain')?.value.trim(),
        status: 'pending'
      };
      const companies = getStore('companies') || [];
      companies.push(company);
      setStore('companies', companies);
      $('companyMsg').textContent = 'Company submitted for approval.';
    });
  }

  // ================= ADMIN BINDING =================
  function bindAdmin() {
    $('adminPanel')?.querySelectorAll('[data-admin-tab]')?.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.adminTab;
        $('adminContent').innerHTML = `<h3>${target}</h3><p>Admin ${target} data...</p>`;
      });
    });
  }

  // ================= OTHER BINDINGS =================
  function bindFeedback() {
    $('feedbackBtn')?.addEventListener('click', () => {
      if (!requireSession('candidate')) return;
      alert('Feedback dispute submitted (demo)');
    });
  }

  function bindLogout() {
    $('logoutBtn')?.addEventListener('click', () => {
      state.session = null;
      currentOtp = null;
      otpAuth = null;
      $('dashboard')?.classList.add('hidden');
      $('authMsg').textContent = 'Logged out.';
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

  function generateWorkId(country) {
    const year = new Date().getFullYear();
    state.seqByYear[year] = (state.seqByYear[year] || 0) + 1;
    const seq = String(state.seqByYear[year]).padStart(6, '0');
    return `WID-${country}-${year}-${seq}`;
  }

  function syncAdminData() {
    try {
      if (window.db && typeof window.db === 'object') {
        localStorage.setItem('adminDb', JSON.stringify(window.db));
      }
    } catch (e) {
      console.warn('Admin sync failed:', e);
    }
  }

  // Export globals
  window.getMappedRole = getMappedRole;
  window.currentUser = () => currentUser();
})();