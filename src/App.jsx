import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Trash2, BarChart3, PiggyBank, Sparkles, LogOut, Lock, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- CONFIGURAÇÃO FIREBASE ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
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

  // --- SINCRONIZAÇÃO EM TEMPO REAL ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        const unsubData = onSnapshot(doc(db, "dados", "principal"), (snapshot) => {
          if (snapshot.exists()) {
            const d = snapshot.data();
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

  const salvarDados = async (novasReceitas, novasDespesas, novasReceitasR, novasDespesasR) => {
    if (!user) return;
    await setDoc(doc(db, "dados", "principal"), {
      receitasPlanejadas: novasReceitas || receitasPlanejadas,
      despesasPlanejadas: novasDespesas || despesasPlanejadas,
      receitasReais: novasReceitasR || receitasReais,
      despesasReais: novasDespesasR || despesasReais
    });
  };

  // --- CALCULOS ---
  const t = {
    rPlan: receitasPlanejadas.filter(r => r.mes === mesAtual).reduce((s, r) => s + r.valor, 0),
    dPlan: despesasPlanejadas.filter(d => d.mes === mesAtual).reduce((s, d) => s + d.valor, 0),
    rReal: receitasReais.filter(r => r.data.startsWith(mesAtual)).reduce((s, r) => s + r.valor, 0),
    dReal: despesasReais.filter(d => d.data.startsWith(mesAtual)).reduce((s, d) => s + d.valor, 0),
  };
  t.saldoReal = t.rReal - t.dReal;

  const m = {
    orcs: { essenciais: (t.rReal || t.rPlan) * 0.6, qualidade: (t.rReal || t.rPlan) * 0.3, futuro: (t.rReal || t.rPlan) * 0.1 },
    gastos: {
      essenciais: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.essenciais.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      qualidade: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.qualidade.includes(d.categoria)).reduce((s, d) => s + d.valor, 0),
      futuro: despesasReais.filter(d => d.data.startsWith(mesAtual) && categoriasPorBolso.futuro.includes(d.categoria)).reduce((s, d) => s + d.valor, 0)
    }
  };

  // --- COMPONENTES DE TELA ---
  const Painel = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2"><Sparkles /> Método 60/30/10</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{id:'essenciais', label:'60% Essenciais', c:'blue'}, {id:'qualidade', label:'30% Qualidade', c:'green'}, {id:'futuro', label:'10% Futuro', c:'purple'}].map(item => {
            const pct = Math.min((m.gastos[item.id] / (m.orcs[item.id] || 1)) * 100, 100);
            const colorClass = item.c === 'blue' ? 'text-blue-600 bg-blue-500' : item.c === 'green' ? 'text-green-600 bg-green-500' : 'text-purple-600 bg-purple-500';
            return (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-400">{item.label}</p>
                <p className={`text-2xl font-black ${colorClass.split(' ')[0]}`}>R$ {m.orcs[item.id].toFixed(2)}</p>
                <div className="w-full bg-gray-100 h-2 rounded-full mt-3"><div className={`h-2 rounded-full transition-all duration-1000 ${colorClass.split(' ')[1]}`} style={{ width: `${pct}%` }}></div></div>
                <p className="text-xs mt-2 text-gray-500 font-bold">Gasto Real: R$ {m.gastos[item.id].toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-lg text-center">
        <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Saldo Real do Mês</p>
        <p className="text-5xl font-black mt-2">R$ {t.saldoReal.toLocaleString()}</p>
      </div>
    </div>
  );

  const LancarGasto = () => {
    const [f, sf] = useState({ categoria: 'Moradia', descricao: '', valor: '', data: new Date().toISOString().slice(0, 10) });
    const add = () => {
      if(!f.descricao || !f.valor) return;
      const novaLista = [...despesasReais, { ...f, valor: parseFloat(f.valor), id: Date.now() }];
      setDespesasReais(novaLista);
      salvarDados(null, null, null, novaLista);
      sf({ ...f, descricao: '', valor: '' });
    };
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
          <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2"><PlusCircle /> Novo Gasto Real</h3>
          <div className="grid grid-cols-1 gap-3">
            <select className="border-2 p-4 rounded-xl" value={f.categoria} onChange={e=>sf({...f, categoria:e.target.value})}>{todasCategorias.map(c=><option key={c}>{c}</option>)}</select>
            <input className="border-2 p-4 rounded-xl" placeholder="Descrição" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="border-2 p-4 rounded-xl" type="number" placeholder="Valor R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <input className="border-2 p-4 rounded-xl" type="date" value={f.data} onChange={e=>sf({...f, data:e.target.value})} />
            <button onClick={add} className="bg-red-600 text-white p-4 rounded-xl font-bold">Registrar Gasto</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 divide-y overflow-hidden shadow-sm">
          {despesasReais.filter(d => d.data.startsWith(mesAtual)).reverse().map(d => (
            <div key={d.id} className="p-4 flex justify-between items-center bg-white">
              <div><p className="font-bold text-gray-800">{d.descricao}</p><p className="text-[10px] text-gray-400 uppercase font-bold">{d.categoria}</p></div>
              <div className="flex items-center gap-4"><span className="font-black text-red-600">R$ {d.valor.toFixed(2)}</span>
              <button onClick={()=>{const n = despesasReais.filter(x=>x.id!==d.id); setDespesasReais(n); salvarDados(null,null,null,n);}}><Trash2 size={16} className="text-gray-300"/></button></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LancarReceita = () => {
    const [f, sf] = useState({ descricao: '', valor: '', data: new Date().toISOString().slice(0, 10) });
    const add = () => {
      if(!f.descricao || !f.valor) return;
      const novaLista = [...receitasReais, { ...f, valor: parseFloat(f.valor), id: Date.now() }];
      setReceitasReais(novaLista);
      salvarDados(null, null, novaLista, null);
      sf({ ...f, descricao: '', valor: '' });
    };
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-xl border-2 border-green-100 shadow-sm">
          <h3 className="font-bold text-green-600 mb-4 flex items-center gap-2"><DollarSign /> Entrada de Dinheiro</h3>
          <div className="grid grid-cols-1 gap-3">
            <input className="border-2 p-4 rounded-xl" placeholder="Ex: Salário" value={f.descricao} onChange={e=>sf({...f, descricao:e.target.value})} />
            <input className="border-2 p-4 rounded-xl" type="number" placeholder="Valor R$" value={f.valor} onChange={e=>sf({...f, valor:e.target.value})} />
            <input className="border-2 p-4 rounded-xl" type="date" value={f.data} onChange={e=>sf({...f, data:e.target.value})} />
            <button onClick={add} className="bg-green-600 text-white p-4 rounded-xl font-bold">Confirmar Recebimento</button>
          </div>
        </div>
        {receitasReais.filter(r => r.data.startsWith(mesAtual)).map(r => (
           <div key={r.id} className="p-4 bg-white border-2 border-gray-100 rounded-xl flex justify-between font-bold text-green-600 mb-2">
             <span>{r.descricao}</span><span>R$ {r.valor.toFixed(2)}</span>
           </div>
        ))}
      </div>
    );
  };

  // --- LOGIN SCREEN ---
  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600">Carregando Nuvem...</div>;
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-blue-600 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-6">
          <div className="text-center"><PiggyBank size={48} className="mx-auto text-blue-600"/><h2 className="text-2xl font-black mt-2">Login Familiar</h2></div>
          <input className="w-full border-2 p-4 rounded-2xl" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full border-2 p-4 rounded-2xl" type="password" placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} />
          <button onClick={() => signInWithEmailAndPassword(auth, email, senha)} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg">ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-6 shadow-sm border-b-2 border-gray-100 flex justify-between items-center">
        <div><h1 className="font-black text-xl flex items-center gap-2 text-gray-800"><PiggyBank className="text-blue-600"/> 2026</h1><p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{user.email}</p></div>
        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg"><Calendar size={16} className="text-blue-600"/><input type="month" value={mesAtual} onChange={e=>setMesAtual(e.target.value)} className="bg-transparent font-bold text-xs outline-none cursor-pointer text-blue-700" /></div>
        <button onClick={()=>signOut(auth)} className="text-gray-300"><LogOut size={20}/></button>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {telaAtiva === 'painel' && <Painel />}
        {telaAtiva === 'receitas' && <LancarReceita />}
        {telaAtiva === 'gastos' && <LancarGasto />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 p-2 flex justify-around shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={()=>setTelaAtiva('painel')} className={`p-3 rounded-2xl flex flex-col items-center gap-1 ${telaAtiva==='painel'?'text-blue-600 bg-blue-50':'text-gray-400'}`}><BarChart3 size={20}/><span className="text-[10px] font-bold">Painel</span></button>
        <button onClick={()=>setTelaAtiva('receitas')} className={`p-3 rounded-2xl flex flex-col items-center gap-1 ${telaAtiva==='receitas'?'text-green-600 bg-green-50':'text-gray-400'}`}><DollarSign size={20}/><span className="text-[10px] font-bold">Receitas</span></button>
        <button onClick={()=>setTelaAtiva('gastos')} className={`p-3 rounded-2xl flex flex-col items-center gap-1 ${telaAtiva==='gastos'?'text-red-600 bg-red-50':'text-gray-400'}`}><TrendingDown size={20}/><span className="text-[10px] font-bold">Gastos</span></button>
      </nav>
    </div>
  );
}
