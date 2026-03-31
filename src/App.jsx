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
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em] mb-2">Saldo Real Consolidado</p>
          <h2 className="text-5xl font-black tracking-tighter">R$ {saldoR.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
          <div className="mt-6 flex gap-4 text-xs font-bold opacity-80">
            <span className="flex items-center gap-1 text-green-400"><TrendingUp size={14}/> +R$ {t.rR.toFixed(0)}</span>
            <span className="flex items-center gap-1 text-red-400"><TrendingDown size={14}/> -R$ {t.dR.toFixed(0)}</span>
          </div>
        </div>
        <Sparkles className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['essenciais', 'qualidade', 'futuro'].map((b) => {
          const cores = { essenciais: 'text-blue-600 bg-blue-500', qualidade: 'text-emerald-600 bg-emerald-500', futuro: 'text-indigo-600 bg-indigo-500' };
          const labels = { essenciais: '60% Essenciais', qualidade: '30% Qualidade', futuro: '10% Futuro' };
          const pct = Math.min((m.gastos[b] / (m.orcs[b] || 1)) * 100, 100);
          return (
            <div key={b} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider mb-1">{labels[b]}</p>
              <p className={`text-2xl font-black ${cores[b].split(' ')[0]}`}>R$ {m.orcs[b].toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              <div className="w-full bg-gray-50 h-2.5 rounded-full mt-4 overflow-hidden border border-gray-100">
                <div className={`h-full ${cores[b].split(' ')[1]} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-[10px] mt-3 text-gray-500 font-bold flex justify-between uppercase"><span>Gasto:</span> <span className="text-gray-900">R$ {m.gastos[b].toFixed(2)}</span></p>
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
      <div className="space-y-4 pb-24">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className={`font-black mb-4 flex items-center gap-2 ${isD?'text-orange-600':'text-cyan-600'}`}><Target size={20}/> Meta de {isD?'Gastos':'Receitas'}</h3>
          <div className="grid grid-cols-1 gap-3">
            {isD && <select className="p-4 border-2 rounded-xl bg-gray-50" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c}>{c}</option>)}</select>}
            <input className="p-4 border-2 rounded-xl outline-none focus:border-blue-500" placeholder="Ex: Aluguel ou Salário" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="p-4 border-2 rounded-xl outline-none focus:border-blue-500" type="number" placeholder="Valor R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <button onClick={handleAdd} className={`p-4 rounded-xl font-black text-white shadow-lg ${isD?'bg-orange-600':'bg-cyan-600'}`}>SALVAR NO PLANO</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y">
          {lista.map(i => (
            <div key={i.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
              <div><p className="font-bold text-gray-800">{i.descricao}</p>{isD && <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest">{i.categoria}</p>}</div>
              <div className="flex items-center gap-4"><span className="font-black text-gray-600">R$ {i.valor.toFixed(2)}</span>
              <button onClick={()=>{const n=(isD?despesasPlanejadas:receitasPlanejadas).filter(x=>x.id!==i.id); isD?setDespesasPlanejadas(n):setReceitasPlanejadas(n); isD?sync(null,n,null,null):sync(n,null,null,null);}}><Trash2 size={16} className="text-gray-300 hover:text-red-500 transition-colors"/></button></div>
            </div>
          ))}
          <div className={`p-5 font-black flex justify-between items-center ${isD?'bg-orange-50 text-orange-700':'bg-cyan-50 text-cyan-700'}`}><span>TOTAL ESTIMADO:</span><span>R$ {total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
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
      <div className="space-y-4 pb-24">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className={`font-black mb-4 flex items-center gap-2 ${isD?'text-red-600':'text-emerald-600'}`}>{isD?<TrendingDown/>:<PlusCircle/>} {isD?'Registrar Saída':'Registrar Entrada'}</h3>
          <div className="grid grid-cols-1 gap-2">
            {isD && <select className="p-4 border-2 rounded-xl" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c}>{c}</option>)}</select>}
            <input className="p-4 border-2 rounded-xl outline-none focus:border-blue-500" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="p-4 border-2 rounded-xl outline-none focus:border-blue-500" type="number" placeholder="Valor R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <input className="p-4 border-2 rounded-xl" type="date" value={f.data} onChange={e=>sf({...f, data:e.target.value})} />
            <button onClick={handleAdd} className={`p-4 rounded-xl font-black text-white shadow-lg ${isD?'bg-red-600 shadow-red-100':'bg-emerald-600 shadow-emerald-100'}`}>CONFIRMAR AGORA</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y overflow-hidden shadow-sm">
          {lista.slice().reverse().map(i => (
            <div key={i.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
              <div><p className="font-bold text-gray-800">{i.descricao}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{i.data}</p></div>
              <div className="flex items-center gap-4"><span className={`font-black ${isD?'text-red-600':'text-emerald-600'}`}>R$ {i.valor.toFixed(2)}</span>
              <button onClick={()=>{const n=(isD?despesasReais:receitasReais).filter(x=>x.id!==i.id); isD?setDespesasReais(n):setReceitasReais(n); isD?sync(null,null,null,n):sync(null,null,n,null);}}><Trash2 size={16} className="text-gray-200 hover:text-red-500 transition-colors"/></button></div>
            </div>
          ))}
          <div className={`p-5 font-black flex justify-between items-center text-lg ${isD?'bg-red-50 text-red-700 border-t-2 border-red-100':'bg-emerald-50 text-emerald-700 border-t-2 border-emerald-100'}`}>
            <span>TOTAL ACUMULADO:</span><span>R$ {total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
          </div>
        </div>
      </div>
    );
  };

  const Graficos = () => {
    const pizza = [{ name: 'Essenciais', v: m.gastos.essenciais || 0.1 }, { name: 'Qualidade', v: m.gastos.qualidade || 0.1 }, { name: 'Futuro', v: m.gastos.futuro || 0.1 }];
    const barras = todasCategorias.map(c => ({
      name: c,
      plan: despesasPlanejadas.filter(d=>d.mes===mesAtual && d.categoria===c).reduce((s,d)=>s+d.valor, 0),
      real: despesasReais.filter(d=>d.data.startsWith(mesAtual) && d.categoria===c).reduce((s,d)=>s+d.valor, 0)
    })).filter(x => x.plan > 0 || x.real > 0);

    return (
      <div className="space-y-6 pb-24">
        <div className="bg-white p-8 rounded-3xl border shadow-xl shadow-blue-900/5">
          <h3 className="font-black text-gray-800 mb-8 text-center uppercase tracking-widest text-xs border-b pb-4">Distribuição do Gasto Real (60/30/10)</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pizza} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="v" isAnimationActive={true}>{pizza.map((e,i)=><Cell key={i} fill={['#2563EB', '#10B981', '#6366F1'][i]} stroke="none"/>)}</Pie><Tooltip contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}/><Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 'bold'}}/></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-8 rounded-3xl border shadow-xl shadow-blue-900/5">
          <h3 className="font-black text-gray-800 mb-8 text-center uppercase tracking-widest text-xs border-b pb-4">Comparativo: Plano vs Realizado</h3>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={barras} margin={{bottom: 40}} barGap={8}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6"/><XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={10} axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} fontSize={10}/><Tooltip cursor={{fill: '#F9FAFB'}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}/><Legend verticalAlign="top" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold'}}/><Bar dataKey="plan" fill="#BFDBFE" name="Meta" radius={[4, 4, 0, 0]}/><Bar dataKey="real" fill="#2563EB" name="Real" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    );
  };

  const ResumoAnual = () => {
    const meses = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const ano = mesAtual.split('-');
    const dados = meses.map((m, i) => {
      const ref = `${ano[0]}-${m}`;
      const r = receitasReais.filter(x=>x.data.startsWith(ref)).reduce((s,i)=>s+i.valor,0);
      const d = despesasReais.filter(x=>x.data.startsWith(ref)).reduce((s,i)=>s+i.valor,0);
      return { n: nomes[i], r, d, s: r-d };
    });
    return (
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden pb-24">
        <table className="w-full text-[11px] text-center font-bold">
          <thead className="bg-gray-900 text-white uppercase tracking-tighter"><tr><th className="p-4">Mês</th><th className="p-4">Rec.</th><th className="p-4">Desp.</th><th className="p-4">Saldo</th></tr></thead>
          <tbody className="divide-y">{dados.map(i=>(
            <tr key={i.n} className="hover:bg-gray-50 transition-colors"><td className="p-4 font-black text-gray-900 uppercase">{i.n}</td><td className="p-4 text-emerald-600">R$ {i.r.toFixed(0)}</td><td className="p-4 text-rose-600">R$ {i.d.toFixed(0)}</td><td className={`p-4 ${i.s>=0?'text-blue-600':'text-orange-600'} font-black italic`}>R$ {i.s.toFixed(0)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse tracking-widest text-xs uppercase">Carregando Banco André...</div>;
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 p-6 font-sans">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm space-y-6">
          <div className="text-center"><div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30"><PiggyBank size={40} className="text-white"/></div><h2 className="text-3xl font-black text-gray-900 tracking-tighter">Budget 2026</h2><p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Família André & Heloisa</p></div>
          <div className="space-y-3">
            <input className="w-full border-2 p-4 rounded-2xl outline-none focus:border-blue-600 transition-colors bg-gray-50 font-semibold text-sm" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
            <div className="relative">
              <input className="w-full border-2 p-4 rounded-2xl outline-none focus:border-blue-600 transition-colors bg-gray-50 font-semibold text-sm" type={verSenha?'text':'password'} placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} />
              <button onClick={()=>setVerSenha(!verSenha)} className="absolute right-4 top-5 text-gray-400 hover:text-blue-600 transition-colors">{verSenha?<EyeOff size={20}/>:<Eye size={20}/>}</button>
            </div>
            <button onClick={()=>sendPasswordResetEmail(auth, email).then(()=>alert('Link enviado!')).catch(()=>alert('Verifique o e-mail.'))} className="text-[9px] font-black text-blue-600 uppercase block mx-auto underline tracking-widest">Recuperar Senha</button>
          </div>
          <button onClick={() => signInWithEmailAndPassword(auth, email, senha).catch(()=>alert('Falha no login.'))} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest text-xs">Entrar no Sistema</button>
        </div>
      </div>
    );
  }

  const menu = [
    {id:'painel', l:'Painel', i:<LayoutDashboard size={18}/>},
    {id:'plan-receita', l:'Meta R$', i:<Target size={18}/>},
    {id:'plan-despesa', l:'Meta $', i:<TrendingDown size={18}/>},
    {id:'lanc-receita', l:'Lançar R$', i:<DollarSign size={18}/>},
    {id:'lanc-despesa', l:'Lançar $', i:<PlusCircle size={18}/>},
    {id:'graficos', l:'Gráficos', i:<Sparkles size={18}/>},
    {id:'anual', l:'Anual', i:<Calendar size={18}/>}
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col selection:bg-blue-100">
      <header className="bg-white/80 backdrop-blur-md p-4 shadow-sm border-b border-gray-200 flex justify-between items-center sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="font-black text-lg flex items-center gap-2 tracking-tighter text-gray-900 uppercase italic">A&H 2026</h1>
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">{user.email.split('@')[0]} • <button onClick={()=>signOut(auth)} className="text-red-500 font-black">Sair</button></p>
        </div>
        <div className="flex items-center gap-1 bg-gray-900 p-2 px-3 rounded-2xl shadow-lg border border-gray-800">
          <Calendar size={12} className="text-blue-400"/>
          <input type="month" value={mesAtual} onChange={e=>setMesAtual(e.target.value)} className="bg-transparent font-black text-[10px] outline-none text-white cursor-pointer" />
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto w-full flex-grow">
        {telaAtiva === 'painel' && <Painel />}
        {telaAtiva === 'plan-receita' && <Planejar tipo="receita" />}
        {telaAtiva === 'plan-despesa' && <Planejar tipo="despesa" />}
        {telaAtiva === 'lanc-receita' && <LançarReal tipo="receita" />}
        {telaAtiva === 'lanc-despesa' && <LançarReal tipo="despesa" />}
        {telaAtiva === 'graficos' && <Graficos />}
        {telaAtiva === 'anual' && <ResumoAnual />}
      </main>

      <nav className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-gray-200 p-2 flex overflow-x-auto gap-1 z-50 shadow-2xl rounded-3xl scrollbar-hide">
        {menu.map(b=>(
          <button key={b.id} onClick={()=>setTelaAtiva(b.id)} className={`flex-1 min-w-[70px] p-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-300 ${telaAtiva===b.id?'text-blue-600 bg-blue-50 shadow-inner scale-105':'text-gray-400 hover:text-gray-900'}`}>
            <span className="mb-0.5">{b.i}</span>
            <span className="text-[8px] font-black uppercase tracking-tighter whitespace-nowrap">{b.l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
