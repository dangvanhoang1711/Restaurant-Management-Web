const EventEmitter = require('events');

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

const STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang nấu',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

function notify(event, data) {
  emitter.emit(event, data);
}

function onOrderCreated(order) {
  notify('order:created', order);
}

function onOrderUpdated(order) {
  notify('order:updated', order);
}

module.exports = { emitter, onOrderCreated, onOrderUpdated, STATUS_LABELS };
