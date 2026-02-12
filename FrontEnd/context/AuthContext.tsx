import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  role: string;
  token: string; 
}

interface AuthContextData {
  user: User | null;
  login: (id: string, role: string, token: string) => Promise<void>; 
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        // Usa a chave correta 'user_data' 
        const savedUser = await SecureStore.getItemAsync("user_data");
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData); 
        }
      } catch (e) {
        console.log("Erro ao carregar dados do SecureStore", e);
      } finally {
        setLoading(false);
      }
    };
    loadStorageData();
  }, []);

  // A função login agora recebe e guarda a info
  const login = async (backendId: string, backendRole: string, backendToken: string) => {
    try {
      const userData = {
        id: backendId,
        role: backendRole,
        token: backendToken 
      };

      await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      console.error("Erro ao guardar login", e);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context || Object.keys(context).length === 0) {
    console.error("ERRO: useAuth foi chamado fora do AuthProvider!");
  }
  return context;
};