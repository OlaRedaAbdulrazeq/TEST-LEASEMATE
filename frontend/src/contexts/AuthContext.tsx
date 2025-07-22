'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { io, Socket } from 'socket.io-client';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'landlord' | 'tenant' | 'admin';
  avatarUrl?: string;
  verificationStatus?: {
    status: 'pending' | 'approved' | 'rejected';
    idVerified?: boolean;
    faceMatched?: boolean;
    uploadedIdUrl?: string;
    selfieUrl?: string;
    idData?: {
      name?: string;
      idNumber?: string;
      birthDate?: string;
    };
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  socket: Socket | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null); // ✅ Make socket reactive

  useEffect(() => {
    const storedToken = localStorage.getItem('leasemate_token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken) as any;
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          setToken(storedToken);
          fetchUserData(storedToken);
        } else {
          localStorage.removeItem('leasemate_token');
        }
      } catch (error) {
        localStorage.removeItem('leasemate_token');
      }
    }
    setIsLoading(false);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connectWebSocket = (userId: string) => {
    if (socketRef.current) return;

    socketRef.current = io('https://test-backendleasemate-zeta.vercel.app', {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket connected:', socketRef.current?.id);
      socketRef.current?.emit('join', userId);
      setSocket(socketRef.current); // ✅ Update reactive socket state
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
    });
  };

  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        fetchUserData(token);
      }, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (user && user._id) {
      connectWebSocket(user._id);
    }
  }, [user]);

  const fetchUserData = async (authToken: string) => {
    try {
      const response = await fetch('https://test-backendleasemate-zeta.vercel.app/api/users/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // connectWebSocket(userData._id); // 🧠 Connect after user loads - Moved to useEffect
      } else {
        localStorage.removeItem('leasemate_token');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('leasemate_token');
    }
  };

  const login = (authToken: string, userObj: User) => {
    localStorage.setItem('leasemate_token', authToken);
    setToken(authToken);
    setUser(userObj);
    fetchUserData(authToken);
  };

  const logout = () => {
    localStorage.removeItem('leasemate_token');
    setToken(null);
    setUser(null);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null); // ✅ clear reactive socket
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, socket }}>
      {children}
    </AuthContext.Provider>
  );
};
