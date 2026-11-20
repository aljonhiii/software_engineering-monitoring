let io = null;

export function initSocket(serverInstance) {
  io = serverInstance;

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.IO] Client connected: ${socket.id}`);

    // Mobile app registers as an owner room: { ownerId: 'USR-001-OWNER' }
    socket.on('owner:register', ({ ownerId } = {}) => {
      if (ownerId) {
        const room = `owner:${ownerId}`;
        socket.join(room);
        console.log(`🔌 [Socket.IO] Socket ${socket.id} joined owner room: ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocket() {
  return io;
}

/**
 * Emit a transaction event to a specific owner room, then broadcast globally.
 * Pass ownerId to target just that owner's room; omit to global-broadcast only.
 */
export function broadcastNewTransaction(transaction, ownerId) {
  if (!io) return;
  console.log(`⚡ [Socket.IO] Broadcasting transaction:new -> ${transaction.order_id || transaction.orderId}`);
  if (ownerId) {
    io.to(`owner:${ownerId}`).emit('transaction:new', transaction);
  }
  // Also emit globally so legacy/admin clients still receive it
  io.emit('transaction:new', transaction);
}

export function broadcastTransactionUpdate(transaction, ownerId) {
  if (!io) return;
  console.log(`⚡ [Socket.IO] Broadcasting transaction:updated -> ${transaction.order_id || transaction.orderId}`);
  if (ownerId) {
    io.to(`owner:${ownerId}`).emit('transaction:updated', transaction);
  }
  io.emit('transaction:updated', transaction);
}

/**
 * Emit machine:status to all owner rooms that own this kiosk, then broadcast globally.
 * ownerIds: array of owner user IDs that own this kiosk.
 */
export function broadcastMachineStatus(kiosk, ownerIds) {
  if (!io) return;
  if (Array.isArray(ownerIds) && ownerIds.length > 0) {
    for (const ownerId of ownerIds) {
      io.to(`owner:${ownerId}`).emit('machine:status', kiosk);
    }
  }
  io.emit('machine:status', kiosk);
}

export function broadcastStatsUpdate(stats) {
  if (io) {
    io.emit('stats:updated', stats);
  }
}

export function broadcastAlert(alert, ownerIds) {
  if (!io) return;
  if (Array.isArray(ownerIds) && ownerIds.length > 0) {
    for (const ownerId of ownerIds) {
      io.to(`owner:${ownerId}`).emit('system:alert', alert);
    }
  }
  io.emit('system:alert', alert);
}
