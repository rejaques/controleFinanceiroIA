"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Wallet, TrendingUp, TrendingDown, Activity } from "lucide-react";

// Tipagem dos dados que vêm da nossa API
interface Transacao {
  data: string;
  tipo: string;
  descricao: string;
  categoria: string;
  valor: number;
}

export default function Dashboard() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca os dados da nossa API Node quando a tela carrega
  useEffect(() => {
    fetch("/api/gastos")
        .then((res) => res.json())
        .then((data) => {
          setTransacoes(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Erro ao buscar dados:", err);
          setLoading(false);
        });
  }, []);

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 text-xl font-medium">
          Carregando seus dados...
        </div>
    );
  }

  // --- MATEMÁTICA DO DASHBOARD ---
  const totalGanhos = transacoes.filter((t) => t.tipo === "Ganho").reduce((acc, curr) => acc + curr.valor, 0);
  const totalGastos = transacoes.filter((t) => t.tipo === "Gasto").reduce((acc, curr) => acc + curr.valor, 0);
  const saldoAtual = totalGanhos - totalGastos;

  // Agrupar gastos por categoria para o Gráfico de Pizza (Tipagem corrigida)
  const gastosPorCategoria = transacoes
      .filter((t) => t.tipo === "Gasto")
      .reduce((acc: Record<string, number>, curr) => {
        acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.valor;
        return acc;
      }, {} as Record<string, number>);

  // Mapear o objeto agrupado para o formato de array que o Recharts pede (Variável restaurada)
  const dadosPizza = Object.keys(gastosPorCategoria).map((key) => ({
    name: key,
    value: gastosPorCategoria[key],
  }));

  // Cores do gráfico de pizza
  const CORES = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  // Dados para o Gráfico de Barras (Entradas vs Saídas)
  const dadosBarras = [
    { name: "Ganhos", valor: totalGanhos, fill: "#10b981" },
    { name: "Gastos", valor: totalGastos, fill: "#ef4444" },
  ];

  // Formatar dinheiro no padrão BR
  const formatarDinheiro = (valor: number) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Cabeçalho */}
          <header className="flex items-center space-x-3 mb-8">
            <Activity className="text-blue-500 w-8 h-8" />
            <h1 className="text-3xl font-bold tracking-tight">Meu Dashboard Financeiro</h1>
          </header>

          {/* Linha dos Cartões Superiores (Saldo) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cartão Saldo */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-slate-400 font-medium">Saldo Atual</h2>
                <Wallet className="text-blue-500 w-6 h-6" />
              </div>
              <p className="text-4xl font-bold">{formatarDinheiro(saldoAtual)}</p>
            </div>

            {/* Cartão Ganhos */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-slate-400 font-medium">Total de Ganhos</h2>
                <TrendingUp className="text-emerald-500 w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-emerald-400">{formatarDinheiro(totalGanhos)}</p>
            </div>

            {/* Cartão Gastos */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-slate-400 font-medium">Total de Gastos</h2>
                <TrendingDown className="text-red-500 w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-red-400">{formatarDinheiro(totalGastos)}</p>
            </div>
          </div>

          {/* Linha dos Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
            {/* Raio-X de Gastos */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-slate-300">Gastos por Categoria</h2>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dadosPizza} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                      {dadosPizza.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: unknown) => formatarDinheiro(Number(value))} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#cbd5e1' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Termômetro */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-slate-300">Termômetro do Mês</h2>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosBarras}>
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" tickFormatter={(value) => `R$ ${value}`} />
                    {/* Tooltip com tipagem unknown corrigida */}
                    <Tooltip formatter={(value: unknown) => formatarDinheiro(Number(value))} cursor={{fill: '#1e293b'}} />
                    <Bar dataKey="valor" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Histórico Completo */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg mt-6">
            <h2 className="text-lg font-semibold mb-6 text-slate-300">Histórico Recente</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Descrição</th>
                  <th className="pb-3 font-medium">Categoria</th>
                  <th className="pb-3 font-medium text-right">Valor</th>
                </tr>
                </thead>
                <tbody>
                {/* Mostra só os 10 últimos registros pra não poluir a tela */}
                {transacoes.slice().reverse().slice(0, 10).map((t, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 text-slate-300">{t.data}</td>
                      <td className="py-4 font-medium text-slate-200">{t.descricao}</td>
                      <td className="py-4 text-slate-400">
                        <span className="bg-slate-800 px-3 py-1 rounded-full text-sm">{t.categoria}</span>
                      </td>
                      <td className={`py-4 text-right font-semibold ${t.tipo === 'Gasto' ? 'text-red-400' : t.tipo === 'Ganho' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {t.tipo === 'Gasto' ? '-' : '+'}{formatarDinheiro(t.valor)}
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
  );
}