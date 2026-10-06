import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setSignedOutHandler, storeShopperToken } from '../lib/api';
import { clearShopper, read, write } from '../lib/session';
import { EVENTS, track } from '../lib/analytics';

const AuthContext = createContext(null);
const REFRESH_WITHIN_MS = 24 * 60 * 60 * 1000;

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [contactId, setContactId] = useState(() => {
    const expiresAt = Date.parse(read('tokenExpiresAt') || '');
    if (read('token') && Number.isFinite(expiresAt) && expiresAt < Date.now()) clearShopper();
    return read('token') ? read('contactId') : null;
  });

  const resetIdentity = useCallback(() => {
    queryClient.removeQueries();
  }, [queryClient]);

  const signedOut = useCallback(() => {
    setContactId(null);
    resetIdentity();
  }, [resetIdentity]);

  useEffect(() => {
    setSignedOutHandler(signedOut);
    return () => setSignedOutHandler(() => {});
  }, [signedOut]);

  useEffect(() => {
    const expiresAt = Date.parse(read('tokenExpiresAt') || '');
    if (!read('token') || !Number.isFinite(expiresAt)) return;
    if (expiresAt - Date.now() < REFRESH_WITHIN_MS) {
      api
        .post('auth/refresh')
        .then(storeShopperToken)
        .catch(() => {});
    }
  }, []);

  const signIn = useCallback(
    (data) => {
      storeShopperToken(data);
      write('guest', null);
      write('guestExpiresAt', null);
      setContactId(data.contactId);
      resetIdentity();
    },
    [resetIdentity],
  );

  const login = useCallback(
    async ({ identifier, password }) => {
      const isEmail = identifier.includes('@');
      const data = await api.post('auth/login', isEmail ? { email: identifier.trim(), password } : { mobile: identifier.trim(), password });
      signIn(data);
      track(EVENTS.LOGIN);
      return data;
    },
    [signIn],
  );

  const register = useCallback(
    async (payload) => {
      const data = await api.post('auth/register', payload);
      signIn(data);
      track(EVENTS.SIGNUP_COMPLETE);
      return data;
    },
    [signIn],
  );

  const confirmReset = useCallback(
    async ({ email, token, newPassword }) => {
      const data = await api.post('auth/reset/confirm', { email, token, newPassword });
      signIn(data);
      return data;
    },
    [signIn],
  );

  const logout = useCallback(() => {
    clearShopper();
    signedOut();
  }, [signedOut]);

  const value = useMemo(
    () => ({
      contactId,
      isSignedIn: Boolean(contactId),
      login,
      register,
      logout,
      confirmReset,
      requestReset: (email) => api.post('auth/reset', { email }),
      changePassword: (currentPassword, newPassword) => api.post('auth/password', { currentPassword, newPassword }),
    }),
    [contactId, login, register, logout, confirmReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
