import { X } from "lucide-react";

const Modal = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/40 z-50 overflow-y-auto">
            <div className="min-h-full flex items-start sm:items-center justify-center p-4 py-8">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-xl my-auto max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto">{children}</div>
                </div>
            </div>
        </div>
    );
};

export default Modal;