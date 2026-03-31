import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Trash2, BarChart3, PiggyBank, Sparkles, LogOut, Lock, Calendar, Eye, EyeOff, Target } from 'lucide-react';
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

  // --- ESCUTA EM TEMPO REAL (O segredo da atualização mútua) ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Esta função "vigia" o banco. Se alguém mudar algo lá, o app atualiza aqui.
        const unsubData = onSnapshot(doc(db, "dados", "principal"), (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setReceitasPlanejadas(d.receitasPlanejadas || []);
            setDespesasPlanejadas(d.despesasPlanejadas || []);
            setReceitasReais(d.receitasReais || []);
            setDespesasReais(d.despesasReais || []);
          }
          setLoading(false);
        }, (error) => {
          console.error("Erro na escuta real:", error);
          setLoading(false);
        });
        return () => unsubData();
      } else {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Função única de salvamento para evitar conflitos
  const syncTotal = async (rP, dP, rR, dR) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "dados", "principal"), {
        receitasPlanejadas: rP || receitasPlanejadas,
        despesasPlanejadas: dP || despesasPlanejadas,
        receitasReais: rR || receitasReais,
        despesasReais: dR || despesasReais
      });
    } catch (e) { console.error("Erro ao sincronizar:", e); }
  };

  // --- CÁLCULOS ---
  const t = {
    rPlan: receitasPlanejadas.filter(r => r.mes === mesAtual).reduce((s, r) => s + r.valor, 0),
    dPlan: despesasPlanejadas.filter(d => d.mes === mesAtual).reduce((s, d) => s + d.valor, 0),
    rReal: receitasReais.filter(r => r.data.startsWith(mesAtual)).reduce((s, r) => s + r.valor, 0),
    dReal: despesasReais.filter(d => d.data.startsWith(mesAtual)).reduce((s, d) => s + d.valor, 0),
  };
  t.saldoReal = t.rReal - t.dReal;

  const m = {
    orcs: { essenciais: (t.rReal || t.rPlan || 1) * 0.6, qualidade: (t.rReal || t.rPlan || 1) * 0.3, futuro: (t.rReal || t.rPlan || 1) * 0.1 },
    gastos: {
      essenciais: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.essenciais.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      qualidade: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.qualidade.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      futuro: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.futuro.includes(d.categoria)).reduce((s, d) => s + d.valor, 0)
    }
  };

  // --- TELAS ---
  const Painel = () => (
    <div className="space-y-6">
      <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl text-center">
        <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Saldo Mensal Real</p>
        <h2 className="text-5xl font-black mt-2">R$ {t.saldoReal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{id:'essenciais', label:'60% Essenciais', c:'bg-blue-500 text-blue-600'}, {id:'qualidade', label:'30% Qualidade', c:'bg-green-500 text-green-600'}, {id:'futuro', label:'10% Futuro', c:'bg-purple-500 text-purple-600'}].map(item => {
          const pct = Math.min((m.gastos[item.id] / (m.orcs[item.id] || 1)) * 100, 100);
          return (
            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400">{item.label}</p>
              <p className={`text-2xl font-black ${item.c.split(' ')[1]}`}>R$ {m.orcs[item.id].toFixed(2)}</p>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${item.c.split(' ')[0]}`} style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-xs mt-2 text-gray-500 font-bold">Gasto Real: R$ {m.gastos[item.id].toFixed(2)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const Planejar = ({ tipo }) => {
    const [f, sf] = useState({ categoria: 'Moradia', descricao: '', valor: '', mes: mesAtual });
    const isD = tipo === 'despesa';
    const lista = (isD ? despesasPlanejadas : receitasPlanejadas).filter(x => x.mes === mesAtual);
    const total = lista.reduce((s, i) => s + i.valor, 0);

    const handleAdd = () => {
      if(!f.descricao || !f.valor) return;
      const novo = { ...f, valor: parseFloat(f.valor), id: Date.now() };
      if(isD) { const n = [...despesasPlanejadas, novo]; setDespesasPlanejadas(n); syncTotal(null, n, null, null); }
      else { const n = [...receitasPlanejadas, novo]; setReceitasPlanejadas(n); syncTotal(n, null, null, null); }
      sf({ ...f, descricao: '', valor: '' });
    };

    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100">
          <h3 className={`font-black mb-4 flex items-center gap-2 ${isD?'text-orange-600':'text-teal-600'}`}><Target/> Plano de {isD?'Gastos':'Receitas'}</h3>
          <div className="grid grid-cols-1 gap-2">
            {isD && <select className="p-4 border-2 rounded-xl" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c}>{c}</option>)}</select>}
            <input className="p-4 border-2 rounded-xl" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="p-4 border-2 rounded-xl" type="number" placeholder="R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <button onClick={handleAdd} className={`p-4 rounded-xl font-black text-white ${isD?'bg-orange-600':'bg-teal-600'}`}>ADICIONAR AO PLANO</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden divide-y">
          {lista.map(i => (
            <div key={i.id} className="p-4 flex justify-between">
              <div><p className="font-bold">{i.descricao}</p>{isD && <p className="text-[10px] uppercase text-gray-400 font-bold">{i.categoria}</p>}</div>
              <span className="font-black">R$ {i.valor.toFixed(2)}</span>
            </div>
          ))}
          <div className="p-4 bg-gray-50 flex justify-between font-black text-gray-700 uppercase tracking-tighter"><span>Total Planejado:</span><span>R$ {total.toLocaleString()}</span></div>
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
      const novo = { ...f, valor: parseFloat(f.valor), id: Date.now() };
      if(isD) { const n = [...despesasReais, novo]; setDespesasReais(n); syncTotal(null, null, null, n); }
      else { const n = [...receitasReais, novo]; setReceitasReais(n); syncTotal(null, null, n, null); }
      sf({ ...f, descricao: '', valor: '' });
    };

    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100">
          <h3 className={`font-black mb-4 flex items-center gap-2 ${isD?'text-red-600':'text-green-600'}`}>{isD?<TrendingDown/>:<PlusCircle/>} Lançar {isD?'Saída':'Entrada'} Real</h3>
          <div className="grid grid-cols-1 gap-2">
            {isD && <select className="p-4 border-2 rounded-xl" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c}>{c}</option>)}</select>}
            <input className="p-4 border-2 rounded-xl" placeholder="O que é?" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="p-4 border-2 rounded-xl" type="number" placeholder="Valor Pago R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <input className="p-4 border-2 rounded-xl" type="date" value={f.data} onChange={e=>sf({...f, data:e.target.value})} />
            <button onClick={handleAdd} className={`p-4 rounded-xl font-black text-white ${isD?'bg-red-600':'bg-green-600'}`}>CONFIRMAR AGORA</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden divide-y">
          {lista.reverse().map(i => (
            <div key={i.id} className="p-4 flex justify-between items-center">
              <div><p className="font-bold">{i.descricao}</p><p className="text-[10px] text-gray-400 font-bold">{i.data}</p></div>
              <div className="flex gap-4 items-center">
                <span className={`font-black ${isD?'text-red-600':'text-green-600'}`}>R$ {i.valor.toFixed(2)}</span>
                <button onClick={()=>{const n=(isD?despesasReais:receitasReais).filter(x=>x.id!==i.id); isD?setDespesasReais(n):setReceitasReais(n); isD?syncTotal(null,null,null,n):syncTotal(null,null,n,null);}}><Trash2 size={16} className="text-gray-200"/></button>
              </div>
            </div>
          ))}
          <div className={`p-5 font-black flex justify-between items-center text-lg ${isD?'bg-red-50 text-red-700':'bg-green-50 text-green-700'}`}>
            <span>TOTAL ACUMULADO:</span><span>R$ {total.toLocaleString()}</span>
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
      <div className="space-y-6 pb-20">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-black mb-6 text-gray-700 flex items-center gap-2"><BarChart3 size={20}/> Distribuição Real (60/30/10)</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pizza} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="v">{pizza.map((e,i)=><Cell key={i} fill={['#3B82F6', '#10B981', '#8B5CF6'][i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-black mb-6 text-gray-700 flex items-center gap-2"><BarChart3 size={20}/> Planejado vs Real</h3>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={barras} margin={{bottom: 40}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={10}/><YAxis/><Tooltip/><Legend verticalAlign="top"/><Bar dataKey="plan" fill="#93C5FD" name="Plano"/><Bar dataKey="real" fill="#3B82F6" name="Real"/></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    );
  };

  const ResumoAnual = () => {
    const meses = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const ano = mesAtual.split('-')[0];
    const dados = meses.map((m, i) => {
      const ref = `${ano}-${m}`;
      const r = receitasReais.filter(x=>x.data.startsWith(ref)).reduce((s,i)=>s+i.valor,0);
      const d = despesasReais.filter(x=>x.data.startsWith(ref)).reduce((s,i)=>s+i.valor,0);
      return { n: nomes[i], r, d, s: r-d };
    });
    return (
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-[11px] text-center font-bold">
          <thead className="bg-gray-800 text-white"><tr><th className="p-3">Mês</th><th className="p-3">Rec.</th><th className="p-3">Desp.</th><th className="p-3">Saldo</th></tr></thead>
          <tbody className="divide-y">{dados.map(i=>(
            <tr key={i.n}><td className="p-3 font-black">{i.n}</td><td className="p-3 text-green-600">R$ {i.r.toFixed(0)}</td><td className="p-3 text-red-600">R$ {i.d.toFixed(0)}</td><td className={`p-3 ${i.s>=0?'text-blue-600':'text-orange-600'}`}>R$ {i.s.toFixed(0)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    );
  };

  // --- LOGIN ---
  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 tracking-widest">Sincronizando Família André...</div>;
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-blue-600 p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-sm space-y-6">
          <div className="text-center"><PiggyBank size={50} className="mx-auto text-blue-600 mb-2"/><h2 className="text-3xl font-black text-gray-800 tracking-tighter">Meu Orçamento</h2><p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Acesso Familiar</p></div>
          <div className="space-y-3">
            <input className="w-full border-2 p-4 rounded-2xl outline-none" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
            <div className="relative">
              <input className="w-full border-2 p-4 rounded-2xl outline-none" type={verSenha?'text':'password'} placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} />
              <button onClick={()=>setVerSenha(!verSenha)} className="absolute right-4 top-5 text-gray-400">{verSenha?<EyeOff size={20}/>:<Eye size={20}/>}</button>
            </div>
            <button onClick={()=>sendPasswordResetEmail(auth, email).then(()=>alert('Link enviado!')).catch(()=>alert('E-mail incorreto'))} className="text-[9px] font-black text-blue-600 uppercase block mx-auto underline">Esqueci a Senha</button>
          </div>
          <button onClick={() => signInWithEmailAndPassword(auth, email, senha)} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl">ENTRAR</button>
        </div>
      </div>
    );
  }

  // --- LAYOUT ---
  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans">
      <header className="bg-white p-4 shadow-sm border-b-2 border-gray-100 flex justify-between items-center sticky top-0 z-50">
        <div><h1 className="font-black text-xl flex items-center gap-1"><PiggyBank size={24} className="text-blue-600"/> 2026</h1><p className="text-[8px] font-bold text-gray-400 uppercase">{user.email} <button onClick={()=>signOut(auth)} className="text-red-400 ml-2">Sair</button></p></div>
        <div className="flex items-center gap-1 bg-blue-50 p-2 rounded-xl"><input type="month" value={mesAtual} onChange={e=>setMesAtual(e.target.value)} className="bg-transparent font-black text-xs outline-none text-blue-700" /></div>
      </header>

      <main className="p-4 max-w-xl mx-auto space-y-4">
        {telaAtiva === 'painel' && <Painel />}
        {telaAtiva === 'plan-receita' && <Planejar tipo="receita" />}
        {telaAtiva === 'plan-despesa' && <Planejar tipo="despesa" />}
        {telaAtiva === 'lanc-receita' && <LançarReal tipo="receita" />}
        {telaAtiva === 'lanc-despesa' && <LançarReal tipo="despesa" />}
        {telaAtiva === 'graficos' && <Graficos />}
        {telaAtiva === 'anual' && <ResumoAnual />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 p-2 flex overflow-x-auto gap-1 z-50">
        {[
          {id:'painel', l:'Início', i:<BarChart3 size={18}/>},
          {id:'plan-receita', l:'Meta R$', i:<Target size={18}/>},
          {id:'plan-despesa', l:'Meta $', i:<TrendingDown size={18}/>},
          {id:'lanc-receita', l:'Lançar R$', i:<DollarSign size={18}/>},
          {id:'lanc-despesa', l:'Lançar $', i:<PlusCircle size={18}/>},
          {id:'graficos', l:'Gráficos', i:<Sparkles size={18}/>},
          {id:'anual', l:'Anual', i:<Calendar size={18}/>}
        ].map(b=>(
          <button key={b.id} onClick={()=>setTelaAtiva(b.id)} className={`flex-1 min-w-[75px] p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${telaAtiva===b.id?'text-blue-600 bg-blue-50 shadow-inner':'text-gray-400'}`}><span className="mb-0.5">{b.i}</span><span className="text-[8px] font-black uppercase">{b.l}</span></button>
        ))}
      </nav>
    </div>
  );
}
