/**
 * Chat Client Module - STL Real-time Chat
 * Полностью рабочий чат с WebSocket подключением
 */
(function() {
  // Состояние приложения
  const state = {
    socket: null,
    currentChannel: null,
    channels: [],
    userId: null,
    userName: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  };

  // DOM элементы
  const elements = {};

  // Инициализация
  window.initChat = function(config) {
    console.log('[Chat] Init start', config);

    state.channels = config.channels || [];
    state.currentChannel = config.currentChannel || null;
    state.userId = config.userId;
    state.userName = config.userName || 'Пользователь';

    init();
  };

  function init() {
    try {
      console.log('[Chat] init() called');
      cacheElements();
      console.log('[Chat] Elements cached:', {
        channelList: !!elements.channelList,
        messages: !!elements.messages,
        form: !!elements.form,
        status: !!elements.status
      });

      // Если нет текущего канала, берем первый
      if (!state.currentChannel || !state.currentChannel.id) {
        if (state.channels.length > 0) {
          state.currentChannel = state.channels[0];
        }
      }

      console.log('[Chat] Channel:', state.currentChannel?.id, 'User:', state.userId);

      // Рендерим каналы
      renderChannelList();
      console.log('[Chat] Channels rendered');

      // Обновляем заголовок
      updateChannelUI();
      console.log('[Chat] UI updated');

      // Подключаем WebSocket
      connectSocket();
      console.log('[Chat] Socket connecting');

      // Загружаем сообщения
      if (state.currentChannel?.id) {
        loadMessages(state.currentChannel.id);
      }

      // Обработчики
      setupEventListeners();
      console.log('[Chat] Event listeners setup');

      console.log('[Chat] Ready');
    } catch (e) {
      console.error('[Chat] init() ERROR:', e.message, e.stack);
    }
  };

  // Кэширование DOM элементов
  function cacheElements() {
    elements.channelList = document.getElementById('channel-list');
    elements.messages = document.getElementById('messages');
    elements.form = document.getElementById('message-form');
    elements.input = document.getElementById('message-input');
    elements.channelName = document.getElementById('channel-name');
    elements.channelDesc = document.getElementById('channel-description');
    elements.status = document.getElementById('connection-status');
  }

  // Подключение к Socket.io
  function connectSocket() {
    if (state.socket) {
      state.socket.removeAllListeners();
      state.socket.disconnect();
    }

    console.log('[Chat] Connecting to WebSocket...');
    console.log('[Chat] Socket.IO config:', { reconnection: true, reconnectionAttempts: state.maxReconnectAttempts });

    // Подключаемся к Socket.io (автоматически определяет текущий хост)
    state.socket = io({
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: state.maxReconnectAttempts,
      transports: ['polling', 'websocket']
    });

    console.log('[Chat] Socket created, waiting for connect...');

    state.socket.on('connect', () => {
      console.log('[Chat] CONNECTED! Socket ID:', state.socket.id);
      state.isConnected = true;
      state.reconnectAttempts = 0;
      updateConnectionStatus(true);

      // Присоединяемся к текущему каналу
      if (state.currentChannel && state.currentChannel.id) {
        state.socket.emit('join-channel', state.currentChannel.id.toString());
        console.log('[Chat] Joined channel:', state.currentChannel.id);
      }
    });

    state.socket.on('disconnect', (reason) => {
      console.log('[Chat] DISCONNECTED:', reason);
      state.isConnected = false;
      updateConnectionStatus(false);
    });

    state.socket.on('connect_error', (error) => {
      console.error('[Chat] CONNECT ERROR:', error.message, error.type);
      state.reconnectAttempts++;
      if (state.reconnectAttempts >= state.maxReconnectAttempts) {
        showError('Не удалось подключиться к чату. Перезагрузите страницу.');
      }
    });

    state.socket.on('reconnect', (attemptNumber) => {
      console.log('[Chat] Reconnected after', attemptNumber, 'attempts');
    });

    state.socket.on('reconnect_error', (error) => {
      console.error('[Chat] Reconnect error:', error);
    });

    // Обработка новых сообщений (включая свои)
    state.socket.on('new-message', (message) => {
      console.log('[Chat] New message received:', message);
      console.log('[Chat] My userId:', state.userId, 'Message user_id:', message.user_id);
      appendMessage(message);
    });

    // Подтверждение отправки сообщения (для отладки)
    state.socket.on('message-sent', (data) => {
      console.log('[Chat] Message sent confirmation:', data);
    });

    // Обработка удаления сообщений
    state.socket.on('message-deleted', (data) => {
      console.log('[Chat] Message deleted:', data.messageId);
      removeMessage(data.messageId);
    });
  }

  // Обновление статуса подключения
  function updateConnectionStatus(connected) {
    if (elements.status) {
      elements.status.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
      elements.status.textContent = connected ? 'Подключено' : 'Нет подключения';
    }
  }

  // Рендеринг списка каналов
  function renderChannelList() {
    if (!elements.channelList || !state.channels.length) return;

    elements.channelList.innerHTML = state.channels.map(channel => `
      <li class="channel-item ${channel.id === state.currentChannel.id ? 'active' : ''}"
          data-channel-id="${channel.id}">
        <span class="channel-name">${escapeHtml(channel.name)}</span>
      </li>
    `).join('');

    // Обработчики кликов
    elements.channelList.querySelectorAll('.channel-item').forEach(item => {
      item.addEventListener('click', function() {
        const channelId = this.dataset.channelId;
        switchChannel(parseInt(channelId));
      });
    });
  }

  // Переключение канала
  function switchChannel(channelId) {
    const channel = state.channels.find(c => c.id === channelId);
    if (!channel || channelId === state.currentChannel.id) return;

    console.log('[Chat] Switching to channel:', channelId);

    // Покидаем старый канал
    if (state.isConnected && state.socket) {
      state.socket.emit('leave-channel', state.currentChannel.id.toString());
    }

    // Обновляем текущий канал
    state.currentChannel = channel;

    // Присоединяемся к новому каналу
    if (state.isConnected && state.socket) {
      state.socket.emit('join-channel', channelId.toString());
    }

    // Обновляем UI
    updateChannelUI();

    // Загружаем сообщения
    loadMessages(channelId);
  }

  // Обновление UI канала
  function updateChannelUI() {
    // Обновляем активный класс в списке
    elements.channelList.querySelectorAll('.channel-item').forEach(item => {
      const channelId = parseInt(item.dataset.channelId);
      item.classList.toggle('active', channelId === state.currentChannel.id);
    });

    // Обновляем заголовок
    if (elements.channelName) {
      elements.channelName.textContent = state.currentChannel.name;
    }
    if (elements.channelDesc) {
      elements.channelDesc.textContent = state.currentChannel.description || '';
    }
  }

  // Загрузка сообщений
  async function loadMessages(channelId) {
    console.log('[Chat] Loading messages for channel:', channelId);

    if (!elements.messages) return;

    elements.messages.innerHTML = '<div class="messages-placeholder">Загрузка сообщений...</div>';

    try {
      const response = await fetch(`/chat/api/${channelId}/messages`);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.messages)) {
        elements.messages.innerHTML = '';
        data.messages.forEach(message => appendMessage(message, false));
        scrollToBottom();
        console.log('[Chat] Loaded', data.messages.length, 'messages');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('[Chat] Error loading messages:', error);
      elements.messages.innerHTML = `
        <div class="messages-placeholder">
          <p>Ошибка загрузки сообщений</p>
          <button class="btn btn-primary" onclick="window.chatRetryLoad(${channelId})">Попробовать снова</button>
        </div>
      `;
    }
  }

  // Повторная загрузка сообщений (для кнопки)
  window.chatRetryLoad = function(channelId) {
    loadMessages(channelId);
  };

  // Настройка обработчиков событий
  function setupEventListeners() {
    if (elements.form) {
      elements.form.addEventListener('submit', handleSendMessage);
    }

    if (elements.input) {
      elements.input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          elements.form.dispatchEvent(new Event('submit'));
        }
      });
    }
  }

  // Отправка сообщения
  function handleSendMessage(e) {
    e.preventDefault();

    console.log('[Chat] handleSendMessage called');

    if (!elements.input) {
      console.error('[Chat] No input element');
      return;
    }

    const content = elements.input.value.trim();
    console.log('[Chat] Message content:', content);

    if (!content) {
      console.warn('[Chat] Empty message');
      return;
    }

    console.log('[Chat] isConnected:', state.isConnected, 'socket:', !!state.socket);
    if (!state.isConnected || !state.socket) {
      console.error('[Chat] Not connected');
      showError('Нет подключения к чату');
      return;
    }

    console.log('[Chat] currentChannel:', state.currentChannel);
    if (!state.currentChannel) {
      console.error('[Chat] No channel selected');
      showError('Канал не выбран');
      return;
    }

    const payload = {
      channelId: state.currentChannel.id,
      userId: state.userId,
      content: content,
      type: 'TEXT'
    };
    console.log('[Chat] Emitting send-message:', payload);

    // Отправляем через WebSocket
    state.socket.emit('send-message', payload);

    // Очищаем поле ввода
    elements.input.value = '';
    elements.input.focus();
    console.log('[Chat] Message sent');
  }

  // Добавление сообщения в UI
  function appendMessage(message, animate = true) {
    if (!elements.messages) return;

    // Удаляем placeholder если есть
    const placeholder = elements.messages.querySelector('.messages-placeholder');
    if (placeholder) placeholder.remove();

    const isOwn = message.user_id === state.userId;

    const messageEl = document.createElement('div');
    messageEl.className = `message ${isOwn ? 'own' : ''}`;
    messageEl.dataset.messageId = message.id;

    const time = formatMessageTime(message.created_at);
    const author = message.author || 'Аноним';
    const content = escapeHtml(message.content);

    messageEl.innerHTML = `
      <span class="message-author">${escapeHtml(author)}</span>
      <span class="message-content">${content.replace(/\n/g, '<br>')}</span>
      <span class="message-time">${time}</span>
    `;

    elements.messages.appendChild(messageEl);

    if (animate) {
      scrollToBottom();
    }
  }

  // Форматирование времени сообщения
  function formatMessageTime(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  }

  // Удаление сообщения
  function removeMessage(messageId) {
    const messageEl = elements.messages.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
      messageEl.classList.add('message-deleted');
      messageEl.innerHTML = '<span class="message-deleted-text">Сообщение удалено</span>';
    }
  }

  // Прокрутка вниз
  function scrollToBottom() {
    if (elements.messages) {
      elements.messages.scrollTop = elements.messages.scrollHeight;
    }
  }

  // Показ ошибки
  function showError(message) {
    console.error('[Chat] Error:', message);
    if (elements.messages) {
      elements.messages.innerHTML = `<div class="messages-placeholder error">${escapeHtml(message)}</div>`;
    }
  }

  // Экранирование HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Публичные методы для отладки
  window.chatDebug = {
    getState: () => state,
    reconnect: () => connectSocket(),
    reloadMessages: () => loadMessages(state.currentChannel.id)
  };

})();
