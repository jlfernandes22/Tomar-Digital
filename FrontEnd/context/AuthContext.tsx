import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  role: string;
  token: string; 
  email: string;
  saldo: number;
  name?: string;
}

interface AuthContextData {
  user: User | null;
  updateUser: (updatedData: Partial<User>) => void;
  login: (
    id: string, 
    role: string, 
    token: string, 
    email: string, 
    saldo: number
  ) => Promise<void>; 
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Definimos a chave como uma constante para não haver erros de escrita
const STORAGE_KEY = 'user_data';

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
const updateUser = (updatedData: Partial<User>) => {
  setUser((prev) => {
    if (!prev) return null;

    // Criamos o novo objeto fundindo o antigo com o novo
    const newUser = { 
      ...prev, 
      ...updatedData,
      // Se o saldo for NaN, ele volta para o saldo anterior ou 0
      saldo: updatedData.saldo !== undefined && !isNaN(Number(updatedData.saldo)) 
             ? Number(updatedData.saldo) 
             : prev.saldo 
    };

    // Usar a chave constante 'user_data'
    SecureStore.setItemAsync('user_data', JSON.stringify(newUser));
    return newUser;
  });
};
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const savedUser = await SecureStore.getItemAsync(STORAGE_KEY);
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData); 
        }
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        setLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const login = async (id: string, role: string, token: string, email: string, saldo: number) => {
    try {
      const userData: User = {
        id,
        role,
        token,
        email,
        saldo: Number(saldo) || 0,
        name: email.split('@')[0] // Atribui um nome logo no login
      };

      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      console.log("Login efetuado com sucesso:", userData);
    } catch (e) {
      console.error("Erro ao guardar login", e);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      setUser(null);
    } catch (e) {
      console.error("Erro no logout:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, updateUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};