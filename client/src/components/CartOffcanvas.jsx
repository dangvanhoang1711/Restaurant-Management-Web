import { fmtPrice } from '../utils';

export default function CartOffcanvas({ cartOffcanvasRef, cart, updateQty, removeFromCart, cartTotal, openCheckout }) {
  return (
    <div className="offcanvas offcanvas-end" ref={cartOffcanvasRef} tabIndex="-1" id="cartOffcanvas">
      <div className="offcanvas-header border-bottom">
        <h6 className="fw-bold mb-0"><i className="bi bi-cart3"></i> Giỏ hàng ({cart.length})</h6>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" />
      </div>
      <div className="offcanvas-body">
        {cart.length === 0 ? (
          <div className="text-center py-5 text-muted"><i className="bi bi-cart-x fs-1"></i><p className="mt-2">Giỏ hàng trống</p></div>
        ) : (
          <ul className="list-group list-group-flush">
            {cart.map(i => {
              const tt = (i.toppings || []).reduce((s, t) => s + t.price, 0);
              return (
                <li className="list-group-item px-0" key={i.key}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1 me-2">
                      <div className="fw-medium small">{i.name}</div>
                      {i.toppings?.length > 0 && (
                        <small className="text-muted">+{i.toppings.map(t => t.name).join(', ')}</small>
                      )}
                      {i.note && <div className="text-muted small fst-italic">📝 {i.note}</div>}
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-brand small">{fmtPrice((i.price + tt) * i.qty)}</div>
                      <div className="d-flex align-items-center gap-1 mt-1 justify-content-end">
                        <button className="btn btn-sm btn-outline-secondary py-0 px-1" onClick={() => updateQty(i.key, -1)}><i className="bi bi-dash"></i></button>
                        <span className="small fw-bold">{i.qty}</span>
                        <button className="btn btn-sm btn-outline-secondary py-0 px-1" onClick={() => updateQty(i.key, 1)}><i className="bi bi-plus"></i></button>
                        <button className="btn btn-sm btn-outline-danger py-0 px-1 ms-1" onClick={() => removeFromCart(i.key)}><i className="bi bi-trash"></i></button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {cart.length > 0 && (
        <div className="offcanvas-footer border-top p-3">
          <div className="d-flex justify-content-between mb-2">
            <span className="fw-bold">Tổng cộng:</span>
            <span className="fw-bold text-brand fs-5">{fmtPrice(cartTotal)}</span>
          </div>
          <button className="btn btn-brand w-100" onClick={() => { const oc = bootstrap.Offcanvas.getInstance(cartOffcanvasRef.current); oc?.hide(); openCheckout(); }}>
            <i className="bi bi-credit-card"></i> Thanh toán
          </button>
        </div>
      )}
    </div>
  );
}
