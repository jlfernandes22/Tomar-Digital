import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';


interface AuthContextData {
  user: { id: string, role: string } | null;
  login: (id: string, role: string) => Promise<void>; 
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: any) => {
const [user, setUser] = useState<{ id: string, role: string } | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadStorageData = async () => {
    try {
      // Tenta ir buscar ao SecureStore
      const savedUser = await SecureStore.getItemAsync("userInfo");
      
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser({ id: userData.id , role: userData.role}); 
      }
    } catch (e) {
      console.log("Erro ao carregar dados do SecureStore", e);
    } finally {
      setLoading(false);
    }
  };
  loadStorageData();
}, []);

  const login = async (backendId: string, backendRole: string) => {
    try {

    const userData = {
          id: backendId,
          role: backendRole
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