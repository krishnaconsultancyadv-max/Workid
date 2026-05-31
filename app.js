// WorkID Demo App Logic – localStorage POC (FULLY SECURED AUTH + ROLE + EMAIL DUP FIX)
(function(){
  'use strict';
  
  // ==========================================
  // GLOBALS & STATE INITIALIZATION LAYER
  // ==========================================
  const $ = (id) => document.getElementById(id);
  
  const state = {
    session: null, // Holds session schema: {role, userId, email, mobile}
    seqByYear: {}
  };
  
  let currentMobileOtp = null;
  let currentEmailOtp = null;
  let otpAuth = null;

  // Global Geographic Constraints Engine Mapping
  const AVAILABLE_LOCATIONS = ["Sagar", "Bhopal", "Indore", "Jabalpur", "Delhi", "Mumbai", "Remote"];

  // ==========================================
  // SYSTEM ARCHITECTURE ROLE MAPPING ENGINE
  // ==========================================
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

  // ==========================================
  // APPLICATION INITIAL BOOT SYSTEM (DOM LOAD)
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    // Timeout buffer layer to secure data integrity
    setTimeout(syncAdminData, 100);
    
    // Core Handlers Binding Iteration
    bindAuth();
    bindTheme();
    bindNav();
    bindCandidate();
    bindHR();
    bindAdmin();
    bindFeedback();
    bindLogout();
    bindPasswordToggle();
    
    // 🚀 Initialization of Entrepreneur dynamic fields visibility controller
    setupEntrepreneurToggle(); 
    
    // Initial Render Layer Call
    render();
    setupOtpUiFields(); 
  });

  // ==========================================
  // DUAL OTP VERIFICATION DYNAMIC UI BUILDER
  // ==========================================
  function setupOtpUiFields() {
    const otpInput = $('otpInput');
    if (otpInput && !$('emailOtpInput')) {
      otpInput.placeholder = "Enter Mobile OTP";
      
      const emailOtpBox = document.createElement('input');
      emailOtpBox.id = 'emailOtpInput';
      emailOtpBox.type = 'text';
      emailOtpBox.className = 'input mt-2';
      emailOtpBox.placeholder = "Enter Email OTP";
      emailOtpBox.style.marginTop = "8px";
      
      otpInput.parentNode.insertBefore(emailOtpBox, otpInput.nextSibling);
    }
  }

  // ==========================================
  // SECURE CRYPTO CRYPT-PASS INTERACTION TOGGLE
  // ==========================================
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

  // ==========================================
  // CORE THEME ENGINE CONFIGURATION (DARK/LIGHT)
  // ==========================================
  function bindTheme() {
    const select = $('themeSelect');
    if (!select) return;
    select.addEventListener('change', () => {
      document.documentElement.classList.toggle('dark', select.value === 'dark');
    });
  }

  // ==========================================
  // SECURITY & IDENTITY AUTHENTICATION WORKFLOWS
  // ==========================================
  function bindAuth() {
    const sendOtpBtn = $('sendOtpBtn');
    const verifyOtpBtn = $('verifyOtpBtn');
    const passwordLoginBtn = $('passwordLoginBtn');
    const forgotBtn = $('forgotBtn');
    const resetPasswordBtn = $('resetPasswordBtn');

    // 1. Password Verification Framework (Pre-OTP Verification Phase)
    if (passwordLoginBtn) {
      passwordLoginBtn.addEventListener('click', () => {
        const role = $('roleSelect')?.value || 'candidate';
        const mobile = $('mobileInput')?.value.trim();
        const email = $('emailInput')?.value.trim();
        const pass = $('loginPass')?.value;
        const msgEl = $('authMsg');
        
        if (!mobile || !email) {
          msgEl.textContent = '❌ Mobile aur Email dono daalna mandatory hai.';
          return;
        }
        if (!pass) {
          msgEl.textContent = 'Password required.';
          return;
        }
        
        const auth = { role, mobile, email };
        const user = getUserByEmailMobileAndRole(auth); 
        
        if (!user) {
          msgEl.textContent = `❌ Account nahi mila! Is Email, Mobile aur Selected Role (${role}) ka koi combination registered nahi hai.`;
          return;
        }
        
        if (user.password !== pass) {
          msgEl.textContent = '❌ Invalid credentials password.';
          return;
        }
        
        state.session = { ...auth, userId: user.id, passwordOk: true };
        msgEl.textContent = 'Password accepted. Ab "Send OTP" par click karein.';
      });
    }

    // 2. OTP Dispatch Trigger Management Module
    if (sendOtpBtn) {
      sendOtpBtn.addEventListener('click', () => {
        const role = $('roleSelect')?.value || 'candidate';
        const mobile = $('mobileInput')?.value.trim();
        const email = $('emailInput')?.value.trim();
        const msgEl = $('authMsg');
        
        if (!mobile || !email) {
          msgEl.textContent = 'Mobile aur Email dono required hain.';
          return;
        }
        if (!state.session || !state.session.passwordOk) {
          msgEl.textContent = 'Pehle password se login verify karein.';
          return;
        }
        
        currentMobileOtp = generateOtp();
        currentEmailOtp = generateOtp();
        otpAuth = { role, mobile, email };
        
        alert(`📱 Mobile OTP Sent to [${mobile}]: ${currentMobileOtp}\n📧 Email OTP Sent to [${email}]: ${currentEmailOtp}`);
        msgEl.textContent = '✅ OTPs sent successfully to your Mobile and Email.';
      });
    }

    // 3. Double Verification Verification Gate Engine
    if (verifyOtpBtn) {
      verifyOtpBtn.addEventListener('click', () => {
        const givenMobileOtp = $('otpInput')?.value.trim();
        const givenEmailOtp = $('emailOtpInput')?.value.trim();
        const msgEl = $('authMsg');
        
        if (!givenMobileOtp || !givenEmailOtp) {
          msgEl.textContent = '❌ Krpya Mobile aur Email dono ka OTP enter karein.';
          return;
        }
        if (!currentMobileOtp || !currentEmailOtp || !otpAuth) {
          msgEl.textContent = 'OTP request pehle generate karein.';
          return;
        }
        
        if (givenMobileOtp !== currentMobileOtp) {
          msgEl.textContent = '❌ Invalid Mobile OTP.';
          return;
        }
        if (givenEmailOtp !== currentEmailOtp) {
          msgEl.textContent = '❌ Invalid Email OTP.';
          return;
        }
        
        const auth = otpAuth;
        const user = getUserByEmailMobileAndRole(auth); 
        
        if (!user) {
          msgEl.textContent = 'Session mismatch. Sahi details se login karein.';
          return;
        }
        
        state.session = { ...auth, userId: user.id };
        currentMobileOtp = null;
        currentEmailOtp = null;
        otpAuth = null;
        msgEl.textContent = '✅ Dual OTP Verified! Logged in successfully.';
        buildNavForRole(auth.role);
        render();
      });
    }

    // 4. Credential Recovery Strategy Pipeline
    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        const email = $('fpEmail')?.value.trim();
        const mobile = $('fpMobile')?.value.trim();
        const role = $('roleSelect')?.value || 'candidate'; 
        const msgEl = $('authMsg');
        
        if (!email || !mobile) {
          msgEl.textContent = 'Reset karne ke liye Email aur Mobile dono daalein.';
          return;
        }
        
        const users = getStore('users');
        const user = users.find(u => u.email === email && u.mobile === mobile && u.role === role);
        
        if (!user) {
          msgEl.textContent = `❌ Is Role (${role}) ke liye is configuration ka koi user nahi mila.`;
          return;
        }
        
        const resetOtp = generateOtp();
        sessionStorage.setItem('resetOtp', resetOtp);
        sessionStorage.setItem('resetEmail', email);
        sessionStorage.setItem('resetMobile', mobile);
        sessionStorage.setItem('resetRole', role);
        alert(`Demo Reset OTP: ${resetOtp}`);
        msgEl.textContent = 'OTP bhej diya.';
        if ($('resetOtpSection')) $('resetOtpSection').style.display = 'flex';
      });
    }

    // 5. Hard Password Reset Overwrite Matrix
    if (resetPasswordBtn) {
      resetPasswordBtn.addEventListener('click', () => {
        const otp = $('resetOtpInput')?.value.trim();
        const newPass = $('newPasswordInput')?.value;
        const confirmPass = $('newPasswordConfirm')?.value;
        const msgEl = $('resetMsg') || $('authMsg');
        
        if (newPass !== confirmPass) {
          msgEl.textContent = 'Passwords match nahi kar rahe.';
          return;
        }
        
        const storedOtp = sessionStorage.getItem('resetOtp');
        if (otp !== storedOtp) {
          msgEl.textContent = '❌ Invalid OTP.';
          return;
        }
        
        const rEmail = sessionStorage.getItem('resetEmail');
        const rMobile = sessionStorage.getItem('resetMobile');
        const rRole = sessionStorage.getItem('resetRole');
        const users = getStore('users') || [];
        const user = users.find(u => u.email === rEmail && u.mobile === rMobile && u.role === rRole);
        
        if (user) {
          user.password = newPass;
          setStore('users', users);
          msgEl.textContent = '✅ Password reset successful!';
        }
      });
    }

    // ==========================================
    // TAB MECHANICS LAYER & SECURITY VIEW ENGINE
    // ==========================================
    const tabs = ['tabLogin', 'tabSignup', 'tabForgot'];
    const boxes = ['authLoginBox', 'authSignupBox', 'authForgotBox'];
    tabs.forEach((tabId, i) => {
      $(tabId)?.addEventListener('click', () => {
        tabs.forEach(t => $(t)?.classList.remove('active'));
        boxes.forEach(b => $(b)?.classList.add('hidden'));
        $(tabId).classList.add('active');
        $(boxes[i])?.classList.remove('hidden');

        // Dynamic Extra Field Protection Switch Inside Tab Interface System
        if (tabId === 'tabSignup') {
          const roleSelect = $('suRole');
          if (roleSelect && roleSelect.value === 'entrepreneur') {
            $('entSection')?.classList.remove('hidden');
            $('entHelp')?.classList.remove('hidden');
          } else {
            $('entSection')?.classList.add('hidden');
            $('entHelp')?.classList.add('hidden');
          }
        } else {
          // Force and assert hidden states for specialized dynamic containers on non-signup views
          $('entSection')?.classList.add('hidden');
          $('entHelp')?.classList.add('hidden');
        }
      });
    });

    // ==========================================
    // SIGNUP HANDLER WITH DUPLICATION SYSTEM FIREWALL
    // ==========================================
    $('signupBtn')?.addEventListener('click', () => {
      const role = $('suRole')?.value || 'candidate';
      const name = $('suName')?.value.trim();
      const email = $('suEmail')?.value.trim();
      const mob = $('suMobile')?.value.trim();
      const p1 = $('suPass')?.value;
      const msgEl = $('authMsg');
      
      if (!name || !email || !mob || !p1) {
        msgEl.textContent = 'All fields required.';
        return;
      }
      
      const users = getStore('users');
      
      // Verification Firewall: System-Wide Email Isolation Check
      const emailExists = users.find(u => u.email === email);
      if (emailExists) {
        msgEl.textContent = `❌ Yeh Email ID (${email}) pehle से सिस्टम में रजिस्टर्ड hai!`;
        return;
      }

      // Verification Firewall: System-Wide Mobile Isolation Check
      const mobileExists = users.find(u => u.mobile === mob);
      if (mobileExists) {
        msgEl.textContent = `❌ Yeh Mobile Number (${mob}) pehle से सिस्टम में रजिस्टर्ड hai!`;
        return;
      }
      
      // Creating standard sandbox registration node
      const auth = { role, email, mobile: mob };
      const user = createUser(auth);
      user.profile.name = name;
      user.password = p1; 

      // Deep Extract Layer for specialized multi-dimensional Entrepreneur Profiles
      if (role === 'entrepreneur') {
        user.businessName = $('entBusinessName')?.value.trim();
        user.gst = $('entGst')?.value.trim();
        user.category = $('entBusinessCategory')?.value;
        user.size = $('entBusinessSize')?.value;
        user.regType = $('entRegType')?.value;
        user.regNo = $('entRegNumber')?.value.trim();
        user.address = $('entAddress')?.value.trim();
        user.city = $('entCity')?.value.trim();
        user.state = $('entState')?.value.trim();
        user.pin = $('entPin')?.value.trim();
        user.domainEmail = $('entDomainEmail')?.value.trim();
        user.turnover = $('entTurnover')?.value;
      }

      saveUser(user);
      msgEl.textContent = '✅ Account created successfully! Ab Login kariye.';
    });
  }

  // ==========================================
  // CORE STORAGE ABSTRACTED PERSISTENCE ENGINES
  // ==========================================
  function getStore(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
  function setStore(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function generateOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }
  
  function getUserByEmailMobileAndRole(auth) {
    const users = getStore('users');
    return users.find(u => u.email === auth.email && u.mobile === auth.mobile && u.role === auth.role) || null;
  }

  // Seeding System Core Superuser Credentials Nodes
  function syncAdminData() {
    let users = getStore('users');
    if (!users.some(u => u.role === 'superadmin')) {
      users.push({
        id: 'usr_super',
        role: 'superadmin',
        email: 'superadmin@workid.in',
        mobile: '9999999999',
        password: 'Password@123',
        profile: { name: 'System Super Admin', status: 'Verified' },
        workId: 'WID-IN-2026-000001'
      });
      setStore('users', users);
    }
  }

  function createUser(auth) {
    const users = getStore('users');
    const user = {
      id: 'usr_' + Date.now(),
      role: auth.role,
      email: auth.email,
      mobile: auth.mobile,
      password: 'demo123', 
      profile: { status: 'Unverified' },
      workId: null
    };
    users.push(user);
    setStore('users', users);
    return user;
  }

  function saveUser(user) {
    const users = getStore('users');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    setStore('users', users);
  }

  function currentUser() {
    if (!state.session) return null;
    const users = getStore('users');
    return users.find(u => u.id === state.session.userId) || null;
  }

  // ==========================================
  // VIEW ROUTING INTERACTION SYSTEM (ROUTER)
  // ==========================================
  function bindNav() {
    $('navList')?.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-view]');
      if (li?.dataset.view) {
        showView(li.dataset.view);
        if (li.dataset.view === 'workIdCard') updateWorkIdCardUI();
        if (li.dataset.view === 'candidateProfile') renderCandidateDashboardLive();
        if (li.dataset.view === 'hrPanelTools') renderHRReqListsLive();
        if (li.dataset.view === 'adminPanel') renderAdminPanelLive();
      }
    });
  }

  function buildNavForRole(role) {
    const nav = $('navList');
    if (!nav) return;
    nav.innerHTML = '';
    const mappedRole = getMappedRole(role);
    
    if (mappedRole === 'candidate') {
      ['candidateProfile', 'workIdCard', 'employmentHistory'].forEach(id => {
        nav.appendChild(navItem(id, id.replace(/([A-Z])/g, ' $1').toLowerCase()));
      });
    } else if (mappedRole === 'hr' || mappedRole === 'entrepreneur') {
      ['hrCompany', 'hrVerify', 'hrPanelTools'].forEach(id => {
        nav.appendChild(navItem(id, id.replace(/([A-Z])/g, ' $1').toLowerCase()));
      });
    } else {
      nav.appendChild(navItem('adminPanel', 'administrative terminal core'));
    }
  }

  function navItem(viewId, label) {
    const li = document.createElement('li');
    li.textContent = label; li.dataset.view = viewId; return li;
  }

  function showView(id) {
    document.querySelectorAll('.content > *').forEach(el => el.classList.add('hidden'));
    $(id)?.classList.remove('hidden');
    
    document.querySelectorAll('#navList li').forEach(l => l.classList.remove('active'));
    const activeLi = document.querySelector(`#navList li[data-view="${id}"]`);
    if (activeLi) activeLi.classList.add('active');
  }

  // ==========================================
  // REALTIME SYNCHRONIZED INTERFACE RENDERERS
  // ==========================================
  function updateWorkIdCardUI() {
    const user = currentUser();
    if (!user || !user.workId) return;
    if ($('widName')) $('widName').textContent = user.profile?.name || 'Candidate Name';
    if ($('widNumber')) $('widNumber').textContent = user.workId;
    
    const statusEl = $('widStatus');
    if (statusEl) {
      const currentStatus = user.profile?.status || 'Unverified';
      statusEl.textContent = currentStatus;
      statusEl.style.background = currentStatus === 'Verified' ? '#10b981' : '#6b7280';
      statusEl.style.color = '#fff';
    }
    if ($('qrBox')) $('qrBox').innerHTML = `<div style="padding:10px; background:#fff; color:#000; text-align:center; font-size:10px; font-weight:bold;">QR CODE<br>${user.workId}</div>`;
  }

  function renderCandidateDashboardLive() {
    const user = currentUser();
    if (!user) return;

    let liveContainer = $('candidateLiveSection');
    if (!liveContainer) {
      liveContainer = document.createElement('div');
      liveContainer.id = 'candidateLiveSection';
      liveContainer.style.marginTop = '24px';
      $('candidateProfile').appendChild(liveContainer);
    }

    const jobs = getStore('posted_jobs');
    const apps = getStore('job_applications').filter(a => a.candidateId === user.id);
    const history = getStore('employment_history').filter(h => h.workId === user.workId);

    const selectedLoc = sessionStorage.getItem('selectedJobLocation') || 'All';

    let filterHtml = `
      <div style="margin-top:20px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px; border:1px solid #4b5563;">
        <label for="jobLocFilter" style="font-weight:bold; display:block; margin-bottom:8px; color:#34d399;">📍 View Jobs by Location:</label>
        <select id="jobLocFilter" class="input" style="max-width:100%; padding:8px; background:#1f2937; color:#fff; border:1px solid #4b5563; border-radius:6px;" onchange="window.changeJobLocationFilter(this.value)">
          <option value="All" ${selectedLoc === 'All' ? 'selected' : ''}>🌍 All Locations</option>
          ${AVAILABLE_LOCATIONS.map(loc => `<option value="${loc}" ${selectedLoc === loc ? 'selected' : ''}>📍 ${loc}</option>`).join('')}
        </select>
      </div>
      <br/>
    `;

    const filteredJobs = selectedLoc === 'All' ? jobs : jobs.filter(j => j.location === selectedLoc);

    let jobsHtml = `<h4>💼 Available Job Postings (${filteredJobs.length})</h4>`;
    if (filteredJobs.length === 0) {
      jobsHtml += `<p class="muted">Is location (${selectedLoc}) ke liye koi job available nahi hai.</p>`;
    } else {
      filteredJobs.forEach(j => {
        const hasApplied = apps.find(a => a.jobId === j.id);
        jobsHtml += `
          <div class="hr-job-post" style="margin-bottom:12px; padding:12px; border:1px solid #374151; border-radius:8px; background:rgba(255,255,255,0.02)">
            <strong>${j.title}</strong> - ${j.company} <span style="background:#1e3a8a; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold; margin-left:8px;">📍 ${j.location || 'Remote'}</span><br/>
            <small>Salary: ${j.salary} | Experience Req: ${j.exp}</small><br/>
            Status: <span style="color:#34d399; font-weight:bold;">${hasApplied ? (hasApplied.status || 'Applied') : 'Not Applied'}</span><br/>
            ${hasApplied ? '' : `<button class="btn small" style="margin-top:8px;" onclick="window.applyForJob('${j.id}')">Apply Now</button>`}
          </div>`;
      });
    }

    let historyHtml = `<h4 style="margin-top:20px;">📜 Active Company / Employment & Exit History</h4>`;
    if (history.length === 0) historyHtml += `<p class="muted">No active joining or past employment record found.</p>`;
    else {
      history.forEach(h => {
        historyHtml += `
          <div class="readonly-box" style="margin-bottom:8px; border-left:4px solid ${h.type==='Exit'?'#ef4444':'#10b981'}">
            <strong>Company/Dept:</strong> ${h.department || 'General'} | <strong>Position:</strong> ${h.position}<br/>
            <strong>Date:</strong> ${h.date} | <strong>Record Type:</strong> ${h.type}<br/>
            ${h.rating ? `<strong>Rating given by HR:</strong> ${h.rating}<br/>` : ''}
            ${h.feedback ? `<strong>HR Feedback:</strong> ${h.feedback}` : ''}
          </div>`;
      });
    }

    liveContainer.innerHTML = "<hr style='margin:20px 0;'/>" + filterHtml + jobsHtml + historyHtml;
  }

  window.changeJobLocationFilter = function(value) {
    sessionStorage.setItem('selectedJobLocation', value);
    renderCandidateDashboardLive();
  };

  window.applyForJob = function(jobId) {
    const user = currentUser();
    if (!user) return;
    const apps = getStore('job_applications');
    if (apps.find(a => a.jobId === jobId && a.candidateId === user.id)) return;

    const jobs = getStore('posted_jobs');
    const matchingJob = jobs.find(j => j.id === jobId);

    apps.push({
      id: 'app_' + Date.now(),
      jobId: jobId,
      candidateId: user.id,
      workId: user.workId || 'Pending ID',
      name: user.profile?.name || user.email,
      status: 'Applied',
      company: matchingJob ? matchingJob.company : 'Enterprise Platform'
    });
    setStore('job_applications', apps);
    alert('✅ Job Application Submitted Successfully!');
    renderCandidateDashboardLive();
  };

  function renderHRReqListsLive() {
    const reqs = getStore('verification_requests');
    const apps = getStore('job_applications');
    
    const container = $('hrReqList') || document.createElement('div');
    let html = `<h4>📥 Received Job Applications</h4>`;
    if (apps.length === 0) html += `<p class="muted">No applications received yet.</p>`;
    else {
      apps.forEach(a => {
        html += `
          <div class="item" style="padding:10px; border-bottom:1px solid #374151; margin-bottom:8px;">
            <strong>Name:</strong> ${a.name} (${a.workId}) | <strong>Status:</strong> <span style="color:#f59e0b">${a.status}</span><br/>
            <button class="btn small" style="margin-top:5px;" onclick="window.scheduleInterview('${a.id}')">Schedule Interview</button>
          </div>`;
      });
    }
    container.innerHTML = html;

    const incomingBox = $('hrClaims') || document.createElement('div');
    let incHtml = `<h4>📬 Incoming Verification Requests from other HRs</h4>`;
    if (reqs.length === 0) incHtml += `<p class="muted">No verification requests received.</p>`;
    else {
      reqs.forEach(r => {
        incHtml += `
          <div class="hr-job-post" style="padding:10px; margin-bottom:10px; border:1px solid #4b5563;">
            <strong>WorkID:</strong> ${r.workId} | <strong>Requested By:</strong> ${r.fromHrEmail}<br/>
            <strong>Status:</strong> <span style="color:#f59e0b">${r.status}</span> | <strong>Remarks:</strong> ${r.remarks || 'None'}<br/>
            <div style="margin-top:6px; display:flex; gap:6px;">
               <button class="btn small" onclick="window.actionVerification('${r.id}', 'Verified', '')">Mark Verified</button>
               <button class="btn-outline small" onclick="window.actionVerification('${r.id}', 'Not Matched', prompt('Enter problem/reason:'))">Reject / Flag Issue</button>
            </div>
          </div>`;
      });
    }
    incomingBox.innerHTML = incHtml;

    renderChatLive();
  }

  window.scheduleInterview = function(appId) {
    const apps = getStore('job_applications');
    const a = apps.find(x => x.id === appId);
    if (a) {
      const dateTime = prompt("Enter Interview Date and Time:");
      if (dateTime) {
        a.status = `Interview Scheduled at ${dateTime}`;
        setStore('job_applications', apps);
        alert('✅ Interview Scheduled!');
        renderHRReqListsLive();
      }
    }
  };

  window.actionVerification = function(id, status, reason) {
    const reqs = getStore('verification_requests');
    const r = reqs.find(x => x.id === id);
    if (r) {
      r.status = status;
      if (reason) r.remarks = reason;
      setStore('verification_requests', reqs);
      
      if (status === 'Not Matched') {
         const users = getStore('users');
         const u = users.find(x => x.workId === r.workId);
         if (u) { u.profile.status = 'Issue Flagged'; setStore('users', users); }
      }
      alert(`✅ Request updated to: ${status}`);
      renderHRReqListsLive();
    }
  };

  function renderChatLive() {
    const chatBox = $('hrChatMessages');
    if (!chatBox) return;
    const chats = getStore('hr_chats');
    chatBox.innerHTML = chats.map(c => `<div><strong>${c.sender}:</strong> ${c.text} <small class="muted">(${c.time})</small></div>`).join('');
  }

  // ==========================================
  // MASTER ADMINISTRATIVE INTERFACE CORE TERMINAL
  // ==========================================
  function renderAdminPanelLive() {
    const container = $('adminPanel');
    if (!container) return;
    
    const users = getStore('users');
    const loggedAdmin = state.session || { role: 'admin' };
    
    let html = `
      <h3>👑 Administrative Control Core (${loggedAdmin.role.toUpperCase()})</h3>
      <div class="grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:20px;">
        <div class="readonly-box" style="padding:15px; background:rgba(255,255,255,0.05); border-radius:6px;">
          <strong>Total Managed Users:</strong> ${users.length}
        </div>
        <div class="readonly-box" style="padding:15px; background:rgba(255,255,255,0.05); border-radius:6px;">
          <strong>System Status:</strong> Active Node
        </div>
      </div>
      <h4>📋 System Node User Directory</h4>
      <div style="max-height:300px; overflow-y:auto; border:1px solid #374151; padding:10px; border-radius:6px; background:rgba(0,0,0,0.2);">
    `;
    
    users.forEach(u => {
      html += `
        <div style="padding:6px; border-bottom:1px solid #1f2937; font-size:13px;">
          • <strong>${u.profile?.name || 'No Name'}</strong> (${u.email}) - Role: <code style="color:#34d399;">${u.role}</code> | WorkID: <code>${u.workId || 'None'}</code>
        </div>
      `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
  }

  // ==========================================
  // CANDIDATE OPERATIONAL MUTATION METHODS
  // ==========================================
  function bindCandidate() {
    $('saveProfileBtn')?.addEventListener('click', () => {
      if (!requireSession('candidate')) return;
      const user = currentUser();
      if (!user) return;
      
      const oldStatus = user.profile?.status || 'Unverified';
      user.profile = {
        name: $('cName')?.value.trim(),
        father: $('cFather')?.value.trim(),
        dob: $('cDob')?.value,
        country: $('cCountry')?.value.trim() || 'IN',
        address: $('cAddr')?.value.trim(),
        phone: $('cPhone')?.value.trim(),
        email: $('cEmail')?.value.trim(),
        qualification: $('cQual')?.value.trim(),
        status: oldStatus
      };
      saveUser(user);
      if ($('profileMsg')) $('profileMsg').textContent = 'Profile saved successfully!';
      renderCandidateDashboardLive();
    });

    $('initWorkIdBtn')?.addEventListener('click', () => {
      if (!requireSession('candidate')) return;
      const user = currentUser();
      if (!user) return;
      
      const countryCode = user.profile?.country || $('cCountry')?.value.trim() || 'IN';
      user.workId = generateWorkId(countryCode);
      user.profile.status = user.profile.status || 'Unverified';
      
      saveUser(user);
      showView('workIdCard');
      updateWorkIdCardUI();
    });
  }

  // ==========================================
  // ENTERPRISE MANAGEMENT OPERATIONAL SUBSYSTEMS
  // ==========================================
  function bindHR() {
    $('hrConfirmJoiningBtn')?.addEventListener('click', () => {
      if (!requireSession('hr,entrepreneur')) return;
      const wid = $('hrJoinWorkId')?.value.trim();
      const date = $('hrJoinDate')?.value;
      const pos = $('hrJoinPosition')?.value.trim();
      const dept = $('hrJoinDept')?.value.trim();

      if (!wid || !date || !pos) { alert('Fill mandatory fields!'); return; }

      const users = getStore('users');
      const candidate = users.find(u => u.workId === wid);
      if (!candidate) { alert('Invalid WorkID!'); return; }

      candidate.profile.status = 'Verified';
      saveUser(candidate);

      const history = getStore('employment_history');
      history.push({ id: 'h_'+Date.now(), workId: wid, date, position: pos, department: dept, type: 'Joining' });
      setStore('employment_history', history);

      alert(`✅ Joining confirmed for ${candidate.profile.name || wid}!`);
    });

    $('hrPostJobBtn')?.addEventListener('click', () => {
      if (!requireSession('hr,entrepreneur')) return;
      const jobs = getStore('posted_jobs');
      const selectedJobLocation = $('hrJobLocationDropdown')?.value || 'Remote';
      
      const hrHiringManagerInput = $('hrHiringManager') || { value: 'Active Partner Enterprise' };

      jobs.push({
        id: 'job_' + Date.now(),
        title: $('hrJobTitle')?.value.trim() || 'Software Engineer Node',
        company: hrHiringManagerInput.value || 'Active Partner Enterprise',
        location: selectedJobLocation,
        salary: $('hrSalaryRange')?.value || 'Negotiable',
        exp: $('hrExpRange')?.value || 'Any'
      });
      setStore('posted_jobs', jobs);
      alert('🚀 Job Posted Successfully!');
    });

    $('hrMarkAttendanceBtn')?.addEventListener('click', () => {
      const wid = $('hrAttWorkId')?.value.trim();
      const date = $('hrAttDate')?.value;
      const status = $('hrAttStatus')?.value;
      if(!wid || !date) return alert('Enter data');

      const tbody = $('hrAttTableBody');
      if(tbody) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${date}</td><td>${status} (${wid})</td>`;
        tbody.prepend(tr);
      }
      alert('Attendance tracked!');
    });

    $('hrSubmitExitBtn')?.addEventListener('click', () => {
      if (!requireSession('hr,entrepreneur')) return;
      const wid = $('hrExitWorkId')?.value.trim();
      const date = $('hrExitDate')?.value;
      if (!wid || !date) return alert('Enter WorkID and Exit date');

      const history = getStore('employment_history');
      history.push({ id: 'h_'+Date.now(), workId: wid, date, position: 'Relieved from Duty', department: 'Ex-Employee', type: 'Exit' });
      setStore('employment_history', history);

      const users = getStore('users');
      const u = users.find(x => x.workId === wid);
      if(u) { u.profile.status = 'Unverified (Settled)'; saveUser(u); }

      alert(`⚠️ Exit Process Completed for ${wid}.`);
    });

    $('hrSubmitFeedbackBtn')?.addEventListener('click', () => {
      const wid = $('hrFbWorkId')?.value.trim();
      const rating = $('hrFbRating')?.value;
      const text = $('hrFbText')?.value.trim();

      const history = getStore('employment_history');
      const item = history.reverse().find(x => x.workId === wid);
      if (item) {
        item.rating = rating;
        item.feedback = text;
        setStore('employment_history', history.reverse());
        alert('⭐ Feedback added!');
      } else {
        alert('No employment record found.');
      }
    });

    $('hrHistorySearchBtn')?.addEventListener('click', () => {
      const wid = $('hrHistoryWorkId')?.value.trim();
      const history = getStore('employment_history').filter(x => x.workId === wid);
      const resEl = $('hrHistoryResult');
      if(history.length === 0) {
        if (resEl) resEl.innerHTML = "No history found.";
      } else {
        if (resEl) resEl.innerHTML = history.map(h => `<div>• ${h.date}: ${h.type} as ${h.position}</div>`).join('');
      }
    });

    $('hrChatSendBtn')?.addEventListener('click', () => {
      const txt = $('hrChatInput')?.value.trim();
      if(!txt) return;
      const chats = getStore('hr_chats');
      chats.push({ sender: state.session.email || 'HR Manager', text: txt, time: new Date().toLocaleTimeString() });
      setStore('hr_chats', chats);
      if ($('hrChatInput')) $('hrChatInput').value = '';
      renderChatLive();
    });

    $('outReqSendBtn')?.addEventListener('click', () => {
      if (!requireSession('hr,entrepreneur')) return;
      const reqs = getStore('verification_requests');
      reqs.push({
        id: 'req_' + Date.now(),
        workId: $('outReqWorkId')?.value.trim(),
        targetCompany: $('outReqCompany')?.value.trim(),
        fromHrEmail: state.session.email || 'hr@origin.com',
        status: 'Pending Verification',
        remarks: $('outReqReason')?.value.trim()
      });
      setStore('verification_requests', reqs);
      if ($('outReqMsg')) $('outReqMsg').textContent = '✅ Request sent to recipient HR.';
      renderHRReqListsLive();
    });
  }

  function bindAdmin() {}
  function bindFeedback() {}

  // ==========================================
  // 🚀 ENTREPRENEUR EXTRA FIELDS CONTROLLER ENGINE
  // ==========================================
  function setupEntrepreneurToggle() {
    const roleSelect = $('suRole'); 
    const entSection = $('entSection');
    const entHelp = $('entHelp');

    if (roleSelect && entSection) {
      roleSelect.addEventListener('change', function() {
        if (this.value === 'entrepreneur') {
          entSection.classList.remove('hidden');
          if (entHelp) entHelp.classList.remove('hidden');
        } else {
          entSection.classList.add('hidden');
          if (entHelp) entHelp.classList.add('hidden');
        }
      });
    }
  }
  
  // ==========================================
  // SYSTEM SESSION DESTRUCTION ENGINE (LOGOUT)
  // ==========================================
  function bindLogout() {
    $('logoutBtn')?.addEventListener('click', () => {
      state.session = null; currentMobileOtp = null; currentEmailOtp = null; otpAuth = null;
      $('dashboard')?.classList.add('hidden');
      showView('authLoginBox');
    });
  }

  function requireSession(allowedRoles) {
    if (!state.session) { alert('Please login first.'); return false; }
    const mappedRole = getMappedRole(state.session.role);
    if (allowedRoles && !allowedRoles.split(',').includes(mappedRole)) { alert(`Access denied.`); return false; }
    return true;
  }

  function generateWorkId(country) {
    const year = new Date().getFullYear();
    state.seqByYear[year] = (state.seqByYear[year] || 0) + 1;
    return `WID-${country}-${year}-${String(state.seqByYear[year]).padStart(6, '0')}`;
  }

  // ==========================================
  // MASTER INTERFACE STATE SYNCHRONIZATION LAYERS
  // ==========================================
  function render() {
    const d = $('dashboard');
    if (!state.session) { if(d) d.style.display = 'none'; return; }
    if(d) d.style.display = 'grid';
    buildNavForRole(state.session.role);
    const mappedRole = getMappedRole(state.session.role);
    
    const oldLocInput = $('hrJobLocation');
    if (oldLocInput && oldLocInput.tagName === 'INPUT') {
      const selectNode = document.createElement('select');
      selectNode.id = 'hrJobLocationDropdown';
      selectNode.className = 'input';
      selectNode.innerHTML = AVAILABLE_LOCATIONS.map(loc => `<option value="${loc}">📍 ${loc}</option>`).join('');
      oldLocInput.parentNode.replaceChild(selectNode, oldLocInput);
    }

    if (mappedRole === 'candidate') { showView('candidateProfile'); renderCandidateDashboardLive(); }
    else if (mappedRole === 'hr') { showView('hrPanelTools'); renderHRReqListsLive(); }
    else { showView('adminPanel'); renderAdminPanelLive(); }
  }

})();
