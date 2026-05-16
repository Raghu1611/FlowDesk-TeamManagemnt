import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');
  const passwordStrength = passwordValue.length >= 12 ? 3 : passwordValue.length >= 8 ? 2 : passwordValue.length >= 4 ? 1 : 0;

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [isAuthenticated, error, navigate, dispatch]);

  const onSubmit = (data) => dispatch(registerUser(data));

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-success" />
          </div>
          <span className="text-[11px] font-semibold text-success uppercase tracking-wider">Get Started</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-text-primary leading-tight">Create your account</h2>
        <p className="text-sm text-text-secondary mt-1.5">Start managing projects with your team</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Full name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              <User className="w-4 h-4" />
            </div>
            <input
              {...register('name')}
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-background-base border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all placeholder:text-text-muted"
              placeholder="John Doe"
            />
          </div>
          {errors.name && <p className="text-danger text-xs mt-1.5 font-medium">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              <Mail className="w-4 h-4" />
            </div>
            <input
              {...register('email')}
              type="email"
              className="w-full pl-10 pr-4 py-3 bg-background-base border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all placeholder:text-text-muted"
              placeholder="name@company.com"
            />
          </div>
          {errors.email && <p className="text-danger text-xs mt-1.5 font-medium">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              <Lock className="w-4 h-4" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full pl-10 pr-11 py-3 bg-background-base border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all placeholder:text-text-muted"
              placeholder="Min. 8 characters"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-secondary transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Password strength indicator */}
          {passwordValue && (
            <div className="flex gap-1.5 mt-2">
              {[1, 2, 3].map(level => (
                <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength >= level
                  ? level === 1 ? 'bg-danger' : level === 2 ? 'bg-warning' : 'bg-success'
                  : 'bg-border'}`} />
              ))}
              <span className="text-[10px] text-text-muted ml-1">
                {passwordStrength <= 1 ? 'Weak' : passwordStrength === 2 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}
          {errors.password && <p className="text-danger text-xs mt-1.5 font-medium">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background-base disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_8px_rgba(0,122,255,0.25)] hover:shadow-[0_4px_16px_rgba(0,122,255,0.3)] mt-2 group"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">Have an account?</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Link to="/login"
        className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-accent bg-accent/5 border border-accent/20 hover:bg-accent/10 hover:border-accent/30 transition-all">
        Sign in instead <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default RegisterPage;
