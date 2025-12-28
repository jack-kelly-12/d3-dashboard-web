import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Calendar, Trash2 } from "lucide-react";
import Modal from "./Modal";
import { getGradeName } from "../../utils/recruitFormUtils";

const WriteupsViewerModal = ({ isOpen, onClose, writeups = [], playerName = "", onDeleteWriteup }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, index: null });

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : writeups.length - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < writeups.length - 1 ? prev + 1 : 0);
  };

  const handleDeleteClick = (index) => {
    setDeleteConfirm({ isOpen: true, index });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.index !== null && onDeleteWriteup) {
      onDeleteWriteup(deleteConfirm.index);
      if (writeups.length === 1) {
        onClose();
      } else if (currentIndex >= deleteConfirm.index && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (currentIndex >= writeups.length - 1) {
        setCurrentIndex(0);
      }
    }
    setDeleteConfirm({ isOpen: false, index: null });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, index: null });
  };


  const currentWriteup = writeups[currentIndex];

  if (!currentWriteup) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Write-Ups for ${playerName}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevious}
              disabled={writeups.length <= 1}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {currentIndex + 1} of {writeups.length}
            </span>
            <button
              onClick={goToNext}
              disabled={writeups.length <= 1}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{currentWriteup.coachName}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Calendar className="w-4 h-4" />
                {new Date(currentWriteup.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            {onDeleteWriteup && (
              <button
                onClick={() => handleDeleteClick(currentIndex)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete write-up"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {currentWriteup.toolGrades && (currentWriteup.toolGrades.hitting || currentWriteup.toolGrades.power || currentWriteup.toolGrades.running || currentWriteup.toolGrades.fielding || currentWriteup.toolGrades.armStrength) && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tool Grades (20-80 Scale)</h4>
              <div className="flex flex-wrap gap-3">
                {currentWriteup.toolGrades.hitting && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-sm font-bold text-blue-900">{currentWriteup.toolGrades.hitting}</span>
                    <span className="text-xs text-gray-600">Hitting</span>
                    <span className="text-xs text-gray-500">({getGradeName(currentWriteup.toolGrades.hitting)})</span>
                  </div>
                )}
                {currentWriteup.toolGrades.power && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-sm font-bold text-blue-900">{currentWriteup.toolGrades.power}</span>
                    <span className="text-xs text-gray-600">Power</span>
                    <span className="text-xs text-gray-500">({getGradeName(currentWriteup.toolGrades.power)})</span>
                  </div>
                )}
                {currentWriteup.toolGrades.running && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-sm font-bold text-blue-900">{currentWriteup.toolGrades.running}</span>
                    <span className="text-xs text-gray-600">Running</span>
                    <span className="text-xs text-gray-500">({getGradeName(currentWriteup.toolGrades.running)})</span>
                  </div>
                )}
                {currentWriteup.toolGrades.fielding && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-sm font-bold text-blue-900">{currentWriteup.toolGrades.fielding}</span>
                    <span className="text-xs text-gray-600">Fielding</span>
                    <span className="text-xs text-gray-500">({getGradeName(currentWriteup.toolGrades.fielding)})</span>
                  </div>
                )}
                {currentWriteup.toolGrades.armStrength && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-sm font-bold text-blue-900">{currentWriteup.toolGrades.armStrength}</span>
                    <span className="text-xs text-gray-600">Arm</span>
                    <span className="text-xs text-gray-500">({getGradeName(currentWriteup.toolGrades.armStrength)})</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {currentWriteup.content}
            </div>
          </div>
        </div>

        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Write-Up</h3>
              <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this write-up? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {writeups.length > 1 && (
          <div className="flex gap-2 justify-center">
            {writeups.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WriteupsViewerModal;

