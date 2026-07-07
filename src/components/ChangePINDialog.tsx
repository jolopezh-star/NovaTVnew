import React from "react";
import { Lock } from "lucide-react";

interface ChangePINDialogProps {
  onClose: () => void;
}

export default function ChangePINDialog({
  onClose,
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

        <p className="text-center text-white/40 text-sm mt-2">
          Esta función estará disponible en el siguiente paso.
        </p>

        <button
          onClick={onClose}
          className="mt-8 w-full py-3 rounded-xl bg-[#0066FF] font-bold"
        >
          Cerrar
        </button>

      </div>

    </div>
  );
}