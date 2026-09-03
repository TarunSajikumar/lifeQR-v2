/**
 * LifeQR Universal System Theme Controller
 * Automatically synchronizes dark / light mode based on the user's OS & device appearance (prefers-color-scheme)
 * while providing seamless manual toggle support.
 */
(function() {
  function getSystemTheme() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function getEffectiveTheme() {
    const manual = localStorage.getItem('lifeqr_theme_manual');
    if (manual === 'dark' || manual === 'light') {
      return manual;
    }
    return getSystemTheme();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
    
    // Update theme toggle UI indicators across dashboards if present
    const icons = document.querySelectorAll('#doctorThemeIcon, #patientThemeIcon, #crewThemeIcon, .theme-toggle-icon');
    icons.forEach(icon => {
      icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    });
    const labels = document.querySelectorAll('#doctorThemeLabel, #patientThemeLabel, #crewThemeLabel, .theme-toggle-label');
    labels.forEach(label => {
      label.textContent = theme === 'dark' ? 'Light' : 'Dark';
    });
  }

  // Initial application immediately
  const initialTheme = getEffectiveTheme();
  applyTheme(initialTheme);

  // Listen for system appearance changes in real time
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // If the user hasn't forced a manual override, follow device appearance
      if (!localStorage.getItem('lifeqr_theme_manual')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    }
  }

  // Expose global methods
  window.toggleTheme = function() {
    const current = document.documentElement.getAttribute('data-theme') || getSystemTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('lifeqr_theme_manual', next);
    localStorage.setItem('lifeqr_theme', next);
    applyTheme(next);
    if (typeof showToast === 'function') {
      showToast(`Switched to ${next} mode`, 'info');
    }
  };

  window.resetToSystemTheme = function() {
    localStorage.removeItem('lifeqr_theme_manual');
    localStorage.removeItem('lifeqr_theme');
    applyTheme(getSystemTheme());
    if (typeof showToast === 'function') {
      showToast('Theme reset to match device appearance mode', 'info');
    }
  };

  window.toggleDoctorTheme = window.toggleTheme;
  window.togglePatientTheme = window.toggleTheme;
  window.applyDoctorTheme = applyTheme;
  window.applyPatientTheme = applyTheme;
})();
