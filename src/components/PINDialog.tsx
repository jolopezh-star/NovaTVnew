import React, { useEffect } from 'react';
import { Lock, Delete, X } from 'lucide-react';

interface PINDialogProps {
  pinValue: string;
  onPinChange: (val: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  focusedKeypadIndex: number; // 0 to 11 representing: [1,2,3, 4,5,6, 7,8,9, Cancel, 0, Backspace]
  errorMessage: string;
}

export default function PINDialog({
  pinValue,
  onPinChange,
  onSubmit,
  onCancel,
  focusedKeypadIndex,
  errorMessage
}: PINDialogProps) {
  
  const keypadKeys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'Cancelar', '0', 'Borrar'
  ];

  // If PIN reaches 4 digits, automatically submit
  useEffect(() => {
    if (pinValue.length === 4) {
      onSubmit();
    }
  }, [pinValue]);

  const handleKeyPress = (key: string) => {
    if (key === 'Cancelar') {
      onCancel();
    } else if (key === 'Borrar') {
      onPinChange(pinValue.slice(0, -1));
    } else {
      if (pinValue.length < 4) {
        onPinChange(pinValue + key);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none animate-fade-in">
      
      <div className="w-full max-w-sm bg-[#0C0C0C] border border-white/5 rounded-3xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col items-center">
        
        {/* Lock Icon */}
        <div className="h-14 w-14 rounded-2xl bg-[#0066FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,102,255,0.4)] mb-4">
          <Lock className="w-6 h-6 text-white" />
        </div>

        {/* Header */}
        <h2 className="text-lg font-display font-extrabold text-white tracking-tight uppercase">Contenido Protegido</h2>
        <p className="text-white/40 text-xs font-mono tracking-wider text-center mt-1 uppercase">ESTE CANAL REQUIERE PIN PARENTAL</p>

        {/* PIN Circles Indicator */}
        <div className="flex gap-4 my-6">
          {[0, 1, 2, 3].map((idx) => {
            const hasDigit = pinValue.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  hasDigit
                    ? 'bg-[#0066FF] border-[#0066FF] shadow-[0_0_10px_rgba(0,102,255,0.5)] scale-110'
                    : 'border-white/5 bg-[#141414]'
                }`}
              />
            );
          })}
        </div>

        {/* Keypad Grid (4 rows x 3 columns) */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[270px]">
          {keypadKeys.map((key, idx) => {
            const isFocused = focusedKeypadIndex === idx;
            const isSpecial = key === 'Cancelar' || key === 'Borrar';

            return (
              <button
                key={idx}
                onClick={() => handleKeyPress(key)}
                className={`h-14 rounded-xl font-display font-bold flex items-center justify-center transition-all outline-none border ${
                  isFocused
                    ? 'bg-[#0066FF] text-white border-transparent scale-105 shadow-[0_0_12px_rgba(0,102,255,0.4)]'
                    : 'bg-[#141414] text-white/60 border-white/5 hover:text-white hover:bg-white/5'
                } ${isSpecial ? 'text-[10px] uppercase tracking-wider px-1' : 'text-lg'}`}
              >
                {key === 'Borrar' ? <Delete className="w-4 h-4 text-white/40" /> : key}
              </button>
            );
          })}
        </div>

        {/* Keypad Error Message */}
        {errorMessage && (
          <p className="text-red-400 text-[10px] font-mono tracking-wider uppercase text-center mt-4 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
            {errorMessage}
          </p>
        )}

        {/* Keyboard Legend */}
        <div className="mt-6 flex items-center gap-3 text-[10px] text-white/30 font-mono tracking-widest uppercase">
          <span className="flex items-center gap-1"><span className="bg-[#141414] border border-white/5 px-1 py-0.5 rounded font-mono">▲ ▼ ◄ ►</span> Mover</span>
          <span className="flex items-center gap-1"><span className="bg-[#141414] border border-white/5 px-1 py-0.5 rounded font-mono">OK</span> Ingresar</span>
        </div>

      </div>

    </div>
  );
}
