'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import {
    LayoutDashboard,
    Sparkles,
    Database,
    ChartNoAxesCombined,
    History,
    Cpu,
    Settings,
    Moon,
    Sun,
} from 'lucide-react';

const NAV = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/prediction', label: 'Prediction', icon: Sparkles },
    { href: '/data', label: 'Data', icon: Database },
    { href: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
    { href: '/history', label: 'History', icon: History },
    { href: '/model', label: 'Model', icon: Cpu },
];

const MOBILE_NAV = [...NAV.slice(0, 4), { href: '/settings', label: 'More', icon: Settings }];

type Listener = () => void;
let themeListeners: Listener[] = [];
const themeObserver =
    typeof window !== 'undefined'
        ? new MutationObserver(() => themeListeners.forEach((l) => l()))
        : null;

function subscribeTheme(cb: Listener): () => void {
    if (!themeObserver) return () => {};
    if (themeListeners.length === 0) {
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
    }
    themeListeners.push(cb);
    return () => {
        themeListeners = themeListeners.filter((l) => l !== cb);
    };
}

function getThemeSnapshot(): boolean {
    return document.documentElement.classList.contains('dark');
}

function ThemeToggle() {
    const dark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => false);

    useEffect(() => {
        const stored = localStorage.getItem('theme');
        const isDark =
            stored === 'dark' ||
            (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', isDark);
    }, []);

    const toggle = () => {
        const next = !dark;
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggle}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-indigo-500/10 transition-colors"
            aria-label="Toggle dark mode"
        >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? 'Light mode' : 'Dark mode'}
        </button>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen flex">
            <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-border-subtle bg-surface px-3 py-5">
                <div className="flex items-center gap-2 px-2 mb-8">
                    <Image
                        src="/g-survey.png"
                        alt="G-Survey"
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-lg object-contain"
                    />
                    <Image
                        src="/google.png"
                        alt="Google"
                        width={28}
                        height={28}
                        className="h-7 w-7 object-contain"
                    />
                    <div>
                        <div className="font-semibold text-sm leading-tight">Survey</div>
                        <div className="text-xs text-muted">Predictor</div>
                    </div>
                </div>
                <nav className="flex flex-col gap-1 flex-1">
                    {NAV.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                                    active
                                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                                        : 'text-muted hover:bg-indigo-500/5 hover:text-foreground'
                                }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t border-border-subtle pt-3 mt-3">
                    <Link
                        href="/settings"
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                            pathname === '/settings'
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                                : 'text-muted hover:bg-indigo-500/5 hover:text-foreground'
                        }`}
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                    <ThemeToggle />
                </div>
            </aside>

            <main className="flex-1 md:ml-56 pb-24 md:pb-8">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">{children}</div>
            </main>

            <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border-subtle flex">
                {MOBILE_NAV.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                                active ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted'
                            }`}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
