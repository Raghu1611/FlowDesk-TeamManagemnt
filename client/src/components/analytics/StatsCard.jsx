import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  accent: { icon: 'text-accent bg-accent/10', ring: 'ring-accent/5' },
  success: { icon: 'text-success bg-success/10', ring: 'ring-success/5' },
  danger: { icon: 'text-danger bg-danger/10', ring: 'ring-danger/5' },
  warning: { icon: 'text-warning bg-warning/10', ring: 'ring-warning/5' },
  info: { icon: 'text-info bg-info/10', ring: 'ring-info/5' },
};

const StatsCard = ({ title, value, trend, trendUp, icon: Icon, color = 'accent' }) => {
  const c = colorMap[color] || colorMap.accent;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-background-surface p-5 rounded-xl border border-border shadow-card hover:shadow-cardHover transition-shadow ring-1 ${c.ring}`}
    >
      <div className="flex justify-between items-start mb-3">
        <p className="text-[13px] font-medium text-text-secondary">{title}</p>
        <div className={`p-2 rounded-lg ${c.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-display font-bold text-text-primary tracking-tight">{value}</span>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-success' : 'text-text-muted'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : null}
            <span>{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
