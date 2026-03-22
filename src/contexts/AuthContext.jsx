/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(localStorage.getItem('X-DW-Token') || null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userToken) {
      localStorage.setItem('X-DW-Token', userToken);
      fetchProfile(userToken);
    } else {
      localStorage.removeItem('X-DW-Token');
      setUserProfile(null);
      setLoading(false);
    }
  }, [userToken]);

  const fetchProfile = async (token) => {
    try {
      const { data } = await axios.get('/api/dw/me', {
        headers: {
          'X-DW-Token': token
        }
      });
      if (data.ok) {
        setUserProfile(data.data);
      } else {
        // Token might be invalid
        setUserToken(null);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setUserToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const { data } = await axios.post('/api/dw/auth/login', credentials);
    if (data.ok && data.data.accessToken) {
      setUserToken(data.data.accessToken);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const register = async (userData) => {
    const { data } = await axios.post('/api/dw/auth/register', userData);
    if (data.ok && data.data.accessToken) {
      setUserToken(data.data.accessToken);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const logout = () => {
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, userProfile, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
