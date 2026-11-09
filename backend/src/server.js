import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import os from 'os';
import dotenv from 'dotenv';

import { getDbConnection } from './config/db.js';
import { initSocket } from './services/socket.js';

import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import salesRoutes from './routes/sales.routes.js';
import machineRoutes from './routes/machine.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO with permissive CORS for mobile / local development
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Initialize Socket.IO singleton
initSocket(io);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/machine', machineRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'kixcleen-monitoring-backend',
    time: new Date().toISOString(),
  });
});

// Helper for local network IP addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// Start Server
async function startServer() {
  // Try connecting to MariaDB
  await getDbConnection();

  server.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIpAddresses();
    console.log('========================================================');
    console.log(`🚀 KixCleen Monitor Backend API running on port ${PORT}`);
    console.log('--------------------------------------------------------');
    console.log(`📍 Localhost:     http://localhost:${PORT}`);
    ips.forEach((ip) => {
      console.log(`📱 Local Network: http://${ip}:${PORT}`);
    });
    console.log('--------------------------------------------------------');
    console.log('⚡ Socket.IO:     Real-time event broadcasting active');
    console.log('🔐 Auth:          Role-Based Access Control (Owner / Admin)');
    console.log('========================================================');
  });
}

startServer();
