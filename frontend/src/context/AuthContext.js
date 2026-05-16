// React context that centralizes authentication state and helpers.
//
// Exposes: `user`, `token`, `loading`, `login`, `register`, `logout`.
// The provider persists the access token and user in localStorage so
// sessions survive page refreshes.
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  // Configure axios to always send the token if we have it
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    // If we have a token in local storage on refresh, restore the user session
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, [token]);

  // Login helper: calls backend and persists token + user on success
  const login = async (email, password) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/auth/login', {
        email,
        password,
      });

      const { access_token, user: userData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  };

  // Register helper: calls backend register endpoint and persists session
  const register = async (userData) => {
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/auth/register',
        userData,
      );

      const { access_token, user: newUserData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(newUserData));

      setToken(access_token);
      setUser(newUserData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
      };
    }
  };

  // Logout clears local session and context state
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, loading, login, register, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
