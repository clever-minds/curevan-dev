
'use client';

import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/currency";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

interface DashboardCardProps {
  title: string;
  description?: string;
  data: any[];
  type: "line" | "bar" | "pie";
  categoryKey: string;
  valueKey: string;
  className?: string;
  loading?: boolean;
  isCurrency?: boolean;
}

export function DashboardCard({ title, description, data, type, categoryKey, valueKey, className, loading, isCurrency = false }: DashboardCardProps) {
  const ChartComponent = () => {
    switch (type) {
      case 'line':
        // If it's a line chart, we might want to show multiple lines (e.g., revenue and refunds)
        const lineKeys = ['revenue', 'refunds'].filter(key => 
          data.length > 0 && data[0].hasOwnProperty(key)
        );
        
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
              <XAxis 
                dataKey={categoryKey} 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => isCurrency && typeof value === 'number' ? formatINR(value) : value}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={40}
              />
              <Tooltip 
                formatter={(value: any) => isCurrency && typeof value === 'number' ? formatINR(value, true) : value}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }}/>
              {lineKeys.map((key, index) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  name={key.charAt(0).toUpperCase() + key.slice(1)}
                  stroke={index === 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} 
                  strokeWidth={2} 
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey={categoryKey} stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => isCurrency && typeof value === 'number' ? formatINR(value) : value} width={40} />
              <Tooltip 
                formatter={(value: any) => isCurrency && typeof value === 'number' ? formatINR(value, true) : value}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey={valueKey} radius={[4, 4, 0, 0]}>
                   {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={data} 
                dataKey={valueKey} 
                nameKey={categoryKey} 
                cx="50%" 
                cy="50%" 
                outerRadius="70%" 
                innerRadius="40%"
                paddingAngle={5}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => isCurrency && typeof value === 'number' ? formatINR(value) : value}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  console.log(`Rendering DashboardCard: ${title}`, { data, lineKeys: (type === 'line' ? ['revenue', 'refunds'].filter(k => data.length > 0 && data[0].hasOwnProperty(k)) : []) });

  return (
    <Card className={cn("avoid-break", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        ) : data && data.length > 0 ? (
          <div className="h-[250px] sm:h-[300px] w-full border border-dashed border-muted-foreground/20 rounded-md flex items-center justify-center bg-muted/5 p-2 overflow-hidden">
              <ChartComponent />
          </div>
        ) : (
          <div className="flex h-[250px] sm:h-[300px] w-full items-center justify-center text-muted-foreground">
            No data available for this period.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
