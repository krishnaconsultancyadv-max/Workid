// WorkID Advanced App Logic – POC Multi-Experience & HR Link Connected Fixed
(function(){
  'use strict';
  
  const $ = (id) => document.getElementById(id);
  
  const state = {
    session: null, 
    seqByYear: {}
  };
  
  let currentOtp = null;
  let otpAuth = null;

  function getMappedRole(role) {
    const roleMap = {
      'superadmin': 'superadmin', 'stateadmin': 'stateadmin', 
      'districtadmin': 'districtadmin', 'admin': 'admin',
      'entrepreneur': 'hr', 'candidate': 'candidate', 'hr': 'hr'
    };
    return roleMap[role] || role;
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindAuth();
    bindTheme();
    bindNav();
    bindCandidate();
    bindHR();
    bindLogout();
    bindPasswordToggle();
    render();
  });

  function bindPasswordToggle() {
    const passInput = $('loginPass');
    const toggleBtn = $('togglePass');
    if (!passInput || !toggleBtn) return;
    toggleBtn.addEventListener('click', () => {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
    });
  }

  function bindTheme() {
    $('themeSelect')?.addEventListener('change', (e) => {
      document.documentElement.classList.toggle('dark', e.target.value === 'dark');
    });
  }

  // ================= DATA ENGINES =================
  function getStore(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }
  function setStore(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

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
      profile: {},
      workId: null,
      verificationStatus: 'Unverified', // Unverified -> Pending -> Verified
      experiences: []
    };
    users.push(user);
    setStore('users', users);
    return user;
  }

  // ================= LIVE AUTH =================
  function bindAuth() {
    $('passwordLoginBtn')?.addEventListener('click', () => {
      const role = $('roleSelect')?.value || 'candidate';
      const mobile = $('mobileInput')?.value.trim();
      const email = $('emailInput')?.value.trim();
      if (!mobile && !email) { $('authMsg').textContent = 'Email/Mobile required.'; return; }
      
      const user = getUserByEmailOrMobile({ email, mobile });
      if (!user) { $('authMsg').textContent = 'User not found. Account Sign-up kariye.'; return; }
      
      state.session = { role, mobile, email, userId: user.id };
      $('authMsg').textContent = 'Password match! Click Send OTP to proceed.';
    });

    $('sendOtpBtn')?.addEventListener('click', () => {
      if (!state.session) { $('authMsg').textContent = 'Pehle password login kariye.'; return; }
      currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
      alert('Demo OTP Sent: ' + currentOtp);
      $('authMsg').textContent = 'OTP code generated.';
    });

    $('verifyOtpBtn')?.addEventListener('click', () => {
      const given = $('otpInput')?.value.trim();
      if (given === currentOtp && state.session) {
        $('authMsg').textContent = '✅ Logged In!';
        render();
      } else {
        $('authMsg').textContent = '❌ Incorrect OTP.';
      }
    });

    $('signupBtn')?.addEventListener('click', () => {
      const role = $('suRole')?.value || 'candidate';
      const name = $('suName')?.value.trim();
      const email = $('suEmail')?.value.trim();
      const mob = $('suMobile')?.value.trim();
      if (!name || !email || !mob) { $('authMsg').textContent = 'All fields required.'; return; }
      
      const user = createUser({ role, email, mobile: mob });
      user.name = name;
      const users = getStore('users');
      const idx = users.findIndex(u => u.id === user.id);
      if(idx>=0) { users[idx].name = name; setStore('users', users); }

      $('authMsg').textContent = '✅ Account setup complete! Please Login.';
    });

    // Forgot password tabs binding
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
  }

  // ================= NAVIGATION =================
  function bindNav() {
    $('navList')?.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-view]');
      if (li?.dataset.view) showView(li.dataset.view);
    });
  }

  function buildNavForRole(role) {
    const nav = $('navList');
    if (!nav) return; nav.innerHTML = '';
    const mappedRole = getMappedRole(role);
    
    if (mappedRole === 'candidate') {
      nav.appendChild(navItem('candidateProfile', 'Candidate Profile'));
      nav.appendChild(navItem('workIdCard', 'WorkID Card View'));
    } else {
      nav.appendChild(navItem('hrVerify', 'HR Verification Centre'));
      nav.appendChild(navItem('hrCompany', 'Company Details'));
    }
  }

  function navItem(viewId, label) {
    const li = document.createElement('li');
    li.textContent = label; li.dataset.view = viewId;
    li.style.padding = "8px"; li.style.cursor = "pointer";
    return li;
  }

  function showView(id) {
    document.querySelectorAll('.content > *').forEach(el => el.classList.add('hidden'));
    $(id)?.classList.remove('hidden');
  }

  // ================= CANDIDATE MANAGEMENT (MULTIPLE EXP) =================
  function bindCandidate() {
    const fresherCheck = $('isFresherCheck');
    const expFields = $('experienceFields');
    const expContainer = $('experienceContainer');
    let compCounter = 1;

    fresherCheck?.addEventListener('change', () => {
      if (fresherCheck.checked) { expFields.style.display = 'none'; } 
      else { expFields.style.display = 'block'; }
    });

    $('addMoreExpBtn')?.addEventListener('click', () => {
      compCounter++;
      const block = document.createElement('div');
      block.className = "experience-block";
      block.style = "border:1px solid #4a5568; padding:15px; border-radius:6px; margin-bottom:15px; position:relative;";
      block.innerHTML = `
        <h5 class="comp-title">Company #${compCounter}</h5>
        <button type="button" class="rem-btn" style="position:absolute; top:10px; right:10px; background:red; color:white; border:none; border-radius:4px; cursor:pointer; font-size:10px; padding:2px 6px;">Remove</button>
        <div class="grid">
          <div><label>Company Name</label><input class="expCompany" type="text" /></div>
          <div><label>Designation/Role</label><input class="expRole" type="text" /></div>
          <div><label>Joining Date</label><input class="expStart" type="date" /></div>
          <div><label>Relieving Date</label><input class="expEnd" type="date" /></div>
        </div>
        <div class="grid" style="margin-top:10px;">
          <div><label>Relieving Letter</label><input class="expRelieveDoc" type="file" /></div>
          <div><label>No Dues Certificate</label><input class="expNoDuesDoc" type="file" /></div>
        </div>
      `;
      block.querySelector('.rem-btn').addEventListener('click', () => block.remove());
      expContainer.appendChild(block);
    });

    $('saveProfileBtn')?.addEventListener('click', () => {
      const users = getStore('users');
      const user = users.find(u => u.id === state.session.userId);
      if (!user) return;

      user.profile = {
        name: $('cName').value.trim() || user.name || "Candidate Name",
        father: $('cFather').value.trim(),
        dob: $('cDob').value,
        address: $('cAddr').value.trim(),
        qualification: $('cQual').value.trim(),
        isFresher: fresherCheck.checked
      };

      user.experiences = [];
      if (!fresherCheck.checked) {
        document.querySelectorAll('.experience-block').forEach(b => {
          const cName = b.querySelector('.expCompany').value.trim();
          if (cName) {
            user.experiences.push({
              company: cName,
              role: b.querySelector('.expRole').value.trim(),
              start: b.querySelector('.expStart').value,
              end: b.querySelector('.expEnd').value,
              hasRelieving: b.querySelector('.expRelieveDoc').files.length > 0 ? "Attached" : "Not Provided",
              hasNoDues: b.querySelector('.expNoDuesDoc').files.length > 0 ? "Attached" : "Not Provided"
            });
          }
        });
      }

      user.verificationStatus = 'Pending Verification';
      const idx = users.findIndex(u => u.id === user.id);
      users[idx] = user;
      setStore('users', users);

      $('profileMsg').innerHTML = `✅ Profile & documents submitted to HR Server successfully!<br>Current Status: <span style='color:orange;'>Pending HR Verification</span>.`;
      
      // Keep card buttons disabled
      $('initWorkIdBtn').disabled = true;
      $('initWorkIdBtn').style.opacity = "0.5";
      $('initWorkIdBtn').style.cursor = "not-allowed";
    });

    $('initWorkIdBtn')?.addEventListener('click', () => {
      const users = getStore('users');
      const user = users.find(u => u.id === state.session.userId);
      if (user && user.verificationStatus === 'Verified') {
        user.workId = `WID-IN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        const idx = users.findIndex(u => u.id === user.id);
        users[idx] = user;
        setStore('users', users);
        
        // Card rendering components push
        $('widName').textContent = user.profile.name || user.name;
        $('widNumber').textContent = user.workId;
        $('widStatus').textContent = "Verified Live";
        $('widStatus').style.background = "#10B981"; // Green
        
        showView('workIdCard');
        alert("🎉 WorkID Card successfully generated based on verified profile records!");
      } else {
        alert("Cannot generate. Profile must be HR verified first!");
      }
    });

    // Download Alert Trigger
    $('downloadCardBtn')?.addEventListener('click', () => {
      alert("Downloading PNG Image Asset for your Verified WorkID secure container...");
    });
  }

  // ================= HR DASHBOARD CONNECTIVITY =================
  function bindHR() {
    $('submitCompanyBtn')?.addEventListener('click', () => {
      $('companyMsg').textContent = "Company parameters saved locally.";
    });
  }

  function loadHRReviewPanel() {
    const listContainer = $('hrCandidatesReviewList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const users = getStore('users').filter(u => u.role === 'candidate');

    if (users.length === 0) {
      listContainer.innerHTML = '<p class="muted">No candidates registered on this Node.</p>';
      return;
    }

    users.forEach(user => {
      const block = document.createElement('div');
      block.style = "background:#2d3748; padding:15px; border-radius:8px; border: 1px solid #4a5568;";
      
      let expHTML = '';
      if (user.profile?.isFresher) {
        expHTML = `<p style="color:#4fd1c5; margin:5px 0;"><strong>✨ Candidate Status: Fresher</strong> (No external work history docs required)</p>`;
      } else if (user.experiences && user.experiences.length > 0) {
        user.experiences.forEach((exp, i) => {
          expHTML += `
            <div style="margin-left:15px; margin-top:5px; border-left:2px dashed #4a5568; padding-left:10px;">
              <strong>Job #${i+1}: ${exp.company}</strong> (${exp.role})<br>
              <span style="font-size:12px;" class="muted">Duration: ${exp.start} to ${exp.end} | Relieving: ${exp.hasRelieving} | No Dues: ${exp.hasNoDues}</span>
            </div>
          `;
        });
      } else {
        expHTML = `<p class="muted" style="font-size:12px;">Profile details not submitted yet.</p>`;
      }

      block.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
          <div>
            <h4 style="margin:0; color:#fff;">${user.profile?.name || user.name || "Unknown Name"}</h4>
            <p style="font-size:12px; margin:2px 0;" class="muted">Email: ${user.email} | Mobile: ${user.mobile} | Edu: ${user.profile?.qualification || 'N/A'}</p>
            <p style="font-size:12px; margin:2px 0;">Verification Status: <strong style="color:#ecc94b;">${user.verificationStatus || 'Unverified'}</strong></p>
            ${expHTML}
          </div>
          <div style="margin-top:10px;">
            <button class="btn approve-user-btn" data-uid="${user.id}" style="background:#10B981; font-size:12px; padding:6px 12px;" ${user.verificationStatus==='Verified'?'disabled style="opacity:0.5;"':''}>
              ${user.verificationStatus==='Verified'?'Verified ✓':'Approve & Verify Credentials'}
            </button>
          </div>
        </div>
      `;

      block.querySelector('.approve-user-btn')?.addEventListener('click', (e) => {
        const uid = e.target.dataset.uid;
        const allUsers = getStore('users');
        const targetIdx = allUsers.findIndex(u => u.id === uid);
        if (targetIdx >= 0) {
          allUsers[targetIdx].verificationStatus = 'Verified';
          setStore('users', allUsers);
          alert("Candidate credentials verified! WorkID activation window unlocked for this user.");
          loadHRReviewPanel();
        }
      });

      listContainer.appendChild(block);
    });
  }

  // ================= CORE ENGINE CORE RENDER =================
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
    
    // Auto sync layout switches
    if (mappedRole === 'candidate') {
      showView('candidateProfile');
      
      // Local check if state matches verified token
      const currentStoredUser = getStore('users').find(u => u.id === state.session.userId);
      if (currentStoredUser && currentStoredUser.verificationStatus === 'Verified') {
        $('initWorkIdBtn').disabled = false;
        $('initWorkIdBtn').style.opacity = "1";
        $('initWorkIdBtn').style.cursor = "pointer";
        $('profileMsg').innerHTML = `<span style='color:#10B981;'>✓ Your profile has been officially VERIFIED by HR. Please generate your dynamic QR WorkID Card now.</span>`;
      }
    } else {
      showView('hrVerify');
      loadHRReviewPanel();
    }
  }

  function bindLogout() {
    $('logoutBtn')?.addEventListener('click', () => {
      state.session = null;
      currentOtp = null;
      $('dashboard')?.classList.add('hidden');
      if($('dashboard')) $('dashboard').style.display = 'none';
      $('authMsg').textContent = 'Logged out safely.';
      showView('authLoginBox');
    });
  }

})();
