import React, { useRef, useEffect } from "react";
import { Lock } from "lucide-react";

interface ChangePINDialogProps {
  focusIndex: number; // 0: currentPin, 1: newPin, 2: confirmPin, 3: save, 4: cancel
  currentPin: string;
  newPin: string;
  confirmPin: string;

  setCurrentPin: (value: string) => void;
  setNewPin: (value: string) => void;
  setConfirmPin: (value: string) => void;

  onSave: () => void;
  onClose: () => void;

  error: string;
}

export default function ChangePINDialog({
  focusIndex,
  currentPin,
  newPin,
  confirmPin,
  setCurrentPin,
  setNewPin,
  setConfirmPin,
  onSave,
  onClose,
  error,
}: ChangePINDialogProps) {
  const currentPinRef = useRef<HTMLInputElement>(null);
  const newPinRef = useRef<HTMLInputElement>(null);
  const confirmPinRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Synchronize focus of DOM elements with remote control focus state
  useEffect(() => {
    if (focusIndex === 0) currentPinRef.current?.focus();
    else if (focusIndex === 1) newPinRef.current?.focus();
    else if (focusIndex === 2) confirmPinRef.current?.focus();
    else if (focusIndex === 3) saveRef.current?.focus();
    else if (focusIndex === 4) cancelRef.current?.focus();
  }, [focusIndex]);

  return (
    <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md z-50 flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-[#0C0C0C] border border-white/5 rounded-3xl p-8">

        <div className="flex justify-center mb-5">
          <div className="h-14 w-14 rounded-2xl bg-[#0066FF] flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
        </div>

        <h2 className="text-center text-xl font-bold uppercase">
          Cambiar PIN
        </h2>

        <div className="mt-6 space-y-4">

  <input
    ref={currentPinRef}
    type="password"
    placeholder="PIN actual"
    value={currentPin}
    onChange={(e) => setCurrentPin(e.target.value)}
    className={`w-full rounded-xl bg-[#141414] px-4 py-3 text-white border outline-none text-sm transition-all duration-200 ${
      focusIndex === 0
        ? 'border-[#0066FF] bg-[#141414]/90 shadow-[0_0_15px_rgba(0,102,255,0.2)] scale-[1.02]'
        : 'border-white/5 focus:border-white/10'
    }`}
  />

  <input
    ref={newPinRef}
    type="password"
    placeholder="Nuevo PIN"
    value={newPin}
    onChange={(e) => setNewPin(e.target.value)}
    className={`w-full rounded-xl bg-[#141414] px-4 py-3 text-white border outline-none text-sm transition-all duration-200 ${
      focusIndex === 1
        ? 'border-[#0066FF] bg-[#141414]/90 shadow-[0_0_15px_rgba(0,102,255,0.2)] scale-[1.02]'
        : 'border-white/5 focus:border-white/10'
    }`}
  />

  <input
    ref={confirmPinRef}
    type="password"
    placeholder="Confirmar PIN"
    value={confirmPin}
    onChange={(e) => setConfirmPin(e.target.value)}
    className={`w-full rounded-xl bg-[#141414] px-4 py-3 text-white border outline-none text-sm transition-all duration-200 ${
      focusIndex === 2
        ? 'border-[#0066FF] bg-[#141414]/90 shadow-[0_0_15px_rgba(0,102,255,0.2)] scale-[1.02]'
        : 'border-white/5 focus:border-white/10'
    }`}
  />

  {error && (
    <p className="text-red-400 text-sm">
      {error}
    </p>
  )}

</div>

        <div className="mt-8 flex gap-3">

  <button
    ref={saveRef}
    onClick={onSave}
    className={`flex-1 py-3 rounded-xl font-bold outline-none border transition-all duration-200 ${
      focusIndex === 3
        ? 'bg-[#0066FF] border-[#0066FF] shadow-[0_0_15px_rgba(0,102,255,0.3)] scale-[1.02]'
        : 'bg-[#0066FF] border-transparent'
    }`}
  >
    Guardar PIN
  </button>

  <button
    ref={cancelRef}
    onClick={onClose}
    className={`flex-1 py-3 rounded-xl font-bold outline-none border transition-all duration-200 ${
      focusIndex === 4
        ? 'bg-[#141414] border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-[1.02]'
        : 'bg-[#141414] border-white/5'
    }`}
  >
    Cancelar
  </button>

</div>

      </div>

    </div>
  );
}