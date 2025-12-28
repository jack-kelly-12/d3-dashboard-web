import React from "react";
import Modal from "./Modal";

const WhatsNewModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What's New: D3 Dashboard Updates">
      <div className="space-y-4 text-gray-700">
        <p>
          We just shipped a refreshed layout and expanded data coverage across divisions and seasons. Navigation is cleaner, pages load faster, and charts/tables are easier to work with.
        </p>
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
          <strong>Note about player lists and scouting reports:</strong> we upgraded our internal player ID system. Any existing player lists and scouting reports may not map 1:1 to the new IDs. You may need to re-add players to your lists and reports.
        </div>
        <p>
          Thanks for using the D3 Dashboard — we hope you enjoy the improvements!
        </p>
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsNewModal;





