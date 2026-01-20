import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTickets } from "@/hooks/use-tickets";

export default function Reports() {
  const { data: response } = useTickets();
  const tickets = response?.tickets || [];

  const statusData = [
    { name: 'Aberto', value: tickets.filter(t => t.status === 'open').length || 0, color: '#3b82f6' },
    { name: 'Em Andamento', value: tickets.filter(t => t.status === 'in_progress').length || 0, color: '#f59e0b' },
    { name: 'Resolvido', value: tickets.filter(t => t.status === 'resolved').length || 0, color: '#22c55e' },
    { name: 'Fechado', value: tickets.filter(t => t.status === 'closed').length || 0, color: '#64748b' },
  ];

  const priorityData = [
    { name: 'Baixa', count: tickets.filter(t => t.priority === 'low').length || 0 },
    { name: 'Média', count: tickets.filter(t => t.priority === 'medium').length || 0 },
    { name: 'Alta', count: tickets.filter(t => t.priority === 'high').length || 0 },
    { name: 'Crítica', count: tickets.filter(t => t.priority === 'critical').length || 0 },
  ];

  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Relatórios e Análises</h1>
        <p className="text-slate-500 mt-2">Insights sobre o volume de chamados e o desempenho da resolução.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Chamados por Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {statusData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-slate-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Chamados por Prioridade</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
