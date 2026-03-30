import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Trash2, BarChart3, PiggyBank, Sparkles, LogOut, Lock, Calendar, Eye, EyeOff, Target, ArrowRight } from 'lucide-react';
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

  // Estados dos Dados
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

  // --- SINCRONIZAÇÃO FIREBASE ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        const unsubData = onSnapshot(doc(db, "dados", "principal"), (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setReceitasPlanejadas(d.receitasPlanejadas || []);
            setDespesasPlanejadas(d.despesasPlanejadas || []);
            setReceitasReais(d.receitasReais || []);
            setDespesasReais(d.despesasReais || []);
          }
        });
        return () => unsubData();
      }
    });
    return () => unsubAuth();
  }, []);

  const sync = async (rP, dP, rR, dR) => {
    if (!user) return;
    await setDoc(doc(db, "dados", "principal"), {
      receitasPlanejadas: rP || receitasPlanejadas,
      despesasPlanejadas: dP || despesasPlanejadas,
      receitasReais: rR || receitasReais,
      despesasReais: dR || despesasReais
    });
  };

  // --- CÁLCULOS GERAIS ---
  const calcularTotais = () => {
    const filterMes = (lista, campoData = 'mes') => lista.filter(i => i[campoData].startsWith(mesAtual));
    const rPlan = filterMes(receitasPlanejadas).reduce((s, i) => s + i.valor, 0);
    const dPlan = filterMes(despesasPlanejadas).reduce((s, i) => s + i.valor, 0);
    const rReal = filterMes(receitasReais, 'data').reduce((s, i) => s + i.valor, 0);
    const dReal = filterMes(despesasReais, 'data').reduce((s, i) => s + i.valor, 0);
    return { rPlan, dPlan, rReal, dReal, saldoReal: rReal - dReal };
  };
  const t = calcularTotais();

  const m = {
    orcs: { essenciais: (t.rReal || t.rPlan || 1) * 0.6, qualidade: (t.rReal || t.rPlan || 1) * 0.3, futuro: (t.rReal || t.rPlan || 1) * 0.1 },
    gastos: {
      essenciais: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.essenciais.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      qualidade: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.qualidade.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      futuro: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.futuro.includes(d.categoria)).reduce((s, d) => s + d.valor, 0)
    }
  };

  // --- COMPONENTES DE TELAS ---

  const Painel = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl text-center border-b-8 border-blue-800">
        <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Saldo Real Disponível</p>
        <h2 className="text-5xl font-black mt-2">R$ {t.saldoReal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['essenciais', 'qualidade', 'futuro'].map((b, i) => {
          const cores = { essenciais: 'bg-blue-500 text-blue-600', qualidade: 'bg-green-500 text-green-600', futuro: 'bg-purple-500 text-purple-600' };
          const labels = { essenciais: '60% Essenciais', qualidade: '30% Qualidade', futuro: '10% Futuro' };
          const pct = Math.min((m.gastos[b] / (m.orcs[b] || 1)) * 100, 100);
          return (
            <div key={b} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400">{labels[b]}</p>
              <p className={`text-2xl font-black ${cores[b].split(' ')[1]}`}>R$ {m.orcs[b].toFixed(2)}</p>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                <div className={`h-full ${cores[b].split(' ')[0]} transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-xs mt-2 text-gray-500 font-bold">Gasto Real: R$ {m.gastos[b].toFixed(2)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const Planejamento = ({ tipo }) => {
    const isDespesa = tipo === 'despesa';
    const [f, sf] = useState({ categoria: 'Moradia', descricao: '', valor: '', mes: mesAtual });
    const lista = (isDespesa ? despesasPlanejadas : receitasPlanejadas).filter(x => x.mes === mesAtual);
    const total = lista.reduce((s, i) => s + i.valor, 0);

    const add = () => {
      if(!f.descricao || !f.valor) return;
      const novo = { ...f, valor: parseFloat(f.valor), id: Date.now() };
      if (isDespesa) { const n = [...despesasPlanejadas, novo]; setDespesasPlanejadas(n); sync(null, n, null, null); }
      else { const n = [...receitasPlanejadas, novo]; setReceitasPlanejadas(n); sync(n, null, null, null); }
      sf({ ...f, descricao: '', valor: '' });
    };

    return (
      <div className="space-y-4 pb-20">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100">
          <h3 className={`font-black mb-4 flex items-center gap-2 ${isDespesa?'text-orange-600':'text-teal-600'}`}><Target/> Planejar {isDespesa?'Gasto':'Receita'}</h3>
          <div className="grid grid-cols-1 gap-2">
            {isDespesa && <select className="p-4 border-2 rounded-xl" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c}>{c}</option>)}</select>}
            <input className="p-4 border-2 rounded-xl" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="p-4 border-2 rounded-xl" type="number" placeholder="Valor Estimado R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <button onClick={add} className={`p-4 rounded-xl font-black text-white ${isDespesa?'bg-orange-600':'bg-teal-600'}`}>SALVAR NO PLANO</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 divide-y overflow-hidden">
          {lista.map(item => (
            <div key={item.id} className="p-4 flex justify-between items-center">
              <div><p className="font-bold text-gray-700">{item.descricao}</p>{isDespesa && <p className="text-[10px] uppercase font-black text-gray-400">{item.categoria}</p>}</div>
              <div className="flex items-center gap-4"><span className="font-black text-gray-600">R$ {item.valor.toFixed(2)}</span>
              <button onClick={()=>{const n=(isDespesa?despesasPlanejadas:receitasPlanejadas).filter(i=>i.id!==item.id); isDespesa?setDespesasPlanejadas(n):setReceitasPlanejadas(n); isDespesa?sync(null,n,null,null):sync(n,null,null,null);}}><Trash2 size={16} className="text-red-200 hover:text-red-500"/></button></div>
            </div>
          ))}
          <div className={`p-4 font-black flex justify-between items-center ${isDespesa?'bg-orange-50 text-orange-700':'bg-teal-50 text-teal-700'}`}>
            <span>TOTAL PLANEJADO:</span><span>R$ {total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
          </div>
        </div>
      </div>
    );
  };

  const LancamentoReal = ({ tipo }) => {
    const isDespesa = tipo === 'despesa';
    const [f, sf] = useState({ categoria: 'Moradia', descricao: '', valor: '', data: new Date().toISOString().slice(0, 10) });
    const lista = (isDespesa ? despesasReais : receitasReais).filter(x => x.data.startsWith(mesAtual));
    const total = lista.reduce((s, i) => s + i.valor, 0);

    const add = () => {
      if(!f.descricao || !f.valor) return;
      const novo = { ...f, valor: parseFloat(f.valor), id: Date.now() };
      if (isDespesa) { const n = [...despesasReais, novo]; setDespesasReais(n); sync(null, null, null, n); }
      else { const n = [...receitasReais, novo]; setReceitasReais(n); sync(null, null, n, null); }
      sf({ ...f, descricao: '', valor: '' });
    };

    return (
      <div className="space-y-4 pb-20">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100">
          <h3 className={`font-black mb-4 flex items-center gap-2 ${isDespesa?'text-red-600':'text-green-600'}`}>{isDespesa?<TrendingDown/>:<PlusCircle/>} Lançar {isDespesa?'Saída Real':'Entrada Real'}</h3>
          <div className="grid grid-cols-1 gap-2">
            {isDespesa && <select className="p-4 border-2 rounded-xl" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c}>{c}</option>)}</select>}
            <input className="p-4 border-2 rounded-xl" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="p-4 border-2 rounded-xl" type="number" placeholder="Valor Pago R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <input className="p-4 border-2 rounded-xl" type="date" value={f.data} onChange={e=>sf({...f, data:e.target.value})} />
            <button onClick={add} className={`p-4 rounded-xl font-black text-white ${isDespesa?'bg-red-600':'bg-green-600'}`}>CONFIRMAR AGORA</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 divide-y overflow-hidden">
          {lista.reverse().map(item => (
            <div key={item.id} className="p-4 flex justify-between items-center">
              <div><p className="font-bold text-gray-800">{item.descricao}</p><p className="text-[10px] text-gray-400 font-bold">{item.data}</p></div>
              <div className="flex items-center gap-4"><span className={`font-black ${isDespesa?'text-red-600':'text-green-600'}`}>R$ {item.valor.toFixed(2)}</span>
              <button onClick={()=>{const n=(isDespesa?despesasReais:receitasReais).filter(i=>i.id!==item.id); isDespesa?setDespesasReais(n):setReceitasReais(n); isDespesa?sync(null,null,null,n):sync(null,null,n,null);}}><Trash2 size={16} className="text-gray-200"/></button></div>
            </div>
          ))}
          <div className={`p-5 font-black flex justify-between items-center text-lg ${isDespesa?'bg-red-50 text-red-700':'bg-green-50 text-green-700'}`}>
            <span>TOTAL ACUMULADO:</span><span>R$ {total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
          </div>
        </div>
      </div>
    );
  };

  const Relatorios = () => {
    const pizza = [{ name: 'Essenciais', v: m.gastos.essenciais || 0.1 }, { name: 'Qualidade', v: m.gastos.qualidade || 0.1 }, { name: 'Futuro', v: m.gastos.futuro || 0.1 }];
    const barras = todasCategorias.map(c => ({
      name: c,
      plan: despesasPlanejadas.filter(d=>d.mes===mesAtual && d.categoria===c).reduce((s,d)=>s+d.valor, 0),
      real: despesasReais.filter(d=>d.data.startsWith(mesAtual) && d.categoria===c).reduce((s,d)=>s+d.valor, 0)
    })).filter(x => x.plan > 0 || x.real > 0);

    return (
      <div className="space-y-6 pb-20">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-700 mb-6 flex items-center gap-2"><BarChart3 size={20}/> Distribuição Real (60/30/10)</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pizza} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="v" isAnimationActive={true}>{pizza.map((e,i)=><Cell key={i} fill={['#3B82F6', '#10B981', '#8B5CF6'][i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-700 mb-6 flex items-center gap-2"><BarChart3 size={20}/> Planejado vs Real</h3>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={barras} margin={{bottom: 40}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={10} interval={0}/><YAxis/><Tooltip/><Legend verticalAlign="top"/><Bar dataKey="plan" fill="#93C5FD" name="Plano" isAnimationActive={true}/><Bar dataKey="real" fill="#3B82F6" name="Real" isAnimationActive={true}/></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    );
  };

  const ResumoAnual = () => {
    const meses = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const anoRef = mesAtual.split('-')[0];
    const dados = meses.map((m, i) => {
      const ref = `${anoRef}-${m}`;
      const r = receitasReais.filter(x=>x.data.startsWith(ref)).reduce((s,i)=>s+i.valor,0);
      const d = despesasReais.filter(x=>x.data.startsWith(ref)).reduce((s,i)=>s+i.valor,0);
      return { n: nomes[i], r, d, s: r-d };
    });

    return (
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-gray-800 text-white font-bold text-center">
            <tr><th className="p-3">Mês</th><th className="p-3">Rec.</th><th className="p-3">Desp.</th><th className="p-3">Saldo</th></tr>
          </thead>
          <tbody className="divide-y text-center font-bold">
            {dados.map(i=>(
              <tr key={i.n}><td className="p-3 text-gray-800 font-black">{i.n}</td><td className="p-3 text-green-600">R$ {i.r.toFixed(0)}</td><td className="p-3 text-red-600">R$ {i.d.toFixed(0)}</td><td className={`p-3 ${i.s>=0?'text-blue-600':'text-orange-600'}`}>R$ {i.s.toFixed(0)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // --- TELA DE LOGIN ---
  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600">SINCRONIZANDO...</div>;
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-blue-600 p-6 font-sans">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-sm space-y-6">
          <div className="text-center"><PiggyBank size={60} className="mx-auto text-blue-600 mb-2"/><h2 className="text-3xl font-black text-gray-800 tracking-tight">Login Familiar</h2><p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Acesso André & Heloisa</p></div>
          <div className="space-y-3">
            <input className="w-full border-2 p-4 rounded-2xl outline-none" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
            <div className="relative">
              <input className="w-full border-2 p-4 rounded-2xl outline-none" type={verSenha?'text':'password'} placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} />
              <button onClick={()=>setVerSenha(!verSenha)} className="absolute right-4 top-5 text-gray-400">{verSenha?<EyeOff size={20}/>:<Eye size={20}/>}</button>
            </div>
            <button onClick={()=>sendPasswordResetEmail(auth, email).then(()=>alert('Link enviado!')).catch(()=>alert('E-mail inválido'))} className="text-[10px] font-black text-blue-600 uppercase block mx-auto underline">Esqueci a Senha</button>
          </div>
          <button onClick={() => signInWithEmailAndPassword(auth, email, senha)} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl">ENTRAR</button>
        </div>
      </div>
    );
  }

  // --- MENU DE NAVEGAÇÃO ---
  const abas = [
    {id:'painel', l:'Início', i:<BarChart3 size={18}/>},
    {id:'plan-receitas', l:'Plan. R$', i:<Target size={18}/>},
    {id:'plan-despesas', l:'Plan. $', i:<TrendingDown size={18}/>},
    {id:'lanc-receitas', l:'Lançar R$', i:<DollarSign size={18}/>},
    {id:'lanc-despesas', l:'Lançar $', i:<PlusCircle size={18}/>},
    {id:'relatorios', l:'Gráficos', i:<Sparkles size={18}/>},
    {id:'anual', l:'Anual', i:<Calendar size={18}/>}
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 shadow-sm border-b-2 border-gray-100 flex justify-between items-center sticky top-0 z-50">
        <div><h1 className="font-black text-lg flex items-center gap-2"><PiggyBank className="text-blue-600"/> 2026</h1><p className="text-[8px] font-black text-gray-400 uppercase">{user.email}</p></div>
        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-xl"><input type="month" value={mesAtual} onChange={e=>setMesAtual(e.target.value)} className="bg-transparent font-black text-xs outline-none text-blue-700" /></div>
        <button onClick={()=>signOut(auth)} className="text-gray-300 hover:text-red-500 transition-colors"><LogOut size={20}/></button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {telaAtiva === 'painel' && <Painel />}
        {telaAtiva === 'plan-receitas' && <Planejamento tipo="receita" />}
        {telaAtiva === 'plan-despesas' && <Planejamento tipo="despesa" />}
        {telaAtiva === 'lanc-receitas' && <LancamentoReal tipo="receita" />}
        {telaAtiva === 'lanc-despesas' && <LancamentoReal tipo="despesa" />}
        {telaAtiva === 'relatorios' && <Relatorios />}
        {telaAtiva === 'anual' && <ResumoAnual />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 p-2 flex overflow-x-auto gap-1 z-50">
        {abas.map(b=>(
          <button key={b.id} onClick={()=>setTelaAtiva(b.id)} className={`flex-1 min-w-[70px] p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${telaAtiva===b.id?'text-blue-600 bg-blue-50 shadow-inner':'text-gray-400'}`}><span className="mb-0.5">{b.i}</span><span className="text-[8px] font-black uppercase whitespace-nowrap">{b.l}</span></button>
        ))}
      </nav>
    </div>
  );
}
