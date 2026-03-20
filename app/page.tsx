"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Wallet, TrendingUp, TrendingDown, Activity, Home, PieChart as PieChartIcon, List as ListIcon, Search, Target, DollarSign, TrendingUp as InvestmentIcon, Image as ImageIcon } from "lucide-react";

interface Transacao {
    data: string;
    tipo: string;
    descricao: string;
    categoria: string;
    valor: number;
    objetivo?: string;
}

interface Meta {
    nome: string;
    total: number;
    foto: string;
}

export default function Dashboard() {
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [metas, setMetas] = useState<Meta[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"inicio" | "graficos" | "historico" | "investir">("inicio");
    const [busca, setBusca] = useState("");

    useEffect(() => {
        // Adicionamos parâmetros para destruir qualquer tentativa de cache do navegador
        const fetchOptions = {
            cache: "no-store" as RequestCache,
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        };

        Promise.all([
            fetch("/api/gastos", fetchOptions).then(res => res.json()),
            fetch("/api/metas", fetchOptions).then(res => res.json())
        ])
            .then(([dadosGastos, dadosMetas]) => {
                setTransacoes(dadosGastos);
                setMetas(dadosMetas);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Erro ao buscar dados:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 text-xl font-medium antialiased">Sincronizando com a planilha...</div>;
    }

    // --- MATEMÁTICA ---
    const totalGanhos = transacoes.filter((t) => t.tipo === "Ganho").reduce((acc, curr) => acc + curr.valor, 0);
    const totalGastos = transacoes.filter((t) => t.tipo === "Gasto").reduce((acc, curr) => acc + curr.valor, 0);

    // 1. Calculamos também o total investido
    const totalInvestido = transacoes.filter((t) => t.tipo === "Investimento").reduce((acc, curr) => acc + curr.valor, 0);

    // 2. O Saldo Atual agora subtrai os gastos E os investimentos da sua conta
    const saldoAtual = totalGanhos - totalGastos - totalInvestido;

    const gastosPorCategoria = transacoes
        .filter((t) => t.tipo === "Gasto")
        .reduce((acc: Record<string, number>, curr) => {
            acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.valor;
            return acc;
        }, {} as Record<string, number>);

    const dadosPizza = Object.keys(gastosPorCategoria).map((key) => ({
        name: key,
        value: gastosPorCategoria[key],
    }));

    const CORES = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

    const dadosBarras = [
        { name: "Mês Atual", Ganhos: totalGanhos, Gastos: totalGastos },
    ];

    const gastosPorData = transacoes
        .filter((t) => t.tipo === "Gasto")
        .reduce((acc: Record<string, number>, curr) => {
            const dataFormatada = curr.data.substring(0, 5);
            acc[dataFormatada] = (acc[dataFormatada] || 0) + curr.valor;
            return acc;
        }, {} as Record<string, number>);

    const dadosArea = Object.keys(gastosPorData).sort().map((key) => ({
        date: key,
        valor: gastosPorData[key],
    }));

    const historicoFiltrado = transacoes.filter(
        (t) =>
            t.descricao.toLowerCase().includes(busca.toLowerCase()) ||
            t.categoria.toLowerCase().includes(busca.toLowerCase())
    );

    const historicoAgrupado = historicoFiltrado.reduce((acc: Record<string, Transacao[]>, curr) => {
        if (!acc[curr.data]) acc[curr.data] = [];
        acc[curr.data].push(curr);
        return acc;
    }, {});

    const formatarDinheiro = (valor: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 font-sans antialiased relative z-0">

            <header className="bg-slate-900 border-b border-slate-800 p-6 flex items-center space-x-3 sticky top-0 z-10">
                <Activity className="text-blue-500 w-8 h-8" />
                <h1 className="text-2xl font-bold tracking-tight">Finanças</h1>
            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative z-0">

                {/* ================= TELA 1: INÍCIO ================= */}
                {activeTab === "inicio" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-slate-400 font-medium">Saldo Atual</h2>
                                    <Wallet className="text-blue-500 w-5 h-5" />
                                </div>
                                <p className="text-4xl font-extrabold">{formatarDinheiro(saldoAtual)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-center">
                                    <div className="flex justify-between items-center mb-1">
                                        <h2 className="text-slate-400 text-sm font-medium">Ganhos</h2>
                                        <TrendingUp className="text-emerald-500 w-4 h-4" />
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-400">{formatarDinheiro(totalGanhos)}</p>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-center">
                                    <div className="flex justify-between items-center mb-1">
                                        <h2 className="text-slate-400 text-sm font-medium">Gastos</h2>
                                        <TrendingDown className="text-red-500 w-4 h-4" />
                                    </div>
                                    <p className="text-2xl font-bold text-red-400">{formatarDinheiro(totalGastos)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-lg font-semibold text-slate-200">Últimos Registros</h2>
                                <button onClick={() => setActiveTab("historico")} className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors">Ver tudo</button>
                            </div>
                            <div className="space-y-4">
                                {transacoes.slice().reverse().slice(0, 5).map((t, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-800/30 p-4 rounded-xl border border-slate-800/50">
                                        <div>
                                            <p className="font-medium text-slate-100">{t.descricao}</p>
                                            <p className="text-xs text-slate-500">{t.categoria} • {t.data}</p>
                                        </div>
                                        <p className={`font-semibold text-base ${t.tipo === 'Gasto' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {t.tipo === 'Gasto' ? '-' : '+'}{formatarDinheiro(t.valor)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= TELA 2: GRÁFICOS ================= */}
                {activeTab === "graficos" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg flex flex-col items-center h-[420px]">
                            <h2 className="text-lg font-semibold mb-3 text-slate-200 w-full text-left">Gastos por Categoria</h2>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={dadosPizza} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {dadosPizza.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: unknown) => formatarDinheiro(Number(value))} contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px'}} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg flex flex-col h-[420px]">
                            <h2 className="text-lg font-semibold mb-4 text-slate-200">Tendência de Gastos (Área)</h2>
                            <div className="flex-1 -ml-6 -mr-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dadosArea} margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} interval={0} padding={{left: 10}} />
                                        <Tooltip contentStyle={{background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} formatter={(value: unknown) => formatarDinheiro(Number(value))} />
                                        <Area type="monotone" dataKey="valor" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                                        <ReferenceLine y={totalGastos / (transacoes.length / 30)} label="Média" stroke="#475569" strokeDasharray="3 3" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg h-[450px] md:col-span-2">
                            <h2 className="text-lg font-semibold mb-5 text-slate-200">Termômetro do Mês</h2>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dadosBarras} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={13} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `R$ ${value}`} axisLine={false} tickLine={false} width={80} />
                                    <Tooltip formatter={(value: unknown) => formatarDinheiro(Number(value))} cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px'}} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', paddingTop: '15px' }} />
                                    <Bar dataKey="Ganhos" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={100} />
                                    <Bar dataKey="Gastos" fill="#ef4444" radius={[8, 8, 0, 0]} maxBarSize={100} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* ================= TELA 3: HISTÓRICO ================= */}
                {activeTab === "historico" && (
                    <div className="space-y-6 max-w-2xl mx-auto relative z-0">
                        <div className="relative sticky top-[97px] z-10 bg-slate-950 py-3 -mt-3">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar despesa ou categoria..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl py-4 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        <div className="space-y-7 relative z-0">
                            {Object.keys(historicoAgrupado).reverse().map((dataString) => (
                                <div key={dataString}>
                                    <h3 className="text-sm font-semibold text-slate-500 mb-4 border-b border-slate-800 pb-2 tracking-wider uppercase">{dataString}</h3>
                                    <div className="space-y-4">
                                        {historicoAgrupado[dataString].map((t, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-900 p-5 rounded-2xl border border-slate-800">
                                                <div>
                                                    <p className="font-medium text-slate-100 text-lg">{t.descricao}</p>
                                                    <span className="inline-block mt-1.5 bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-medium">
                            {t.categoria}
                          </span>
                                                </div>
                                                <p className={`font-extrabold text-lg ${t.tipo === 'Gasto' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {t.tipo === 'Gasto' ? '-' : '+'}{formatarDinheiro(t.valor)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {Object.keys(historicoAgrupado).length === 0 && (
                                <p className="text-center text-slate-600 py-16 text-lg">Nenhum registro encontrado.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ================= TELA 4: INVESTIR (METAS DINÂMICAS) ================= */}
                {activeTab === "investir" && (
                    <div className="space-y-6 max-w-2xl mx-auto relative z-0">
                        <header className="flex items-center space-x-3 mb-6">
                            <InvestmentIcon className="w-7 h-7 text-emerald-500" />
                            <h2 className="text-2xl font-bold tracking-tight">Meus Objetivos</h2>
                        </header>

                        {metas.filter(m => m.nome).map((meta, idx) => {

                            // 👇 MAGIA BLINDADA CONTRA ERROS DE DIGITAÇÃO 👇
                            const arrecadado = transacoes
                                .filter(t => {
                                    const objGasto = (t.objetivo || "").trim().toLowerCase();
                                    const descGasto = (t.descricao || "").trim().toLowerCase();
                                    const nomeMeta = (meta.nome || "").trim().toLowerCase();

                                    return objGasto === nomeMeta || descGasto === nomeMeta;
                                })
                                .reduce((acc, curr) => acc + curr.valor, 0);

                            const porcentagem = Math.min(100, Math.max(0, (arrecadado / meta.total) * 100));
                            const progressoFormatado = formatarDinheiro(arrecadado);
                            const totalFormatado = formatarDinheiro(meta.total);

                            return (
                                <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center md:space-x-6 space-y-4 md:space-y-0">

                                    {/* Mostra a foto real se tiver URL, ou um ícone padrão se não tiver */}
                                    {meta.foto && meta.foto.startsWith("http") ? (
                                        <img src={meta.foto} alt={meta.nome} className="w-20 h-20 rounded-full object-cover border-4 border-slate-800 shadow-md" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
                                            <Target className="w-8 h-8 text-slate-400" />
                                        </div>
                                    )}

                                    <div className="flex-1 w-full space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl font-semibold text-slate-100">{meta.nome}</h3>
                                            <span className="text-sm font-medium text-slate-400">{porcentagem.toFixed(2)}% arrecadado</span>
                                        </div>
                                        <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${porcentagem >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                style={{ width: `${porcentagem}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <p className="text-slate-300 font-medium">{progressoFormatado}</p>
                                            <p className="text-slate-500">de {totalFormatado}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {metas.length === 0 && (
                            <p className="text-center text-slate-600 py-16 text-lg">Nenhum objetivo encontrado na planilha.</p>
                        )}
                    </div>
                )}

            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur border-t border-slate-800 px-6 py-3.5 flex justify-between items-center z-50 rounded-t-2xl shadow-inner">
                <NavButton tab="inicio" icon={Home} label="Início" current={activeTab} setter={setActiveTab} />
                <NavButton tab="graficos" icon={PieChartIcon} label="Gráficos" current={activeTab} setter={setActiveTab} />
                <NavButton tab="historico" icon={ListIcon} label="Histórico" current={activeTab} setter={setActiveTab} />
                <NavButton tab="investir" icon={DollarSign} label="Investir" current={activeTab} setter={setActiveTab} />
            </nav>

        </div>
    );
}

interface NavButtonProps {
    tab: "inicio" | "graficos" | "historico" | "investir";
    icon: React.ElementType;
    label: string;
    current: string;
    setter: (tab: "inicio" | "graficos" | "historico" | "investir") => void;
}

function NavButton({ tab, icon: Icon, label, current, setter }: NavButtonProps) {
    const isActive = current === tab;
    return (
        <button
            onClick={() => setter(tab)}
            className={`flex flex-col items-center space-y-1.5 transition-colors group ${isActive ? "text-blue-500" : "text-slate-500"}`}
        >
            <Icon className={`w-7 h-7 transition-transform ${isActive ? "scale-100" : "scale-90 group-hover:scale-100"}`} />
            <span className={`text-[11px] font-semibold transition-opacity ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
        {label}
      </span>
        </button>
    );
}