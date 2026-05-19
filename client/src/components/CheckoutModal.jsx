import { useState, useEffect } from 'react';
import { fmtPrice, API } from '../utils';
import AddressAutocomplete from './AddressAutocomplete';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CheckoutModal({ checkoutModalRef, checkoutCodeRef, handleSubmitOrder, cartTotal }) {
  const [voucher, setVoucher] = useState('');
  const [voucherMsg, setVoucherMsg] = useState('');
  const [voucherErr, setVoucherErr] = useState('');
  const [discount, setDiscount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);
  const [estimatedFee, setEstimatedFee] = useState(0);
  const [distanceKm, setDistanceKm] = useState(null);

  useEffect(() => {
    fetch(`${API}/settings`).then(r => r.json()).then(j => {
      if (j.success) setDeliveryFee(parseInt(j.data.delivery_fee) || 0);
    });
  }, []);

  useEffect(() => {
    const el = checkoutModalRef.current;
    if (!el) return;
    const handler = () => {
      setVoucher(''); setVoucherMsg(''); setVoucherErr(''); setDiscount(0);
      setDeliveryType('pickup'); setDeliveryLat(null); setDeliveryLng(null);
      setEstimatedFee(0); setDistanceKm(null);
    };
    el.addEventListener('show.bs.modal', handler);
    return () => el.removeEventListener('show.bs.modal', handler);
  }, []);

  useEffect(() => {
    if (deliveryType !== 'ship' || !deliveryLat || !deliveryLng) {
      setEstimatedFee(0);
      setDistanceKm(null);
      return;
    }
    fetch(`${API}/settings`).then(r => r.json()).then(j => {
      if (!j.success) return;
      const rLat = parseFloat(j.data.restaurant_lat) || 16.4663130;
      const rLng = parseFloat(j.data.restaurant_lng) || 107.5996701;
      const baseKm = parseInt(j.data.delivery_base_km) || 3;
      const baseFee = parseInt(j.data.delivery_base_fee) || 12000;
      const extraFee = parseInt(j.data.delivery_extra_fee) || 3000;
      const dist = haversineKm(rLat, rLng, deliveryLat, deliveryLng);
      setDistanceKm(Math.round(dist * 10) / 10);
      const fee = dist <= baseKm ? baseFee : baseFee + Math.ceil(dist - baseKm) * extraFee;
      setEstimatedFee(fee);
    });
  }, [deliveryType, deliveryLat, deliveryLng]);

  function handleAddressCoordinate(coord) {
    if (coord) {
      setDeliveryLat(coord.lat);
      setDeliveryLng(coord.lng);
    } else {
      setDeliveryLat(null);
      setDeliveryLng(null);
      setEstimatedFee(0);
      setDistanceKm(null);
    }
  }

  const finalTotal = cartTotal - discount + (deliveryType === 'ship' ? estimatedFee : 0);

  async function applyVoucher() {
    const code = voucher.trim();
    if (!code) return;
    setApplying(true);
    setVoucherMsg('');
    setVoucherErr('');
    try {
      const r = await fetch(`${API}/vouchers/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, total: cartTotal }),
      });
      const j = await r.json();
      if (j.success) {
        setDiscount(j.data.discount);
        setVoucherMsg(`Giảm ${fmtPrice(j.data.discount)}`);
      } else {
        setDiscount(0);
        setVoucherErr(j.message || 'Mã không hợp lệ');
      }
    } catch {
      setVoucherErr('Lỗi kết nối');
    } finally {
      setApplying(false);
    }
  }

  function removeVoucher() {
    setVoucher('');
    setDiscount(0);
    setVoucherMsg('');
    setVoucherErr('');
  }

  return (
    <div className="modal fade" ref={checkoutModalRef} id="checkoutModal" tabIndex="-1">
      <div className="modal-dialog modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="fw-bold mb-0"><i className="bi bi-receipt"></i> Thanh toán</h6>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <form onSubmit={handleSubmitOrder}>
            <div className="modal-body">
              <input type="hidden" id="checkoutCode" value={checkoutCodeRef.current} />
              <input type="hidden" name="voucherCode" value={voucherMsg ? voucher.trim().toUpperCase() : ''} />
              <div className="mb-2">
                <label className="form-label small fw-medium">Họ tên <span className="text-danger">*</span></label>
                <input type="text" className="form-control form-control-sm" name="customerName" required />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-medium">Số điện thoại <span className="text-danger">*</span></label>
                <input type="tel" className="form-control form-control-sm" name="customerPhone" required />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-medium">Nhận hàng</label>
                  <div className="d-flex gap-3">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="deliveryType" value="pickup" defaultChecked onChange={e => {
                      setDeliveryType('pickup');
                      document.getElementById('addressGroup').style.display = 'none';
                    }} />
                    <label className="form-check-label small">Tại quán</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="deliveryType" value="ship" onChange={e => {
                      setDeliveryType('ship');
                      document.getElementById('addressGroup').style.display = 'block';
                    }} />
                    <label className="form-check-label small">Giao hàng</label>
                  </div>
                </div>
              </div>
              <div className="mb-2" id="addressGroup" style={{display:'none'}}>
                <label className="form-label small fw-medium">Địa chỉ <span className="text-danger">*</span></label>
                <AddressAutocomplete name="customerAddress" required={false} placeholder="Nhập địa chỉ giao hàng..." onCoordinate={handleAddressCoordinate} />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-medium">Thanh toán</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="paymentMethod" value="cod" defaultChecked />
                    <label className="form-check-label small">COD</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="paymentMethod" value="transfer" />
                    <label className="form-check-label small">Chuyển khoản</label>
                  </div>
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label small fw-medium">Mã giảm giá</label>
                <div className="input-group input-group-sm">
                  <input type="text" className="form-control" placeholder="Nhập mã" value={voucher} onChange={e => { setVoucher(e.target.value); setDiscount(0); setVoucherMsg(''); setVoucherErr(''); }} />
                  {voucherMsg ? (
                    <button type="button" className="btn btn-outline-danger" onClick={removeVoucher}><i className="bi bi-x-lg"></i></button>
                  ) : (
                    <button type="button" className="btn btn-brand" onClick={applyVoucher} disabled={applying || !voucher.trim()}>
                      {applying ? '...' : 'Áp dụng'}
                    </button>
                  )}
                </div>
                {voucherMsg && <div className="small text-success mt-1"><i className="bi bi-check-circle"></i> {voucherMsg}</div>}
                {voucherErr && <div className="small text-danger mt-1"><i className="bi bi-exclamation-circle"></i> {voucherErr}</div>}
              </div>
              <div className="mb-2">
                <label className="form-label small fw-medium">Ghi chú</label>
                <textarea className="form-control form-control-sm" name="orderNote" rows="2"></textarea>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between mb-1 small">
                <span>Tạm tính:</span>
                <span>{fmtPrice(cartTotal)}</span>
              </div>
              {deliveryType === 'ship' && distanceKm !== null && (
                <div className="d-flex justify-content-between mb-1 small">
                  <span>Phí giao hàng {distanceKm > 0 && <span className="text-muted">(~{distanceKm}km)</span>}:</span>
                  <span>{fmtPrice(estimatedFee)}</span>
                </div>
              )}
              {deliveryType === 'ship' && distanceKm === null && (
                <div className="mb-1 small text-muted">
                  <i className="bi bi-info-circle"></i> Chọn địa chỉ từ gợi ý để tính phí ship
                </div>
              )}
              {discount > 0 && (
                <div className="d-flex justify-content-between mb-1 small text-success">
                  <span>Giảm giá:</span>
                  <span>-{fmtPrice(discount)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between fw-bold">
                <span>Tổng cộng:</span>
                <span className="text-brand">{fmtPrice(finalTotal)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Hủy</button>
              <button type="submit" className="btn btn-brand btn-sm"><i className="bi bi-check-lg"></i> Đặt hàng</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
