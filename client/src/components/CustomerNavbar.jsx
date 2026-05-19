export default function CustomerNavbar({ cart, openCart }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top">
      <div className="container">
        <a className="navbar-brand" href="/"><i className="bi bi-shop"></i> Châu Loan</a>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-light btn-sm rounded-pill" data-bs-toggle="modal" data-bs-target="#trackOrderModal"><i className="bi bi-truck"></i> <span className="d-none d-sm-inline">Tra cứu</span></button>
          <div className="cart-btn-wrap">
            <button className="btn btn-outline-light btn-sm rounded-pill" onClick={openCart}>
              <i className="bi bi-cart3"></i> <span className="d-none d-sm-inline">Giỏ hàng</span>
            </button>
            {cart.length > 0 && (
              <span className="cart-badge animate-scale-in">
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
