import React, { useEffect, useState } from 'react';
import { View, Modal, ScrollView } from 'react-native';
import {
  Surface,
  Text,
  IconButton,
  Divider,
  useTheme,
} from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import CustomButton from './CustomButton';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface DetalhesProps {
  visible: boolean;
  campaign: any;
  onClose: () => void;
}

const DetalhesCampanha = ({ visible, campaign, onClose }: DetalhesProps) => {
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [meusNegocios, setMeusNegocios] = useState<any[]>([]);
  const [negocioSelecionado, setNegocioSelecionado] = useState<string | null>(
    null,
  );
  const { user } = useAuth();
  const theme = useTheme();

  if (!campaign) return null;

  const handleAderir = async () => {
    if (!negocioSelecionado) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/campanhas/aderir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          businessId: negocioSelecionado,
          campaignId: campaign._id,
        }),
      });

      const textoResposta = await response.text(); // Lê como texto primeiro

      if (response.ok) {
        alert('Sucesso!');
        onClose();
      } else {
        alert(textoResposta);
      }
    } catch (error) {
      console.log('Erro capturado no Catch:', error); // ISTO DIZ-NOS O PROBLEMA REAL
      alert('Erro de conexão!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const carregarNegocios = async () => {
      if (!visible || !campaign?.listaCAES) return;

      // Se listaCAES for um array, pega no primeiro elemento. Se for string, usa o valor.
      const caeParaBuscar = Array.isArray(campaign.listaCAES)
        ? campaign.listaCAES[0]
        : campaign.listaCAES;

      try {
        const response = await fetch(
          `${API_URL}/negociosCae?cae=${caeParaBuscar}`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setMeusNegocios(data);
        }
      } catch (error) {
        console.error('Erro:', error);
      }
    };
    carregarNegocios();
  }, [visible, user?.token, campaign.listaCAES]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Surface
          style={{
            width: '100%',
            maxHeight: '100%',
            borderRadius: 24,
            padding: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
              Detalhes
            </Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          <Divider style={{ marginVertical: 10 }} />

          <ScrollView style={{ flexGrow: 0 }}>
            {passo === 1 ? (
              <View>
                <Text variant="titleMedium" style={{ marginBottom: 10 }}>
                  1. Selecione o negócio:
                </Text>
                {meusNegocios.map(negocio => (
                  <View key={negocio._id} style={{ marginBottom: 12 }}>
                    <CustomButton
                      onPress={() => setNegocioSelecionado(negocio._id)}
                      textColor={
                        negocioSelecionado === negocio._id
                          ? '#FFF'
                          : theme.colors.onSurface
                      }
                    >
                      {negocio.name}
                    </CustomButton>
                  </View>
                ))}
                <CustomButton
                  style={{
                    backgroundColor: theme.colors.onBackground,
                    marginTop: 10,
                  }}
                  onPress={() =>
                    negocioSelecionado
                      ? setPasso(2)
                      : alert('Selecione um negócio!')
                  }
                >
                  Continuar
                </CustomButton>
              </View>
            ) : (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Text style={{ textAlign: 'center', marginBottom: 20 }}>
                  Confirma a adesão à campanha "{campaign.titulo}"?
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <CustomButton onPress={() => setPasso(1)}>
                    Voltar
                  </CustomButton>
                  <CustomButton
                    style={{ backgroundColor: theme.colors.onBackground }}
                    onPress={handleAderir}
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? 'A enviar...' : 'Confirmar'}
                  </CustomButton>
                </View>
              </View>
            )}
          </ScrollView>
        </Surface>
      </View>
    </Modal>
  );
};

export default DetalhesCampanha;
