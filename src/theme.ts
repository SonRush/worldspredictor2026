/** Light/dark theme: explicit choice persisted in localStorage, else the OS preference. */
const KEY = 'wp26:theme';
type Theme = 'dark' | 'light';

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

function preferred(): Theme {
  return stored() ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f2e9' : '#010a13');
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    const label = theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }
}

export function initTheme() {
  applyTheme(preferred());
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next: Theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage blocked: the choice just won't persist */
    }
    applyTheme(next);
  });
  // Follow the OS while the user hasn't picked explicitly.
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (!stored()) applyTheme(preferred());
  });
}
