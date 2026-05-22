export default function SuccessModal({ successModalRef }) {
  return (
    <div className="modal fade" ref={successModalRef} id="successModal" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content text-center border-0 shadow">
          <div className="modal-body py-4 px-4">
            <div className="success-icon-wrap">
              <i className="bi bi-check-circle-fill success-icon"></i>
            </div>
            <h5 className="fw-bold mb-1">Đặt hàng thành công!</h5>
            <p className="text-muted small mb-3">Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ chuẩn bị sớm nhất!</p>
            <div id="orderSummary" className="text-start bg-brand-subtle rounded p-3 small mb-3 border border-brand border-opacity-10"></div>
            <div id="paymentQR" style={{display:'none'}} className="mb-2">
              <hr />
              <p className="small text-muted mb-2">Quét mã QR để thanh toán chuyển khoản</p>
              <div className="d-flex justify-content-center mb-2">
                <img id="qrImage" src="" alt="QR" className="img-fluid rounded border" style={{maxWidth:180}} />
              </div>
              <div className="small">Số tiền: <strong className="text-brand" id="qrAmount"></strong></div>
              <div className="small">Nội dung: <strong id="qrContent"></strong></div>
            </div>
            <button className="btn btn-brand w-100 mt-2" data-bs-dismiss="modal"><i className="bi bi-check-lg"></i> Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
