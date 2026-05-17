export default function CustomerNavbar({ cart, openCart }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-brand shadow-sm sticky-top">
      <div className="container">
        <a className="navbar-brand fw-bold" href="/"><i className="bi bi-shop"></i> Châu Loan</a>
        <div className="d-flex align-items-center gap-2">
          <a href="/track" className="btn btn-outline-light btn-sm rounded-pill" data-bs-toggle="modal" data-bs-target="#trackOrderModal"><i className="bi bi-truck"></i> Tra cứu</a>
          <button className="btn btn-outline-light btn-sm rounded-pill position-relative" onClick={openCart}>
            <i className="bi bi-cart3"></i> Giỏ hàng
            {cart.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize:10}}>
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
