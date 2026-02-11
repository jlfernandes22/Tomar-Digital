import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';


interface AuthContextData {
  user: { id: string } | null;
  login: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: any) => {
  // 1. Voltamos para null por padrão (utilizador deslogado)
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

 // Altera o useEffect do teu AuthContext
useEffect(() => {
  const loadStorageData = async () => {
    try {
      // Tenta ir buscar ao SecureStore
      const jsonValue = await SecureStore.getItemAsync("userInfo");
      
      if (jsonValue) {
        const userData = JSON.parse(jsonValue);
        setUser({ id: userData.id }); // Ou userData.userId, dependendo de como guardaste
      }
    } catch (e) {
      console.log("Erro ao carregar dados do SecureStore", e);
    } finally {
      setLoading(false);
    }
  };
  loadStorageData();
}, []);

  // 2. Esta função será chamada no teu ecrã de Login após o fetch com sucesso
  const login = async (backendId: string) => {
    try {
      await AsyncStorage.setItem('user_id', backendId);
      setUser({ id: backendId });
    } catch (e) {
      console.error("Erro ao guardar login", e);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user_id');
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