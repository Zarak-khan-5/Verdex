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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('verdex_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
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

  // Sync dark/light theme to document root and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.add('light');
      localStorage.setItem('verdex_theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
      localStorage.setItem('verdex_theme', 'dark');
    }
  }, [theme]);

  // Cursor tracking for ambient radial glow lights & 3D Card Tilt
  useEffect(() => {
    // 1. Ambient Glows on window mousemove
    const handleMouseMove = (e: MouseEvent) => {
      const glows = document.querySelectorAll('.dew-drop-glow');
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      
      glows.forEach((glow: any, index) => {
        const speed = (index + 1) * 25;
        glow.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 2. 3D Card Tilt on Hover
    const cards = document.querySelectorAll('.tilt-card');
    const tiltHandlers = Array.from(cards).map((cardNode) => {
      const card = cardNode as HTMLElement;
      
      const onMouseMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const cardX = e.clientX - rect.left - rect.width / 2;
        const cardY = e.clientY - rect.top - rect.height / 2;
        // Reduced to 2.0 degrees max for subtle elegant 3D tilt effect
        const tiltX = (cardY / (rect.height / 2)) * -2.0;
        const tiltY = (cardX / (rect.width / 2)) * 2.0;
        card.style.setProperty('--rx', `${tiltX}deg`);
        card.style.setProperty('--ry', `${tiltY}deg`);
      };
      
      const onMouseLeave = () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      };
      
      card.addEventListener('mousemove', onMouseMove);
      card.addEventListener('mouseleave', onMouseLeave);
      
      return { card, onMouseMove, onMouseLeave };
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      tiltHandlers.forEach(({ card, onMouseMove, onMouseLeave }) => {
        card.removeEventListener('mousemove', onMouseMove);
        card.removeEventListener('mouseleave', onMouseLeave);
      });
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
        localStorage.setItem('verdex_token', res.token || '');
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
        if (res.status === 'pending_approval') {
          setSuccess(res.message || 'Registration request sent! Awaiting administrator approval.');
          setName('');
          setEmail('');
          setPassword('');
        } else {
          setSuccess('Registration successful! Accessing account...');
          
          localStorage.setItem('verdex_token', res.token || '');
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
      localStorage.setItem('verdex_token', res.token || '');
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
        <div className="nav-container">
          <div className="logo-group" onClick={() => scrollTo(heroRef)}>
            <span className="material-symbols-outlined" style={{ color: 'var(--ldg-accent)', fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>eco</span>
            <span className="nav-logo-text">Verdex</span>
          </div>
          
          <div className="nav-links-center">
            <button className="nav-link" onClick={() => scrollTo(heroRef)}>Home</button>
            <button className="nav-link" onClick={() => scrollTo(howItWorksRef)}>About</button>
            <button className="nav-link" onClick={() => scrollTo(sdgsRef)}>SDGs</button>
            <button className="nav-link nav-live-map-btn" onClick={() => router.push('/enviromap')}>
              <EarthIcon size={16} />
              Live Map
            </button>
          </div>

          <div className="nav-actions-right">
            <button className="theme-toggle" aria-label="Toggle Theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button className="nav-signin-btn" onClick={() => setIsAuthModalOpen(true)}>
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section-new">
        <div className="hero-grid-split">
          {/* Left Column — Content */}
          <div className="hero-left-new animate-fade-in-up">
            <div className="hero-badge-green">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>nest_eco_leaf</span>
              🌱 SDG 11 & 13 ALIGNED
            </div>
            
            <h1 className="hero-title-big">
              Smart Mobility, 
              <span className="accent">Greener Cities</span>
            </h1>
            
            <p className="hero-desc-new">
              Verdex is an event-driven AI mobility agent that optimizes urban commutes in real-time — minimizing carbon footprint while maximizing transit efficiency across your city.
            </p>
            
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => setIsAuthModalOpen(true)}>
                Get Started
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>
              <button className="btn-secondary" onClick={() => router.push('/enviromap')}>
                View Live Map
              </button>
            </div>
          </div>

          {/* Right Column — Futuristic Telemetry Terminal */}
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="glass-surface metropolitan-console tilt-card">
              <div className="console-header">
                <div className="console-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="console-title">Metropolitan Core - LIVE</div>
                <div className="console-status-indicator" style={{ opacity: 0 }}>
                  <span className="pulse-indicator"></span>
                  <span className="status-text">LIVE</span>
                </div>
              </div>
              
              <div className="console-body-new">
                <div className="isometric-grid-bg"></div>
                <div className="system-healthy-badge">System Healthy</div>
                
                {/* Stylized routes & globe center */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="map-globe-wrapper" style={{ transform: 'translateY(-15px)' }}>
                    <EarthIcon size={120} />
                  </div>
                </div>

                {/* Animated vector paths */}
                <svg className="route-vectors-isometric" viewBox="0 0 300 150">
                  <path d="M 40 100 Q 100 40, 150 75 T 260 50" fill="none" stroke="rgba(98, 179, 127, 0.4)" strokeWidth="2.5" strokeDasharray="6,6" className="animate-path-1" />
                  <path d="M 60 50 Q 150 120, 240 70" fill="none" stroke="rgba(6, 182, 212, 0.35)" strokeWidth="2" strokeDasharray="5,5" className="animate-path-2" />
                  <circle cx="150" cy="75" r="4.5" fill="var(--palette-green-2)" className="ping-node-1" />
                  <circle cx="40" cy="100" r="4.5" fill="#06b6d4" className="ping-node-2" />
                  <circle cx="260" cy="50" r="4.5" fill="var(--palette-green-2)" className="ping-node-3" />
                </svg>

                {/* Live stats pill overlay */}
                <div className="console-stats-overlay">
                  <div className="console-stat-pill">
                    <span className="stat-pill-label">ACTIVE TRIPS</span>
                    <span className="stat-pill-value green">1,204</span>
                  </div>
                  <div className="console-stat-pill">
                    <span className="stat-pill-label">AVG OFFSET</span>
                    <span className="stat-pill-value blue">84%</span>
                  </div>
                  <div className="console-stat-pill">
                    <span className="stat-pill-label">TRAFFIC INDEX</span>
                    <span className="stat-pill-value orange">Low</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Impact Section */}
      <section className="impact-section section-border">
        <div className="section-container">
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p className="section-overline">THE IMPACT</p>
            <h2 className="section-title" style={{ marginTop: '4px' }}>Targeting Global Sustainability</h2>
          </div>
          
          <div className="impact-grid animate-fade-in-up">
            <div className="glass-surface impact-card">
              <div className="impact-icon-box icon-co2">
                <span className="material-symbols-outlined">co2</span>
              </div>
              <h3 className="impact-card-title">2.5T</h3>
              <p className="impact-card-subtitle">CO₂ Saved</p>
              <p className="impact-card-desc">
                Verified carbon reduction through optimized multi-modal transit routing across partner cities.
              </p>
            </div>
            
            <div className="glass-surface impact-card">
              <div className="impact-icon-box icon-route">
                <span className="material-symbols-outlined">route</span>
              </div>
              <h3 className="impact-card-title">15K+</h3>
              <p className="impact-card-subtitle">Routes Optimized</p>
              <p className="impact-card-desc">
                Dynamic transit adjustments powered by our event-driven AI engine to reduce gridlock.
              </p>
            </div>
            
            <div className="glass-surface impact-card">
              <div className="impact-icon-box icon-uptime">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h3 className="impact-card-title">98%</h3>
              <p className="impact-card-subtitle">System Uptime</p>
              <p className="impact-card-desc">
                Enterprise-grade reliability ensuring continuous urban mobility monitoring and optimization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section (Bento Grid) */}
      <section ref={howItWorksRef} className="section-border" style={{ padding: '80px 0', position: 'relative', zIndex: 10 }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p className="section-overline">THE SYSTEM</p>
            <h2 className="section-title">How Verdex Works</h2>
            <p className="section-subtitle">
              A decoupled multi-layered architecture working in harmony to reduce metropolitan gridlock.
            </p>
          </div>
          
          <div className="bento-grid">
            {/* Bento Card 1: Event-Driven AI Engine */}
            <div className="glass-surface bento-card bento-card-wide-left bento-card-horizontal">
              <div className="bento-card-left-content">
                <div className="bento-icon-wrapper icon-ai">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <h3 className="bento-card-title">Event-Driven AI Engine</h3>
                <p className="bento-card-desc">
                  Our core architecture processes millions of metropolitan events per second, from bus locations to weather patterns, predicting congestion before it happens.
                </p>
                <a href="#engine" className="bento-link" onClick={(e) => { e.preventDefault(); scrollTo(sdgsRef); }}>
                  Learn about the Engine
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                </a>
              </div>
              <div className="bento-card-right-graphic">
                <svg className="bento-graphic-lines" viewBox="0 0 200 100">
                  <path d="M 10 80 C 40 10, 60 90, 100 50 T 190 20" fill="none" stroke="var(--ldg-accent)" strokeWidth="3" />
                  <path d="M 10 50 C 70 80, 120 20, 190 70" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="2" />
                </svg>
              </div>
            </div>
            
            {/* Bento Card 2: Carbon Wallet */}
            <div className="glass-surface bento-card">
              <div>
                <div className="bento-icon-wrapper icon-wallet">
                  <span className="material-symbols-outlined">wallet</span>
                </div>
                <h3 className="bento-card-title">Carbon Wallet</h3>
                <p className="bento-card-desc">
                  Earn and trade verified carbon credits as you choose greener commutes.
                </p>
              </div>
            </div>
            
            {/* Bento Card 3: City Planner Portal */}
            <div className="glass-surface bento-card">
              <div>
                <div className="bento-icon-wrapper icon-planner">
                  <span className="material-symbols-outlined">map</span>
                </div>
                <h3 className="bento-card-title">City Planner Portal</h3>
                <p className="bento-card-desc">
                  Empower urban designers with real-time heatmaps and sustainability metrics.
                </p>
              </div>
            </div>

            {/* Bento Card 4: Decoupled Architecture */}
            <div className="glass-surface bento-card bento-card-wide-right bento-card-horizontal">
              <div className="bento-card-left-content">
                <div className="bento-icon-wrapper icon-architecture">
                  <span className="material-symbols-outlined">layers</span>
                </div>
                <h3 className="bento-card-title">Decoupled Architecture</h3>
                <p className="bento-card-desc">
                  FastAPI backend handles heavy computational routing rules, while the Next.js React client delivers visual components dynamically.
                </p>
              </div>
              <div className="bento-card-right-graphic">
                {/* Tech node connection visualization */}
                <svg className="bento-graphic-lines" viewBox="0 0 200 100">
                  <line x1="30" y1="50" x2="100" y2="50" stroke="var(--ldg-border)" strokeWidth="2" />
                  <line x1="100" y1="50" x2="170" y2="20" stroke="var(--ldg-border)" strokeWidth="2" />
                  <line x1="100" y1="50" x2="170" y2="80" stroke="var(--ldg-border)" strokeWidth="2" />
                  <circle cx="30" cy="50" r="8" fill="var(--ldg-accent)" />
                  <circle cx="100" cy="50" r="10" fill="#06b6d4" />
                  <circle cx="170" cy="20" r="8" fill="var(--ldg-accent)" />
                  <circle cx="170" cy="80" r="8" fill="var(--ldg-accent)" />
                </svg>
              </div>
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

      {/* SaaS Footer */}
      <footer className="saas-footer">
        <div className="footer-columns">
          <div className="footer-col-left">
            <div className="logo-group">
              <span className="material-symbols-outlined" style={{ color: 'var(--ldg-accent)', fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>eco</span>
              <span className="nav-logo-text">Verdex</span>
            </div>
            <p className="footer-tagline">
              Verdex is an event-driven AI mobility agent that optimizes urban commutes in real-time, helping commute greener.
            </p>
            <div className="footer-socials">
              <button className="social-icon-btn"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span></button>
              <button className="social-icon-btn"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mail</span></button>
              <button className="social-icon-btn"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>language</span></button>
            </div>
          </div>
          
          <div>
            <h4 className="footer-col-title">Resources</h4>
            <ul className="footer-links">
              <li><span className="footer-link-item">Environmental Reports</span></li>
              <li><span className="footer-link-item">Sustainability Metrics</span></li>
              <li><span className="footer-link-item">Carbon Offset Data</span></li>
            </ul>
          </div>
          
          <div>
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links">
              <li><span className="footer-link-item" onClick={() => scrollTo(howItWorksRef)}>Contact Us</span></li>
              <li><span className="footer-link-item">Privacy Policy</span></li>
              <li><span className="footer-link-item">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-copyright">
          <p className="footer-text">
            &copy; 2026 Verdex Inc. Preserving biodiversity through technology. Created for BS Artificial Intelligence.
          </p>
        </div>
      </footer>

      {/* Authentication Modal Overlay */}
      {isAuthModalOpen && (
        <div className="auth-modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsAuthModalOpen(false)}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
            
            <div className="glass-surface-elevated login-card">
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
                    onClick={() => {
                      handleDemoLogin(acc).then(() => {
                        // If successfully authenticated, close modal
                        setIsAuthModalOpen(false);
                      });
                    }}
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
      )}
    </div>
  );
}
