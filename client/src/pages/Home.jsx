import { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { showToast } from '../components/ToastContainer';
import { API, fmtPrice } from '../utils';
import CustomerNavbar from '../components/CustomerNavbar';
import CategoryNav from '../components/CategoryNav';
import FeaturedItems from '../components/FeaturedItems';
import MenuGrid from '../components/MenuGrid';
import CustomerFooter from '../components/CustomerFooter';
import ItemDetailModal from '../components/ItemDetailModal';
import CartOffcanvas from '../components/CartOffcanvas';
import CheckoutModal from '../components/CheckoutModal';
import SuccessModal from '../components/SuccessModal';
import TrackOrderModal from '../components/TrackOrderModal';

function genCode() {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let r = '';
  for (let i = 0; i < 7; i++) r += c[Math.floor(Math.random() * c.length)];
  return r;
}

export default function Home() {
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailQty, setDetailQty] = useState(1);
  const [itemToppings, setItemToppings] = useState([]);
  const [trackPhone, setTrackPhone] = useState('');
  const [trackData, setTrackData] = useState([]);
  const [trackTimer, setTrackTimer] = useState(null);

  const detailModalRef = useRef();
  const cartOffcanvasRef = useRef();
  const checkoutModalRef = useRef();
  const successModalRef = useRef();
  const checkoutCodeRef = useRef('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/menu`)
      .then(r => r.json())
      .then(j => { if (j.success) setAllItems(j.data); })
      .finally(() => setLoading(false));
  }, []);

  const foodItems = allItems
    .filter(i => i.category !== 'topping' && i.category !== 'douong')
    .filter(i => category === 'all' || category === 'douong' || i.category === category)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const drinkItems = allItems
    .filter(i => i.category === 'douong')
    .filter(i => category === 'all' || category === 'douong')
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const featured = allItems.filter(i => i.category !== 'topping').slice(0, 4);

  function openDetail(item) {
    setSelectedItem(item);
    setDetailQty(1);
    document.querySelectorAll('.topping-cb').forEach(cb => cb.checked = false);
    fetch(`${API}/menu/${item.id}/toppings`)
      .then(r => r.json())
      .then(j => {
        setItemToppings(j.success ? j.data : []);
        if (detailModalRef.current) {
          const modal = new bootstrap.Modal(detailModalRef.current);
          modal.show();
        }
      })
      .catch(() => setItemToppings([]));
  }

  function handleAddToCart() {
    if (!selectedItem) return;
    const tops = document.querySelectorAll('.topping-cb:checked');
    const toppings = Array.from(tops).map(cb => ({
      id: parseInt(cb.value),
      name: cb.nextElementSibling.textContent.trim().split(' +')[0],
      price: parseInt(cb.dataset.price),
    }));
    const note = document.getElementById('itemDetailNote')?.value || '';
    addToCart(selectedItem, detailQty, toppings, note);
    showToast(`<i class="bi bi-check-circle-fill text-success"></i> Đã thêm <strong>${selectedItem.name}</strong> vào giỏ hàng`);
    const modal = bootstrap.Modal.getInstance(detailModalRef.current);
    modal?.hide();
  }

  function openCart() {
    const offcanvas = new bootstrap.Offcanvas(cartOffcanvasRef.current);
    offcanvas.show();
  }

  function openCheckout() {
    checkoutCodeRef.current = genCode();
    const modal = new bootstrap.Modal(checkoutModalRef.current);
    modal.show();
  }

  function handleSubmitOrder(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.customerName.value.trim();
    const phone = form.customerPhone.value.trim();
    const deliveryType = form.deliveryType.value;
    const address = form.customerAddress?.value?.trim() || '';
    const note = form.orderNote?.value?.trim() || '';
    const paymentMethod = form.paymentMethod.value;
    const voucherCode = form.voucherCode?.value?.trim() || '';

    if (deliveryType === 'ship' && !address) {
      showToast('Vui lòng nhập địa chỉ giao hàng');
      return;
    }

    const items = cart.map(i => {
      const topPrice = (i.toppings || []).reduce((s, t) => s + t.price, 0);
      const topStr = (i.toppings || []).map(t => t.name).join(', ');
      return {
        id: i.id,
        name: topStr ? `${i.name} (+${topStr})` : i.name,
        price: i.price + topPrice,
        qty: i.qty,
      };
    });

    fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name, customerPhone: phone, deliveryType,
        address, note, paymentMethod, items, orderCode: checkoutCodeRef.current || undefined, voucherCode,
      }),
    })
      .then(r => r.json())
      .then(j => {
        if (!j.success) { showToast(j.message || 'Đặt hàng thất bại', 'danger'); return; }
        const subtotal = cart.reduce((s, i) => {
          const tt = (i.toppings || []).reduce((t, tp) => t + tp.price, 0);
          return s + (i.price + tt) * i.qty;
        }, 0);
        const discount = j.data.discount || 0;
        const total = j.data.total || subtotal;
        const dLabel = deliveryType === 'ship' ? '🚚 Giao hàng tận nơi' : '🏪 Tại quán';
        const pLabel = paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản';
        const orderItems = cart.map(i => {
          const tt = i.toppings?.length ? ' (+' + i.toppings.map(t => t.name).join(', ') + ')' : '';
          return `${i.name}${tt} x${i.qty} = ${fmtPrice((i.price + (i.toppings||[]).reduce((s,t)=>s+t.price,0)) * i.qty)}`;
        }).join('<br>');
        const orderCode = j.data.orderCode;

        document.getElementById('orderSummary').innerHTML = `
          <div><strong>Mã ĐH:</strong> ${orderCode}</div>
          <div><strong>Khách:</strong> ${name}</div>
          <div><strong>SĐT:</strong> ${phone}</div>
          <div>${dLabel}</div>
          ${deliveryType==='ship' ? `<div><strong>Địa chỉ:</strong> ${address}</div>` : ''}
          ${note ? `<div><strong>Ghi chú:</strong> ${note}</div>` : ''}
          <div><strong>Thanh toán:</strong> ${pLabel}</div>
          <hr class="my-1">
          <div>${orderItems}</div>
          <hr class="my-1">
          ${discount > 0 ? `<div class="d-flex justify-content-between text-success"><span>Giảm giá:</span><span>-${fmtPrice(discount)}</span></div>` : ''}
          <div class="fs-6"><strong>Tổng cộng:</strong> ${fmtPrice(total)}</div>
          <div class="text-success mt-1"><i class="bi bi-clock"></i> Thời gian dự kiến: 20-30 phút</div>
        `;

        if (paymentMethod === 'transfer') {
          try {
            const qrUrl = 'https://img.vietqr.io/image/VCB-1024580716-compact2.jpg?amount=' + j.data.total + '&addInfo=' + orderCode + '&accountName=DANG%20VAN%20HOANG';
            document.getElementById('qrImage').src = qrUrl;
            document.getElementById('qrAmount').textContent = fmtPrice(total);
            document.getElementById('qrContent').textContent = orderCode;
            document.getElementById('paymentQR').style.display = 'block';
          } catch { /* ignore QR error */ }
        } else {
          document.getElementById('paymentQR').style.display = 'none';
        }

        const cm = bootstrap.Modal.getInstance(checkoutModalRef.current);
        cm?.hide();
        clearCart();
        setTimeout(() => {
          const sm = new bootstrap.Modal(successModalRef.current);
          sm.show();
        }, 400);
      })
      .catch(() => showToast('Lỗi kết nối server', 'danger'));
  }

  function handleTrackOrder(e) {
    e.preventDefault();
    const p = e.target.trackPhone.value.trim();
    setTrackPhone(p);
    doTrack(p);
    if (trackTimer) clearInterval(trackTimer);
    const t = setInterval(() => doTrack(p), 10000);
    setTrackTimer(t);
  }

  function doTrack(phone) {
    fetch(`${API}/orders/track?phone=` + encodeURIComponent(phone))
      .then(r => r.json())
      .then(j => { if (j.success) setTrackData(j.data); });
  }

  useEffect(() => {
    return () => { if (trackTimer) clearInterval(trackTimer); };
  }, [trackTimer]);

  function cancelOrder(id) {
    if (!confirm('Hủy đơn hàng này?')) return;
    fetch(`${API}/orders/${id}/cancel`, { method: 'PUT' })
      .then(r => r.json())
      .then(j => {
        if (j.success) { showToast('Đã hủy đơn', 'success'); doTrack(trackPhone); }
        else showToast(j.message, 'danger');
      });
  }

  const statusMap = {
    pending: { label: 'Chờ xác nhận', color: 'warning' },
    confirmed: { label: 'Đã xác nhận', color: 'primary' },
    preparing: { label: 'Đang nấu', color: 'info' },
    completed: { label: 'Hoàn thành', color: 'success' },
    cancelled: { label: 'Đã hủy', color: 'danger' },
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <CustomerNavbar cart={cart} openCart={openCart} />
      <CategoryNav category={category} onCategoryChange={setCategory} search={search} onSearchChange={setSearch} />
      <div className="container py-3 flex-grow-1">
        {featured.length > 0 && category === 'all' && !search && (
          <FeaturedItems featured={featured} onItemClick={openDetail} />
        )}
        {foodItems.length > 0 && (
          <MenuGrid items={foodItems} loading={loading} category={category === 'douong' ? 'all' : category} onItemClick={openDetail} />
        )}
        {(category === 'all' || category === 'douong') && drinkItems.length > 0 && (
          <div className="mt-4">
            <h5 className="fw-bold mb-3">🥤 Đồ uống</h5>
            <div className="row g-3">
              {drinkItems.map(item => (
                <div className="col-lg-3 col-md-4 col-6" key={item.id}>
                  <div className="card border-0 shadow-sm h-100 menu-card" onClick={() => openDetail(item)} style={{cursor:'pointer'}}>
                    <div className="rounded-top" style={{background: item.image_bg, height: 120}} />
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title fw-bold mb-1">{item.name}</h6>
                      <p className="card-text text-muted small flex-grow-1">{item.description}</p>
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <span className="fs-5 fw-bold text-brand">{fmtPrice(item.price)}</span>
                        <button className="btn btn-sm btn-brand rounded-pill" onClick={e => { e.stopPropagation(); openDetail(item); }}>
                          <i className="bi bi-plus-lg"></i> Thêm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <CustomerFooter />
      <CartOffcanvas cartOffcanvasRef={cartOffcanvasRef} cart={cart} updateQty={updateQty} removeFromCart={removeFromCart} cartTotal={cartTotal} openCheckout={openCheckout} />
      <ItemDetailModal detailModalRef={detailModalRef} selectedItem={selectedItem} itemToppings={itemToppings} detailQty={detailQty} setDetailQty={setDetailQty} handleAddToCart={handleAddToCart} />
      <CheckoutModal checkoutModalRef={checkoutModalRef} checkoutCodeRef={checkoutCodeRef} handleSubmitOrder={handleSubmitOrder} cartTotal={cartTotal} />
      <SuccessModal successModalRef={successModalRef} />
      <TrackOrderModal handleTrackOrder={handleTrackOrder} trackData={trackData} trackPhone={trackPhone} cancelOrder={cancelOrder} statusMap={statusMap} />
    </div>
  );
}
