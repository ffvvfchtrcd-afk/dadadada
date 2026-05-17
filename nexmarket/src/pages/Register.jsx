import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import { dataService } from '../services/dataService';

export default function Register() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.senha !== formData.confirmarSenha) {
      return setError('As senhas não coincidem.');
    }

    setLoading(true);
    try {
      const result = await dataService.register({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha
      });

      if (result.success) {
        window.dispatchEvent(new Event('app-state-change'));
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Ocorreu um erro ao criar sua conta.');
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
            <UserPlus size={32} strokeWidth={2.5} />
          </div>
          <h1 className="premium-title text-4xl mb-2">Criar Conta</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Junte-se à nossa comunidade premium</p>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text" 
                  name="nome"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  className="input-premium pl-12" 
                  placeholder="Seu nome"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail (Opcional)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-premium pl-12" 
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password" 
                  name="senha"
                  required
                  value={formData.senha}
                  onChange={handleChange}
                  className="input-premium pl-12" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Senha</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password" 
                  name="confirmarSenha"
                  required
                  value={formData.confirmarSenha}
                  onChange={handleChange}
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
              <span className="flex items-center gap-2">Finalizar Cadastro <ArrowRight size={18} strokeWidth={3} /></span>
            )}
          </button>

          <div className="text-center pt-4">
            <p className="text-slate-400 text-[11px] font-bold">
              Já tem uma conta? {' '}
              <Link to="/login" className="text-accent-blue hover:underline">Entre agora</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
