require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const { app, initializeApp } = require('./app');

async function startServer() {
  await initializeApp();

  const server = http.createServer(app);

  // Socket.io инициализация
  const io = new Server(server, {
    cors: {
      origin: true, // Разрешить все origin (для localhost)
      methods: ['GET', 'POST']
    }
  });

  // Глобальный доступ к io в роутах
  app.set('io', io);

  // Socket.io логика
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-channel', (channelId) => {
      socket.join(channelId.toString());
      console.log(`User ${socket.id} joined channel ${channelId}`);
    });

    socket.on('leave-channel', (channelId) => {
      socket.leave(channelId.toString());
      console.log(`User ${socket.id} left channel ${channelId}`);
    });

    socket.on('send-message', async (data) => {
      console.log('[Socket] === SEND MESSAGE ===');
      console.log('[Socket] Received send-message:', data);
      console.log('[Socket] Socket ID:', socket.id);
      console.log('[Socket] Rooms:', Array.from(socket.rooms));

      const { query } = require('./config/database');

      try {
        // Валидация данных
        if (!data.channelId || !data.userId || !data.content) {
          console.error('[Socket] Invalid message data:', data);
          return;
        }

        // Сохранение в БД
        const result = await query(
          'INSERT INTO messages (channel_id, user_id, content, type) VALUES (?, ?, ?, ?)',
          [data.channelId, data.userId, data.content, data.type || 'TEXT']
        );

        console.log('[Socket] Message inserted, ID:', result.insertId);

        const messages = await query(
          'SELECT m.*, u.username as author FROM messages m JOIN users u ON m.user_id = u.id WHERE m.id = ?',
          [result.insertId]
        );

        const message = messages[0];
        console.log('[Socket] Message fetched:', message);

        // Рассылка всем в канале (включая отправителя)
        const roomName = data.channelId.toString();
        console.log('[Socket] Broadcasting to room:', roomName);
        io.to(roomName).emit('new-message', message);
        console.log('[Socket] Message broadcast complete');

        // Отправляем подтверждение отправителю
        socket.emit('message-sent', { success: true, messageId: result.insertId });
      } catch (error) {
        console.error('[Socket] Error sending message:', error);
        socket.emit('message-error', { error: error.message });
      }
    });

    socket.on('delete-message', async (data) => {
      const { query } = require('./config/database');

      try {
        await query('UPDATE messages SET deleted = 1 WHERE id = ?', [data.messageId]);
        io.to(data.channelId.toString()).emit('message-deleted', { messageId: data.messageId });
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  }).on('error', (err) => {
    console.error('Server listen error:', err);
  });
}

startServer().catch(console.error);
