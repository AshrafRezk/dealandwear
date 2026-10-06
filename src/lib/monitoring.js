let sentry = null;
const pending = [];

/** Error monitoring. Off unless VITE_SENTRY_DSN is set (the SDK is only downloaded then); never sends request bodies, tokens or emails. */
export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION,
        sendDefaultPii: false,
        tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_RATE || 0.1),
        beforeSend(event) {
          if (event.request) {
            delete event.request.data;
            delete event.request.cookies;
            if (event.request.headers) {
              delete event.request.headers['X-DW-Token'];
              delete event.request.headers['X-DW-Guest'];
            }
          }
          if (event.user) event.user = { id: event.user.id };
          return event;
        },
      });
      sentry = Sentry;
      pending.splice(0).forEach(([error, context]) => captureError(error, context));
    })
    .catch(() => {});
}

export function captureError(error, context) {
  if (sentry) sentry.captureException(error, context ? { extra: context } : undefined);
  else if (import.meta.env.VITE_SENTRY_DSN && pending.length < 10) pending.push([error, context]);
  else if (import.meta.env.DEV) console.error(error, context);
}
