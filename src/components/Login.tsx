import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { motion } from 'motion/react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.login(username, password);
      localStorage.setItem('soc_token', res.data.token);
      localStorage.setItem('soc_user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soc-bg flex items-center justify-center p-4 relative overflow-hidden dark">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-soc-blue/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-soc-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-soc-blue via-soc-purple to-soc-blue"></div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-soc-blue/10 rounded-2xl flex items-center justify-center mb-4 neon-border-blue relative">
              <div className="absolute inset-0 bg-soc-blue/20 blur-md rounded-2xl"></div>
              <ShieldCheck className="w-8 h-8 text-soc-blue relative z-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-soc-text to-soc-muted">CyberSOC</h1>
            <p className="text-soc-muted mt-2 font-mono text-xs tracking-widest uppercase">Secure Authentication</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-soc-red/10 border border-soc-red/30 rounded-xl flex items-center gap-3 text-soc-red text-sm shadow-[0_0_10px_rgba(239,68,68,0.1)]"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-bold text-soc-muted uppercase tracking-widest mb-2 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-soc-muted group-focus-within:text-soc-blue transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-soc-surface/50 border border-soc-border/50 rounded-xl py-3.5 pl-12 pr-4 text-soc-text focus:outline-none focus:border-soc-blue/50 focus:ring-1 focus:ring-soc-blue/50 transition-all"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-soc-muted uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-soc-muted group-focus-within:text-soc-blue transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-soc-surface/50 border border-soc-border/50 rounded-xl py-3.5 pl-12 pr-4 text-soc-text focus:outline-none focus:border-soc-blue/50 focus:ring-1 focus:ring-soc-blue/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-soc-blue text-white font-bold rounded-xl hover:bg-soc-blue/90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(14,165,233,0.4)] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Initialize Session
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-soc-border/30 text-center">
            <p className="text-xs text-soc-muted">
              Default credentials: <span className="text-soc-text font-mono">admin / admin123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-soc-muted mt-8 uppercase tracking-widest">
          Authorized Personnel Only • System Monitored
        </p>
      </motion.div>
    </div>
  );
}
