export default function SuccessModal({ successModalRef }) {
  return (
    <div className="modal fade" ref={successModalRef} id="successModal" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content text-center border-0 shadow">
          <div className="modal-body py-4">
            <div className="fs-1 text-success mb-2"><i className="bi bi-check-circle-fill"></i></div>
            <h5 className="fw-bold">Đặt hàng thành công!</h5>
            <p className="text-muted small mb-2">Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ chuẩn bị sớm nhất!</p>
            <div id="orderSummary" className="text-start bg-light rounded p-3 small mb-3"></div>
            <div id="paymentQR" style={{display:'none'}}>
              <hr />
              <p className="small text-muted mb-1">Quét mã QR để thanh toán chuyển khoản</p>
              <img id="qrImage" src="" alt="QR" className="img-fluid rounded border" style={{maxWidth:200}} />
              <div className="mt-2">
                <div className="small">Số tiền: <strong id="qrAmount"></strong></div>
                <div className="small">Nội dung: <strong id="qrContent"></strong></div>
              </div>
            </div>
            <button className="btn btn-brand mt-3" data-bs-dismiss="modal"><i className="bi bi-check-lg"></i> Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
