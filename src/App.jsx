import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Trash2, Filter, BarChart3, Download, Upload, PiggyBank, Home, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Ajuste de Storage para persistência no navegador
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: (key) => Promise.resolve({ value: localStorage.getItem(key) }),
    set: (key, value) => {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
  };
}

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('painel');
  const [mesAtual, setMesAtual] = useState(new Date().toISOString().slice(0, 7));
  
  const [receitasPlanejadas, setReceitasPlanejadas] = useState([]);
  const [despesasPlanejadas, setDespesasPlanejadas] = useState([]);
  const [receitasReais, setReceitasReais] = useState([]);
  const [despesasReais, setDespesasReais] = useState([]);
  
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroResponsavel, setFiltroResponsavel] = useState('todos');
  const [filtroBolso, setFiltroBolso] = useState('todos');
  
  const categoriasPorBolso = {
    essenciais: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Contas Básicas'],
    qualidade: ['Lazer', 'Viagens', 'Restaurantes', 'Hobbies', 'Assinaturas', 'Presentes'],
    futuro: ['Investimentos', 'Poupança', 'Emergência', 'Aposentadoria']
  };
  
  const todasCategorias = [...categoriasPorBolso.essenciais, ...categoriasPorBolso.qualidade, ...categoriasPorBolso.futuro];
  const responsaveis = ['André', 'Heloisa'];

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const dados = await window.storage.get('orcamento-familiar-dados');
        if (dados && dados.value) {
          const parsed = JSON.parse(dados.value);
          setReceitasPlanejadas(parsed.receitasPlanejadas || []);
          setDespesasPlanejadas(parsed.despesasPlanejadas || []);
          setReceitasReais(parsed.receitasReais || []);
          setDespesasReais(parsed.despesasReais || []);
        }
      } catch (error) { console.log('Sem dados salvos.'); }
    };
    carregarDados();
  }, []);

  useEffect(() => {
    const salvarDados = async () => {
      try {
        const dados = { receitasPlanejadas, despesasPlanejadas, receitasReais, despesasReais };
        await window.storage.set('orcamento-familiar-dados', JSON.stringify(dados));
      } catch (error) { console.error('Erro ao salvar:', error); }
    };
    if (receitasPlanejadas.length > 0 || despesasPlanejadas.length > 0 || receitasReais.length > 0 || despesasReais.length > 0) {
      salvarDados();
    }
  }, [receitasPlanejadas, despesasPlanejadas, receitasReais, despesasReais]);

  const exportarDados = () => {
    const dados = { receitasPlanejadas, despesasPlanejadas, receitasReais, despesasReais };
    const dataStr = JSON.stringify(dados, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orcamento-2026.json`;
    link.click();
  };

  const importarDados = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dados = JSON.parse(e.target.result);
          setReceitasPlanejadas(dados.receitasPlanejadas || []);
          setDespesasPlanejadas(dados.despesasPlanejadas || []);
          setReceitasReais(dados.receitasReais || []);
          setDespesasReais(dados.despesasReais || []);
        } catch (e) { alert('Erro no arquivo.'); }
      };
      reader.readAsText(file);
    }
  };

  const getBolsoCategoria = (categoria) => {
    if (categoriasPorBolso.essenciais.includes(categoria)) return 'essenciais';
    if (categoriasPorBolso.qualidade.includes(categoria)) return 'qualidade';
    if (categoriasPorBolso.futuro.includes(categoria)) return 'futuro';
    return 'essenciais';
  };

  const calcularTotais = () => {
    const rPlan = receitasPlanejadas.filter(r => r.mes === mesAtual).reduce((s, r) => s + r.valor, 0);
    const dPlan = despesasPlanejadas.filter(d => d.mes === mesAtual).reduce((s, d) => s + d.valor, 0);
    const rReal = receitasReais.filter(r => r.data.startsWith(mesAtual)).reduce((s, r) => s + r.valor, 0);
    const dReal = despesasReais.filter(d => d.data.startsWith(mesAtual)).reduce((s, d) => s + d.valor, 0);
    return { rPlan, dPlan, rReal, dReal, saldoReal: rReal - dReal };
  };

  const calcularMetodo = () => {
    const t = calcularTotais();
    const receitaRef = t.rReal > 0 ? t.rReal : t.rPlan;
    const orcs = { essenciais: receitaRef * 0.60, qualidade: receitaRef * 0.30, futuro: receitaRef * 0.10 };
    const gastos = {
      essenciais: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.essenciais.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      qualidade: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.qualidade.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      futuro: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.futuro.includes(d.categoria)).reduce((s, d) => s + d.valor, 0)
    };
    return { receitaRef, orcs, gastos };
  };

  const t = calcularTotais();
  const m = calcularMetodo();

  const Painel = () => (
    <div className="space-y-6">
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex gap-3 justify-end shadow-sm">
        <button onClick={exportarDados} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"><Download size={18} /> Exportar</button>
        <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold cursor-pointer"><Upload size={18} /> Importar<input type="file" accept=".json" onChange={importarDados} className="hidden" /></label>
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2"><Sparkles /> Método 60/30/10</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['essenciais', 'qualidade', 'futuro'].map((b, i) => {
            const cores = ['blue', 'green', 'purple'];
            const labels = ['60% Essenciais', '30% Qualidade', '10% Futuro'];
            const pct = Math.min((m.gastos[b] / (m.orcs[b] || 1)) * 100, 100);
            return (
              <div key={b} className={`bg-white border-2 border-${cores[i]}-200 p-4 rounded-lg`}>
                <p className="text-sm font-bold text-gray-500">{labels[i]}</p>
                <p className={`text-2xl font-bold text-${cores[i]}-700`}>R$ {m.orcs[b].toFixed(2)}</p>
                <div className="w-full bg-gray-100 h-2 rounded-full mt-3"><div className={`h-2 rounded-full bg-${cores[i]}-500`} style={{ width: `${pct}%` }}></div></div>
                <p className="text-xs mt-2 text-gray-600">Gasto: R$ {m.gastos[b].toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-blue-700 text-white p-8 rounded-xl shadow-xl text-center">
        <p className="text-sm font-bold opacity-80 tracking-widest uppercase">Saldo Real Acumulado</p>
        <p className="text-5xl font-black mt-2">R$ {t.saldoReal.toFixed(2)}</p>
      </div>
    </div>
  );

  const PlanejamentoReceitas = () => {
    const [f, sf] = useState({ descricao: '', valor: '', responsavel: 'André', mes: mesAtual });
    const add = () => { if(f.descricao && f.valor) { setReceitasPlanejadas([...receitasPlanejadas, {...f, valor: parseFloat(f.valor), id: Date.now()}]); sf({...f, descricao: '', valor: ''}); } };
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
          <h3 className="font-bold text-green-700 mb-4">Planejar Receita</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className="border-2 p-2 rounded-lg" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="border-2 p-2 rounded-lg" type="number" placeholder="Valor" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <button onClick={add} className="bg-green-600 text-white font-bold rounded-lg">Adicionar</button>
          </div>
        </div>
        <div className="bg-white rounded-lg border-2 border-gray-200 divide-y">
          {receitasPlanejadas.filter(r=>r.mes===mesAtual).map(r=>(
            <div key={r.id} className="p-4 flex justify-between"><span>{r.descricao}</span><div className="flex gap-4 font-bold">R$ {r.valor.toFixed(2)}<button onClick={()=>setReceitasPlanejadas(receitasPlanejadas.filter(x=>x.id!==r.id))} className="text-red-500"><Trash2 size={18}/></button></div></div>
          ))}
        </div>
      </div>
    );
  };

  const PlanejamentoDespesas = () => {
    const [f, sf] = useState({ categoria: 'Moradia', descricao: '', valor: '', responsavel: 'André', mes: mesAtual });
    const add = () => { if(f.descricao && f.valor) { setDespesasPlanejadas([...despesasPlanejadas, {...f, valor: parseFloat(f.valor), id: Date.now()}]); sf({...f, descricao: '', valor: ''}); } };
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
          <h3 className="font-bold text-red-700 mb-4">Planejar Despesa</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select className="border-2 p-2 rounded-lg" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <input className="border-2 p-2 rounded-lg" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="border-2 p-2 rounded-lg" type="number" placeholder="Valor" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <button onClick={add} className="bg-red-600 text-white font-bold rounded-lg">Adicionar</button>
          </div>
        </div>
        <div className="bg-white rounded-lg border-2 border-gray-200 divide-y">
          {despesasPlanejadas.filter(d=>d.mes===mesAtual).map(d=>(
            <div key={d.id} className="p-4 flex justify-between"><span>{d.descricao} ({d.categoria})</span><div className="flex gap-4 font-bold text-red-600">R$ {d.valor.toFixed(2)}<button onClick={()=>setDespesasPlanejadas(despesasPlanejadas.filter(x=>x.id!==d.id))} className="text-red-400"><Trash2 size={18}/></button></div></div>
          ))}
        </div>
      </div>
    );
  };

  const LancamentosReceitas = () => {
    const [f, sf] = useState({ descricao: '', valor: '', responsavel: 'André', data: new Date().toISOString().slice(0, 10) });
    const add = () => { if(f.descricao && f.valor) { setReceitasReais([...receitasReais, {...f, valor: parseFloat(f.valor), id: Date.now()}]); sf({...f, descricao: '', valor: ''}); } };
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
          <h3 className="font-bold text-green-700 mb-4">Lançar Receita Realizada</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input className="border-2 p-2 rounded-lg" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="border-2 p-2 rounded-lg" type="number" placeholder="Valor" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <input className="border-2 p-2 rounded-lg" type="date" value={f.data} onChange={e=>sf({...f, data:e.target.value})} />
            <button onClick={add} className="bg-green-700 text-white font-bold rounded-lg">Lançar</button>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 space-y-2">
          {receitasReais.filter(r=>r.data.startsWith(mesAtual)).map(r=>(<div key={r.id} className="p-3 bg-green-50 rounded border border-green-100 flex justify-between font-bold"><span>{r.descricao}</span><span>R$ {r.valor.toFixed(2)}</span></div>))}
        </div>
      </div>
    );
  };

  const LancamentosDespesas = () => {
    const [f, sf] = useState({ categoria: 'Moradia', descricao: '', valor: '', responsavel: 'André', data: new Date().toISOString().slice(0, 10) });
    
    const add = () => { 
      if(f.descricao && f.valor) { 
        setDespesasReais([...despesasReais, {...f, valor: parseFloat(f.valor), id: Date.now()}]); 
        sf({...f, descricao: '', valor: '', categoria: 'Moradia', data: new Date().toISOString().slice(0, 10)}); 
      } 
    };

    // Função para apagar o lançamento
    const remover = (id) => {
      if(window.confirm('Deseja excluir este lançamento?')) {
        setDespesasReais(despesasReais.filter(d => d.id !== id));
      }
    };

    const lista = despesasReais.filter(d => d.data.startsWith(mesAtual));

    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="font-bold text-red-700 mb-4">Lançar Despesa Realizada</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="border-2 p-2 rounded-lg" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <input className="border-2 p-2 rounded-lg" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="border-2 p-2 rounded-lg" type="number" placeholder="Valor" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <input className="border-2 p-2 rounded-lg" type="date" value={f.data} onChange={e=>sf({...f, data:e.target.value})} />
            <button onClick={add} className="bg-red-700 text-white font-bold rounded-lg md:col-span-2 shadow-md hover:bg-red-800 transition-colors">Lançar Agora</button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 divide-y">
          {lista.length === 0 ? (
            <p className="text-center text-gray-400 py-4">Nenhum lançamento neste mês.</p>
          ) : (
            lista.map(d => (
              <div key={d.id} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{d.descricao}</span>
                  <small className="text-gray-400">{d.categoria} • {new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')}</small>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-red-600">R$ {d.valor.toFixed(2)}</span>
                  <button 
                    onClick={() => remover(d.id)} 
                    className="text-red-400 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                    title="Excluir lançamento"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const Relatorios = () => {
    const dadosPizza = [
      { name: 'Essenciais', value: m.gastos.essenciais || 0.1 },
      { name: 'Qualidade', value: m.gastos.qualidade || 0.1 },
      { name: 'Futuro', value: m.gastos.futuro || 0.1 }
    ];
    const dadosBarras = todasCategorias.map(c => ({
      name: c,
      planejado: despesasPlanejadas.filter(d=>d.mes===mesAtual && d.categoria===c).reduce((s,d)=>s+d.valor, 0),
      real: despesasReais.filter(d=>d.data.startsWith(mesAtual) && d.categoria===c).reduce((s,d)=>s+d.valor, 0)
    })).filter(x => x.planejado > 0 || x.real > 0);

    const CORES = ['#3B82F6', '#10B981', '#8B5CF6'];

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="font-bold mb-4">Gráfico 60/30/10 (Realizado)</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dadosPizza} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{dadosPizza.map((e,i)=><Cell key={i} fill={CORES[i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="font-bold mb-4">Planejado vs Realizado</h3>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={dadosBarras} margin={{bottom: 40}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={10}/><YAxis/><Tooltip/><Legend/><Bar dataKey="planejado" fill="#93C5FD" name="Plan."/><Bar dataKey="real" fill="#3B82F6" name="Real"/></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white border-2 border-gray-300 rounded-xl p-6 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div><h1 className="text-3xl font-black text-gray-800">📊 MEU ORÇAMENTO 2026</h1><p className="text-gray-500 font-bold">Gestão André & Heloisa</p></div>
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border-2 border-gray-200"><label className="text-xs font-black">MÊS:</label><input type="month" value={mesAtual} onChange={e=>setMesAtual(e.target.value)} className="bg-transparent font-bold outline-none" /></div>
        </header>
        <nav className="bg-white border-2 border-gray-300 rounded-xl p-2 mb-6 flex flex-wrap gap-1 shadow-sm">
          {[{id:'painel', l:'Painel'}, {id:'plan-receitas', l:'Plan. Receita'}, {id:'plan-despesas', l:'Plan. Despesa'}, {id:'lanc-receitas', l:'Lançar Rec.'}, {id:'lanc-despesas', l:'Lançar Desp.'}, {id:'relatorios', l:'Relatórios'}].map(b=>(
            <button key={b.id} onClick={()=>setTelaAtiva(b.id)} className={`flex-1 px-4 py-3 rounded-lg font-bold text-xs transition ${telaAtiva===b.id?'bg-blue-600 text-white shadow-md':'hover:bg-gray-100 text-gray-600'}`}>{b.l}</button>
          ))}
        </nav>
        <main className="pb-20">
          {telaAtiva === 'painel' && <Painel />}
          {telaAtiva === 'plan-receitas' && <PlanejamentoReceitas />}
          {telaAtiva === 'plan-despesas' && <PlanejamentoDespesas />}
          {telaAtiva === 'lanc-receitas' && <LancamentosReceitas />}
          {telaAtiva === 'lanc-despesas' && <LancamentosDespesas />}
          {telaAtiva === 'relatorios' && <Relatorios />}
        </main>
      </div>
    </div>
  );
}
