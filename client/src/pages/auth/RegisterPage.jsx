import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [isAuthenticated, error, navigate, dispatch]);

  const onSubmit = (data) => dispatch(registerUser(data));

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-xl font-display font-bold text-text-primary">Create your account</h2>
        <p className="text-sm text-text-secondary mt-1">Get started with FlowDesk for free</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Full name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              <User className="w-4 h-4" />
            </div>
            <input
              {...register('name')}
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-background-base border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all placeholder:text-text-muted"
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
              className="w-full pl-10 pr-4 py-2.5 bg-background-base border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all placeholder:text-text-muted"
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
              type="password"
              className="w-full pl-10 pr-4 py-2.5 bg-background-base border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all placeholder:text-text-muted"
              placeholder="Min. 8 characters"
            />
          </div>
          {errors.password && <p className="text-danger text-xs mt-1.5 font-medium">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background-base disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] mt-2 group"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
