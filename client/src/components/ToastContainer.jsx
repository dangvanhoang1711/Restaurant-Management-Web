import { useState, useCallback } from 'react';
import Toast from './Toast';

let toastId = 0;

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((html, type = 'light') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, html, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <>
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.html} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
      <WindowToaster addToast={addToast} />
    </>
  );
}

function WindowToaster({ addToast }) {
  if (typeof window !== 'undefined') {
    window.__showToast = addToast;
  }
  return null;
}

export function showToast(html, type) {
  if (window.__showToast) window.__showToast(html, type);
}
