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

  // --- LOGICA DE DADOS ---
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
          alert('Dados importados!');
        } catch (e) { alert('Erro no arquivo.'); }
      };
      reader.readAsText(file);
    }
  };

  const calcularTotais = () => {
    const rPlan = receitasPlanejadas.filter(r => r.mes === mesAtual).reduce((s, r) => s + r.valor, 0);
    const dPlan = despesasPlanejadas.filter(d => d.mes === mesAtual).reduce((s, d) => s + d.valor, 0);
    const rReal = receitasReais.filter(r => r.data.startsWith(mesAtual)).reduce((s, r) => s + r.valor, 0);
    const dReal = despesasReais.filter(d => d.data.startsWith(mesAtual)).reduce((s, d) => s + d.valor, 0);
    return { rPlan, dPlan, rReal, dReal, saldoReal: rReal - dReal };
  };

  const t = calcularTotais();

  const calcularMetodo = () => {
    const receitaRef = t.rReal > 0 ? t.rReal : t.rPlan;
    const orcs = { essenciais: receitaRef * 0.60, qualidade: receitaRef * 0.30, futuro: receitaRef * 0.10 };
    const gastos = {
      essenciais: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.essenciais.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      qualidade: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.qualidade.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      futuro: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.futuro.includes(d.categoria)).reduce((s, d) => s + d.valor, 0)
    };
    return { orcs, gastos };
  };

  const m = calcularMetodo();

  // --- COMPONENTES DE TELA ---

  const Painel = () => (
    <div className="space-y-6">
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex gap-3 justify-end shadow-sm">
        <button onClick={exportarDados} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"><Download size={18} /> Exportar</button>
        <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold cursor-pointer hover:bg-green-700 transition"><Upload size={18} /> Importar<input type="file" accept=".json" onChange={importarDados} className="hidden" /></label>
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2"><Sparkles /> Método 60/30/10</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['essenciais', 'qualidade', 'futuro'].map((b, i) => {
            const cores = ['blue', 'green', 'purple'];
            const labels = ['60% Essenciais', '30% Qualidade', '10% Futuro'];
            const pct = Math.min((m.gastos[b] / (m.orcs[b] || 1)) * 100, 100);
            return (
              <div key={b} className={`bg-white border-2 border-${cores[i]}-200 p-4 rounded-lg shadow-sm`}>
                <p className="text-xs font-bold text-gray-400 uppercase">{labels[i]}</p>
                <p className={`text-2xl font-black text-${cores[i]}-600`}>R$ {m.orcs[b].toFixed(2)}</p>
                <div className="w-full bg-gray-100 h-2 rounded-full mt-3"><div className={`h-2 rounded-full bg-${cores[i]}-500 transition-all duration-500`} style={{ width: `${pct}%` }}></div></div>
                <p className="text-xs mt-2 text-gray-500 font-medium">Gasto Real: R$ {m.gastos[b].toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-blue-700 text-white p-8 rounded-xl shadow-xl text-center border-b-8 border-blue-900">
        <p className="text-sm font-bold opacity-70 tracking-widest uppercase">Saldo do Mês (Real)</p>
        <p className="text-5xl font-black mt-2">R$ {t.saldoReal.toFixed(2)}</p>
      </div>
    </div>
  );

  const PlanejamentoReceitas = () => {
    const [f, sf] = useState({ descricao: '', valor: '', responsavel: 'André', mes: mesAtual });
    const add = () => { if(f.descricao && f.valor) { setReceitasPlanejadas([...receitasPlanejadas, {...f, valor: parseFloat(f.valor), id: Date.now()}]); sf({...f, descricao: '', valor: ''}); } };
    const lista = receitasPlanejadas.filter(r => r.mes === mesAtual);
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2"><PlusCircle /> Planejar Receita</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className="border-2 p-3 rounded-lg focus:border-green-500 outline-none" placeholder="Fonte de Renda" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="border-2 p-3 rounded-lg focus:border-green-500 outline-none" type="number" placeholder="Valor R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <button onClick={add} className="bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">Adicionar ao Plano</button>
          </div>
        </div>
        <div className="bg-white rounded-lg border-2 border-gray-200 divide-y shadow-sm">
          {lista.length === 0 ? <p className="p-8 text-center text-gray-400">Nenhum planejamento para este mês.</p> :
            lista.map(r => (
              <div key={r.id} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50">
                <span className="font-medium text-gray-700">{r.descricao}</span>
                <div className="flex gap-4 items-center font-bold">
                  <span className="text-green-600">R$ {r.valor.toFixed(2)}</span>
                  <button onClick={()=>setReceitasPlanejadas(receitasPlanejadas.filter(x=>x.id!==r.id))} className="text-red-300 hover:text-red-600 transition"><Trash2 size={18}/></button>
                </div>
              </div>
          ))}
        </div>
      </div>
    );
  };

  const PlanejamentoDespesas = () => {
    const [f, sf] = useState({ categoria: 'Moradia', descricao: '', valor: '', responsavel: 'André', mes: mesAtual });
    const add = () => { if(f.descricao && f.valor) { setDespesasPlanejadas([...despesasPlanejadas, {...f, valor: parseFloat(f.valor), id: Date.now()}]); sf({...f, descricao: '', valor: ''}); } };
    const lista = despesasPlanejadas.filter(d=>d.mes===mesAtual);
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2"><TrendingDown /> Planejar Gasto</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select className="border-2 p-3 rounded-lg" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <input className="border-2 p-3 rounded-lg" placeholder="O que é?" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="border-2 p-3 rounded-lg" type="number" placeholder="Valor R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <button onClick={add} className="bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">Adicionar</button>
          </div>
        </div>
        <div className="bg-white rounded-lg border-2 border-gray-200 divide-y shadow-sm">
          {lista.length === 0 ? <p className="p-8 text-center text-gray-400">Nenhum planejamento para este mês.</p> :
            lista.map(d => (
              <div key={d.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <span className="font-medium text-gray-700">{d.descricao} <small className="text-gray-400">({d.categoria})</small></span>
                <div className="flex gap-4 items-center font-bold">
                  <span className="text-red-600">R$ {d.valor.toFixed(2)}</span>
                  <button onClick={()=>setDespesasPlanejadas(despesasPlanejadas.filter(x=>x.id!==d.id))} className="text-red-300 hover:text-red-600 transition"><Trash2 size={18}/></button>
                </div>
              </div>
          ))}
        </div>
      </div>
    );
  };

  const LancamentosReceitas = () => {
    const [f, sf] = useState({ descricao: '', valor: '', responsavel: 'André', data: new Date().toISOString().slice(0, 10) });
    const add = () => { if(f.descricao && f.valor) { setReceitasReais([...receitasReais, {...f, valor: parseFloat(f.valor), id: Date.now()}]); sf({...f, descricao: '', valor: '', data: new Date().toISOString().slice(0, 10)}); } };
    const remover = (id) => { if(window.confirm('Excluir receita?')) setReceitasReais(receitasReais.filter(r=>r.id!==id)); };
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2"><DollarSign /> Lançar Dinheiro Real</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input className="border-2 p-3 rounded-lg" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="border-2 p-3 rounded-lg" type="number" placeholder="Valor R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <input className="border-2 p-3 rounded-lg" type="date" value={f.data} onChange={e=>sf({...f, data:e.target.value})} />
            <button onClick={add} className="bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition">Confirmar Lançamento</button>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 space-y-2 shadow-sm">
          {receitasReais.filter(r=>r.data.startsWith(mesAtual)).map(r=>(
            <div key={r.id} className="p-3 bg-green-50 rounded-lg border border-green-100 flex justify-between items-center font-bold">
              <span>{r.descricao}</span>
              <div className="flex gap-4"><span>R$ {r.valor.toFixed(2)}</span><button onClick={()=>remover(r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LancamentosDespesas = () => {
    const [f, sf] = useState({ categoria: 'Moradia', descricao: '', valor: '', responsavel: 'André', data: new Date().toISOString().slice(0, 10) });
    const add = () => { if(f.descricao && f.valor) { setDespesasReais([...despesasReais, {...f, valor: parseFloat(f.valor), id: Date.now()}]); sf({...f, descricao: '', valor: '', categoria:'Moradia', data:new Date().toISOString().slice(0, 10)}); } };
    const remover = (id) => { if(window.confirm('Excluir gasto?')) setDespesasReais(despesasReais.filter(d=>d.id!==id)); };
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2"><PlusCircle /> Lançar Gasto Real</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="border-2 p-3 rounded-lg" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <input className="border-2 p-3 rounded-lg" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="border-2 p-3 rounded-lg" type="number" placeholder="Valor R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <input className="border-2 p-3 rounded-lg" type="date" value={f.data} onChange={e=>sf({...f, data:e.target.value})} />
            <button onClick={add} className="bg-red-700 text-white font-bold rounded-lg md:col-span-2 hover:bg-red-800 transition">Registrar Gasto</button>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 divide-y shadow-sm">
          {despesasReais.filter(d=>d.data.startsWith(mesAtual)).map(d=>(
            <div key={d.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
              <span className="font-medium text-gray-700">{d.descricao} <small className="text-gray-300">({d.categoria})</small></span>
              <div className="flex gap-4 font-bold text-red-600 items-center">R$ {d.valor.toFixed(2)}<button onClick={()=>remover(d.id)} className="text-red-200 hover:text-red-500"><Trash2 size={16}/></button></div>
            </div>
          ))}
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
      <div className="space-y-6 pb-8">
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="font-bold mb-6 text-gray-700 flex items-center gap-2"><BarChart3 size={20}/> Distribuição Real (60/30/10)</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dadosPizza} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" isAnimationActive={false}>{dadosPizza.map((e,i)=><Cell key={i} fill={CORES[i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
          <h3 className="font-bold mb-6 text-gray-700 flex items-center gap-2"><BarChart3 size={20}/> Planejado vs Realizado</h3>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={dadosBarras} margin={{bottom: 40}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={10} interval={0}/><YAxis/><Tooltip/><Legend verticalAlign="top"/><Bar dataKey="planejado" fill="#93C5FD" name="Plan." isAnimationActive={false}/><Bar dataKey="real" fill="#3B82F6" name="Real" isAnimationActive={false}/></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    );
  };

  const ResumoAnual = () => {
    const meses = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const anoRef = mesAtual.split('-')[0];
    const nomesMeses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const dadosAnuais = meses.map((m, i) => {
      const ref = `${anoRef}-${m}`;
      const r = receitasReais.filter(rec => rec.data.startsWith(ref)).reduce((s, rec) => s + rec.valor, 0);
      const d = despesasReais.filter(des => des.data.startsWith(ref)).reduce((s, des) => s + des.valor, 0);
      return { nome: nomesMeses[i], r, d, saldo: r - d };
    });
    return (
      <div className="space-y-6">
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white font-bold">
              <tr>
                <th className="p-4 text-left">Mês ({anoRef})</th>
                <th className="p-4 text-right">Receitas</th>
                <th className="p-4 text-right">Despesas</th>
                <th className="p-4 text-right font-black">Saldo Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dadosAnuais.map(item => (
                <tr key={item.nome} className={item.r > 0 || item.d > 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 opacity-60"}>
                  <td className="p-4 font-black text-gray-700">{item.nome}</td>
                  <td className="p-4 text-right text-green-600 font-bold">R$ {item.r.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="p-4 text-right text-red-600 font-bold">R$ {item.d.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className={`p-4 text-right font-black ${item.saldo >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>R$ {item.saldo.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-blue-600 text-white font-black text-lg">
              <tr>
                <td className="p-5 uppercase tracking-tighter">Acumulado {anoRef}</td>
                <td className="p-5 text-right border-l border-blue-500">R$ {dadosAnuais.reduce((s,i)=>s+i.r, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="p-5 text-right border-l border-blue-500">R$ {dadosAnuais.reduce((s,i)=>s+i.d, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="p-5 text-right border-l-4 border-white bg-blue-800">R$ {dadosAnuais.reduce((s,i)=>s+i.saldo, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-center text-gray-400 text-xs italic">Cálculos baseados em todos os lançamentos reais do ano de {anoRef}.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white border-2 border-gray-300 rounded-xl p-6 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div><h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2"><PiggyBank className="text-blue-600"/> MEU ORÇAMENTO 2026</h1><p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Gestão Familiar André & Heloisa</p></div>
          <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border-2 border-gray-200 shadow-inner">
            <label className="text-xs font-black text-gray-400 uppercase">Mês de Referência:</label>
            <input type="month" value={mesAtual} onChange={e=>setMesAtual(e.target.value)} className="bg-transparent font-bold outline-none text-blue-700 cursor-pointer" />
          </div>
        </header>

        <nav className="bg-white border-2 border-gray-300 rounded-xl p-2 mb-6 flex flex-wrap gap-1 shadow-sm sticky top-2 z-50">
          {[
            {id:'painel', l:'📊 Painel', c:'blue'}, 
            {id:'plan-receitas', l:'💰 Plan. Receita', c:'green'}, 
            {id:'plan-despesas', l:'💸 Plan. Despesa', c:'red'}, 
            {id:'lanc-receitas', l:'💵 Lançar R$', c:'green'}, 
            {id:'lanc-despesas', l:'💳 Lançar Gasto', c:'red'}, 
            {id:'relatorios', l:'📈 Relatórios', c:'blue'},
            {id:'anual', l:'📅 Resumo Anual', c:'purple'}
          ].map(b=>(
            <button key={b.id} onClick={()=>setTelaAtiva(b.id)} className={`flex-1 px-4 py-3 rounded-lg font-bold text-[10px] md:text-xs transition-all duration-200 ${telaAtiva===b.id?`bg-${b.c}-600 text-white shadow-lg scale-105`:`hover:bg-gray-100 text-gray-600`}`}>{b.l}</button>
          ))}
        </nav>

        <main className="pb-12 min-h-[60vh]">
          {telaAtiva === 'painel' && <Painel />}
          {telaAtiva === 'plan-receitas' && <PlanejamentoReceitas />}
          {telaAtiva === 'plan-despesas' && <PlanejamentoDespesas />}
          {telaAtiva === 'lanc-receitas' && <LancamentosReceitas />}
          {telaAtiva === 'lanc-despesas' && <LancamentosDespesas />}
          {telaAtiva === 'relatorios' && <Relatorios />}
          {telaAtiva === 'anual' && <ResumoAnual />}
        </main>
        
        <footer className="mt-8 pt-8 border-t-2 border-gray-200 flex justify-between items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          <span>Sistema André & Heloisa v3.0</span>
          <span>Janeiro 2026</span>
        </footer>
      </div>
    </div>
  );
}
