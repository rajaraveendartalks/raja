// ============================================================================
// RAJA RAVEENDAR OFFICIAL HUB — "RAJA'S LEGACY LOUNGE" & NETWORK LOGIC
// ============================================================================

(function () {
  const DATA = window.RR_DATA;

  const state = {
    lang: localStorage.getItem("rr_lang") || "en",
    activePersona: "podcaster",
    activeAnalyticsTab: "youtube",
    selectedCategory: "All",
    searchQuery: "",
    guestFilter: "All",
    communityPoints: parseInt(localStorage.getItem("rr_points") || "150", 10),
    upvotedIds: JSON.parse(localStorage.getItem("rr_upvoted") || "[]"),
    votedPolls: JSON.parse(localStorage.getItem("rr_polls") || "{}"),
    claimedGoodies: JSON.parse(localStorage.getItem("rr_goodies") || "[]"),
    selectedInternTrack: "AI Content Creators",
    isRecordingVoice: false,
    recordingSeconds: 0,
    recordingTimer: null
  };

  // Load saved custom items
  const savedQuestions = JSON.parse(localStorage.getItem("rr_custom_questions_v2") || "null");
  if (savedQuestions && Array.isArray(savedQuestions)) {
    DATA.upcomingQuestions = savedQuestions;
  }

  const savedCreators = JSON.parse(localStorage.getItem("rr_creator_pool") || "null");
  if (savedCreators && Array.isArray(savedCreators)) {
    DATA.creatorTalentPool = savedCreators;
  }

  const savedGuestMessages = JSON.parse(localStorage.getItem("rr_guest_messages_v2") || "{}");
  Object.keys(savedGuestMessages).forEach((gId) => {
    const g = DATA.guests.find((x) => x.id === gId);
    if (g) {
      g.messages = savedGuestMessages[gId];
    }
  });

  function domainCssClass(cat) {
    return "domain-" + String(cat).replace(/[^a-zA-Z0-9]+/g, "-");
  }

  // Toast Notification
  window.showToast = function (message) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  };

  function addPoints(pts, reason) {
    state.communityPoints += pts;
    localStorage.setItem("rr_points", String(state.communityPoints));
    document.querySelectorAll(".user-points-count").forEach((el) => {
      el.textContent = state.communityPoints;
    });
    if (reason) {
      showToast(`🎉 +${pts} Network Points earned (${reason})!`);
    }
  }

  function postToBackendInbox(type, entry) {
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, entry })
    }).catch(() => {});
  }

  // 1. Language Switcher (EN / TE)
  window.setLanguage = function (lang) {
    state.lang = lang;
    localStorage.setItem("rr_lang", lang);
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    const dict = DATA.i18n[lang];
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    renderSocialStats();
    renderPersonas();
    renderNetflixCatalog();
    renderViralReels();
    renderWisdomQuotes();
  };

  // 2. Social Media & Verified KPI Cards
  function renderSocialStats() {
    const container = document.getElementById("stats-grid");
    if (!container) return;
    container.innerHTML = DATA.socialStats
      .map(
        (s) => `
      <a href="${s.link}" target="${s.link.startsWith("http") ? "_blank" : "_self"}" class="stat-card">
        <div class="stat-top">
          <div class="stat-icon">${s.icon}</div>
          <span class="stat-platform-tag">${s.platform}</span>
        </div>
        <div class="stat-number" style="color: ${s.color}">${s.value}${s.suffix}</div>
        <div class="stat-label">${state.lang === "te" ? s.labelTe : s.label}</div>
        <div class="stat-subtext">${s.subtext}</div>
      </a>
    `
      )
      .join("");
  }

  // 2B. Render Clean Views & Followers Overview (YouTube, Instagram, Facebook — No Monthly Breakdown)
  window.switchAnalyticsTab = function (tab) {
    state.activeAnalyticsTab = tab;
    renderAnalyticsDashboard();
  };

  function renderAnalyticsDashboard() {
    const container = document.getElementById("analytics-dashboard-box");
    if (!container) return;

    const rpt = DATA.analyticsReport;
    const tab = state.activeAnalyticsTab === "youtube" ? "instagram" : state.activeAnalyticsTab;

    let bodyHTML = "";
    if (tab === "instagram") {
      bodyHTML = `
        <div>
          <span class="pill-badge pill-gold">INSTAGRAM • @rajaraveendar</span>
          <h3 style="font-size:1.35rem; font-weight:900; margin-top:6px;">8.2M (82L) Reel Views • 38K Followers • 3.4M Unique Viewers</h3>
          <div class="kpi-mini-grid">
            ${rpt.instagramKPIs
              .map(
                (k) => `
              <div class="kpi-mini-card">
                <div style="font-size:0.78rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">${k.metric}</div>
                <div class="kpi-val">${k.value}</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">${k.insight}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    } else {
      bodyHTML = `
        <div>
          <span class="pill-badge pill-crimson">FACEBOOK ANALYTICS</span>
          <h3 style="font-size:1.35rem; font-weight:900; margin-top:6px;">6.49M Views (+1,362% Growth) • 92.8% Non-Follower Organic Reach</h3>
          <div class="kpi-mini-grid">
            ${rpt.facebookKPIs
              .map(
                (k) => `
              <div class="kpi-mini-card">
                <div style="font-size:0.78rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">${k.metric}</div>
                <div class="kpi-val">${k.value}</div>
                <div style="font-size:0.8rem; color:#0D9488; font-weight:700;">${k.growth}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="analytics-tabs">
        <button class="persona-tab-btn ${tab === "instagram" ? "active" : ""}" onclick="switchAnalyticsTab('instagram')">
          📸 Instagram @rajaraveendar (8.2M Reel Views • 38K Followers)
        </button>
        <button class="persona-tab-btn ${tab === "facebook" ? "active" : ""}" onclick="switchAnalyticsTab('facebook')">
          📈 Facebook Analytics (6.49M Views • +1,362%)
        </button>
      </div>
      <div class="analytics-panel">
        ${bodyHTML}
      </div>
    `;
  }

  // 3. Multi-Faceted Persona & Legacy Lounge Philosophy
  window.selectPersona = function (id) {
    state.activePersona = id;
    renderPersonas();
  };

  function renderPersonas() {
    const tabsEl = document.getElementById("persona-tabs");
    const cardEl = document.getElementById("persona-display");
    if (!tabsEl || !cardEl) return;

    tabsEl.innerHTML = DATA.personas
      .map(
        (p) => `
      <button class="persona-tab-btn ${p.id === state.activePersona ? "active" : ""}"
              onclick="selectPersona('${p.id}')">
        ${state.lang === "te" ? p.roleTe : p.role} • <small>${p.badge}</small>
      </button>
    `
      )
      .join("");

    const active = DATA.personas.find((p) => p.id === state.activePersona) || DATA.personas[0];
    cardEl.innerHTML = `
      <div>
        <span class="pill-badge pill-crimson" style="margin-bottom:12px;">${active.badge}</span>
        <h3 style="font-size:1.65rem; font-weight:900; margin-bottom:12px;">${active.headline}</h3>
        <p style="color:var(--text-secondary); font-size:1rem;">${active.description}</p>
        <ul class="persona-highlights">
          ${active.highlights.map((h) => `<li>✓ ${h}</li>`).join("")}
        </ul>
      </div>
      <div class="persona-img-box">
        <img src="${active.image}" alt="${active.role}" loading="lazy" />
      </div>
    `;
  }

  // Helper: Extract YouTube Video / Shorts ID from any YouTube URL
  function extractYouTubeId(url) {
    if (!url) return null;
    const match = String(url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return match && match[1] ? match[1] : null;
  }

  function resolveThumbUrl(thumb, fallbackVideoUrl) {
    const ytFromThumb = extractYouTubeId(thumb);
    if (ytFromThumb && !String(thumb).includes("img.youtube.com")) {
      return `https://img.youtube.com/vi/${ytFromThumb}/hqdefault.jpg`;
    }
    if (!thumb || thumb.trim() === "") {
      const ytFromVideo = extractYouTubeId(fallbackVideoUrl);
      if (ytFromVideo) return `https://img.youtube.com/vi/${ytFromVideo}/hqdefault.jpg`;
    }
    return thumb;
  }

  // 4. Daytime Netflix-Style Catalog Swimlanes (Ordered by Admin Category Position)
  window.handleEpisodeSearch = function (val) {
    state.searchQuery = val.trim().toLowerCase();
    renderNetflixCatalog();
  };

  window.scrollSwimlane = function (rowId, direction) {
    const row = document.getElementById(rowId);
    if (row) {
      row.scrollBy({ left: direction * 680, behavior: "smooth" });
    }
  };

  function buildEpisodeCardHTML(ep) {
    const title = state.lang === "te" ? ep.titleTe : ep.title;
    const hasVotedPoll = Boolean(state.votedPolls[ep.id]);
    const domClass = domainCssClass(ep.category);
    const thumbSrc = resolveThumbUrl(ep.thumbnail, ep.youtubeUrl);
    return `
      <article class="ep-card">
        <div class="ep-thumb-wrap" onclick="openEpisodeModal('${ep.id}')" style="cursor:pointer;">
          <img src="${thumbSrc}" alt="${ep.title}" loading="lazy" />
          <span class="ep-num-badge">${ep.releaseBadge}</span>
          <span class="ep-duration-badge">▶ ${ep.duration}</span>
        </div>
        <div class="ep-body">
          <div class="ep-meta-top">
            <span class="domain-tag ${domClass}">${ep.category}</span>
            <span style="color:var(--accent-crimson); font-weight:800;">${ep.views}</span>
          </div>
          <h4 class="ep-title" onclick="openEpisodeModal('${ep.id}')" style="cursor:pointer;">${title}</h4>
          <div class="ep-guest-line">🎙️ Guest: ${ep.guestName}</div>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${ep.summary}
          </p>
          <div class="ep-actions">
            <button class="ep-btn-sm primary" onclick="openEpisodeModal('${ep.id}')">
              ▶ Watch & Discuss ${hasVotedPoll ? "✓" : ""}
            </button>
            <button class="ep-btn-sm" onclick="openGuestMessageModal('${ep.guestId}', '${ep.guestName.replace(/'/g, "\\'")}')">
              💬 Message Guest
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderNetflixCatalog() {
    const container = document.getElementById("netflix-swimlanes-container");
    if (!container) return;

    if (state.searchQuery) {
      const filtered = DATA.episodes.filter(
        (ep) =>
          ep.title.toLowerCase().includes(state.searchQuery) ||
          ep.titleTe.toLowerCase().includes(state.searchQuery) ||
          ep.guestName.toLowerCase().includes(state.searchQuery) ||
          ep.summary.toLowerCase().includes(state.searchQuery) ||
          ep.category.toLowerCase().includes(state.searchQuery)
      );
      container.innerHTML = `
        <div class="swimlane-block">
          <div class="swimlane-header">
            <div class="swimlane-title">
              🎬 Showing ${filtered.length} Matching Episode(s)
            </div>
          </div>
          <div class="netflix-row" id="row-filtered">
            ${filtered.length ? filtered.map(buildEpisodeCardHTML).join("") : `<p style="padding:20px; color:var(--text-secondary);">No episodes matched your search.</p>`}
          </div>
        </div>
      `;
      return;
    }

    const categoriesList =
      DATA.categories && DATA.categories.length
        ? DATA.categories
        : [
            {
              id: "cat-all",
              name: "All Episodes",
              rowTitleEn: "🏆 Raja’s Legacy Lounge — All 15 Published Episodes",
              rowTitleTe: "🏆 రాజాస్ లెగసీ లాంజ్ — మొత్తం 15 ఎపిసోడ్‌లు",
              isAllRow: true,
              visible: true
            }
          ];

    const lanes = categoriesList
      .filter((c) => c.visible !== false)
      .map((c, idx) => {
        const items = c.isAllRow
          ? DATA.episodes
          : DATA.episodes.filter((e) => e.category === c.name || (Array.isArray(e.categories) && e.categories.includes(c.name)));
        return {
          id: `row-cat-${idx}`,
          title: state.lang === "te" ? c.rowTitleTe || c.rowTitleEn || c.name : c.rowTitleEn || c.name,
          items
        };
      })
      .filter((lane) => lane.items.length > 0);

    container.innerHTML = lanes
      .map(
        (lane) => `
      <div class="swimlane-block">
        <div class="swimlane-header">
          <div class="swimlane-title">${lane.title} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">(${lane.items.length} Videos)</span></div>
          <div class="swimlane-controls">
            <button class="carousel-arrow" onclick="scrollSwimlane('${lane.id}', -1)">‹</button>
            <button class="carousel-arrow" onclick="scrollSwimlane('${lane.id}', 1)">›</button>
          </div>
        </div>
        <div class="netflix-row" id="${lane.id}">
          ${lane.items.map(buildEpisodeCardHTML).join("")}
        </div>
      </div>
    `
      )
      .join("");
  }

  // 5. Episode Detail Modal (With Embedded YouTube Video Player, Topic Discussion Thread, Poll & Guest Connect)
  window.openEpisodeModal = function (epId) {
    const ep = DATA.episodes.find((e) => e.id === epId) || DATA.episodes[0];
    const votedChoice = state.votedPolls[ep.id];
    const savedDisc = JSON.parse(localStorage.getItem("rr_disc_" + ep.id) || "null");
    const discussions = savedDisc || ep.discussions || [];
    const ytId = extractYouTubeId(ep.youtubeUrl);
    const thumbSrc = resolveThumbUrl(ep.thumbnail, ep.youtubeUrl);

    const playerHTML = ytId
      ? `<iframe src="https://www.youtube.com/embed/${ytId}?rel=0" title="${ep.title}" style="width:100%; height:100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      : `
        <img src="${thumbSrc}" alt="${ep.title}" style="width:100%; height:100%; object-fit:cover;" />
        <div style="position:absolute; inset:0; background:rgba(20,28,43,0.36); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#FFF; padding:20px; text-align:center;">
          <a href="${ep.youtubeUrl}" target="_blank" class="btn btn-primary" style="font-size:0.98rem; padding:14px 26px;">
            ▶ Watch Full Episode ${ep.epNumber} on YouTube
          </a>
        </div>
      `;

    const html = `
      <span class="pill-badge pill-crimson">${ep.releaseBadge} • ${ep.category.toUpperCase()}</span>
      <h2 style="font-size:1.5rem; font-weight:900; margin:10px 0 4px;">${ep.title}</h2>
      <p style="color:var(--accent-crimson); font-weight:700; margin-bottom:14px;">${ep.titleTe}</p>

      <div style="position:relative; border-radius:14px; overflow:hidden; aspect-ratio:16/9; margin-bottom:14px; border:1px solid var(--border-light); background:#000;">
        ${playerHTML}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
        <span style="font-size:0.84rem; font-weight:700; color:var(--text-secondary);">🎙️ Guest: ${ep.guestName} • ${ep.views}</span>
        <a href="${ep.youtubeUrl}" target="_blank" class="btn btn-secondary" style="padding:6px 14px; font-size:0.8rem;">
          📺 Open Directly on YouTube ↗
        </a>
      </div>

      <div style="background:var(--bg-primary); padding:16px; border-radius:12px; margin-bottom:16px; border:1px solid var(--border-light);">
        <div style="font-weight:800; margin-bottom:4px;">🎙️ Guest: ${ep.guestName} (${ep.guestRole})</div>
        <p style="font-size:0.92rem; color:var(--text-secondary); margin-bottom:12px;">${ep.summary}</p>
        <div style="font-weight:800; font-size:0.85rem; margin-bottom:6px;">🔑 Key Topics & Video References:</div>
        <ul style="padding-left:18px; font-size:0.86rem; color:var(--text-secondary);">
          ${ep.takeaways.map((t) => `<li style="margin-bottom:4px;">${t}</li>`).join("")}
          ${(ep.references || []).map((r) => `<li style="color:var(--accent-crimson); font-weight:700;">📌 ${r}</li>`).join("")}
        </ul>
      </div>

      <!-- Topic Discussion & Viewer Comments Thread -->
      <div style="background:#FFFFFF; border:1px solid var(--border-light); border-radius:12px; padding:16px; margin-bottom:16px;">
        <h4 style="font-size:0.98rem; font-weight:800; margin-bottom:10px;">💬 Episode Topic Discussion & Viewer Comments (${discussions.length})</h4>
        <div style="max-height:150px; overflow-y:auto; margin-bottom:12px;">
          ${
            discussions.length
              ? discussions
                  .map(
                    (d) => `
              <div style="background:var(--bg-primary); padding:10px 12px; border-radius:8px; margin-bottom:8px; font-size:0.84rem;">
                <strong>👤 ${d.user}</strong> <span style="color:var(--text-muted); font-size:0.75rem;">• ${d.time}</span>
                <p style="margin-top:3px;">${d.comment}</p>
              </div>
            `
                  )
                  .join("")
              : `<p style="font-size:0.82rem; color:var(--text-muted);">Start the discussion on Episode ${ep.epNumber} below!</p>`
          }
        </div>
        <form onsubmit="postEpisodeComment(event, '${ep.id}')" style="display:flex; gap:8px; flex-wrap:wrap;">
          <input type="text" id="disc-user-${ep.id}" class="form-control" style="flex:0 0 160px; padding:8px 12px;" placeholder="Your Name" required />
          <input type="text" id="disc-text-${ep.id}" class="form-control" style="flex:1; padding:8px 12px;" placeholder="Share your thoughts on this topic..." required />
          <button type="submit" class="btn btn-primary" style="padding:8px 16px;">Post Comment</button>
        </form>
      </div>

      <!-- Interactive Poll -->
      <div style="background:var(--accent-gold-bg); border:1.5px solid #F3D9A4; border-radius:14px; padding:18px; margin-bottom:18px;">
        <div style="font-size:0.75rem; font-weight:800; color:#92400E; text-transform:uppercase; margin-bottom:4px;">
          🎁 Episode Poll • Vote to Unlock Brand Partner Voucher
        </div>
        <h4 style="font-size:1rem; font-weight:800; margin-bottom:10px;">${ep.poll.question}</h4>
        <div style="display:grid; gap:8px; margin-bottom:12px;">
          ${ep.poll.options
            .map(
              (opt) => `
            <button class="btn ${votedChoice === opt ? "btn-primary" : "btn-secondary"}"
                    style="justify-content:flex-start; text-align:left; border-radius:10px; padding:9px 14px;"
                    onclick="voteEpisodePoll('${ep.id}', '${opt.replace(/'/g, "\\'")}')">
              ${votedChoice === opt ? "✅ " : "⚪ "} ${opt}
            </button>
          `
            )
            .join("")}
        </div>
        ${
          votedChoice
            ? `
          <div style="background:#FFFFFF; border:2px dashed var(--accent-crimson); padding:12px; border-radius:10px;">
            <div style="font-weight:800; color:var(--accent-crimson);">🎉 Unlocked Partner Privilege: ${ep.poll.sponsorReward}</div>
            <div style="display:inline-block; background:var(--accent-crimson-light); color:var(--accent-crimson); font-weight:900; padding:3px 10px; border-radius:6px; font-size:0.85rem; margin-top:4px;">
              PRIVILEGE CODE: ${ep.poll.couponCode}
            </div>
          </div>
        `
            : `<div style="font-size:0.8rem; color:#92400E; font-weight:600;">👆 Vote above to unlock your Brand Partner privilege code!</div>`
        }
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="openGuestMessageModal('${ep.guestId}', '${ep.guestName.replace(/'/g, "\\'")}')">
          💬 Send Business Lead / Query to ${ep.guestName}
        </button>
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      </div>
    `;
    openModal(html);
  };

  window.postEpisodeComment = function (e, epId) {
    e.preventDefault();
    const user = document.getElementById("disc-user-" + epId).value.trim();
    const comment = document.getElementById("disc-text-" + epId).value.trim();
    if (!user || !comment) return;

    const ep = DATA.episodes.find((x) => x.id === epId);
    const savedDisc = JSON.parse(localStorage.getItem("rr_disc_" + epId) || "null") || (ep ? ep.discussions : []) || [];
    savedDisc.unshift({ user, comment, time: "Just now" });
    localStorage.setItem("rr_disc_" + epId, JSON.stringify(savedDisc));
    if (ep) ep.discussions = savedDisc;

    addPoints(15, "Posted Topic Discussion Comment");
    openEpisodeModal(epId);
  };

  window.voteEpisodePoll = function (epId, optionText) {
    const firstTime = !state.votedPolls[epId];
    state.votedPolls[epId] = optionText;
    localStorage.setItem("rr_polls", JSON.stringify(state.votedPolls));
    if (firstTime) {
      addPoints(15, "Voted in Episode Poll");
    }
    openEpisodeModal(epId);
    renderNetflixCatalog();
  };

  // 6. Render 9:16 Vertical Viral Reels Shelf (With Auto-Thumbnail & Playable Preview)
  function renderViralReels() {
    const row = document.getElementById("reels-row");
    if (!row) return;
    row.innerHTML = DATA.viralReels
      .map((r) => {
        const thumbSrc = resolveThumbUrl(r.thumbnail, r.videoUrl);
        return `
      <div class="reel-card" onclick="openReelModal('${r.id}')">
        <div class="reel-Vertical-Img">
          <img src="${thumbSrc}" alt="${r.title}" loading="lazy" />
          <div class="reel-overlay-top">
            <span class="reel-views-pill">🔥 ${r.views}</span>
            <span class="reel-play-badge">▶</span>
          </div>
        </div>
        <div class="reel-info-box">
          <span class="domain-tag ${domainCssClass(r.category)}" style="display:inline-block; margin-bottom:6px;">${r.category}</span>
          <h4>${state.lang === "te" ? r.titleTe : r.title}</h4>
          <p>${r.guest} • ❤️ ${r.likes}</p>
        </div>
      </div>
    `;
      })
      .join("");
  }

  window.openReelModal = function (reelId) {
    const r = DATA.viralReels.find((x) => x.id === reelId) || DATA.viralReels[0];
    const videoLink = r.videoUrl || r.thumbnail || "https://www.youtube.com/@RajaRaveendarTalks/shorts";
    const ytId = extractYouTubeId(videoLink) || extractYouTubeId(r.thumbnail);
    const thumbSrc = resolveThumbUrl(r.thumbnail, r.videoUrl);

    const reelPlayerHTML = ytId
      ? `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" title="${r.title}" style="width:100%; height:100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      : `<img src="${thumbSrc}" alt="${r.title}" style="width:100%; height:100%; object-fit:cover;" />`;

    const html = `
      <span class="pill-badge pill-crimson">🔥 VIRAL REEL PREVIEW • ${r.views}</span>
      <h3 style="font-size:1.35rem; font-weight:900; margin:10px 0 4px;">${r.title}</h3>
      <p style="color:var(--accent-crimson); font-weight:700; margin-bottom:14px;">${r.titleTe}</p>
      <div style="display:grid; grid-template-columns: 270px 1fr; gap:22px; align-items:center;">
        <div style="border-radius:14px; overflow:hidden; aspect-ratio:9/16; border:1px solid var(--border-light); background:#000;">
          ${reelPlayerHTML}
        </div>
        <div>
          <div style="font-weight:800; margin-bottom:8px;">🎙️ Featured Guest: ${r.guest}</div>
          <blockquote style="background:var(--bg-primary); border-left:4px solid var(--accent-crimson); padding:14px; border-radius:8px; font-style:italic; margin-bottom:16px;">
            "${r.quote}"
          </blockquote>
          <p style="font-size:0.86rem; color:var(--text-secondary); margin-bottom:16px;">
            ❤️ ${r.likes} • Part of @rajaraveendar's 8.2M Monthly Instagram Reel Views & 6.49M Facebook Reel Reach.
          </p>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="${ytId ? `https://www.youtube.com/shorts/${ytId}` : videoLink}" target="_blank" class="btn btn-primary">
              ▶ Open on YouTube Shorts ↗
            </a>
            <button class="btn btn-secondary" onclick="shareWisdomText('${r.title.replace(/'/g, "\\'")} - Raja Raveendar Talks')">
              📲 Share on WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;
    openModal(html);
  };

  // 7. Wisdom Quotes Wall
  function renderWisdomQuotes() {
    const grid = document.getElementById("wisdom-grid");
    if (!grid) return;
    grid.innerHTML = DATA.wisdomQuotes
      .map((w) => {
        const text = state.lang === "te" ? w.quoteTe : w.quoteEn;
        return `
        <div class="wisdom-card">
          <div>
            <span class="domain-tag ${domainCssClass(w.category)}" style="display:inline-block; margin-bottom:10px;">${w.episode}</span>
            <p class="wisdom-quote-text">“${text}”</p>
          </div>
          <div class="wisdom-footer">
            <strong>— ${w.author}</strong>
            <div style="display:flex; gap:8px;">
              <button class="ep-btn-sm" onclick="shareWisdomText('${text.replace(/'/g, "\\'")} — ${w.author} (Raja’s Legacy Lounge)')">
                📲 WhatsApp Share
              </button>
              <button class="ep-btn-sm" onclick="copyTextToClipboard('${text.replace(/'/g, "\\'")} — ${w.author}')">
                📋 Copy Quote
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  window.shareWisdomText = function (text) {
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
    addPoints(5, "Shared Legacy Lounge Quote");
  };

  window.copyTextToClipboard = function (text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    showToast("📋 Copied to clipboard!");
  };

  // 8. Distinguished Guests Directory & Business Lead / Query Forwarding
  window.filterGuests = function (domain) {
    state.guestFilter = domain;
    document.querySelectorAll("#guest-filter-pills .cat-pill").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.domain === domain);
    });
    renderGuestsDirectory();
  };

  function renderGuestsDirectory() {
    const grid = document.getElementById("guests-grid");
    if (!grid) return;

    const list =
      state.guestFilter === "All"
        ? DATA.guests
        : DATA.guests.filter((g) => g.domain === state.guestFilter);

    grid.innerHTML = list
      .map((g) => {
        const latestMsg = g.messages && g.messages.length ? g.messages[g.messages.length - 1] : null;
        return `
        <div class="guest-card">
          <div class="guest-header">
            <img src="${g.avatar}" alt="${g.name}" class="guest-avatar" loading="lazy" />
            <div>
              <span class="domain-tag ${domainCssClass(g.domain)}">${g.domain} • ${g.episodeRef}</span>
              <h3 style="font-size:1.08rem; font-weight:800; margin-top:4px;">${g.name}</h3>
              <div style="font-size:0.78rem; color:var(--text-secondary); font-weight:600;">${g.title}</div>
            </div>
          </div>
          <p class="guest-bio">${g.bio}</p>
          <div class="guest-specialties">
            ${g.specialties.map((sp) => `<span class="specialty-chip">${sp}</span>`).join("")}
          </div>
          ${
            latestMsg
              ? `
            <div class="fan-message-preview">
              <div style="font-weight:800; color:var(--text-primary); margin-bottom:2px;">
                💬 Recent Query / Lead (${g.messages.length}) — ${latestMsg.sender}:
              </div>
              <div style="color:var(--text-secondary);">"${latestMsg.text}"</div>
              ${
                latestMsg.reply
                  ? `<div style="margin-top:4px; color:var(--accent-crimson); font-weight:700;">↪ Status: ${latestMsg.reply}</div>`
                  : ""
              }
            </div>
          `
              : `<div class="fan-message-preview" style="color:var(--text-muted);">Have a business lead, medical/industry query, or feedback for ${g.name}? Click below so our team can forward it to them!</div>`
          }
          <div style="margin-top:auto;">
            <button class="btn btn-primary" style="width:100%; padding:10px;" onclick="openGuestMessageModal('${g.id}', '${g.name.replace(/'/g, "\\'")}')">
              💬 Send Query / Business Lead to Guest
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  window.openGuestMessageModal = function (guestId, guestNameFallback) {
    const guest = DATA.guests.find((g) => g.id === guestId) || {
      id: guestId,
      name: guestNameFallback || "Legacy Lounge Guest",
      domain: "Legacy Lounge",
      title: "Featured Guest",
      messages: []
    };

    const existingMsgs = (guest.messages || [])
      .map(
        (m) => `
      <div style="background:var(--bg-primary); padding:12px; border-radius:10px; border:1px solid var(--border-light); margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:800;">
          <span>👤 ${m.sender}</span>
          <span class="pill-badge pill-gold" style="font-size:0.68rem;">${m.type}</span>
        </div>
        <p style="font-size:0.88rem; margin-top:4px;">${m.text}</p>
        ${m.reply ? `<div style="font-size:0.78rem; color:var(--accent-crimson); font-weight:700; margin-top:4px;">↪ ${m.reply}</div>` : ""}
      </div>
    `
      )
      .join("");

    const html = `
      <span class="pill-badge pill-crimson">VIEWER-TO-GUEST BRIDGE • RAJA RAVEENDAR NETWORK</span>
      <h3 style="font-size:1.4rem; font-weight:900; margin:8px 0 4px;">Send Query, Feedback or Business Lead to ${guest.name}</h3>
      <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:16px;">
        Write a query, appreciation feedback, or a serious business/consulting lead related to the podcast. Our team reviews and forwards verified messages directly to <strong>${guest.name}</strong>.
      </p>

      <form onsubmit="submitGuestMessage(event, '${guest.id}', '${guest.name.replace(/'/g, "\\'")}')" style="margin-bottom:20px;">
        <div class="dual-forms-grid" style="gap:12px;">
          <div class="form-group">
            <label>Your Name, Organization & City *</label>
            <input type="text" id="gm-sender" class="form-control" placeholder="e.g., Ramesh K. (Founder, Hyderabad)" required />
          </div>
          <div class="form-group">
            <label>Message Category *</label>
            <select id="gm-type" class="form-control">
              <option value="Business Lead / Collaboration">💼 Business Lead / Collaboration Proposal</option>
              <option value="Important Podcast Query">❓ Important Query Related to Episode Topic</option>
              <option value="Medical / Expert Consultation">🏥 Consultation / Appointment Request</option>
              <option value="Viewer Feedback & Appreciation">👏 Viewer Feedback & Appreciation</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Your WhatsApp Number & Email (for our team to connect you with the Guest) *</label>
          <input type="text" id="gm-contact" class="form-control" placeholder="+91 98XXX XXXXX / email@domain.com" required />
        </div>
        <div class="form-group">
          <label>Detailed Query / Business Lead / Feedback for ${guest.name} *</label>
          <textarea id="gm-text" rows="3" class="form-control" placeholder="Describe your query, business lead, or feedback clearly..." required></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">
          🚀 Submit for Guest Forwarding (+20 Points)
        </button>
      </form>

      <div>
        <h4 style="font-size:0.92rem; font-weight:800; margin-bottom:10px;">Verified Queries & Leads Sent to ${guest.name}:</h4>
        ${existingMsgs || `<p style="font-size:0.84rem; color:var(--text-muted);">Be the first to send a query or business lead to ${guest.name}!</p>`}
      </div>
    `;
    openModal(html);
  };

  window.submitGuestMessage = function (e, guestId, guestName) {
    e.preventDefault();
    const sender = document.getElementById("gm-sender").value.trim();
    const type = document.getElementById("gm-type").value;
    const text = document.getElementById("gm-text").value.trim();

    let guest = DATA.guests.find((g) => g.id === guestId);
    if (!guest) {
      guest = {
        id: guestId,
        name: guestName,
        domain: "Entertainment",
        title: "Legacy Lounge Guest",
        org: "Raja’s Legacy Lounge",
        episodeRef: "Featured Episode",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
        bio: "Featured guest on Raja’s Legacy Lounge.",
        specialties: ["Legacy Lounge Guest"],
        messages: []
      };
      DATA.guests.push(guest);
    }

    guest.messages.push({
      sender,
      type,
      text,
      reply: "Verified & queued by Raja Raveendar Network to forward to the guest."
    });

    const allSaved = JSON.parse(localStorage.getItem("rr_guest_messages_v2") || "{}");
    allSaved[guest.id] = guest.messages;
    localStorage.setItem("rr_guest_messages_v2", JSON.stringify(allSaved));

    const contact = document.getElementById("gm-contact") ? document.getElementById("gm-contact").value.trim() : "";
    postToBackendInbox("guestMessages", {
      guestName,
      sender,
      contact,
      type,
      message: text
    });

    addPoints(20, `Sent ${type} to ${guestName}`);
    renderGuestsDirectory();
    closeModal();
    showToast(`✅ Your <strong>${type}</strong> for <strong>${guestName}</strong> has been received and queued for guest forwarding!`);
  };

  // 9. Viewer Suggestions & Upvoting for Upcoming Episodes
  function renderKnowledgePanel() {
    const qList = document.getElementById("questions-list");
    if (!qList) return;

    const sorted = [...DATA.upcomingQuestions].sort((a, b) => b.upvotes - a.upvotes);
    qList.innerHTML = sorted
      .map((q) => {
        const voted = state.upvotedIds.includes(q.id);
        return `
        <div class="question-card">
          <button class="upvote-btn ${voted ? "voted" : ""}" onclick="toggleUpvoteQuestion('${q.id}')">
            <span>▲</span>
            <span>${q.upvotes}</span>
          </button>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
              <span class="domain-tag ${domainCssClass(q.domain)}">${q.upcomingGuest}</span>
              <span class="pill-badge pill-gold" style="font-size:0.68rem;">${q.status}</span>
            </div>
            <p style="font-weight:700; font-size:0.94rem; margin-bottom:4px;">“${q.question}”</p>
            <div style="font-size:0.78rem; color:var(--text-muted);">Suggested by ${q.author}</div>
          </div>
        </div>
      `;
      })
      .join("");

    document.querySelectorAll(".user-points-count").forEach((el) => {
      el.textContent = state.communityPoints;
    });
  }

  window.toggleUpvoteQuestion = function (qId) {
    const item = DATA.upcomingQuestions.find((q) => q.id === qId);
    if (!item) return;

    const idx = state.upvotedIds.indexOf(qId);
    if (idx === -1) {
      state.upvotedIds.push(qId);
      item.upvotes += 1;
      addPoints(10, "Upvoted Upcoming Episode Question");
    } else {
      state.upvotedIds.splice(idx, 1);
      item.upvotes -= 1;
    }

    localStorage.setItem("rr_upvoted", JSON.stringify(state.upvotedIds));
    localStorage.setItem("rr_custom_questions_v2", JSON.stringify(DATA.upcomingQuestions));
    renderKnowledgePanel();
  };

  window.submitNewPanelQuestion = function (e) {
    e.preventDefault();
    const author = document.getElementById("kp-author").value.trim();
    const guestTarget = document.getElementById("kp-guest-target").value;
    const question = document.getElementById("kp-question-text").value.trim();
    if (!question) return;

    const newQ = {
      id: "q-" + Date.now(),
      upcomingGuest: guestTarget,
      domain: guestTarget.includes("Health") ? "Healthcare" : "Entertainment",
      author,
      question,
      upvotes: 1,
      status: "Viewer Question Pitch"
    };

    DATA.upcomingQuestions.unshift(newQ);
    state.upvotedIds.push(newQ.id);
    localStorage.setItem("rr_custom_questions_v2", JSON.stringify(DATA.upcomingQuestions));
    localStorage.setItem("rr_upvoted", JSON.stringify(state.upvotedIds));

    e.target.reset();
    addPoints(30, "Suggested Question for Upcoming Episode");
    renderKnowledgePanel();
  };

  // 10. Render Goodies & Brand Partner Giveaways
  function renderGoodies() {
    const grid = document.getElementById("goodies-grid");
    if (!grid) return;

    grid.innerHTML = DATA.goodies
      .map((g) => {
        const claimed = state.claimedGoodies.includes(g.id);
        return `
        <div class="goodie-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span class="pill-badge pill-gold">${g.badge}</span>
              <span style="font-size:0.74rem; font-weight:700; color:var(--accent-crimson);">${g.category}</span>
            </div>
            <h4 style="font-size:1.02rem; font-weight:800; margin-bottom:6px;">${g.title}</h4>
            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:10px;">
              Partner: ${g.sponsor}
            </div>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:14px;">${g.description}</p>
          </div>
          <div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:10px;">
              🔥 ${g.claimedCount + (claimed ? 1 : 0)} viewers registered • For: <strong>${g.pointsRequired}</strong>
            </div>
            <button class="btn ${claimed ? "btn-secondary" : "btn-primary"}" style="width:100%;" onclick="claimGoodie('${g.id}', '${g.title.replace(/'/g, "\\'")}')">
              ${claimed ? "✅ Registered for Reward" : "🎁 Claim / Enter Partner Draw"}
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  window.claimGoodie = function (goodieId, title) {
    if (state.claimedGoodies.includes(goodieId)) {
      showToast(`ℹ️ You are already registered for <strong>${title}</strong>!`);
      return;
    }
    state.claimedGoodies.push(goodieId);
    localStorage.setItem("rr_goodies", JSON.stringify(state.claimedGoodies));
    renderGoodies();
    showToast(`🎁 Registered for <strong>${title}</strong>!`);
  };

  // 11. Render All 6 Real Brand Partners (360 Life, Mirrors, Suchirindia, KLC, Ashya Foods, DiaGrand)
  function renderSponsors() {
    const grid = document.getElementById("sponsors-grid");
    if (!grid) return;

    grid.innerHTML = DATA.sponsors
      .map(
        (sp) => `
      <div class="sponsor-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
            <span class="sponsor-logo-pill" style="color:${sp.accentColor}; border-color:${sp.accentColor}44;">
              ${sp.logoText}
            </span>
            <span class="pill-badge pill-crimson" style="font-size:0.68rem;">${sp.category}</span>
          </div>
          <h3 style="font-size:1.18rem; font-weight:800; margin-bottom:6px;">${sp.name}</h3>
          <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:8px;">${sp.tagline}</p>
          <div style="font-size:0.78rem; font-weight:700; color:var(--text-muted);">
            🎬 ${sp.integration}
          </div>
          <div class="sponsor-offer-box">
            🏷️ <strong>Legacy Lounge Privilege:</strong> ${sp.exclusiveOffer}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
          <button class="btn btn-primary" style="flex:1; padding:9px 12px; font-size:0.82rem;" onclick="openBrandConnectModal('${sp.id}')">
            💬 Communicate with Brand
          </button>
          <button class="btn btn-secondary" style="padding:9px 12px; font-size:0.82rem;" onclick="copyTextToClipboard('${sp.exclusiveOffer}')">
            📋 Copy
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }

  window.openBrandConnectModal = function (spId) {
    const sp = DATA.sponsors.find((s) => s.id === spId) || DATA.sponsors[0];
    const html = `
      <span class="pill-badge pill-crimson">${sp.tier} • DIRECT BRAND CONCIERGE</span>
      <h3 style="font-size:1.4rem; font-weight:900; margin:8px 0 4px;">Connect with ${sp.name}</h3>
      <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:14px;">
        ${sp.tagline}
      </p>
      <div class="sponsor-offer-box" style="margin-bottom:16px;">
        🎁 ${sp.exclusiveOffer}
      </div>
      <form onsubmit="submitBrandCommunication(event, '${sp.name.replace(/'/g, "\\'")}')">
        <div class="dual-forms-grid" style="gap:12px;">
          <div class="form-group">
            <label>Your Name *</label>
            <input type="text" class="form-control" placeholder="Full Name" required />
          </div>
          <div class="form-group">
            <label>Phone / WhatsApp Number *</label>
            <input type="text" class="form-control" placeholder="+91 98XXX XXXXX" required />
          </div>
        </div>
        <div class="form-group">
          <label>Inquiry Type for ${sp.name} *</label>
          <select class="form-control">
            <option>Claim Legacy Lounge Viewer Offer / Site Visit / Booking</option>
            <option>Business / Franchise / B2B Inquiry</option>
            <option>Request Callback from Brand Representative</option>
          </select>
        </div>
        <div class="form-group">
          <label>Your Message *</label>
          <textarea rows="3" class="form-control" placeholder="Share your requirement or preferred time for callback..." required></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">
          📨 Send Direct Inquiry to ${sp.name}
        </button>
      </form>
    `;
    openModal(html);
  };

  window.submitBrandCommunication = function (e, brandName) {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input, select, textarea");
    postToBackendInbox("brandMessages", {
      brandName,
      senderName: inputs[0] ? inputs[0].value : "",
      phone: inputs[1] ? inputs[1].value : "",
      inquiryType: inputs[2] ? inputs[2].value : "",
      message: inputs[3] ? inputs[3].value : ""
    });
    closeModal();
    addPoints(15, `Connected with ${brandName}`);
    showToast(`🤝 Your message has been routed to the <strong>${brandName}</strong> team!`);
  };

  window.submitNewSponsorPitch = function (e) {
    e.preventDefault();
    const company = document.getElementById("sp-company").value.trim();
    const role = document.getElementById("sp-tier-select").value;
    const inputs = e.target.querySelectorAll("input, textarea");
    postToBackendInbox("sponsorInquiries", {
      company,
      role,
      contactPerson: inputs[1] ? inputs[1].value : "",
      phoneEmail: inputs[2] ? inputs[2].value : "",
      brief: inputs[3] ? inputs[3].value : ""
    });
    e.target.reset();
    showToast(`🚀 Thank you! Our Sponsorship & Production Desk will connect with <strong>${company}</strong> regarding <strong>${role}</strong> within 24 hours.`);
  };

  // 12. The Raja Raveendar Network: Creators/Influencers Talent Pool & Internships
  function renderCreatorNetwork() {
    const poolEl = document.getElementById("creator-pool-list");
    if (poolEl) {
      poolEl.innerHTML = DATA.creatorTalentPool
        .map(
          (c) => `
        <div style="background:var(--bg-primary); border:1px solid var(--border-light); border-radius:10px; padding:12px 14px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
          <div>
            <div style="font-weight:800; font-size:0.92rem;">🎬 ${c.name} — <span style="color:var(--accent-crimson);">${c.type}</span></div>
            <div style="font-size:0.84rem; font-weight:700; margin-top:2px;">Original Work: ${c.workTitle}</div>
            <div style="font-size:0.78rem; color:var(--text-secondary);">Skills: ${c.skills}</div>
          </div>
          <span class="pill-badge pill-gold">${c.status}</span>
        </div>
      `
        )
        .join("");
    }

    const internGrid = document.getElementById("intern-tracks-grid");
    if (internGrid) {
      internGrid.innerHTML = DATA.internshipTracks
        .map(
          (t) => `
        <div class="intern-track-card" onclick="selectInternTrack('${t.title}')">
          <div style="font-size:1.4rem; margin-bottom:4px;">${t.icon}</div>
          <div style="font-weight:800; font-size:0.9rem; color:var(--text-primary);">${t.title}</div>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px;">${t.desc}</p>
        </div>
      `
        )
        .join("");
    }
  }

  window.selectInternTrack = function (trackTitle) {
    const sel = document.getElementById("intern-role-select");
    if (sel) {
      sel.value = trackTitle;
      sel.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast(`✨ Selected Internship Track: <strong>${trackTitle}</strong>. Fill your details below to apply!`);
    }
  };

  window.submitCreatorProfile = function (e) {
    e.preventDefault();
    const name = document.getElementById("cr-name").value.trim();
    const type = document.getElementById("cr-type").value;
    const workTitle = document.getElementById("cr-work").value.trim();
    const skills = document.getElementById("cr-skills").value.trim();

    DATA.creatorTalentPool.unshift({
      name,
      type,
      workTitle,
      skills,
      status: "New Talent Pool Entry"
    });
    localStorage.setItem("rr_creator_pool", JSON.stringify(DATA.creatorTalentPool));
    postToBackendInbox("creatorRegistrations", { name, category: type, workTitle, skills });
    e.target.reset();
    renderCreatorNetwork();
    addPoints(35, "Joined Creator / Influencer Network");
    showToast(`🌟 Welcome <strong>${name}</strong>! Your profile & original work have been added to the Raja Raveendar Talent Pool.`);
  };

  window.submitInternshipApplication = function (e) {
    e.preventDefault();
    const name = document.getElementById("intern-name").value.trim();
    const track = document.getElementById("intern-role-select").value;
    const inputs = e.target.querySelectorAll("input");
    postToBackendInbox("internshipApplications", {
      applicantName: name,
      track,
      contact: inputs[1] ? inputs[1].value : "",
      portfolioLink: inputs[2] ? inputs[2].value : ""
    });
    e.target.reset();
    addPoints(25, `Applied for ${track} Internship`);
    showToast(`🎓 Application received for <strong>${name}</strong> in <strong>${track}</strong>! Our production team will review your portfolio.`);
  };

  window.submitVVIPApplication = function (e) {
    e.preventDefault();
    const vvipName = document.getElementById("vvip-name").value.trim();
    const domain = document.getElementById("vvip-domain").value;
    const inputs = e.target.querySelectorAll("input, textarea");
    postToBackendInbox("vvipApplications", {
      guestName: vvipName,
      domain,
      achievements: inputs[1] ? inputs[1].value : "",
      storyAngle: inputs[2] ? inputs[2].value : "",
      contact: inputs[3] ? inputs[3].value : ""
    });
    e.target.reset();
    showToast(`👑 Guest Profile for <strong>${vvipName} (${domain})</strong> received! Our editorial team will review and connect with shortlisted guests.`);
  };

  // Modal Helpers
  window.openModal = function (innerHTML) {
    const backdrop = document.getElementById("global-modal-backdrop");
    const content = document.getElementById("global-modal-content");
    if (!backdrop || !content) return;
    content.innerHTML = innerHTML;
    backdrop.classList.add("open");
  };

  window.closeModal = function () {
    const backdrop = document.getElementById("global-modal-backdrop");
    if (backdrop) backdrop.classList.remove("open");
  };

  // Initialize Everything
  document.addEventListener("DOMContentLoaded", () => {
    setLanguage(state.lang);
    renderAnalyticsDashboard();
    renderGuestsDirectory();
    renderKnowledgePanel();
    renderGoodies();
    renderSponsors();
    renderCreatorNetwork();
  });
})();
