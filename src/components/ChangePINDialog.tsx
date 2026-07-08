import React from "react";
import { Lock } from "lucide-react";

interface ChangePINDialogProps {
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
    type="password"
    placeholder="PIN actual"
    value={currentPin}
    onChange={(e) => setCurrentPin(e.target.value)}
    className="w-full rounded-xl bg-[#141414] px-4 py-3 text-white"
  />

  <input
    type="password"
    placeholder="Nuevo PIN"
    value={newPin}
    onChange={(e) => setNewPin(e.target.value)}
    className="w-full rounded-xl bg-[#141414] px-4 py-3 text-white"
  />

  <input
    type="password"
    placeholder="Confirmar PIN"
    value={confirmPin}
    onChange={(e) => setConfirmPin(e.target.value)}
    className="w-full rounded-xl bg-[#141414] px-4 py-3 text-white"
  />

  {error && (
    <p className="text-red-400 text-sm">
      {error}
    </p>
  )}

</div>

        <div className="mt-8 flex gap-3">

  <button
    onClick={onSave}
    className="flex-1 py-3 rounded-xl bg-[#0066FF] font-bold"
  >
    Guardar PIN
  </button>

  <button
    onClick={onClose}
    className="flex-1 py-3 rounded-xl bg-[#141414] font-bold"
  >
    Cancelar
  </button>

</div>

      </div>

    </div>
  );
}