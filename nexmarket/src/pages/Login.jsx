import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, ArrowRight, User } from 'lucide-react';
import { dataService } from '../services/dataService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await dataService.login(email, senha);
      if (result.success) {
        window.dispatchEvent(new Event('app-state-change'));
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-premium pt-[88px] sm:pt-32 pb-32 flex justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue mb-6">
            <User size={32} strokeWidth={2.5} />
          </div>
          <h1 className="premium-title text-4xl mb-2">Bem-vindo</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Acesse sua conta premium</p>
        </div>

        <form onSubmit={handleSubmit} className="card-premium p-8 space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500 text-xs font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail ou Usuário</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium pl-12" 
                  placeholder="Nome de usuário ou e-mail"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Senha</label>
                <button type="button" className="text-[9px] font-bold text-accent-blue hover:underline uppercase tracking-wider">Esqueceu a senha?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password" 
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="input-premium pl-12" 
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-premium btn-premium-primary !py-4 shadow-glow-blue"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-dark-950/20 border-t-dark-950 rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2">Entrar na Conta <ArrowRight size={18} strokeWidth={3} /></span>
            )}
          </button>

          <div className="text-center pt-4">
            <p className="text-slate-400 text-[11px] font-bold">
              Novo por aqui? {' '}
              <Link to="/register" className="text-accent-blue hover:underline">Crie sua conta</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
