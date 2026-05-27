import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-xl flex-shrink-0 ${danger ? 'bg-rose-50 text-rose-500' : 'bg-teal-50 text-teal-600'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="bg-slate-150 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`text-white text-xs font-bold py-2 px-5 rounded-xl cursor-pointer transition-colors ${
                danger 
                  ? 'bg-rose-600 hover:bg-rose-700' 
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
