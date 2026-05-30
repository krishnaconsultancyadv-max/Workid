// WorkID Demo App Logic – localStorage POC (LOCATION-WISE DROPDOWN FOR BOTH HR & CANDIDATE)
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

  // पहले से तय किए गए मुख्य शहर (प्रोजेक्ट स्कोप के अनुसार)
  const AVAILABLE_LOCATIONS = ["Sagar", "Bhopal", "Indore", "Jabalpur", "Delhi", "Mumbai", "Remote"];

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

  // ================= AUTH SYSTEM =================
  function bindAuth() {
    const sendOtpBtn = $('sendOtpBtn');
    const verifyOtpBtn = $('verifyOtpBtn');
    const passwordLoginBtn = $('passwordLoginBtn');
    const forgotBtn = $('forgotBtn');
    const resetPasswordBtn = $('resetPasswordBtn');

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
        alert(`Demo Reset OTP: ${resetOtp}`);
        msgEl.textContent = 'OTP bhej diya.';
        if ($('resetOtpSection')) $('resetOtpSection').style.display = 'flex';
      });
    }

    if (resetPasswordBtn) {
      resetPasswordBtn.addEventListener('click', () => {
        const otp = $('resetOtpInput')?.value.trim();
        const newPass = $('newPasswordInput')?.value;
        const confirmPass = Nipp = $('newPasswordConfirm')?.value;
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
        
        const resetEmailOrMobile = sessionStorage.getItem('resetEmailOrMobile');
        const users = getStore('users') || [];
        const user = users.find(u => u.email === resetEmailOrMobile || u.mobile === resetEmailOrMobile);
        
        if (user) {
          user.password = newPass;
          setStore('users', users);
          msgEl.textContent = '✅ Password reset successful!';
        }
      });
    }

    // TABS
    const tabs = ['tabLogin', 'tabSignup', 'tabForgot'];
    const boxes = ['authLoginBox', 'authSignupBox', 'authForgotBox'];
    tabs.forEach((tabId, i) => {
      $(tabId)?.addEventListener('click', () => {
        tabs.forEach(t => $(t)?.classList.remove('active'));
        boxes.forEach(b => $(b)?.classList.add('hidden'));
        $(tabId).classList.add('active');
        $(boxes[i])?.classList.remove('hidden');
      });
    });

    // SIGNUP
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
      
      const auth = { role, email, mobile: mob };
      if (getUserByEmailOrMobile(auth)) {
        msgEl.textContent = 'Already registered.';
        return;
      }
      
      const user = createUser(auth);
      user.profile.name = name;
      saveUser(user);
      msgEl.textContent = '✅ Account created! Login kariye.';
    });
  }

  // ================= STORAGE HELPERS =================
  function getStore(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
  function setStore(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function generateOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }
  
  function getUserByEmailOrMobile(auth) {
    const users = getStore('users');
    return users.find(u => (auth.email && u.email === auth.email) || (auth.mobile && u.mobile === auth.mobile)) || null;
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

  // ================= NAVIGATION =================
  function bindNav() {
    $('navList')?.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-view]');
      if (li?.dataset.view) {
        showView(li.dataset.view);
        if (li.dataset.view === 'workIdCard') updateWorkIdCardUI();
        if (li.dataset.view === 'candidateProfile') renderCandidateDashboardLive();
        if (li.dataset.view === 'hrPanelTools') renderHRReqListsLive();
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
      nav.appendChild(navItem('adminPanel', 'Admin'));
    }
  }

  function navItem(viewId, label) {
    const li = document.createElement('li');
    li.textContent = label; li.dataset.view = viewId; return li;
  }

  function showView(id) {
    document.querySelectorAll('.content > *').forEach(el => el.classList.add('hidden'));
    $(id)?.classList.remove('hidden');
  }

  // ================= LIVE UI RE-RENDERERS =================
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

  // 1. CANDIDATE SIDE WITH LOCATION DROPDOWN FILTER
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

    // कैंडिडेट के लिए ड्रॉपडाउन फ़िल्टर UI HTML
    let filterHtml = `
      <div style="margin-top:20px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px; border:1px solid #4b5563;">
        <label for="jobLocFilter" style="font-weight:bold; display:block; margin-bottom:8px; color:#34d399;">📍 View Jobs by Location (कैंडिडेट फ़िल्टर):</label>
        <select id="jobLocFilter" class="input" style="max-width:100%; padding:8px; background:#1f2937; color:#fff; border:1px solid #4b5563; border-radius:6px;" onchange="window.changeJobLocationFilter(this.value)">
          <option value="All" ${selectedLoc === 'All' ? 'selected' : ''}>🌍 All Locations (सभी जगह की जॉब्स देखें)</option>
          ${AVAILABLE_LOCATIONS.map(loc => `<option value="${loc}" ${selectedLoc === loc ? 'selected' : ''}>📍 ${loc}</option>`).join('')}
        </select>
      </div>
      <br/>
    `;

    const filteredJobs = selectedLoc === 'All' ? jobs : jobs.filter(j => j.location === selectedLoc);

    let jobsHtml = `<h4>💼 Available Job Postings (${filteredJobs.length})</h4>`;
    if (filteredJobs.length === 0) {
      jobsHtml += `<p class="muted">इस लोकेशन (${selectedLoc}) के लिए अभी कोई जॉब उपलब्ध नहीं है।</p>`;
    } else {
      filteredJobs.forEach(j => {
        const hasApplied = apps.find(a => a.jobId === j.id);
        jobsHtml += `
          <div class="hr-job-post" style="margin-bottom:12px; padding:12px; border:1px solid #374151; borderRadius:8px; background:rgba(255,255,255,0.02)">
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

    apps.push({
      id: 'app_' + Date.now(),
      jobId: jobId,
      candidateId: user.id,
      workId: user.workId,
      name: user.profile.name || user.email,
      status: 'Applied'
    });
    setStore('job_applications', apps);
    alert('✅ Job Application Submitted Successfully!');
    renderCandidateDashboardLive();
  };

  // 2. HR PANEL INCOMING AND APPLICANTS LIVE LIST
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
      const dateTime = prompt("Enter Interview Date and Time (e.g. 05 June, 11:00 AM):");
      if (dateTime) {
        a.status = `Interview Scheduled at ${dateTime}`;
        setStore('job_applications', apps);
        alert('✅ Interview Scheduled & Candidate Informed!');
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

  // ================= CANDIDATE OPERATIONS =================
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
      $('profileMsg').textContent = 'Profile saved!';
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

  // ================= HR & ENTREPRENEUR OPERATIONAL LOGIC =================
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

      alert(`✅ Joining confirmed for ${candidate.profile.name || wid}! WorkID Card Verified.`);
    });

    // 🚀 FIXED: HR जो जॉब पोस्ट करेगा वो ड्रॉपडाउन वैल्यू से सेव होगी
    $('hrPostJobBtn')?.addEventListener('click', () => {
      if (!requireSession('hr,entrepreneur')) return;
      const jobs = getStore('posted_jobs');
      
      // HTML से नया ड्रॉपडाउन इन्जेक्टेड एलिमेंट की वैल्यू उठाना
      const selectedJobLocation = $('hrJobLocationDropdown')?.value || 'Remote';

      jobs.push({
        id: 'job_' + Date.now(),
        title: $('hrJobTitle')?.value.trim(),
        company: $('hrHiringManager')?.value || 'Active Partner Enterprise',
        location: selectedJobLocation, // ड्रॉपडाउन लोकेशन सेव होगी
        salary: $('hrSalaryRange')?.value || 'Negotiable',
        exp: $('hrExpRange')?.value || 'Any'
      });
      setStore('posted_jobs', jobs);
      alert('🚀 Job Posted Successfully with Selected Dropdown Location!');
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

      alert(`⚠️ Exit Process Completed for ${wid}. History Updated.`);
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
  
  function bindLogout() {
    $('logoutBtn')?.addEventListener('click', () => {
      state.session = null; currentOtp = null; otpAuth = null;
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

  // HR फॉर्म के अंदर टेक्स्ट इनपुट की जगह सुंदर ड्रॉपडाउन बदलना और रेंडर करना
  function render() {
    const d = $('dashboard');
    if (!state.session) { if(d) d.style.display = 'none'; return; }
    if(d) d.style.display = 'grid';
    buildNavForRole(state.session.role);
    const mappedRole = getMappedRole(state.session.role);
    
    // 🛠️ यहाँ हम HR के पुराने 'hrJobLocation' टेक्स्ट बॉक्स को सुंदर लोकेशन ड्रॉपडाउन में रिप्लेस कर रहे हैं
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
    else showView('adminPanel');
  }

  function syncAdminData() {}
})();
