import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import styles from './Toast.module.css';
import { haptic } from '../lib/feedback';

const ToastContext = createContext({ show: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message, { tone = 'default', action, duration = 4000 } = {}) => {
      const id = nextId.current++;
      if (tone === 'error') haptic('error');
      setToasts((list) => [...list.slice(-2), { id, message, tone, action }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.tone] || ''}`}>
            {t.tone === 'success' ? <Icon name="check" size={16} /> : t.tone === 'error' ? <Icon name="info" size={16} /> : null}
            <span className={styles.message}>{t.message}</span>
            {t.action ? (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  t.action.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
