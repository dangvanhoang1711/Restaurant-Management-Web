import { fmtPrice } from '../utils';

export default function CartOffcanvas({ cartOffcanvasRef, cart, updateQty, removeFromCart, cartTotal, openCheckout }) {
  return (
    <div className="offcanvas offcanvas-end" ref={cartOffcanvasRef} tabIndex="-1" id="cartOffcanvas">
      <div className="offcanvas-header border-bottom">
        <h6 className="fw-bold mb-0"><i className="bi bi-cart3 text-brand"></i> Giỏ hàng ({cart.length})</h6>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" />
      </div>
      <div className="offcanvas-body p-0">
        {cart.length === 0 ? (
          <div className="text-center py-5 text-muted"><i className="bi bi-cart-x fs-1 d-block mb-2"></i><span>Giỏ hàng trống</span></div>
        ) : (
          <div className="list-group list-group-flush">
            {cart.map(i => {
              const tt = (i.toppings || []).reduce((s, t) => s + t.price, 0);
              return (
                <div className="list-group-item border-bottom px-3 py-3 animate-fade-in-up" key={i.key}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold" style={{fontSize:'0.88rem'}}>{i.name}</div>
                      {i.toppings?.length > 0 && (
                        <small className="text-muted d-block">+ {i.toppings.map(t => t.name).join(', ')}</small>
                      )}
                      {i.note && <small className="text-muted d-block fst-italic mt-1">📝 {i.note}</small>}
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className="fw-bold text-brand">{fmtPrice((i.price + tt) * i.qty)}</div>
                      <div className="d-flex align-items-center gap-1 mt-1 justify-content-end">
                        <button className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-pill" onClick={() => updateQty(i.key, -1)} style={{lineHeight:1}}><i className="bi bi-dash"></i></button>
                        <span className="fw-bold px-1" style={{minWidth:20,textAlign:'center',fontSize:'0.85rem'}}>{i.qty}</span>
                        <button className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-pill" onClick={() => updateQty(i.key, 1)} style={{lineHeight:1}}><i className="bi bi-plus"></i></button>
                        <button className="btn btn-sm btn-ghost text-danger py-0 px-1 ms-1" onClick={() => removeFromCart(i.key)}><i className="bi bi-trash3"></i></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {cart.length > 0 && (
        <div className="border-top px-3 py-3 mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-bold" style={{fontSize:'0.9rem'}}>Tổng cộng:</span>
            <span className="fw-bold text-brand" style={{fontSize:'1.2rem'}}>{fmtPrice(cartTotal)}</span>
          </div>
          <button className="btn btn-brand w-100 py-2" onClick={() => { const oc = bootstrap.Offcanvas.getInstance(cartOffcanvasRef.current); oc?.hide(); openCheckout(); }}>
            <i className="bi bi-credit-card me-1"></i> Thanh toán
          </button>
        </div>
      )}
    </div>
  );
}
