import { Outlet } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-base relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] bg-accent rounded-full blur-[180px] opacity-[0.08]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-info rounded-full blur-[160px] opacity-[0.06]"></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-success rounded-full blur-[140px] opacity-[0.04]"></div>
        <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-[440px] animate-fadeIn">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent via-accent to-info flex items-center justify-center font-display font-bold text-2xl text-white shadow-[0_8px_30px_-8px_var(--accent)] mb-5 ring-1 ring-white/10">
            F
          </div>
          <h1 className="text-3xl font-display font-extrabold text-text-primary tracking-tight">FlowDesk</h1>
          <p className="text-text-secondary mt-2 text-sm font-medium">Real-time team project management</p>
        </div>

        {/* Card */}
        <div className="glass border border-border rounded-2xl p-8 sm:p-10 shadow-card relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"></div>
          <Outlet />
        </div>

        <p className="text-center text-text-muted text-xs mt-6">Secured with JWT authentication & role-based access</p>
      </div>
    </div>
  );
};

export default AuthLayout;
