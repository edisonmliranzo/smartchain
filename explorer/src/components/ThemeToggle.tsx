import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: 'var(--text-primary)',
            }}
        >
            {theme === 'dark' ? (
                <Sun size={20} style={{ color: 'var(--accent)' }} />
            ) : (
                <Moon size={20} style={{ color: 'var(--primary)' }} />
            )}
        </button>
    );
}
