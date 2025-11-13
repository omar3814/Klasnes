import React, { useState } from 'react';
import { XMarkIcon } from './icons/Icons';

interface TermsModalProps {
  onAccept: () => void;
  onCancel: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onAccept, onCancel }) => {
  const [agreed, setAgreed] = useState(false);

  const termsText = `By creating an account on Klasen, you agree that the Admin and the creators of this platform may collect limited data related to your usage and activity within the website. This information is used solely to monitor performance, ensure educational quality, and improve user experience. All data will remain confidential and will never be shared with third parties without your consent. The Admin may access activity records, reports, and interactions for maintenance, safety, and development purposes. By proceeding, you confirm that you understand and accept these terms.

The creators and administrators of this platform are not responsible for any misuse, incorrect data entries, or technical errors caused by user actions. The platform is designed for educational purposes only, and users are responsible for the accuracy and ethics of their own input.`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-scale-in transition-colors">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 id="terms-title" className="text-xl font-bold text-card-foreground">Terms & Conditions</h2>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-muted" aria-label="Close">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-muted-foreground space-y-4">
          <div className="h-64 overflow-y-auto p-4 bg-muted/50 border border-border rounded-lg whitespace-pre-wrap">
            {termsText}
          </div>
          <label htmlFor="terms-agree" className="flex items-center gap-3 cursor-pointer p-2">
            <input
              id="terms-agree"
              type="checkbox"
              checked={agreed}
              onChange={() => setAgreed(!agreed)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-medium text-foreground">I have read and agree to the Terms & Conditions.</span>
          </label>
        </div>
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button onClick={onCancel} className="px-6 py-2.5 text-sm font-semibold bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button
            onClick={onAccept}
            disabled={!agreed}
            className="px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
