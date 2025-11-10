// Simplified notifications module using Socket.IO only (SSE removed)
// This module keeps a small shim API: setIo(io), notifyNewMessage(conv), notifyStatusUpdate(id, status)

let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function notifyNewMessage(conversationData) {
  try {
    const payload = {
      type: 'new_message',
      conversation: conversationData,
      timestamp: new Date().toISOString()
    };
    if (ioInstance && typeof ioInstance.emit === 'function') {
      ioInstance.emit('received-message', { response: payload });
      // also emit a lightweight event name for legacy listeners
      ioInstance.emit('message_update', payload);
      // granular event with flattened shape (id, lastMessage, status, timestamp)
      try {
        const flat = {
          id: conversationData?.id || conversationData?.conversationId || conversationData?.client_id,
          lastMessage: conversationData?.last_message || conversationData?.lastMessage || conversationData?.message || conversationData?.content,
          status: conversationData?.status,
          phone: conversationData?.phone || conversationData?.client_name || conversationData?.clientName,
          timestamp: new Date().toISOString()
        };
        ioInstance.emit('new_message', flat);
      } catch (e) {
        console.warn('[Notify] falha ao emitir evento new_message flatten:', e?.message || e);
      }
    } else {
      console.warn('[Notify] Socket.IO not initialized - skipping notifyNewMessage');
    }
  } catch (e) {
    console.error('[Notify] notifyNewMessage error', e && e.message);
  }
}

function notifyStatusUpdate(conversationId, newStatus) {
  try {
    const payload = { type: 'status_update', conversationId, newStatus, timestamp: new Date().toISOString() };
    if (ioInstance && typeof ioInstance.emit === 'function') {
      ioInstance.emit('status_update', payload);
    } else {
      console.warn('[Notify] Socket.IO not initialized - skipping notifyStatusUpdate');
    }
  } catch (e) {
    console.error('[Notify] notifyStatusUpdate error', e && e.message);
  }
}

module.exports = {
  setIo,
  notifyNewMessage,
  notifyStatusUpdate
};



