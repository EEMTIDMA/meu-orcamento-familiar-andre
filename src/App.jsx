import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Trash2, BarChart3, PiggyBank, Sparkles, LogOut, Lock, Calendar, Eye, EyeOff, Target, LayoutDashboard } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- CONFIGURAÇÃO FIREBASE ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6LRk6eD_K39jYvwZiA3kKtu13UkGXa14",
  authDomain: "://firebaseapp.com",
  projectId: "meu-orcamento-familiar-andre",
  storageBucket: "meu-orcamento-familiar-andre.firebasestorage.app",
  messagingSenderId: "1052513561036",
  appId: "1:1052513561036:web:b4760c62e4569a86489569"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [loading, setLoading] = useState(true);
  const [telaAtiva, setTelaAtiva] = useState('painel');
  const [mesAtual, setMesAtual] = useState(new Date().toISOString().slice(0, 7));

  const [receitasPlanejadas, setReceitasPlanejadas] = useState([]);
  const [despesasPlanejadas, setDespesasPlanejadas] = useState([]);
  const [receitasReais, setReceitasReais] = useState([]);
  const [despesasReais, setDespesasReais] = useState([]);

  const categoriasPorBolso = {
    essenciais: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Contas Básicas'],
    qualidade: ['Lazer', 'Viagens', 'Restaurantes', 'Hobbies', 'Assinaturas', 'Presentes'],
    futuro: ['Investimentos', 'Poupança', 'Emergência', 'Aposentadoria']
  };
  const todasCategorias = [...categoriasPorBolso.essenciais, ...categoriasPorBolso.qualidade, ...categoriasPorBolso.futuro];

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const unsubData = onSnapshot(doc(db, "dados", "principal"), (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setReceitasPlanejadas(d.receitasPlanejadas || []);
            setDespesasPlanejadas(d.despesasPlanejadas || []);
            setReceitasReais(d.receitasReais || []);
            setDespesasReais(d.despesasReais || []);
          }
          setLoading(false);
        });
        return () => unsubData();
      } else { setLoading(false); }
    });
    return () => unsubAuth();
  }, []);

  const sync = async (rP, dP, rR, dR) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "dados", "principal"), {
        receitasPlanejadas: rP || receitasPlanejadas,
        despesasPlanejadas: dP || despesasPlanejadas,
        receitasReais: rR || receitasReais,
        despesasReais: dR || despesasReais
      });
    } catch (e) { console.error(e); }
  };

  const t = {
    rP: receitasPlanejadas.filter(r => r.mes === mesAtual).reduce((s, r) => s + r.valor, 0),
    dP: despesasPlanejadas.filter(d => d.mes === mesAtual).reduce((s, d) => s + d.valor, 0),
    rR: receitasReais.filter(r => r.data.startsWith(mesAtual)).reduce((s, r) => s + r.valor, 0),
    dR: despesasReais.filter(d => d.data.startsWith(mesAtual)).reduce((s, d) => s + d.valor, 0),
  };
  const saldoR = t.rR - t.dR;

  const m = {
    orcs: { essenciais: (t.rR || t.rP || 1) * 0.6, qualidade: (t.rR || t.rP || 1) * 0.3, futuro: (t.rR || t.rP || 1) * 0.1 },
    gastos: {
      essenciais: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.essenciais.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      qualidade: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.qualidade.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      futuro: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.futuro.includes(d.categoria)).reduce((s, d) => s + d.valor, 0)
    }
  };

  const Painel = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Saldo Real Consolidado</p>
          <h2 className="text-5xl font-black tracking-tighter">R$ {saldoR.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
          <div className="mt-8 flex gap-4 text-xs font-bold opacity-80 uppercase tracking-tighter">
            <span className="flex items-center gap-1 text-emerald-400"><TrendingUp size={14}/> +R$ {t.rR.toFixed(0)}</span>
            <span className="flex items-center gap-1 text-rose-400"><TrendingDown size={14}/> -R$ {t.dR.toFixed(0)}</span>
          </div>
        </div>
        <Sparkles className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {['essenciais', 'qualidade', 'futuro'].map((b) => {
          const cores = { essenciais: 'text-blue-600 bg-blue-600', qualidade: 'text-emerald-600 bg-emerald-600', futuro: 'text-violet-600 bg-violet-600' };
          const labels = { essenciais: '60% Essenciais', qualidade: '30% Qualidade', futuro: '10% Futuro' };
          const pct = Math.min((m.gastos[b] / (m.orcs[b] || 1)) * 100, 100);
          return (
            <div key={b} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <p className={`text-[9px] font-black uppercase tracking-wider ${cores[b].split(' ')[0]}`}>{labels[b]}</p>
                <p className="text-[10px] font-black text-slate-400 font-mono">META: R$ {m.orcs[b].toFixed(0)}</p>
              </div>
              <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100">
                <div className={`h-full ${cores[b].split(' ')[1]} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-[10px] mt-3 text-slate-500 font-bold flex justify-between"><span>GASTO REAL:</span> <span className="text-slate-900">R$ {m.gastos[b].toLocaleString()}</span></p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const Planejar = ({ tipo }) => {
    const isD = tipo === 'despesa';
    const [f, sf] = useState({ categoria: 'Moradia', descricao: '', valor: '', mes: mesAtual });
    const lista = (isD ? despesasPlanejadas : receitasPlanejadas).filter(x => x.mes === mesAtual);
    const total = lista.reduce((s, i) => s + i.valor, 0);

    const handleAdd = () => {
      if(!f.descricao || !f.valor) return;
      const n = { ...f, valor: parseFloat(f.valor), id: Date.now() };
      if(isD) { const l = [...despesasPlanejadas, n]; setDespesasPlanejadas(l); sync(null, l, null, null); }
      else { const l = [...receitasPlanejadas, n]; setReceitasPlanejadas(l); sync(l, null, null, null); }
      sf({ ...f, descricao: '', valor: '' });
    };

    return (
      <div className="space-y-4 pb-28">
        <div className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-100">
          <h3 className={`font-black mb-4 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em] ${isD?'text-orange-600':'text-cyan-600'}`}><Target size={18}/> Meta Mensal</h3>
          <div className="space-y-2">
            {isD && <select className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-600 text-sm" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c}>{c}</option>)}</select>}
            <input className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 font-bold text-sm" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 font-bold text-sm" type="number" placeholder="Valor R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <button onClick={handleAdd} className={`w-full text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg ${isD?'bg-orange-600':'bg-cyan-600'}`}>Salvar no Plano</button>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden divide-y">
          {lista.map(i => (
            <div key={i.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
              <div><p className="font-black text-slate-800 text-sm">{i.descricao}</p>{isD && <p className="text-[9px] uppercase font-black text-slate-400">{i.categoria}</p>}</div>
              <div className="flex items-center gap-4"><span className="font-black text-slate-900">R$ {i.valor.toFixed(2)}</span>
              <button onClick={()=>{const n=(isD?despesasPlanejadas:receitasPlanejadas).filter(x=>x.id!==i.id); isD?setDespesasPlanejadas(n):setReceitasPlanejadas(n); isD?sync(null,n,null,null):sync(n,null,null,null);}}><Trash2 size={16} className="text-slate-200 hover:text-red-500"/></button></div>
            </div>
          ))}
          <div className={`p-6 font-black flex justify-between items-center uppercase text-[10px] tracking-widest ${isD?'bg-orange-50 text-orange-700':'bg-cyan-50 text-cyan-700'}`}><span>Total:</span><span>R$ {total.toLocaleString()}</span></div>
        </div>
      </div>
    );
  };

  const LançarReal = ({ tipo }) => {
    const isD = tipo === 'despesa';
    const [f, sf] = useState({ categoria: 'Moradia', descricao: '', valor: '', data: new Date().toISOString().slice(0, 10) });
    const lista = (isD ? despesasReais : receitasReais).filter(x => x.data.startsWith(mesAtual));
    const total = lista.reduce((s, i) => s + i.valor, 0);

    const handleAdd = () => {
      if(!f.descricao || !f.valor) return;
      const n = { ...f, valor: parseFloat(f.valor), id: Date.now() };
      if(isD) { const l = [...despesasReais, n]; setDespesasReais(l); sync(null, null, null, l); }
      else { const l = [...receitasReais, n]; setReceitasReais(l); sync(null, null, l, null); }
      sf({ ...f, descricao: '', valor: '' });
    };

    return (
      <div className="space-y-4 pb-28">
        <div className="bg-white p-7 rounded-[2rem] shadow-xl border border-slate-100">
          <h3 className={`font-black mb-4 flex items-center gap-2 uppercase text-[10px] tracking-widest ${isD?'text-rose-600':'text-emerald-600'}`}>{isD?<TrendingDown/>:<PlusCircle/>} Registro Real</h3>
          <div className="space-y-2">
            {isD && <select className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-600 text-sm focus:border-slate-900" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c}>{c}</option>)}</select>}
            <input className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 font-bold text-sm" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 font-bold text-sm" type="number" placeholder="Valor R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <input className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold text-sm" type="date" value={f.data} onChange={e=>sf({...f, data:e.target.value})} />
            <button onClick={handleAdd} className={`w-full text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg ${isD?'bg-rose-600 shadow-rose-100':'bg-emerald-600 shadow-emerald-100'}`}>Registrar Agora</button>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden divide-y">
          {lista.slice().reverse().map(i => (
            <div key={i.id} className="p-5 flex justify-between items-center hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isD?'bg-rose-50 text-rose-500':'bg-emerald-50 text-emerald-500'}`}>{isD?<TrendingDown size={14}/>:<TrendingUp size={14}/>}</div>
                <div><p className="font-black text-slate-800 text-sm">{i.descricao}</p><p className="text-[9px] uppercase font-black text-slate-400">{i.data}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-black ${isD?'text-rose-500':'text-emerald-500'}`}>R$ {i.valor.toFixed(2)}</span>
                <button onClick={()=>{const n=(isD?despesasReais:receitasReais).filter(x=>x.id!==i.id); isD?setDespesasReais(n):setReceitasReais(n); isD?sync(null,null,null,n):sync(null,null,n,null);}}><Trash2 size={16} className="text-slate-200 hover:text-red-500 transition-colors"/></button>
              </div>
            </div>
          ))}
          <div className={`p-6 font-black flex justify-between items-center uppercase text-[10px] tracking-widest ${isD?'bg-rose-50 text-rose-600':'bg-emerald-50 text-emerald-600'}`}><span>Total Acumulado:</span><span>R$ {total.toLocaleString()}</span></div>
        </div>
      </div>
    );
  };

  const Relatorios = () => {
    const pizzaData = [{ name: 'Essenciais', v: m.gastos.essenciais || 0.1 }, { name: 'Qualidade', v: m.gastos.qualidade || 0.1 }, { name: 'Investimento', v: m.gastos.futuro || 0.1 }];
    const barData = todasCategorias.map(c => ({
      name: c,
      plan: despesasPlanejadas.filter(d=>d.mes===mesAtual && d.categoria===c).reduce((s,d)=>s+d.valor, 0),
      real: despesasReais.filter(d=>d.data.startsWith(mesAtual) && d.categoria===c).reduce((s,d)=>s+d.valor, 0)
    })).filter(x => x.plan > 0 || x.real > 0);

    return (
      <div className="space-y-6 pb-28">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
          <h3 className="font-black text-slate-800 mb-10 text-center uppercase tracking-widest text-[10px] opacity-40">Divisão de Gastos (Pizza)</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pizzaData} innerRadius={0} outerRadius={90} dataKey="v" isAnimationActive={true} stroke="none">{pizzaData.map((e,i)=><Cell key={i} fill={['#2563EB', '#10B981', '#8B5CF6'][i]}/>)}</Pie><Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}/><Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{paddingTop: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}}/></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
          <h3 className="font-black text-slate-800 mb-10 text-center uppercase tracking-widest text-[10px] opacity-40">Meta vs Realizado</h3>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData} margin={{bottom: 40}} barSize={12} barGap={6}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={9} fontWeight="bold" axisLine={false} tickLine={false}/><YAxis fontSize={9} axisLine={false} tickLine={false}/><Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}}/><Bar dataKey="plan" fill="#bfdbfe" name="Meta" radius={}/><Bar dataKey="real" fill="#2563EB" name="Real" radius={}/></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    );
  };

  const ResumoAnual = () => {
    const meses = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const nomes = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    const [ano] = mesAtual.split('-');
    const dados = meses.map((m, i) => {
      const ref = `${ano}-${m}`;
      const r = receitasReais.filter(x=>x.data.startsWith(ref)).reduce((s,i)=>s+i.valor,0);
      const d = despesasReais.filter(x=>x.data.startsWith(ref)).reduce((s,i)=>s+i.valor,0);
      return { n: nomes[i], r, d, s: r-d };
    });
    return (
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden pb-28">
        <table className="w-full text-[10px] text-center font-black uppercase tracking-widest">
          <thead className="bg-slate-900 text-slate-400"><tr><th className="p-5">Mês</th><th className="p-5">Rec.</th><th className="p-5">Desp.</th><th className="p-5">Saldo</th></tr></thead>
          <tbody className="divide-y divide-slate-50 font-bold">{dados.map(i=>(
            <tr key={i.n} className="hover:bg-slate-50 transition-colors"><td className="p-4 text-slate-900 font-black">{i.n}</td><td className="p-4 text-emerald-500">R$ {i.r.toFixed(0)}</td><td className="p-4 text-rose-500">R$ {i.d.toFixed(0)}</td><td className={`p-4 ${i.s>=0?'text-blue-600':'text-orange-600'} font-black`}>R$ {i.s.toFixed(0)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="text-center"><PiggyBank size={40} className="mx-auto text-blue-600 animate-bounce mb-3"/><p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Sincronizando...</p></div></div>;
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 p-6 font-sans">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-sm space-y-8">
          <div className="text-center"><div className="bg-slate-900 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl"><PiggyBank size={32} className="text-white"/></div><h2 className="text-3xl font-black text-slate-900 tracking-tighter">Finance A&H</h2><p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] mt-2 italic">Budget Manager 2026</p></div>
          <div className="space-y-3">
            <input className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-slate-900 bg-slate-50 font-black text-sm transition-all" placeholder="E-MAIL" value={email} onChange={e=>setEmail(e.target.value)} />
            <div className="relative">
              <input className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-slate-900 bg-slate-50 font-black text-sm transition-all" type={verSenha?'text':'password'} placeholder="SENHA" value={senha} onChange={e=>setSenha(e.target.value)} />
              <button onClick={()=>setVerSenha(!verSenha)} className="absolute right-4 top-5 text-slate-400">{verSenha?<EyeOff size={20}/>:<Eye size={20}/>}</button>
            </div>
            <button onClick={()=>sendPasswordResetEmail(auth, email).then(()=>alert('Link enviado!')).catch(()=>alert('Erro'))} className="text-[9px] font-black text-blue-600 uppercase block mx-auto underline tracking-[0.1em]">Esqueci a Senha</button>
          </div>
          <button onClick={() => signInWithEmailAndPassword(auth, email, senha).catch(()=>alert('Falha!'))} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black shadow-xl hover:scale-105 transition-all uppercase tracking-[0.2em] text-[10px]">Entrar Agora</button>
        </div>
      </div>
    );
  }

  const menu = [
    {id:'painel', l:'Painel', i:<LayoutDashboard size={20}/>},
    {id:'plan-receita', l:'Meta R$', i:<Target size={20}/>},
    {id:'plan-despesa', l:'Meta $', i:<TrendingDown size={20}/>},
    {id:'lanc-receita', l:'Lançar R$', i:<DollarSign size={20}/>},
    {id:'lanc-despesa', l:'Lançar $', i:<PlusCircle size={20}/>},
    {id:'graficos', l:'Gráficos', i:<Sparkles size={20}/>},
    {id:'anual', l:'Anual', i:<Calendar size={20}/>}
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-xl p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 z-50">
        <div className="flex flex-col leading-none">
          <h1 className="font-black text-lg tracking-tighter text-slate-900 uppercase italic">A&H Finance</h1>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Sincronizado • <button onClick={()=>signOut(auth)} className="text-rose-500 font-black">Sair</button></p>
        </div>
        <div className="bg-slate-900 p-2 px-4 rounded-[1.2rem] shadow-xl flex items-center gap-2 border border-slate-800">
          <Calendar size={12} className="text-blue-400"/>
          <input type="month" value={mesAtual} onChange={e=>setMesAtual(e.target.value)} className="bg-transparent font-black text-[10px] outline-none text-white cursor-pointer" />
        </div>
      </header>

      <main className="p-5 max-w-xl mx-auto w-full flex-grow">
        {telaAtiva === 'painel' && <Painel />}
        {telaAtiva === 'plan-receita' && <Planejar tipo="receita" />}
        {telaAtiva === 'plan-despesa' && <Planejar tipo="despesa" />}
        {telaAtiva === 'lanc-receita' && <LançarReal tipo="receita" />}
        {telaAtiva === 'lanc-despesa' && <LançarReal tipo="despesa" />}
        {telaAtiva === 'graficos' && <Relatorios />}
        {telaAtiva === 'anual' && <ResumoAnual />}
      </main>

      <nav className="fixed bottom-6 left-5 right-5 bg-slate-900/95 backdrop-blur-xl p-3 flex overflow-x-auto gap-2 z-50 shadow-2xl rounded-[2.5rem] border border-white/5 scrollbar-hide">
        {menu.map(b=>(
          <button key={b.id} onClick={()=>setTelaAtiva(b.id)} className={`flex-1 min-w-[72px] p-4 rounded-[1.8rem] flex flex-col items-center gap-1 transition-all duration-300 ${telaAtiva===b.id?'text-white bg-blue-600 shadow-xl shadow-blue-500/20 scale-105':'text-slate-500'}`}>
            <span className="mb-0.5">{b.i}</span>
            <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">{b.l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
