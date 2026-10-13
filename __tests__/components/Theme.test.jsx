import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { THEME_BOOTSTRAP_SCRIPT, THEME_STORAGE_KEY } from '@/lib/theme';
import zh from '@/messages/zh.json';
import en from '@/messages/en.json';

let mockCopy = zh;
jest.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ t: mockCopy }) }));

let systemDark;
let listeners;
beforeEach(() => {
  mockCopy = zh;
  systemDark = false;
  listeners = new Set();
  localStorage.clear();
  document.documentElement.className = '';
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = '#ffffff';
  document.head.appendChild(meta);
  window.matchMedia = jest.fn(() => ({
    get matches() { return systemDark; },
    media: '(prefers-color-scheme: dark)',
    addListener: (listener) => listeners.add(listener),
    removeListener: (listener) => listeners.delete(listener),
  }));
});
afterEach(async () => {
  cleanup();
  // next-themes removes its temporary transition stylesheet on a short timer.
  await new Promise((resolve) => setTimeout(resolve, 10));
  jest.restoreAllMocks();
});

function mount() {
  return render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
}
function changeSystem(dark) {
  act(() => {
    systemDark = dark;
    listeners.forEach((listener) => listener({ matches: dark }));
  });
}
async function choose(label, trigger = '外观') {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: trigger }));
  await user.click(screen.getByRole('menuitemradio', { name: new RegExp(`${label}$`) }));
}

describe('site appearance', () => {
  it('creates one browser theme-color tag before hydration and reuses it', () => {
    document.querySelector('meta[name="theme-color"]').remove();
    systemDark = true;
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#0d0f12');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff');
  });

  it('follows live system changes by default and updates browser chrome', async () => {
    mount();
    await waitFor(() => expect(document.documentElement).toHaveClass('light'));
    changeSystem(true);
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#0d0f12');
    changeSystem(false);
    expect(document.documentElement).toHaveClass('light');
  });

  it('persists manual selection, survives remount, and can return to system', async () => {
    const view = mount();
    await choose('深色');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
    changeSystem(false);
    expect(document.documentElement).toHaveClass('dark');
    view.unmount();
    mount();
    expect(document.documentElement).toHaveClass('dark');
    await choose('跟随系统');
    expect(document.documentElement).toHaveClass('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('synchronizes selection from another tab', () => {
    mount();
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' })));
    expect(document.documentElement).toHaveClass('dark');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: null })));
    expect(document.documentElement).toHaveClass('light');
  });

  it('recovers from invalid saved preferences using the system theme', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'unknown');
    systemDark = true;
    mount();
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('still switches in memory when browser storage is unavailable', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
    mount();
    await choose('深色');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('offers translated options and keyboard selection', async () => {
    mockCopy = en;
    mount();
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Appearance' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menuitemradio', { name: /System$/ })).toHaveAttribute('aria-checked', 'true');
    act(() => screen.getByRole('menuitemradio', { name: 'Dark' }).focus());
    await user.keyboard('{Enter}');
    expect(document.documentElement).toHaveClass('dark');
  });
});
