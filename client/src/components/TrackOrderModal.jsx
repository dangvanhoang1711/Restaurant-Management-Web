import { fmtPrice } from '../utils';

export default function TrackOrderModal({ handleTrackOrder, trackData, trackPhone, cancelOrder, statusMap }) {
  return (
    <div className="modal fade" id="trackOrderModal" tabIndex="-1">
      <div className="modal-dialog modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="fw-bold mb-0"><i className="bi bi-truck"></i> Tra cứu đơn hàng</h6>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <form onSubmit={handleTrackOrder} className="d-flex flex-column" style={{maxHeight:'70vh'}}>
            <div className="modal-body" style={{overflowY:'auto', flex:'1 1 auto'}}>
              <div className="input-group mb-3">
                <input type="tel" className="form-control" name="trackPhone" placeholder="Số điện thoại..." required />
                <button className="btn btn-brand" type="submit"><i className="bi bi-search"></i> Tra cứu</button>
              </div>
              {trackData.length === 0 && trackPhone && (
                <p className="text-muted small text-center">Không tìm thấy đơn hàng nào</p>
              )}
              {trackData.map(o => (
                <div className="card border mb-2" key={o.id}>
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold small">#{o.order_code}</div>
                        <div className="text-muted small">{o.customer_name} - {fmtPrice(o.total)}</div>
                        <span className={`badge bg-${statusMap[o.status]?.color || 'secondary'} mt-1`}>
                          {statusMap[o.status]?.label || o.status}
                        </span>
                      </div>
                      {(o.status === 'pending' || o.status === 'confirmed') && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => cancelOrder(o.id)}>
                          <i className="bi bi-x-circle"></i> Hủy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer border-top">
              <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
