'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SystemLogs from '@/components/SystemLogs';
import SessionMonitor from '@/components/SessionMonitor';
import Leaderboard from '@/components/Leaderboard';
import PendingApprovals from '@/components/PendingApprovals';

import type { AuthResponse, UserInfo } from '@/types';
import '@/styles/dashboard.css';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    adminPanel: "Admin Control Panel",
    subtitle: "System monitoring & session management",
    overview: "Overview",
    sessions: "Sessions",
    users: "Manage Users",
    approvals: "Planner Approvals",
    logs: "Logs",
    leaderboard: "Leaderboard",
    settings: "Settings",
    healthy: "Healthy",
    apiStatus: "API Status",
    avgResponse: "Avg Response Time",
    aiEngine: "AI Engine",
    dbConnected: "Database",
    systemSettings: "System Settings",
    welcome: "Welcome back",
    logout: "Logout",
    active: "Active",
    disabled: "Disabled",
    connected: "Connected",
  },
  es: {
    adminPanel: "Panel de Control de Admin",
    subtitle: "Monitoreo del sistema y gestión de sesiones",
    overview: "Resumen",
    sessions: "Sesiones",
    users: "Gestionar Usuarios",
    approvals: "Aprobaciones de Planificadores",
    logs: "Registros",
    leaderboard: "Tabla de Clasificación",
    settings: "Configuración",
    healthy: "Saludable",
    apiStatus: "Estado de la API",
    avgResponse: "Tiempo de Respuesta Promedio",
    aiEngine: "Motor de IA",
    dbConnected: "Base de Datos",
    systemSettings: "Ajustes del Sistema",
    welcome: "Bienvenido de nuevo",
    logout: "Cerrar sesión",
    active: "Activo",
    disabled: "Desactivado",
    connected: "Conectado",
  },
  de: {
    adminPanel: "Admin-Systemsteuerung",
    subtitle: "Systemüberwachung & Sitzungsverwaltung",
    overview: "Übersicht",
    sessions: "Sitzungen",
    users: "Benutzer verwalten",
    approvals: "Planer-Zulassungen",
    logs: "Protokolle",
    leaderboard: "Bestenliste",
    settings: "Einstellungen",
    healthy: "Gesund",
    apiStatus: "API-Status",
    avgResponse: "Durchschn. Antwortzeit",
    aiEngine: "KI-Engine",
    dbConnected: "Datenbank",
    systemSettings: "Systemeinstellungen",
    welcome: "Willkommen zurück",
    logout: "Abmelden",
    active: "Aktiv",
    disabled: "Deaktiviert",
    connected: "Verbunden",
  },
  ur: {
    adminPanel: "ایڈمن کنٹرول پینل",
    subtitle: "سسٹم مانیٹرنگ اور سیشن مینجمنٹ",
    overview: "عمومی جائزہ",
    sessions: "سیشنز",
    users: "صارفین کا انتظام",
    approvals: "پلانر کی منظوری",
    logs: "لاگز",
    leaderboard: "لیڈر بورڈ",
    settings: "ترتیبات",
    healthy: "بہتر حالت",
    apiStatus: "API کی حیثیت",
    avgResponse: "اوسط جواب کا وقت",
    aiEngine: "مصنوعی ذہانت انجن",
    dbConnected: "ڈیٹا بیس",
    systemSettings: "سسٹم کی ترتیبات",
    welcome: "خوش آمدید",
    logout: "لاگ آؤٹ",
    active: "فعال",
    disabled: "غیر فعال",
    connected: "منسلک",
  },
  zh: {
    adminPanel: "管理员控制面板",
    subtitle: "系统监控与会话管理",
    overview: "总览",
    sessions: "会话",
    users: "管理用户",
    approvals: "策划者审批",
    logs: "系统日志",
    leaderboard: "排行榜",
    settings: "配置设置",
    healthy: "运行正常",
    apiStatus: "API 状态",
    avgResponse: "平均响应时间",
    aiEngine: "人工智能引擎",
    dbConnected: "数据库",
    systemSettings: "系统设置",
    welcome: "欢迎回来",
    logout: "注销登出",
    active: "活动",
    disabled: "已禁用",
    connected: "已连接",
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'sessions' | 'logs' | 'users' | 'settings' | 'leaderboard' | 'approvals'>('overview');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // System Settings State
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('dark');
  const [demoLimit, setDemoLimit] = useState(10);
  const [cacheDuration, setCacheDuration] = useState(10);
  const [reactAgentMode, setReactAgentMode] = useState(true);
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const applyTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('verdex_theme', newTheme);
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      const body = window.document.body;
      if (newTheme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
        body.classList.add('light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        body.classList.remove('light');
      }
    }
  };

  const changeLanguage = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('verdex_language', newLang);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLanguage(localStorage.getItem('verdex_language') || 'en');
      setTheme(localStorage.getItem('verdex_theme') || 'dark');
      setDemoLimit(Number(localStorage.getItem('verdex_demo_limit') || '10'));
      setCacheDuration(Number(localStorage.getItem('verdex_cache_duration') || '10'));
      setReactAgentMode(localStorage.getItem('verdex_react_agent_mode') !== 'false');
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('verdex_language', language);
    localStorage.setItem('verdex_theme', theme);
    localStorage.setItem('verdex_demo_limit', String(demoLimit));
    localStorage.setItem('verdex_cache_duration', String(cacheDuration));
    localStorage.setItem('verdex_react_agent_mode', String(reactAgentMode));

    // Apply theme changes instantly
    const root = window.document.documentElement;
    const body = window.document.body;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
    }

    // Notify session monitor and storage events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }

    setShowSaveAlert(true);
    setTimeout(() => {
      setShowSaveAlert(false);
    }, 3000);
  };

  const fetchPendingCount = async () => {
    try {
      const { getPendingPlanners } = await import('@/services/api');
      const data = await getPendingPlanners();
      setPendingCount(data.length);
    } catch (err) {
      console.error('Failed to fetch pending approvals count:', err);
    }
  };

  const fetchUsersData = async () => {
    setUsersLoading(true);
    try {
      const { adminGetUsers } = await import('@/services/api');
      const data = await adminGetUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to permanently delete user "${userName}"?`)) {
      try {
        const { adminDeleteUser } = await import('@/services/api');
        await adminDeleteUser(userId);
        fetchUsersData();
        setLeaderboardRefreshKey((prev) => prev + 1);
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (activeView === 'users') {
      fetchUsersData();
    }
    fetchPendingCount();
  }, [activeView]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('verdex_theme');
    const root = window.document.documentElement;
    const body = window.document.body;
    if (savedTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
    }

    const stored = localStorage.getItem('verdex_user');
    if (!stored) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(stored);
    setUser(parsed);
    fetchPendingCount();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('verdex_token');
    localStorage.removeItem('verdex_user');
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          <span className="sidebar-logo">Verdex</span>
        </div>

        <div className="sidebar-section">System</div>
        <button 
          className={`sidebar-link ${activeView === 'overview' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">monitor</span>
          {t('overview')}
        </button>
        <button 
          className={`sidebar-link ${activeView === 'sessions' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('sessions')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">sensors</span>
          {t('sessions')}
        </button>
        <button 
          className={`sidebar-link ${activeView === 'users' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('users')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">group</span>
          {t('users')}
        </button>
        <button 
          className={`sidebar-link ${activeView === 'approvals' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('approvals')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined sidebar-link-icon">how_to_reg</span>
            {t('approvals')}
          </div>
          {pendingCount > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '9999px',
                lineHeight: 1,
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button 
          className={`sidebar-link ${activeView === 'logs' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('logs')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">assignment</span>
          {t('logs')}
        </button>
        <button 
          className={`sidebar-link ${activeView === 'leaderboard' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('leaderboard')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">leaderboard</span>
          {t('leaderboard')}
        </button>
        <button 
          className={`sidebar-link ${activeView === 'settings' ? 'sidebar-link-active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          <span className="material-symbols-outlined sidebar-link-icon">settings</span>
          {t('settings')}
        </button>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
            <button className="sidebar-logout flex items-center justify-center" onClick={handleLogout} title="Logout">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title flex items-center gap-2">
            {t('adminPanel')}
            <span className="material-symbols-outlined text-2xl text-primary">settings</span>
          </h1>
          <p className="dashboard-subtitle">
            {t('subtitle')}
          </p>
        </div>

        {/* System Status Cards */}
        <div className="dashboard-grid grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card" onClick={() => setActiveView('overview')} style={{ cursor: 'pointer' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-green">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
            </div>
            <div className="stat-card-value" style={{ color: '#10b981' }}>
              {t('healthy')}
            </div>
            <div className="stat-card-label">{t('apiStatus')}</div>
          </div>
          <div className="stat-card" style={{ animationDelay: '0.1s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-cyan">
                <span className="material-symbols-outlined">bolt</span>
              </div>
            </div>
            <div className="stat-card-value">120ms</div>
            <div className="stat-card-label">{t('avgResponse')}</div>
          </div>
          <div className="stat-card" style={{ animationDelay: '0.2s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-purple">
                <span className="material-symbols-outlined">psychology</span>
              </div>
            </div>
            <div className="stat-card-value">
              {reactAgentMode ? t('active') : t('disabled')}
            </div>
            <div className="stat-card-label">{t('aiEngine')}</div>
          </div>
          <div className="stat-card" style={{ animationDelay: '0.3s' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon stat-icon-amber">
                <span className="material-symbols-outlined">database</span>
              </div>
            </div>
            <div className="stat-card-value">{t('connected')}</div>
            <div className="stat-card-label">{t('dbConnected')}</div>
          </div>
        </div>

        {/* Dynamic views based on activeView */}
        {activeView === 'overview' && (
          <div className="dashboard-grid grid-2">
            <SessionMonitor />
            <SystemLogs />
          </div>
        )}

        {activeView === 'sessions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <SessionMonitor />
          </div>
        )}

        {activeView === 'logs' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <SystemLogs />
          </div>
        )}

        {activeView === 'users' && (
          <div className="panel-card custom-scrollbar" style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
            <h2 className="panel-card-title mb-4">
              <span className="material-symbols-outlined text-primary">group</span>
              Registered Users
            </h2>
            <p className="panel-card-description mb-4">View and delete user accounts. Deleting an account removes all their logs and credentials.</p>
            
            {usersLoading ? (
              <p className="text-slate-500 text-xs font-mono">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-slate-500 text-xs font-mono">No users registered in the system.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr className="user-table-header-row" style={{ borderBottom: '1px solid rgba(11, 94, 67, 0.3)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>Name</th>
                      <th style={{ padding: '12px 8px' }}>Email</th>
                      <th style={{ padding: '12px 8px' }}>Role</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(11, 94, 67, 0.15)' }}>
                        <td className="user-table-name" style={{ padding: '12px 8px', fontWeight: 'bold' }}>{u.name}</td>
                        <td className="user-table-email" style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{u.email}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className={`role-badge ${
                            u.role === 'admin' ? 'badge-admin' :
                            u.role === 'client' ? 'badge-client' :
                            'badge-user'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.user_id, u.name)}
                              className="btn-delete"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeView === 'leaderboard' && (
          <Leaderboard refreshTrigger={leaderboardRefreshKey} />
        )}

        {activeView === 'approvals' && (
          <PendingApprovals onActionCompleted={fetchPendingCount} />
        )}

        {activeView === 'settings' && (
          <div className="panel-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 className="panel-card-title" style={{ marginBottom: 4 }}>
                  <span className="material-symbols-outlined text-primary">settings</span>
                  System Settings
                </h2>
                <p className="panel-card-description">
                  Manage Verdex routing configurations, performance caching, and visual parameters.
                </p>
              </div>
            </div>

            {showSaveAlert && (
              <div className="alert-success" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined animate-bounce">check_circle</span>
                <span>Settings saved successfully! Visual overrides applied.</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings}>
              <div className="settings-grid">
                
                {/* Column 1: System Preferences */}
                <div className="settings-section-card">
                  <h3 className="settings-section-title">
                    <span className="material-symbols-outlined text-sm">palette</span>
                    Personalization
                  </h3>
                  
                  <div className="settings-group">
                    <label className="settings-label">Interface Theme</label>
                    <select
                      className="settings-select"
                      value={theme}
                      onChange={(e) => applyTheme(e.target.value)}
                    >
                      <option value="dark">Dark Mode (Emerald Obsidian)</option>
                      <option value="light">Light Mode (Sage Mint)</option>
                    </select>
                    <span className="settings-desc">Choose the dashboard layout theme style.</span>
                  </div>

                  <div className="settings-group">
                    <label className="settings-label">Preferred Language</label>
                    <select
                      className="settings-select"
                      value={language}
                      onChange={(e) => changeLanguage(e.target.value)}
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Español (ES)</option>
                      <option value="de">Deutsch (DE)</option>
                      <option value="ur">Urdu (PK)</option>
                      <option value="zh">Chinese (ZH)</option>
                    </select>
                    <span className="settings-desc">Select the default interface language context.</span>
                  </div>

                  <div className="settings-group" style={{ marginTop: 8 }}>
                    <div className="settings-label-row">
                      <label className="settings-label">Headless ReAct Agent Mode</label>
                      <label className="settings-switch">
                        <input
                          type="checkbox"
                          checked={reactAgentMode}
                          onChange={(e) => setReactAgentMode(e.target.checked)}
                        />
                        <span className="settings-slider"></span>
                      </label>
                    </div>
                    <span className="settings-desc">Use autonomous AI agents to optimize routing algorithms dynamically.</span>
                  </div>
                </div>

                {/* Column 2: System Performance */}
                <div className="settings-section-card">
                  <h3 className="settings-section-title">
                    <span className="material-symbols-outlined text-sm">construction</span>
                    Performance & Limits
                  </h3>

                  <div className="settings-group">
                    <div className="settings-label-row">
                      <label className="settings-label">Demo Session Limit</label>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-verdex-primary-light)' }}>
                        {demoLimit} sessions
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={demoLimit}
                      onChange={(e) => setDemoLimit(Number(e.target.value))}
                      style={{
                        accentColor: 'var(--color-verdex-primary-light)',
                        cursor: 'pointer',
                        marginTop: 4,
                      }}
                    />
                    <span className="settings-desc">Configure the maximum concurrent anonymous user sessions permitted.</span>
                  </div>

                  <div className="settings-group">
                    <label className="settings-label">Open-Meteo Cache Duration</label>
                    <select
                      className="settings-select"
                      value={cacheDuration}
                      onChange={(e) => setCacheDuration(Number(e.target.value))}
                    >
                      <option value="5">5 Minutes</option>
                      <option value="10">10 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">60 Minutes (1 Hour)</option>
                    </select>
                    <span className="settings-desc">Specify how long environmental reports are stored in local storage cache.</span>
                  </div>
                </div>

              </div>

              {/* Form Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  style={{ padding: '10px 24px', fontSize: '0.85rem' }}
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
