import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const fallbackData = [
  { name: 'Mon', completed: 4 },
  { name: 'Tue', completed: 7 },
  { name: 'Wed', completed: 5 },
  { name: 'Thu', completed: 11 },
  { name: 'Fri', completed: 9 },
  { name: 'Sat', completed: 2 },
  { name: 'Sun', completed: 3 },
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TaskCompletionChart = ({ data }) => {
  const { theme } = useTheme();
  
  const textColor = theme === 'dark' ? '#a1a1aa' : '#4b5271';
  const gridColor = theme === 'dark' ? '#27272a' : '#e3e5ef';
  const accentColor = theme === 'dark' ? '#818cf8' : '#635bff';

  const chartData = data?.length > 0
    ? data.map(d => ({
        name: dayNames[new Date(d._id).getDay()],
        completed: d.count
      }))
    : fallbackData;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: textColor, fontSize: 12 }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: textColor, fontSize: 12 }} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'var(--bg-surface)', 
            borderColor: 'var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }} 
          itemStyle={{ color: 'var(--text-primary)' }}
        />
        <Area 
          type="monotone" 
          dataKey="completed" 
          stroke={accentColor} 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorCompleted)" 
          activeDot={{ r: 6, strokeWidth: 0, fill: accentColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default TaskCompletionChart;
