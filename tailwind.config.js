/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主アクセント: エレクトリックなシアンブルー（単一アクセントの軸）
        'gpu-blue': '#0BA5EC',
        'gpu-purple': '#7C3AED',
        'gpu-pink': '#EC4899',
        // アクセントスケール
        accent: {
          400: '#38BDF8',
          DEFAULT: '#0BA5EC',
          500: '#0BA5EC',
          600: '#0284C7',
        },
        // surface階層（CSS変数駆動・light/dark自動切替）
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        line: 'var(--color-border)',
        'line-strong': 'var(--color-border-strong)',
        ink: 'var(--color-text)',
        muted: 'var(--color-muted)',
      },
      boxShadow: {
        // 上品な微細リフト
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
        glow: '0 0 0 1px rgb(11 165 236 / 0.30), 0 8px 24px -6px rgb(11 165 236 / 0.35)',
      },
    },
  },
  plugins: [],
}
