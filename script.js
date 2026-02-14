(function () {
  'use strict';

  var STORAGE_KEY_SHORTCUTS = 'glassTab_shortcuts';
  var STORAGE_KEY_BG = 'glassTab_bgUrl';
  var STORAGE_KEY_FOCUS = 'glassTab_focus';
  var STORAGE_KEY_HINT_HIDDEN = 'glassTab_hintHidden';

  var defaultShortcuts = [
    { name: 'Gmail', url: 'https://mail.google.com' },
    { name: 'YouTube', url: 'https://youtube.com' },
    { name: 'Calendar', url: 'https://calendar.google.com' },
    { name: 'Tasks', url: 'https://tasks.google.com' }
  ];

  function getShortcuts() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_SHORTCUTS);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return null;
  }

  function setShortcuts(list) {
    localStorage.setItem(STORAGE_KEY_SHORTCUTS, JSON.stringify(list));
  }

  function getBgUrl() {
    return localStorage.getItem(STORAGE_KEY_BG) || '';
  }

  function setBgUrl(url) {
    if (url) localStorage.setItem(STORAGE_KEY_BG, url);
    else localStorage.removeItem(STORAGE_KEY_BG);
  }

  function domainFromUrl(url) {
    try {
      var a = document.createElement('a');
      a.href = url;
      return a.hostname || '';
    } catch (e) {
      return '';
    }
  }

  function faviconUrl(url, size) {
    var domain = domainFromUrl(url);
    return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=' + (size || 64);
  }

  function firstLetter(str) {
    if (!str || !str.trim()) return '?';
    return str.trim().charAt(0).toUpperCase();
  }

  function renderShortcuts(list) {
    var row = document.getElementById('shortcuts-row');
    if (!row) return;
    row.innerHTML = '';
    (list || []).forEach(function (item) {
      var a = document.createElement('a');
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'shortcut-item';
      var circle = document.createElement('div');
      circle.className = 'shortcut-circle';
      var img = document.createElement('img');
      img.src = faviconUrl(item.url);
      img.alt = '';
      img.onerror = function () {
        var letter = document.createElement('span');
        letter.className = 'shortcut-letter';
        letter.textContent = firstLetter(item.name);
        circle.innerHTML = '';
        circle.appendChild(letter);
      };
      circle.appendChild(img);
      var label = document.createElement('span');
      label.className = 'shortcut-label';
      label.textContent = item.name;
      a.appendChild(circle);
      a.appendChild(label);
      row.appendChild(a);
    });
  }

  function loadShortcuts(cb) {
    var saved = getShortcuts();
    if (saved && saved.length > 0) {
      renderShortcuts(saved);
      if (cb) cb(saved);
      return;
    }
    if (typeof chrome !== 'undefined' && chrome.topSites) {
      chrome.topSites.get(function (sites) {
        if (sites && sites.length > 0) {
          var list = sites.slice(0, 8).map(function (s) {
            return { name: s.title || domainFromUrl(s.url) || 'Link', url: s.url };
          });
          renderShortcuts(list);
          setShortcuts(list);
          if (cb) cb(list);
        } else {
          renderShortcuts(defaultShortcuts);
          setShortcuts(defaultShortcuts);
          if (cb) cb(defaultShortcuts);
        }
      });
    } else {
      renderShortcuts(defaultShortcuts);
      setShortcuts(defaultShortcuts);
      if (cb) cb(defaultShortcuts);
    }
  }

  function applyBackground() {
    var url = getBgUrl().trim();
    var el = document.getElementById('bg-custom');
    if (!el) return;
    if (url) {
      el.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
      el.classList.add('has-image');
      document.body.classList.add('has-custom-bg');
    } else {
      el.style.backgroundImage = '';
      el.classList.remove('has-image');
      document.body.classList.remove('has-custom-bg');
    }
  }

  // --- Clock ---
  var clockEl = document.getElementById('clock');
  var dateEl = document.getElementById('date');
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function updateTime() {
    if (!clockEl || !dateEl) return;
    var now = new Date();
    clockEl.textContent = pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
    dateEl.textContent = now.getDate() + ' ' + MONTHS[now.getMonth()];
  }

  updateTime();
  setInterval(updateTime, 1000);

  // --- Greeting ---
  var greetingEl = document.getElementById('greeting');
  if (greetingEl) {
    function setGreeting() {
      var h = new Date().getHours();
      if (h < 12) greetingEl.textContent = 'Good morning';
      else if (h < 17) greetingEl.textContent = 'Good afternoon';
      else greetingEl.textContent = 'Good evening';
    }
    setGreeting();
  }

  // --- Search ---
  var form = document.querySelector('.search-bar');
  var searchInput = document.getElementById('search-input') || document.querySelector('.search-input');
  if (form && searchInput) {
    form.addEventListener('submit', function (e) {
      var q = (searchInput.value || '').trim();
      if (!q) { e.preventDefault(); return; }
      if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(q) || /^https?:\/\//i.test(q)) {
        e.preventDefault();
        window.open(q.indexOf('://') === -1 ? 'https://' + q : q, '_blank');
      }
    });
  }

  // --- Weather (Open-Meteo + Nominatim) ---
  var weatherPlace = document.getElementById('weather-place');
  var weatherTemp = document.getElementById('weather-temp');

  function weatherCodeToLabel(code) {
    if (code === 0) return 'Clear';
    if (code >= 1 && code <= 3) return 'Cloudy';
    if (code === 45 || code === 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Clear';
  }

  function fetchWeather(lat, lon) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weather_code&timezone=auto';
    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.current && weatherTemp) {
          var temp = Math.round(data.current.temperature_2m);
          weatherTemp.textContent = temp + '°C';
        }
        if (data.current && weatherPlace) {
          var label = weatherCodeToLabel(data.current.weather_code || 0);
          weatherPlace.textContent = label;
        }
      })
      .catch(function () {
        if (weatherPlace) weatherPlace.textContent = '—';
        if (weatherTemp) weatherTemp.textContent = '—°C';
      });
  }

  function fetchCityName(lat, lon) {
    var url = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json';
    fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GlassTabDashboard/1.0 (Chrome Extension)'
      }
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (weatherPlace && data.address) {
          var city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || '';
          if (city) weatherPlace.textContent = city;
        }
      })
      .catch(function () {});
  }

  if (weatherPlace) weatherPlace.textContent = '…';
  if (weatherTemp) weatherTemp.textContent = '…°C';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lon = pos.coords.longitude;
        fetchWeather(lat, lon);
        fetchCityName(lat, lon);
      },
      function () {
        if (weatherPlace) weatherPlace.textContent = 'Allow location';
        if (weatherTemp) weatherTemp.textContent = '—°C';
      }
    );
  } else {
    if (weatherPlace) weatherPlace.textContent = '—';
    if (weatherTemp) weatherTemp.textContent = '—°C';
  }

  // --- Focus note ---
  var focusInput = document.getElementById('focus-input');
  if (focusInput) {
    try {
      var saved = localStorage.getItem(STORAGE_KEY_FOCUS);
      if (saved) focusInput.value = saved;
    } catch (e) {}
    focusInput.addEventListener('input', function () {
      try { localStorage.setItem(STORAGE_KEY_FOCUS, focusInput.value); } catch (e) {}
    });
    focusInput.addEventListener('blur', function () {
      try { localStorage.setItem(STORAGE_KEY_FOCUS, focusInput.value); } catch (e) {}
    });
  }

  // --- Tip of the day ---
  var TIPS = [
    'Press / from anywhere to focus the search bar.',
    'Use the focus timer for 25-minute deep work sessions.',
    'Your focus note is saved automatically—no need to click save.',
    'Shortcuts sync with your most visited sites when you first install.',
    'Upload a GIF as your background for a livelier tab.',
    'The greeting changes with the time of day—morning, afternoon, evening.',
    'Add your own shortcuts via the + button or Customize.',
    'Glass style works best with a dark or colorful background image.',
  ];
  var tipEl = document.getElementById('tip-text');
  if (tipEl && TIPS.length) {
    var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    tipEl.textContent = TIPS[dayOfYear % TIPS.length];
  }

  // --- Focus timer (adjustable duration with +/-) ---
  var timerDisplay = document.getElementById('timer-display');
  var timerStart = document.getElementById('timer-start');
  var timerPause = document.getElementById('timer-pause');
  var timerReset = document.getElementById('timer-reset');
  var timerPlus = document.getElementById('timer-plus');
  var timerMinus = document.getElementById('timer-minus');
  var timerDurationMinutes = 25;
  var timerMinutes = 25;
  var timerSeconds = 0;
  var timerInterval = null;
  var timerRunning = false;

  function formatTimer(m, s) {
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateTimerDisplay() {
    if (timerDisplay) timerDisplay.textContent = formatTimer(timerMinutes, timerSeconds);
  }

  function updateTimerAdjState() {
    if (timerPlus) timerPlus.disabled = timerRunning || timerDurationMinutes >= 90;
    if (timerMinus) timerMinus.disabled = timerRunning || timerDurationMinutes <= 5;
  }

  function tickTimer() {
    if (timerSeconds > 0) timerSeconds--;
    else if (timerMinutes > 0) { timerMinutes--; timerSeconds = 59; }
    else {
      clearInterval(timerInterval);
      timerInterval = null;
      timerRunning = false;
      if (timerStart) timerStart.disabled = false;
      if (timerPause) timerPause.disabled = true;
      updateTimerAdjState();
    }
    updateTimerDisplay();
  }

  if (timerStart) {
    timerStart.addEventListener('click', function () {
      if (timerRunning) return;
      timerRunning = true;
      timerStart.disabled = true;
      if (timerPause) timerPause.disabled = false;
      updateTimerAdjState();
      if (!timerInterval) timerInterval = setInterval(tickTimer, 1000);
    });
  }
  if (timerPause) {
    timerPause.disabled = true;
    timerPause.addEventListener('click', function () {
      if (!timerRunning) return;
      timerRunning = false;
      timerStart.disabled = false;
      timerPause.disabled = true;
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      updateTimerAdjState();
    });
  }
  if (timerReset) {
    timerReset.addEventListener('click', function () {
      timerMinutes = timerDurationMinutes;
      timerSeconds = 0;
      timerRunning = false;
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      if (timerStart) timerStart.disabled = false;
      if (timerPause) timerPause.disabled = true;
      updateTimerDisplay();
      updateTimerAdjState();
    });
  }
  if (timerPlus) {
    timerPlus.addEventListener('click', function () {
      if (timerRunning || timerDurationMinutes >= 90) return;
      timerDurationMinutes = Math.min(90, timerDurationMinutes + 5);
      if (!timerRunning) {
        timerMinutes = timerDurationMinutes;
        timerSeconds = 0;
        updateTimerDisplay();
      }
      updateTimerAdjState();
    });
  }
  if (timerMinus) {
    timerMinus.addEventListener('click', function () {
      if (timerRunning || timerDurationMinutes <= 5) return;
      timerDurationMinutes = Math.max(5, timerDurationMinutes - 5);
      if (!timerRunning) {
        timerMinutes = timerDurationMinutes;
        timerSeconds = 0;
        updateTimerDisplay();
      }
      updateTimerAdjState();
    });
  }
  updateTimerDisplay();
  updateTimerAdjState();

  // --- Press / to focus search ---
  var searchHint = document.getElementById('search-hint');
  if (searchHint && localStorage.getItem(STORAGE_KEY_HINT_HIDDEN)) {
    searchHint.classList.add('hint-hidden');
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    var active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
    e.preventDefault();
    if (searchInput) {
      searchInput.focus();
      try { localStorage.setItem(STORAGE_KEY_HINT_HIDDEN, '1'); } catch (e) {}
      if (searchHint) searchHint.classList.add('hint-hidden');
    }
  });

  // --- Customize modal ---
  var customizeModal = document.getElementById('customize-modal');
  var customizeBtn = document.getElementById('customize-btn');
  var modalClose = document.getElementById('modal-close');
  var bgFileInput = document.getElementById('bg-file');
  var bgClear = document.getElementById('bg-clear');
  var shortcutsEditList = document.getElementById('shortcuts-edit-list');
  var shortcutAddModal = document.getElementById('shortcut-add-modal');
  var addShortcutModal = document.getElementById('add-shortcut-modal');
  var addShortcutClose = document.getElementById('add-shortcut-close');
  var shortcutNameInput = document.getElementById('shortcut-name');
  var shortcutUrlInput = document.getElementById('shortcut-url');
  var shortcutSave = document.getElementById('shortcut-save');
  var shortcutAdd = document.getElementById('shortcut-add');

  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.removeAttribute('hidden');
    modalEl.setAttribute('data-open', 'true');
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.setAttribute('hidden', '');
    modalEl.removeAttribute('data-open');
  }

  function refreshEditList() {
    var list = getShortcuts() || defaultShortcuts;
    shortcutsEditList.innerHTML = '';
    list.forEach(function (item, i) {
      var li = document.createElement('li');
      li.textContent = item.name + ' — ' + item.url;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shortcut-edit-remove';
      btn.textContent = '×';
      btn.setAttribute('data-index', i);
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        var arr = getShortcuts() || [];
        arr.splice(idx, 1);
        setShortcuts(arr.length ? arr : defaultShortcuts);
        loadShortcuts();
        refreshEditList();
      });
      li.appendChild(btn);
      shortcutsEditList.appendChild(li);
    });
  }

  customizeBtn.addEventListener('click', function () {
    if (bgFileInput) bgFileInput.value = '';
    refreshEditList();
    openModal(customizeModal);
  });

  modalClose.addEventListener('click', function () {
    closeModal(customizeModal);
  });

  customizeModal.addEventListener('click', function (e) {
    if (e.target === customizeModal) closeModal(customizeModal);
  });

  if (bgFileInput) {
    bgFileInput.addEventListener('change', function () {
      var file = bgFileInput.files && bgFileInput.files[0];
      if (!file || !file.type.match(/^image\//)) return;
      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = reader.result;
        try {
          setBgUrl(dataUrl);
          applyBackground();
        } catch (err) {
          if (err.name === 'QuotaExceededError') {
            alert('File is too large. Try a smaller image or GIF (under ~2MB).');
          } else {
            alert('Could not set background.');
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }

  bgClear.addEventListener('click', function () {
    setBgUrl('');
    if (bgFileInput) bgFileInput.value = '';
    applyBackground();
  });

  shortcutAddModal.addEventListener('click', function () {
    shortcutNameInput.value = '';
    shortcutUrlInput.value = '';
    openModal(addShortcutModal);
  });

  addShortcutClose.addEventListener('click', function () {
    closeModal(addShortcutModal);
  });

  shortcutSave.addEventListener('click', function () {
    var name = (shortcutNameInput.value || '').trim();
    var url = (shortcutUrlInput.value || '').trim();
    if (!name || !url) return;
    if (url.indexOf('://') === -1) url = 'https://' + url;
    var list = getShortcuts() || [];
    list.push({ name: name, url: url });
    setShortcuts(list);
    loadShortcuts();
    refreshEditList();
    closeModal(addShortcutModal);
  });

  shortcutAdd.addEventListener('click', function () {
    shortcutNameInput.value = '';
    shortcutUrlInput.value = '';
    openModal(addShortcutModal);
  });

  addShortcutModal.addEventListener('click', function (e) {
    if (e.target === addShortcutModal) closeModal(addShortcutModal);
  });

  // --- Init ---
  applyBackground();
  loadShortcuts();
})();
