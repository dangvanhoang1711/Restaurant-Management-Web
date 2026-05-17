import { useEffect, useRef } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  const elRef = useRef();

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const bs = new bootstrap.Toast(el, { delay: 3000 });
    bs.show();
    el.addEventListener('hidden.bs.toast', () => onClose?.());
  }, []);

  return (
    <div ref={elRef} className={`toast align-items-center text-bg-${type} border-0`} role="alert">
      <div className="d-flex">
        <div className="toast-body" dangerouslySetInnerHTML={{ __html: message }} />
        <button type="button" className="btn-close me-2 m-auto" data-bs-dismiss="toast" />
      </div>
    </div>
  );
}
