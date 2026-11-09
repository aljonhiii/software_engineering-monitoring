let io = null;

export function initSocket(serverInstance) {
  io = serverInstance;

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.IO] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocket() {
  return io;
}

export function broadcastNewTransaction(transaction) {
  if (io) {
    console.log(`⚡ [Socket.IO] Broadcasting transaction:new -> ${transaction.order_id || transaction.orderId}`);
    io.emit('transaction:new', transaction);
  }
}

export function broadcastTransactionUpdate(transaction) {
  if (io) {
    console.log(`⚡ [Socket.IO] Broadcasting transaction:updated -> ${transaction.order_id || transaction.orderId}`);
    io.emit('transaction:updated', transaction);
  }
}

export function broadcastMachineStatus(kiosk) {
  if (io) {
    io.emit('machine:status', kiosk);
  }
}

export function broadcastStatsUpdate(stats) {
  if (io) {
    io.emit('stats:updated', stats);
  }
}

export function broadcastAlert(alert) {
  if (io) {
    io.emit('system:alert', alert);
  }
}
