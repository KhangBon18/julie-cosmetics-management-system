import React from 'react';
import ReactDOM from 'react-dom/client';
import { toast } from 'react-toastify';
import App from './App';
import './index.css';

const ADMIN_TOAST_CONTAINER_ID = 'admin-toast-container';
const activeToastIds = new Set();

const getSafeMessageKey = (msg) => {
  if (typeof msg === 'string') return msg.trim();
  if (typeof msg === 'number') return String(msg);
  return 'custom-content';
};

const getCurrentContainerId = (options = {}) => {
  if (options.containerId) return options.containerId;

  const pathname = window.location.pathname || '';
  if (pathname.startsWith('/shop')) return undefined;

  return ADMIN_TOAST_CONTAINER_ID;
};

['error', 'success', 'info', 'warning'].forEach((method) => {
  const original = toast[method];

  toast[method] = (msg, options = {}) => {
    const containerId = getCurrentContainerId(options);
    const messageKey = getSafeMessageKey(msg);
    const toastId = options.toastId || `${containerId || 'default'}:${method}:${messageKey}`;

    if (activeToastIds.has(toastId) || toast.isActive(toastId)) {
      return toastId;
    }

    activeToastIds.add(toastId);

    const originalOnClose = options.onClose;

    return original(msg, {
      ...options,
      containerId,
      toastId,
      onClose: (props) => {
        activeToastIds.delete(toastId);
        originalOnClose?.(props);
      },
    });
  };
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
