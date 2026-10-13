export const THEME_STORAGE_KEY = 'promptminder-theme';
export const THEMES = ['light', 'dark', 'system'];
export const THEME_COLORS = { light: '#ffffff', dark: '#0d0f12' };

// Run before next-themes' bootstrap so malformed preferences fall back to system.
// Storage can be unavailable in private browsing; the system preference still works.
export const THEME_BOOTSTRAP_SCRIPT = `(() => {
  let theme = 'system';
  try {
    const saved = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (${JSON.stringify(THEMES)}.includes(saved)) theme = saved;
    else if (saved !== null) localStorage.removeItem('${THEME_STORAGE_KEY}');
  } catch {}
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = dark ? '${THEME_COLORS.dark}' : '${THEME_COLORS.light}';
})();`;
