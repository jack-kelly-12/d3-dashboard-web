import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const SlideOutPanel = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = "w-[600px]" 
}) => {
  if (!isOpen) return null;

  const panelContent = (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`${width} max-h-[90vh] bg-white rounded-xl shadow-2xl relative transition-all duration-300 ease-in-out`}>
          <div className="flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(panelContent, document.body);
};

export default SlideOutPanel;
