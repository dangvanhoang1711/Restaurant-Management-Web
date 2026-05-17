import { fmtPrice } from '../utils';

export default function ItemDetailModal({ detailModalRef, selectedItem, itemToppings, detailQty, setDetailQty, handleAddToCart }) {
  return (
    <div className="modal fade" ref={detailModalRef} id="itemDetailModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <div className="modal-body pt-2">
            {selectedItem && (
              <>
                <div className="rounded-3 mb-3" style={{background: selectedItem.image_bg, height: 180}} id="itemDetailBanner" />
                <h5 className="fw-bold" id="itemDetailName">{selectedItem.name}</h5>
                {selectedItem.description && (
                  <p className="text-muted small" id="itemDetailDesc">{selectedItem.description}</p>
                )}
                {itemToppings.length > 0 && (
                  <div className="mb-3" id="itemDetailToppings">
                    <label className="form-label fw-medium"><i className="bi bi-plus-circle"></i> Thêm topping</label>
                    <div id="toppingList">
                      {itemToppings.map(t => (
                        <div className="form-check form-check-inline border rounded topping-option" key={t.id} style={{padding:'10px 14px', margin:'0 6px 8px 0'}}>
                          <input className="form-check-input topping-cb" type="checkbox" value={t.id} data-price={t.price} id={`top${t.id}`} />
                          <label className="form-check-label small" htmlFor={`top${t.id}`}>{t.name} <span className="text-brand">+{fmtPrice(t.price)}</span></label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="d-flex align-items-center border rounded">
                    <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => setDetailQty(Math.max(1, detailQty - 1))}><i className="bi bi-dash"></i></button>
                    <span className="px-3 fw-bold" id="itemDetailQty">{detailQty}</span>
                    <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => setDetailQty(detailQty + 1)}><i className="bi bi-plus"></i></button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium small"><i className="bi bi-pencil"></i> Ghi chú</label>
                  <textarea className="form-control form-control-sm" rows="2" id="itemDetailNote" placeholder="Ghi chú cho món..."></textarea>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer border-0 pt-0">
            <button className="btn btn-brand w-100 rounded-pill py-2" onClick={handleAddToCart}>
              <i className="bi bi-cart-plus"></i> Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
