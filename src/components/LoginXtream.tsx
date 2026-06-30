import React, { useRef, useEffect } from 'react';
import { Server, User, Key, ArrowLeft, Send, Play } from 'lucide-react';
import { XtreamCredentials } from '../types';

interface LoginXtreamProps {
  fieldIndex: number; // 0: URL, 1: User, 2: Pass, 3: Submit, 4: Back, 5: Demo Mode shortcut
  credentials: XtreamCredentials;
  onChangeCreds: (creds: XtreamCredentials) => void;
  onSubmit: () => void;
  onBack: () => void;
  onLoadDemo: () => void;
  errorMessage: string;
  isLoading: boolean;
}

export default function LoginXtream({
  fieldIndex,
  credentials,
  onChangeCreds,
  onSubmit,
  onBack,
  onLoadDemo,
  errorMessage,
  isLoading
}: LoginXtreamProps) {
  const urlRef = useRef<HTMLInputElement>(null);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const demoRef = useRef<HTMLButtonElement>(null);

  // Synchronize focus of DOM elements with remote control focus state
  useEffect(() => {
    if (isLoading) return;
    
    if (fieldIndex === 0) urlRef.current?.focus();
    else if (fieldIndex === 1) userRef.current?.focus();
    else if (fieldIndex === 2) passRef.current?.focus();
    else if (fieldIndex === 3) submitRef.current?.focus();
    else if (fieldIndex === 4) backRef.current?.focus();
    else if (fieldIndex === 5) demoRef.current?.focus();
  }, [fieldIndex, isLoading]);

  const handleChange = (field: keyof XtreamCredentials, value: string) => {
    onChangeCreds({
      ...credentials,
      [field]: value
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-6 select-none relative">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0066FF]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0066FF]/5 rounded-full blur-3xl" />

      {/* Main Card Container */}
      <div 
        className="w-full max-w-xl bg-[#0C0C0C] backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] relative z-10 transition-all duration-300"
        style={{ transform: 'scale(1.02)' }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-[#0066FF] items-center justify-center shadow-[0_0_20px_rgba(0,102,255,0.4)] mb-4">
            <Server className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight uppercase">Xtream Codes API</h1>
          <p className="text-white/40 text-xs font-mono tracking-wider mt-1 uppercase">INGRESA TUS CREDENCIALES DE ACCESO</p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          
          {/* Server URL */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">URL del Servidor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <Server className="w-4 h-4" />
              </span>
              <input
                ref={urlRef}
                type="text"
                placeholder="Ej. http://iptvserver.xyz:8080"
                value={credentials.url}
                onChange={(e) => handleChange('url', e.target.value)}
                disabled={isLoading}
                className={`w-full bg-[#141414] text-white pl-12 pr-4 py-3.5 rounded-xl border outline-none text-sm transition-all duration-200 placeholder-white/25 ${
                  fieldIndex === 0
                    ? 'border-[#0066FF] bg-[#141414]/90 shadow-[0_0_15px_rgba(0,102,255,0.2)] scale-[1.02]'
                    : 'border-white/5 focus:border-white/10'
                }`}
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">Nombre de Usuario</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <User className="w-4 h-4" />
              </span>
              <input
                ref={userRef}
                type="text"
                placeholder="Tu usuario"
                value={credentials.username}
                onChange={(e) => handleChange('username', e.target.value)}
                disabled={isLoading}
                className={`w-full bg-[#141414] text-white pl-12 pr-4 py-3.5 rounded-xl border outline-none text-sm transition-all duration-200 placeholder-white/25 ${
                  fieldIndex === 1
                    ? 'border-[#0066FF] bg-[#141414]/90 shadow-[0_0_15px_rgba(0,102,255,0.2)] scale-[1.02]'
                    : 'border-white/5 focus:border-white/10'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">Contraseña</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <Key className="w-4 h-4" />
              </span>
              <input
                ref={passRef}
                type="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={isLoading}
                className={`w-full bg-[#141414] text-white pl-12 pr-4 py-3.5 rounded-xl border outline-none text-sm transition-all duration-200 placeholder-white/25 ${
                  fieldIndex === 2
                    ? 'border-[#0066FF] bg-[#141414]/90 shadow-[0_0_15px_rgba(0,102,255,0.2)] scale-[1.02]'
                    : 'border-white/5 focus:border-white/10'
                }`}
              />
            </div>
          </div>

        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
            <p className="font-semibold tracking-wide">{errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          
          {/* Submit Button */}
          <button
            ref={submitRef}
            onClick={onSubmit}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider text-xs px-4 py-3.5 rounded-xl transition-all duration-200 outline-none border ${
              fieldIndex === 3
                ? 'bg-[#0066FF] text-white border-transparent shadow-[0_0_20px_rgba(0,102,255,0.4)] scale-105'
                : 'bg-[#141414] text-white/60 border-white/5 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
          </button>

          {/* Return Button */}
          <button
            ref={backRef}
            onClick={onBack}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider text-xs px-4 py-3.5 rounded-xl transition-all duration-200 outline-none border ${
              fieldIndex === 4
                ? 'bg-white/10 text-white border-white/20 scale-105 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                : 'bg-[#141414] text-white/40 border-white/5 hover:text-white'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

        </div>

        {/* Demo Mode Shortcut Footer */}
        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center">
          <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase mb-3">¿No tienes un servidor IPTV a mano?</p>
          <button
            ref={demoRef}
            onClick={onLoadDemo}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-display font-bold uppercase tracking-widest transition-all duration-200 outline-none border ${
              fieldIndex === 5
                ? 'bg-[#0066FF]/20 text-[#0066FF] border-[#0066FF]/40 shadow-[0_0_15px_rgba(0,102,255,0.3)] scale-105'
                : 'bg-[#141414] text-white/50 border-white/5 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Entrar en Modo Demostración
          </button>
        </div>

      </div>

      {/* Navigation Indicator Legend */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[10px] text-white/30 font-mono tracking-widest uppercase">
        <span className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-[#141414] border border-white/5 rounded font-mono">▲ ▼</span> Mover</span>
        <span className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-[#141414] border border-white/5 rounded font-mono">OK</span> Seleccionar</span>
        <span className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-[#141414] border border-white/5 rounded font-mono">Back</span> Regresar</span>
      </div>

    </div>
  );
}
