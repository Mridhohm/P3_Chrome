// Persona 3 Reload New Tab In-World Sliding Controller
document.addEventListener('DOMContentLoaded', () => {
  const rootMenu = document.getElementById('rootMenu');
  const subScreen = document.getElementById('subScreen');
  const subBackBtn = document.getElementById('subBackBtn');
  const subTitleTag = document.getElementById('subTitleTag');
  const searchInput = document.getElementById('searchInput');
  const searchForm = document.getElementById('searchForm');
  const walletHud = document.getElementById('walletHud');
  const walletValue = document.getElementById('walletValue');
  const walletLabel = document.getElementById('walletLabel');

  const menuItems = Array.from(document.querySelectorAll('.menu-item'));
  const panels = {
    search: document.getElementById('panelSearch'),
    bookmarks: document.getElementById('panelBookmarks'),
    pinned: document.getElementById('panelPinned'),
    settings: document.getElementById('panelSettings')
  };

  const panelTitles = {
    search: '// DIRECT SEARCH GATEWAY',
    bookmarks: '// BOOKMARKS INVENTORY',
    pinned: '// PINNED ARCANA APPS',
    settings: '// SYSTEM CONFIGURATION'
  };

  let activeIndex = 0;
  let isSubScreenOpen = false;
  let hudMode = 'time';

  // --- SYNCHRONIZED ENTRANCE ANIMATION (ALIGNED WITH VIDEO INTRO) ---
  document.body.classList.add('intro-animating');

  // Settle into normal state after entrance completes
  const introTimer = setTimeout(() => {
    document.body.classList.remove('intro-animating');
  }, 2100);

  function skipIntro() {
    clearTimeout(introTimer);
    document.body.classList.remove('intro-animating');
  }
  window.addEventListener('keydown', skipIntro, { once: true });
  window.addEventListener('mousedown', skipIntro, { once: true });

  // 1. ROOT MENU NAVIGATION
  function setActiveItem(index, playSound = true) {
    if (!menuItems.length) return;
    if (index < 0) index = menuItems.length - 1;
    if (index >= menuItems.length) index = 0;

    menuItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    activeIndex = index;

    if (playSound && window.soundEngine) {
      window.soundEngine.playHover();
    }
  }

  menuItems.forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
      if (!isSubScreenOpen) {
        setActiveItem(index, true);
      }
    });

    item.addEventListener('click', () => {
      openScreen(item.getAttribute('data-screen'));
    });
  });

  // 2. IN-WORLD SLIDING TRANSITIONS (NO POPUPS)
  function openScreen(screenKey) {
    if (!panels[screenKey]) return;
    if (window.soundEngine) window.soundEngine.playConfirm();

    // Hide all panels, show the targeted one
    Object.keys(panels).forEach(key => {
      if (panels[key]) {
        if (key === screenKey) {
          panels[key].classList.remove('hidden');
        } else {
          panels[key].classList.add('hidden');
        }
      }
    });

    if (subTitleTag && panelTitles[screenKey]) {
      subTitleTag.innerText = panelTitles[screenKey];
    }

    // Slide out root menu to the left, slide in sub-screen from the right
    if (rootMenu) rootMenu.classList.add('slide-out');
    if (subScreen) subScreen.classList.add('slide-in');
    isSubScreenOpen = true;

    // Focus input if opening search
    if (screenKey === 'search' && searchInput) {
      setTimeout(() => searchInput.focus(), 120);
    } else if (screenKey === 'bookmarks') {
      loadBookmarks();
    } else if (screenKey === 'pinned') {
      loadPinnedSites();
    }
  }

  function closeSubScreen(playSound = true) {
    if (!isSubScreenOpen) return;
    if (playSound && window.soundEngine) window.soundEngine.playCancel();

    // Slide sub-screen out to the right, slide root menu back in from left
    if (subScreen) subScreen.classList.remove('slide-in');
    if (rootMenu) rootMenu.classList.remove('slide-out');
    isSubScreenOpen = false;
    hideSuggestions();
  }

  if (subBackBtn) {
    subBackBtn.addEventListener('click', () => closeSubScreen(true));
  }

  // Helper function to escape HTML
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getDomain(urlStr) {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, '');
    } catch {
      return urlStr;
    }
  }

  // 3. GLOBAL KEYBOARD NAVIGATION
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (addShortcutModal && !addShortcutModal.classList.contains('hidden')) {
        closeShortcutModal();
        return;
      }
      if (searchSuggestions && !searchSuggestions.classList.contains('hidden')) {
        hideSuggestions();
        return;
      }
      if (isSubScreenOpen) {
        closeSubScreen(true);
      }
      return;
    }

    // When inside sub-screen
    if (isSubScreenOpen) {
      return; // let user interact with inputs/cards
    }

    // When on root menu
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      setActiveItem(activeIndex - 1, true);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      setActiveItem(activeIndex + 1, true);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (menuItems[activeIndex]) {
        openScreen(menuItems[activeIndex].getAttribute('data-screen'));
      }
    } else if (e.key === '/' || e.key === 'Tab') {
      e.preventDefault();
      openScreen('search');
    }
  });

  // 4A. LIVE GOOGLE SEARCH SUGGESTIONS & AUTOCOMPLETE
  const searchSuggestions = document.getElementById('searchSuggestions');
  let currentSuggestions = [];
  let selectedSuggestionIndex = -1;
  let debounceTimeout = null;

  async function fetchSuggestions(query) {
    if (!query) {
      hideSuggestions();
      return;
    }
    try {
      const endpoint = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Suggestions unavailable');
      const data = await res.json();
      const list = Array.isArray(data[1]) ? data[1].slice(0, 6) : [];
      renderSuggestions(list);
    } catch (err) {
      hideSuggestions();
    }
  }

  function renderSuggestions(list) {
    currentSuggestions = list;
    selectedSuggestionIndex = -1;
    if (!searchSuggestions) return;

    if (!list || list.length === 0) {
      hideSuggestions();
      return;
    }

    searchSuggestions.innerHTML = list.map((item, index) => `
      <div class="p3-suggestion-item" data-index="${index}">
        <div class="suggestion-content">
          <span class="suggestion-icon">//</span>
          <span class="suggestion-text">${escapeHtml(item)}</span>
        </div>
        <span class="suggestion-arrow">↵</span>
      </div>
    `).join('');

    const items = searchSuggestions.querySelectorAll('.p3-suggestion-item');
    items.forEach((el, index) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectSuggestion(index);
      });
      el.addEventListener('mouseenter', () => {
        highlightSuggestion(index, false);
      });
    });

    clearTimeout(hideSuggestionsTimer);
    searchSuggestions.classList.remove('hidden');
  }

  let hideSuggestionsTimer = null;
  function hideSuggestions() {
    if (searchSuggestions) {
      searchSuggestions.classList.add('hidden');
      clearTimeout(hideSuggestionsTimer);
      hideSuggestionsTimer = setTimeout(() => {
        if (searchSuggestions && searchSuggestions.classList.contains('hidden')) {
          searchSuggestions.innerHTML = '';
        }
      }, 200);
    }
    currentSuggestions = [];
    selectedSuggestionIndex = -1;
  }

  function highlightSuggestion(index, updateInput = true) {
    const items = searchSuggestions ? searchSuggestions.querySelectorAll('.p3-suggestion-item') : [];
    items.forEach((el, i) => {
      if (i === index) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
    selectedSuggestionIndex = index;
    if (updateInput && currentSuggestions[index]) {
      searchInput.value = currentSuggestions[index];
    }
    if (window.soundEngine) window.soundEngine.playHover();
  }

  function selectSuggestion(index) {
    if (currentSuggestions[index]) {
      searchInput.value = currentSuggestions[index];
      if (window.soundEngine) window.soundEngine.playConfirm();
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(currentSuggestions[index])}`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      const q = searchInput.value.trim();
      if (!q) {
        hideSuggestions();
      } else {
        debounceTimeout = setTimeout(() => fetchSuggestions(q), 140);
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (!searchSuggestions || searchSuggestions.classList.contains('hidden') || !currentSuggestions.length) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        let next = selectedSuggestionIndex + 1;
        if (next >= currentSuggestions.length) next = 0;
        highlightSuggestion(next, true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        let prev = selectedSuggestionIndex - 1;
        if (prev < 0) prev = currentSuggestions.length - 1;
        highlightSuggestion(prev, true);
      }
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(hideSuggestions, 180);
    });
  }

  // 4B. SEARCH FORM SUBMISSION
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let query = searchInput.value.trim();
      if (selectedSuggestionIndex >= 0 && currentSuggestions[selectedSuggestionIndex]) {
        query = currentSuggestions[selectedSuggestionIndex];
      }
      if (query) {
        if (window.soundEngine) window.soundEngine.playConfirm();
        if (/^(https?:\/\/|www\.)[^\s]+$/i.test(query)) {
          const targetUrl = /^https?:\/\//i.test(query) ? query : `https://${query}`;
          window.location.href = targetUrl;
        } else {
          window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  // 4C. DYNAMIC BOOKMARKS INVENTORY (CHROME BOOKMARKS API)
  const bookmarksList = document.getElementById('bookmarksList');

  const defaultBookmarks = [
    { title: 'YouTube', url: 'https://youtube.com' },
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'Reddit', url: 'https://reddit.com' },
    { title: 'Twitter / X', url: 'https://x.com' },
    { title: 'Persona Central // Atlus News', url: 'https://personacentral.com' },
    { title: 'Atlus Official', url: 'https://atlus.com' }
  ];

  function renderBookmarks(items) {
    if (!bookmarksList) return;
    const bookmarkCandidates = items && items.length ? items : defaultBookmarks;
    const validItems = bookmarkCandidates.filter(b => b && b.url && !b.url.startsWith('chrome://') && !b.url.startsWith('javascript:'));
    
    if (!validItems.length) {
      bookmarksList.innerHTML = `<div class="p3-loading-tag">// NO BOOKMARKS FOUND IN ARCHIVE</div>`;
      return;
    }

    bookmarksList.innerHTML = validItems.slice(0, 15).map((bm, index) => {
      const domain = getDomain(bm.url);
      const num = String(index + 1).padStart(2, '0');
      const title = bm.title || domain;
      const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
      return `
        <a href="${escapeHtml(bm.url)}" class="p3-bookmark-card" target="_blank" rel="noopener noreferrer">
          <span class="card-num">${num}</span>
          <img class="card-favicon" src="${favicon}" onerror="this.style.display='none'" alt="" />
          <span class="card-title">${escapeHtml(title)}</span>
          <span class="card-domain">${escapeHtml(domain)}</span>
          <span class="card-arrow">↗</span>
        </a>
      `;
    }).join('');

    bookmarksList.querySelectorAll('.p3-bookmark-card').forEach(card => {
      card.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playConfirm();
      });
      card.addEventListener('mouseenter', () => {
        if (window.soundEngine) window.soundEngine.playHover();
      });
    });
  }

  function loadBookmarks() {
    if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.getRecent) {
      chrome.bookmarks.getRecent(25, (results) => {
        if (chrome.runtime.lastError || !results || results.length === 0) {
          if (chrome.bookmarks.getTree) {
            chrome.bookmarks.getTree((nodes) => {
              const flat = [];
              function traverse(arr) {
                for (const node of arr) {
                  if (flat.length >= 25) return;
                  if (node.url) flat.push(node);
                  if (node.children) traverse(node.children);
                }
              }
              if (nodes) traverse(nodes);
              renderBookmarks(flat.length ? flat : defaultBookmarks);
            });
          } else {
            renderBookmarks(defaultBookmarks);
          }
        } else {
          renderBookmarks(results);
        }
      });
    } else {
      renderBookmarks(defaultBookmarks);
    }
  }

  // 4D. DYNAMIC PINNED & USER BEHAVIOR TOP SITES
  const pinnedGrid = document.getElementById('pinnedGrid');
  const addShortcutBtn = document.getElementById('addShortcutBtn');
  const resetShortcutBtn = document.getElementById('resetShortcutBtn');
  const addShortcutModal = document.getElementById('addShortcutModal');
  const shortcutNameInput = document.getElementById('shortcutNameInput');
  const shortcutUrlInput = document.getElementById('shortcutUrlInput');
  const cancelShortcutBtn = document.getElementById('cancelShortcutBtn');
  const confirmShortcutBtn = document.getElementById('confirmShortcutBtn');

  const arcanaBadges = [
    '00 // FOOL', '01 // MAGICIAN', '02 // PRIESTESS', '03 // EMPRESS',
    '04 // EMPEROR', '05 // HIEROPHANT', '06 // LOVERS', '07 // CHARIOT',
    '08 // JUSTICE', '09 // HERMIT', '10 // FORTUNE', '11 // STRENGTH',
    '12 // HANGED', '13 // DEATH', '14 // TEMPERANCE', '15 // DEVIL'
  ];

  const defaultTopSites = [
    { title: 'YouTube', url: 'https://www.youtube.com' },
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'Reddit', url: 'https://www.reddit.com' },
    { title: 'Twitter / X', url: 'https://x.com' },
    { title: 'Discord', url: 'https://discord.com' },
    { title: 'Twitch', url: 'https://www.twitch.tv' },
    { title: 'Netflix', url: 'https://www.netflix.com' },
    { title: 'Spotify', url: 'https://open.spotify.com' }
  ];

  let currentPinnedList = [];

  function renderPinned(sites) {
    if (!pinnedGrid) return;
    currentPinnedList = sites && sites.length ? [...sites] : [...defaultTopSites];

    if (!currentPinnedList.length) {
      pinnedGrid.innerHTML = `<div class="p3-loading-tag">// NO PINNED SITES ACTIVE</div>`;
      return;
    }

    pinnedGrid.innerHTML = currentPinnedList.slice(0, 12).map((site, index) => {
      const domain = getDomain(site.url);
      const title = site.title || domain;
      const arcana = arcanaBadges[index % arcanaBadges.length];
      const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
      return `
        <a href="${escapeHtml(site.url)}" class="p3-arcana-card" target="_blank" rel="noopener noreferrer">
          <button class="card-remove-btn" title="Remove Shortcut" data-index="${index}">✕</button>
          <div class="arcana-header">
            <img class="arcana-favicon" src="${favicon}" onerror="this.style.display='none'" alt="" />
            <span class="arcana-badge">${arcana}</span>
          </div>
          <div class="arcana-name">${escapeHtml(title)}</div>
          <span class="arcana-icon">✦</span>
        </a>
      `;
    }).join('');

    pinnedGrid.querySelectorAll('.card-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        removePinnedItem(idx);
      });
    });

    pinnedGrid.querySelectorAll('.p3-arcana-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (window.soundEngine) window.soundEngine.playHover();
      });
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('card-remove-btn')) return;
        if (window.soundEngine) window.soundEngine.playConfirm();
      });
    });
  }

  function removePinnedItem(index) {
    if (index >= 0 && index < currentPinnedList.length) {
      if (window.soundEngine) window.soundEngine.playCancel();
      currentPinnedList.splice(index, 1);
      localStorage.setItem('p3r_custom_pinned', JSON.stringify(currentPinnedList));
      renderPinned(currentPinnedList);
    }
  }

  function loadPinnedSites() {
    const saved = localStorage.getItem('p3r_custom_pinned');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          renderPinned(parsed);
          return;
        }
      } catch (err) {
        console.error('Failed to parse saved pinned sites', err);
      }
    }

    if (typeof chrome !== 'undefined' && chrome.topSites && chrome.topSites.get) {
      chrome.topSites.get((sites) => {
        if (chrome.runtime.lastError || !sites || !sites.length) {
          renderPinned(defaultTopSites);
        } else {
          renderPinned(sites);
        }
      });
    } else {
      renderPinned(defaultTopSites);
    }
  }

  function closeShortcutModal() {
    if (addShortcutModal) addShortcutModal.classList.add('hidden');
    if (window.soundEngine) window.soundEngine.playCancel();
  }

  if (addShortcutBtn && addShortcutModal) {
    addShortcutBtn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playConfirm();
      addShortcutModal.classList.remove('hidden');
      if (shortcutNameInput) {
        shortcutNameInput.value = '';
        shortcutNameInput.focus();
      }
      if (shortcutUrlInput) shortcutUrlInput.value = '';
    });
  }

  if (cancelShortcutBtn) {
    cancelShortcutBtn.addEventListener('click', closeShortcutModal);
  }

  function confirmAddShortcut() {
    if (!shortcutUrlInput) return;
    let url = shortcutUrlInput.value.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    const name = (shortcutNameInput && shortcutNameInput.value.trim()) || getDomain(url);

    currentPinnedList.unshift({ title: name, url: url });
    localStorage.setItem('p3r_custom_pinned', JSON.stringify(currentPinnedList));
    renderPinned(currentPinnedList);

    if (addShortcutModal) addShortcutModal.classList.add('hidden');
    if (window.soundEngine) window.soundEngine.playConfirm();
  }

  if (confirmShortcutBtn) {
    confirmShortcutBtn.addEventListener('click', confirmAddShortcut);
  }

  [shortcutNameInput, shortcutUrlInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          confirmAddShortcut();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeShortcutModal();
        }
      });
    }
  });

  if (resetShortcutBtn) {
    resetShortcutBtn.addEventListener('click', () => {
      localStorage.removeItem('p3r_custom_pinned');
      if (window.soundEngine) window.soundEngine.playConfirm();
      resetShortcutBtn.innerText = 'RESTORED! ✓';
      loadPinnedSites();
      setTimeout(() => {
        resetShortcutBtn.innerText = '↺ RESTORE BEHAVIOR TOP SITES';
      }, 1200);
    });
  }

  // Pre-load data in background
  loadBookmarks();
  loadPinnedSites();

  // 5. SETTINGS CONTROLS
  const btnSoundState = document.getElementById('btnSoundState');
  const settingSoundToggle = document.getElementById('settingSoundToggle');
  const tunerSlider = document.getElementById('tunerSlider');
  const tunerValueText = document.getElementById('tunerValueText');
  const saveTunerBtn = document.getElementById('saveTunerBtn');

  let loopStartTime = parseFloat(localStorage.getItem('p3r_loop_start')) || 2.40;

  if (btnSoundState) {
    btnSoundState.innerText = window.soundEngine && window.soundEngine.enabled ? 'ENABLED' : 'MUTED';
    if (settingSoundToggle) {
      settingSoundToggle.addEventListener('click', () => {
        if (window.soundEngine) {
          const isEnabled = window.soundEngine.toggle();
          btnSoundState.innerText = isEnabled ? 'ENABLED' : 'MUTED';
        }
      });
    }
  }

  if (tunerSlider && tunerValueText) {
    tunerSlider.value = loopStartTime;
    tunerValueText.innerText = `${loopStartTime.toFixed(2)}s`;

    tunerSlider.addEventListener('input', () => {
      loopStartTime = parseFloat(tunerSlider.value);
      tunerValueText.innerText = `${loopStartTime.toFixed(2)}s`;
      if (activeVideo) {
        activeVideo.currentTime = loopStartTime;
      }
    });

    if (saveTunerBtn) {
      saveTunerBtn.addEventListener('click', () => {
        localStorage.setItem('p3r_loop_start', loopStartTime.toFixed(2));
        if (window.soundEngine) window.soundEngine.playConfirm();
        saveTunerBtn.innerText = 'SAVED! ✓';
        setTimeout(() => {
          saveTunerBtn.innerText = 'SAVE TIMING ↵';
        }, 1200);
      });
    }
  }

  // 6. TOP-LEFT HUD WALLET CLOCK / DATE
  function updateHud() {
    if (!walletValue || !walletLabel) return;
    const now = new Date();
    if (hudMode === 'time') {
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      walletValue.innerText = `${h}:${m}:${s}`;
      walletLabel.innerText = 'CURRENT TIME';
    } else {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      walletValue.innerText = `${days[now.getDay()]} ${months[now.getMonth()]}.${now.getDate()}`;
      walletLabel.innerText = 'CALENDAR DATE';
    }
  }

  if (walletHud) {
    walletHud.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playHover();
      hudMode = hudMode === 'time' ? 'date' : 'time';
      updateHud();
    });
  }

  let hudInterval = setInterval(updateHud, 1000);
  updateHud();

  // 7. SEAMLESS DUAL-LAYER CROSSFADE VIDEO ENGINE
  const videoA = document.getElementById('bgVideoA');
  const videoB = document.getElementById('bgVideoB');
  let activeVideo = videoA;
  let standbyVideo = videoB;
  let isCrossfading = false;
  const FADE_DURATION = 0.75; // 750ms silky-smooth dissolve

  function triggerCrossfade() {
    if (isCrossfading || !activeVideo || !standbyVideo) return;
    isCrossfading = true;

    // Enable GPU compositor layer only during active crossfade
    standbyVideo.classList.add('crossfading');
    activeVideo.classList.add('crossfading');

    // Prepare standby video at the loop start point
    standbyVideo.currentTime = loopStartTime;
    standbyVideo.play().then(() => {
      // Crossfade: Bring standby to foreground, fade active to background
      standbyVideo.classList.remove('standby-video');
      standbyVideo.classList.add('active-video');

      activeVideo.classList.remove('active-video');
      activeVideo.classList.add('standby-video');

      // Once dissolve finishes, pause the old video and swap roles
      setTimeout(() => {
        if (activeVideo) activeVideo.pause();
        const prevActive = activeVideo;
        activeVideo = standbyVideo;
        standbyVideo = prevActive;
        // Unbind GPU compositor layers when idle to release VRAM
        activeVideo.classList.remove('crossfading');
        standbyVideo.classList.remove('crossfading');
        isCrossfading = false;
      }, FADE_DURATION * 1000);
    }).catch(() => {
      activeVideo.classList.remove('crossfading');
      standbyVideo.classList.remove('crossfading');
      isCrossfading = false;
    });
  }

  function setupVideoMonitoring(v) {
    if (!v) return;
    v.addEventListener('timeupdate', () => {
      if (v === activeVideo && v.duration) {
        const remaining = v.duration - v.currentTime;
        if (remaining <= FADE_DURATION + 0.05 && !isCrossfading) {
          triggerCrossfade();
        }
      }
    });

    v.addEventListener('ended', () => {
      if (v === activeVideo) {
        triggerCrossfade();
      }
    });
  }

  setupVideoMonitoring(videoA);
  setupVideoMonitoring(videoB);

  if (videoA) {
    videoA.play().catch(() => {});
  }

  // Deep Inactive Tab Freeze & RAM Reclamation
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 1. Pause clock interval
      if (hudInterval) {
        clearInterval(hudInterval);
        hudInterval = null;
      }
      // 2. Suspend audio context
      if (window.soundEngine) {
        window.soundEngine.suspend();
      }
      // 3. Pause video decoders
      if (videoA) videoA.pause();
      if (videoB) videoB.pause();
      // 4. Free suggestions cache
      hideSuggestions();
    } else {
      // 1. Instantly resume and sync clock
      updateHud();
      if (!hudInterval) {
        hudInterval = setInterval(updateHud, 1000);
      }
      // 2. Resume video
      if (activeVideo) {
        activeVideo.play().catch(() => {});
      }
      // 3. Resume audio engine on demand
      if (window.soundEngine) {
        window.soundEngine.resume();
      }
    }
  });

  // Initial active item
  setActiveItem(0, false);
});
