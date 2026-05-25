'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/services/api';
import '@/styles/landing.css';
import EarthIcon from '@/components/EarthIcon';

const DEMO_ACCOUNTS = [
  { role: 'user' as const, email: 'user@verdex.io', password: 'user123', label: 'Commuter', icon: '🚶' },
  { role: 'client' as const, email: 'planner@verdex.io', password: 'planner123', label: 'City Planner', icon: '📊' },
  { role: 'admin' as const, email: 'admin@verdex.io', password: 'admin123', label: 'Admin', icon: '⚙️' },
];

export default function LandingPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Auth Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'client' | 'admin'>('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Section Refs for Smooth Scrolling
  const heroRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const sdgsRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Sync dark/light theme to document root
  useEffect(() => {
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
  }, [theme]);

  // Cursor tracking for ambient radial glow lights & 3D Card Tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Ambient Glows
      const glows = document.querySelectorAll('.dew-drop-glow');
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      
      glows.forEach((glow: any, index) => {
        const speed = (index + 1) * 25;
        glow.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });

      // 2. 3D Card Tilt
      const card = document.querySelector('.tilt-card') as HTMLElement;
      if (card) {
        const rect = card.getBoundingClientRect();
        const cardX = e.clientX - rect.left - rect.width / 2;
        const cardY = e.clientY - rect.top - rect.height / 2;
        const tiltX = (cardY / (rect.height / 2)) * -6; // Max 6 degrees vertical tilt
        const tiltY = (cardX / (rect.width / 2)) * 6;   // Max 6 degrees horizontal tilt
        card.style.setProperty('--rx', `${tiltX}deg`);
        card.style.setProperty('--ry', `${tiltY}deg`);
      }
    };

    const handleMouseLeave = () => {
      const card = document.querySelector('.tilt-card') as HTMLElement;
      if (card) {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    const card = document.querySelector('.tilt-card');
    if (card) {
      card.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (card) {
        card.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const res = await login({ email, password });
        localStorage.setItem('verdex_token', res.token);
        localStorage.setItem('verdex_user', JSON.stringify(res));

        setSuccess('Authentication successful! Routing...');
        setTimeout(() => {
          switch (res.role) {
            case 'admin':
              router.push('/dashboard/admin');
              break;
            case 'client':
              router.push('/dashboard/client');
              break;
            default:
              router.push('/dashboard/user');
          }
        }, 800);
      } else {
        const res = await register({ name, email, password, role: selectedRole });
        setSuccess('Registration successful! Accessing account...');
        
        localStorage.setItem('verdex_token', res.token);
        localStorage.setItem('verdex_user', JSON.stringify(res));

        setTimeout(() => {
          switch (res.role) {
            case 'admin':
              router.push('/dashboard/admin');
              break;
            case 'client':
              router.push('/dashboard/client');
              break;
            default:
              router.push('/dashboard/user');
          }
        }, 1200);
      }
    } catch (err: any) {
      if (activeTab === 'login') {
        setError('Invalid credentials. Please verify your details or use a quick demo account.');
      } else {
        const errMsg = err.response?.data?.detail || 'Registration failed. The selected email address might already be taken.';
        setError(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedRole(account.role);
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await login({ email: account.email, password: account.password });
      localStorage.setItem('verdex_token', res.token);
      localStorage.setItem('verdex_user', JSON.stringify(res));

      setSuccess(`Authenticated as demo ${account.label}. Loading...`);
      setTimeout(() => {
        switch (res.role) {
          case 'admin':
            router.push('/dashboard/admin');
            break;
          case 'client':
            router.push('/dashboard/client');
            break;
          default:
            router.push('/dashboard/user');
        }
      }, 800);
    } catch {
      setError('Connection to backend server failed. Make sure the uvicorn API process is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-body-container" ref={heroRef}>
      {/* Dynamic Cursor-Glow Lights */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="dew-drop-glow" style={{ position: 'absolute', top: '15%', left: '20%', width: '500px', height: '500px' }} />
        <div 
          className="dew-drop-glow" 
          style={{ position: 'absolute', bottom: '20%', right: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Navigation Bar */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1280px', margin: '0 auto', padding: '14px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => scrollTo(heroRef)}>
            <span className="material-symbols-outlined" style={{ color: 'var(--ldg-accent)', fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>eco</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ldg-accent)' }}>Verdex</span>
          </div>
          
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <button className="nav-link" onClick={() => scrollTo(heroRef)}>Home</button>
            <button className="nav-link" onClick={() => scrollTo(howItWorksRef)}>About</button>
            <button className="nav-link" onClick={() => scrollTo(sdgsRef)}>SDGs</button>
            <button className="nav-link nav-live-map-btn" onClick={() => router.push('/enviromap')}>
              <EarthIcon size={16} />
              Live Map
            </button>
          </div>

          <button className="theme-toggle" aria-label="Toggle Theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-grid">
          {/* Left Column — Copy */}
          <div className="hero-left animate-fade-in-up">
            <div className="hero-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>nest_eco_leaf</span>
              🌱 SDG 11 · SDG 13 · AI-Powered Agent
            </div>
            
            <h1 className="hero-title">
              Smart Mobility, <br />
              <span className="accent">Greener Cities</span>
            </h1>
            
            <p className="hero-description">
              Verdex is an event-driven AI mobility agent that optimizes urban commutes in real-time — minimizing carbon footprint while maximizing transit efficiency across your city.
            </p>
            
            {/* Stats Row */}
            <div className="hero-stats">
              <div>
                <p className="hero-stat-value">2.5T</p>
                <p className="hero-stat-label">CO₂ Saved</p>
              </div>
              <div>
                <p className="hero-stat-value">15K+</p>
                <p className="hero-stat-label">Routes Optimized</p>
              </div>
              <div>
                <p className="hero-stat-value">98%</p>
                <p className="hero-stat-label">System Uptime</p>
              </div>
            </div>
          </div>

          {/* Right Column — Login Card */}
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="glass-surface-elevated login-card tilt-card">
              
              {/* Card Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 className="login-card-title">
                  {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="login-card-subtitle">
                  {activeTab === 'login' 
                    ? 'Sign in to access your green mobility dashboard' 
                    : 'Join the ecosystem and start saving carbon tokens'}
                </p>
              </div>

              {/* Tab Selection */}
              <div className="tab-container" style={{ marginBottom: '24px' }}>
                <button
                  className={`tab-button ${activeTab === 'login' ? 'tab-button-active' : ''}`}
                  onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                >
                  Sign In
                </button>
                <button
                  className={`tab-button ${activeTab === 'signup' ? 'tab-button-active' : ''}`}
                  onClick={() => { setActiveTab('signup'); setError(''); setSuccess(''); }}
                >
                  Sign Up
                </button>
              </div>

              {/* Form fields */}
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {error && (
                  <div className="alert-error">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="alert-success">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                    <span>{success}</span>
                  </div>
                )}

                {activeTab === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">Full Name</label>
                    <input
                      required
                      className="glass-input"
                      placeholder="Enter name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">Email Address</label>
                  <input
                    required
                    className="glass-input"
                    placeholder="Enter email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">Password</label>
                  <input
                    required
                    className="glass-input"
                    placeholder="Enter password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {activeTab === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="form-label">Select Workspace Role</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {DEMO_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.role}
                          type="button"
                          className={`role-option-button ${selectedRole === acc.role ? 'role-option-button-active' : ''}`}
                          onClick={() => setSelectedRole(acc.role)}
                        >
                          <span style={{ fontSize: '1.25rem' }}>{acc.icon}</span>
                          {acc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button className="submit-btn" disabled={isLoading} type="submit">
                  {isLoading ? (
                    <>
                      <span className="spinner" />
                      <span>Processing...</span>
                    </>
                  ) : activeTab === 'login' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              {/* Quick demo sign-ins */}
              <div className="demo-divider">
                <span>Quick Demo Access</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    className="demo-btn"
                    onClick={() => handleDemoLogin(acc)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.15rem' }}>{acc.icon}</span>
                      <span style={{ color: 'var(--ldg-accent)', fontWeight: 700 }}>{acc.label}</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', opacity: 0.6, fontFamily: "'JetBrains Mono', monospace" }}>{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="section-border" style={{ padding: '80px 0', position: 'relative', zIndex: 10 }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', marginBottom: '56px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p className="section-overline">THE SYSTEM</p>
            <h2 className="section-title">How Verdex Works</h2>
            <p className="section-subtitle">
              A decoupled multi-layered architecture working in harmony to reduce metropolitan gridlock.
            </p>
          </div>
          
          <div className="features-grid">
            <div className="glass-surface feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">Event-Driven AI Engine</h3>
              <p className="feature-description">
                Not a chat prompt. Verdex processes routing requests as background events, calling lightweight models to optimize trips automatically.
              </p>
            </div>
            
            <div className="glass-surface feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Decoupled Architecture</h3>
              <p className="feature-description">
                FastAPI backend handles heavy computational routing rules, while the Next.js React client delivers visual components dynamically.
              </p>
            </div>
            
            <div className="glass-surface feature-card">
              <div className="feature-icon">🔋</div>
              <h3 className="feature-title">Live Carbon Wallet</h3>
              <p className="feature-description">
                Earn Carbon Credits automatically for choosing green alternatives (metro, biking, walking) and track cumulative city savings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SDG Alignment Section */}
      <section ref={sdgsRef} className="section-border" style={{ padding: '80px 0', position: 'relative', zIndex: 10 }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', marginBottom: '56px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p className="section-overline">UN ALIGNMENT</p>
            <h2 className="section-title">Targeting Global Impact</h2>
            <p className="section-subtitle">
              Verdex aligns key software features with United Nations Sustainable Development Goals.
            </p>
          </div>

          <div className="sdg-grid">
            {/* SDG 11 Card */}
            <div className="glass-surface sdg-card">
              <div>
                <div className="sdg-number" style={{ color: '#f97316' }}>11</div>
                <h3 className="sdg-card-title">Sustainable Cities &amp; Communities</h3>
                <p className="sdg-card-desc">
                  Providing accessible, eco-friendly public transit alternatives to lower traffic gridlock and make cities safer, resilient, and inclusive.
                </p>
              </div>
              <ul className="sdg-features">
                <li className="sdg-feature-item"><span>🏡</span> Smart routing for commuters</li>
                <li className="sdg-feature-item"><span>📊</span> Analytics for city planners</li>
                <li className="sdg-feature-item"><span>🗺️</span> Open map routing coordinates</li>
              </ul>
            </div>

            {/* SDG 13 Card */}
            <div className="glass-surface sdg-card">
              <div>
                <div className="sdg-number" style={{ color: 'var(--ldg-accent)' }}>13</div>
                <h3 className="sdg-card-title">Climate Action</h3>
                <p className="sdg-card-desc">
                  Quantifying greenhouse gas reduction per trip. Real-time calculations show exact metrics of carbon offset compared to solo vehicle use.
                </p>
              </div>
              <ul className="sdg-features">
                <li className="sdg-feature-item"><span>📉</span> Real-time offset calculations</li>
                <li className="sdg-feature-item"><span>🌳</span> Virtual token incentive systems</li>
                <li className="sdg-feature-item"><span>📂</span> System logs auditing total saves</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <span className="material-symbols-outlined" style={{ color: 'var(--ldg-accent)', fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>eco</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ldg-accent)' }}>Verdex</span>
        </div>
        <p className="footer-text">
          &copy; 2026 Verdex AI. Created for BS Artificial Intelligence (Professional Practices).
        </p>
      </footer>
    </div>
  );
}
