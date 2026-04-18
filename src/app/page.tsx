'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, TrendingUp, BarChart3, Zap, ArrowRight, Code, Globe, Cloud, Network } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function LandingPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const features = [
    {
      icon: Terminal,
      title: 'Unified Dashboard',
      description: 'Every submission, across every platform, visualized in a single high-fidelity stream.',
      color: '#81ecff',
      span: 'md:col-span-2',
    },
    {
      icon: TrendingUp,
      title: 'Streak Tracking',
      description: 'Maintain your momentum with automated streak preservation and activity heatmaps.',
      color: '#c3f400',
      span: '',
    },
    {
      icon: BarChart3,
      title: 'Topic Analysis',
      description: 'Identify mastery levels in Dynamic Programming, Graph Theory, and more.',
      color: '#d277ff',
      span: '',
    },
    {
      icon: Zap,
      title: 'Algorithmic Pulse',
      description: 'Real-time data streaming provides instant feedback on your global ranking shifts.',
      color: '#81ecff',
      span: 'md:col-span-2',
    },
  ];

  const platforms = [
    { name: 'LeetCode', icon: Code },
    { name: 'Codeforces', icon: Globe },
    { name: 'GitHub', icon: Cloud },
    { name: 'AtCoder', icon: Network },
  ];

  const tickerItems = [
    { label: 'SUB_SUCCESS', text: 'user_882 solve DP_EXPERT', time: '2ms ago', color: '#c3f400' },
    { label: 'RANK_UP', text: 'code_ninja +42 rating CF', time: '15s ago', color: '#81ecff' },
    { label: 'STREAK_FLAME', text: 'algo_master 365 DAYS', time: '1m ago', color: '#d277ff' },
    { label: 'CONTEST_LIVE', text: 'Weekly Contest 382', time: 'ENDS 45:12', color: '#ff716c' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse" style={{ backgroundImage: 'linear-gradient(135deg, #81ecff 0%, #00e3fd 100%)' }}>
            <Terminal className="w-6 h-6 text-[#003840]" />
          </div>
          <p className="text-[#a7abb2] font-mono text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0f14] overflow-x-hidden">
      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-[#0a0f14] flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center px-4 sm:px-6 lg:px-12 py-4 border-b border-[#43484e]/15">
        <div className="flex items-center gap-4 sm:gap-8 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundImage: 'linear-gradient(135deg, #81ecff 0%, #00e3fd 100%)' }}>
              <Terminal className="w-5 h-5 text-[#003840]" />
            </div>
            <span className="text-xl font-black text-[#81ecff] tracking-tighter">
              Algolytics
            </span>
          </div>
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#features" className="text-[#81ecff] font-bold transition-colors">
              Features
            </a>
            <a href="#platforms" className="text-[#a7abb2] hover:text-[#eaeef5] hover:bg-[#1f262e] px-3 py-1 rounded transition-colors">
              Integrations
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#1f262e] text-[#81ecff] font-bold text-sm hover:bg-[#252d35] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#81ecff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#81ecff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#81ecff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#81ecff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign In
          </button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center overflow-hidden px-4 sm:px-6 lg:px-12 py-10 sm:py-0">
          <div className="absolute right-[-10%] top-[-10%] w-[60%] h-[120%] bg-[#81ecff]/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1f262e] border border-[#43484e]/20 rounded-full mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c3f400] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c3f400]"></span>
                </span>
                <span className="text-[0.7rem] uppercase tracking-widest font-bold text-[#a7abb2]">
                  Live Tracking Active
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
                Elevate Your <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #81ecff 0%, #00e3fd 100%)' }}>
                  Competitive
                </span>{' '}
                <br />
                Programming
              </h1>

              <p className="text-[#a7abb2] text-base sm:text-lg lg:text-xl max-w-lg mb-8 sm:mb-10 leading-relaxed">
                The mission control for modern developers. Aggregate LeetCode, Codeforces, and GitHub metrics into one surgical interface. Built for precision.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-[#003840] font-bold px-8 py-4 rounded-lg neon-glow-primary hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                  style={{ backgroundImage: 'linear-gradient(135deg, #81ecff 0%, #00e3fd 100%)' }}
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="bg-transparent border border-[#43484e]/30 text-[#81ecff] font-bold px-8 py-4 rounded-lg hover:bg-[#141a20] transition-all">
                  View Demo
                </button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#81ecff]/10 blur-3xl rounded-full"></div>
                <div className="bg-[#141a20] border border-[#43484e]/20 p-2 rounded-xl overflow-hidden shadow-2xl">
                  <div className="rounded-lg p-8 aspect-video flex items-center justify-center" style={{ backgroundImage: 'linear-gradient(135deg, #0a0f14 0%, #141a20 100%)' }}>
                    <div className="text-center space-y-4">
                      <div className="flex justify-center gap-8 text-sm font-mono">
                        <div>
                          <span className="text-[#c3f400]">SOLVED</span>
                          <p className="text-4xl font-black text-[#eaeef5]">1,248</p>
                        </div>
                        <div>
                          <span className="text-[#81ecff]">RANK</span>
                          <p className="text-4xl font-black text-[#81ecff]">#842</p>
                        </div>
                        <div>
                          <span className="text-[#d277ff]">STREAK</span>
                          <p className="text-4xl font-black text-[#d277ff]">42d</p>
                        </div>
                      </div>
                      <div className="flex justify-center gap-1 mt-4">
                        {[...Array(7)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-sm ${i < 5 ? 'bg-[#c3f400]' : 'bg-[#1f262e]'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Integrations */}
        <section id="platforms" className="py-12 bg-[#0e1419] border-y border-[#43484e]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="text-center text-[#a7abb2] text-sm uppercase tracking-[0.3em] mb-10 font-bold">
              Connected Ecosystems
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-60">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div
                    key={platform.name}
                    className="flex items-center gap-2 group cursor-default"
                  >
                    <Icon className="text-3xl text-[#a7abb2] group-hover:text-[#81ecff] transition-colors" />
                    <span className="font-bold text-xl text-[#a7abb2] group-hover:text-[#eaeef5] transition-colors">
                      {platform.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-black mb-4">Precision Instrumentation</h2>
            <p className="text-[#a7abb2] max-w-xl">
              Deep analysis tools designed to identify bottlenecks in your algorithmic thinking and runtime performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`${feature.span || ''} bg-[#0e1419] p-8 rounded-xl border border-[#43484e]/10 flex flex-col justify-between group hover:bg-[#141a20] transition-all`}
                >
                  <div>
                    <Icon className="w-10 h-10 mb-6" style={{ color: feature.color }} />
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-[#a7abb2] leading-relaxed max-w-md">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Stats Ticker */}
        <section className="py-16 bg-[#000000] overflow-hidden border-y border-[#43484e]/10">
          <div className="flex whitespace-nowrap gap-16 items-center animate-marquee w-max">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <div key={index} className="flex items-center gap-4 min-w-max">
                <span className="font-mono font-bold" style={{ color: item.color }}>
                  {item.label}
                </span>
                <span className="font-bold text-[#eaeef5]">{item.text}</span>
                <span className="text-[#a7abb2] font-mono text-xs">{item.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 text-center max-w-4xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-black mb-6">
            Ready to decode your potential?
          </h2>
          <p className="text-[#a7abb2] text-lg mb-12">
            Join 10,000+ engineers optimizing their growth curve with Algolytics.
          </p>
          <div className="relative inline-block group">
            <div className="absolute -inset-1 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-200" style={{ backgroundImage: 'linear-gradient(90deg, #81ecff 0%, #c3f400 100%)' }}></div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="relative bg-[#141a20] text-[#eaeef5] font-bold px-12 py-5 rounded-lg border border-[#43484e]/30 active:scale-95 transition-all flex items-center gap-3 mx-auto"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#81ecff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#81ecff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#81ecff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#81ecff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Initialize Account
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0e1419] py-12 px-6 border-t border-[#43484e]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundImage: 'linear-gradient(135deg, #81ecff 0%, #00e3fd 100%)' }}>
                <Terminal className="w-4 h-4 text-[#003840]" />
              </div>
              <span className="text-lg font-black text-[#81ecff] tracking-tighter">
                Algolytics
              </span>
            </div>
            <p className="text-[#a7abb2] text-sm">Mission Control for Competitive Programmers</p>
          </div>

          <div className="flex gap-8">
            {['Privacy', 'Terms', 'API Docs', 'Support'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[#a7abb2] hover:text-[#81ecff] transition-colors text-sm font-medium"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="text-[#a7abb2] text-xs font-mono">
            © 2024 ALGOLYTICS_SYSTEMS.v1.0.0
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <div className="fixed inset-0 bg-[#0a0f14]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141a20] rounded-2xl w-full max-w-sm p-8 border border-[#43484e]/30 relative shadow-2xl">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-[#a7abb2] hover:text-[#eaeef5]"
            >
              ✕
            </button>
            <h2 className="text-2xl font-black text-[#eaeef5] mb-2">Access Portal</h2>
            <p className="text-xs text-[#a7abb2] mb-6">Authenticate to synchronize your algorithms.</p>
            
            {authError && <div className="text-[#ff716c] text-xs mb-4 bg-[#ff716c]/10 p-2 rounded">{authError}</div>}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setAuthError('');
              try {
                // Try logging in first
                await signInWithEmail(email, password);
              } catch (err: any) {
                if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                  try {
                    // Fall back to sign up if they don't exist
                    await signUpWithEmail(email, password);
                  } catch (signupErr: any) {
                    setAuthError(signupErr.message || 'Authentication failed');
                  }
                } else {
                  setAuthError(err.message || 'Authentication failed');
                }
              }
            }} className="flex flex-col gap-4 mb-6">
              <input 
                type="email" 
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-[#0a0f14] border border-[#43484e]/50 rounded-lg px-4 py-3 text-sm text-[#eaeef5] focus:ring-1 focus:ring-[#81ecff] outline-none"
                required
              />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-[#0a0f14] border border-[#43484e]/50 rounded-lg px-4 py-3 text-sm text-[#eaeef5] focus:ring-1 focus:ring-[#81ecff] outline-none"
                required
              />
              <button 
                type="submit"
                className="bg-[#eaeef5] text-[#0a0f14] font-bold rounded-lg px-4 py-3 hover:bg-[#81ecff] transition-colors"
              >
                Sign In / Register
              </button>
            </form>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 border-t border-[#43484e]/30"></div>
              <span className="text-[#a7abb2] text-xs">or</span>
              <div className="flex-1 border-t border-[#43484e]/30"></div>
            </div>

            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#1f262e] text-[#81ecff] font-bold text-sm hover:bg-[#252d35] transition-colors border border-[#43484e]/30"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#81ecff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#81ecff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#81ecff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#81ecff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
