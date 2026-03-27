import React from "react";
import { View, Modal, ScrollView } from "react-native";
import { Surface, Text, useTheme, IconButton, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "./CustomButton";

interface DetalhesProps {
  visible: boolean;
  campaign: any;
  onClose: () => void;
}

const DetalhesCampanha = ({ visible, campaign, onClose }: DetalhesProps) => {
  const theme = useTheme();

  if (!campaign) return null;
return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      transparent={true} 
      onRequestClose={onClose}
    >
      {/* Overlay para escurecer o fundo */}
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20 
      }}>
        
        {/* Janela Principal (Retângulo) */}
        <Surface style={{ 
          width: '100%', 
          backgroundColor: theme.colors.elevation.level3, 
          borderRadius: 24, 
          padding: 20,
          elevation: 10 
        }}>
          
          {/* Header Fixo */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Detalhes</Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          <Divider style={{ marginVertical: 10 }} />

          {/* Área com Scroll para conteúdo longo */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ paddingVertical: 10 }}>
              
              <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {String(campaign.title || "Sem título")}
              </Text>
              
              <Text variant="bodyMedium" style={{ marginVertical: 15, color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
                {String(campaign.description || "Sem descrição disponível")}
              </Text>

              <Divider style={{ marginVertical: 15 }} />

              {/* Listagem de Packs */}
              <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 15 }}>
                Packs Disponíveis:
              </Text>

              {Array.isArray(campaign.packs) && campaign.packs.length > 0 ? (
                campaign.packs.map((pack: any, index: number) => (
                  <Surface 
                    key={index}
                    style={{ 
                      padding: 16, 
                      borderRadius: 12, 
                      backgroundColor: theme.colors.elevation.level1, 
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: theme.colors.outlineVariant
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                          {String(pack.title || "Pack " + (index + 1))}
                        </Text>
                        <Text variant="bodySmall" style={{ marginTop: 4 }}>
                          {String(pack.description || "Sem descrição")}
                        </Text>
                      </View>
                      <Text variant="titleMedium" style={{ color: theme.colors.primary, marginLeft: 10 }}>
                        {String(pack.price || 0)}€
                      </Text>
                    </View>
                  </Surface>
                ))
              ) : (
                <Text variant="bodySmall" style={{ fontStyle: 'italic' }}>
                  Nenhum pack detalhado nesta campanha.
                </Text>
              )}

              {/* Data de Expiração */}
              <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="labelLarge" style={{ color: theme.colors.error }}>
                  📅 Expira em: {campaign.expirationDate ? new Date(campaign.expirationDate).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Fixo */}
          <View style={{ marginTop: 20 }}>
            <CustomButton mode="contained" onPress={() => console.log("Aderir", campaign._id)}>
              Aderir à Campanha
            </CustomButton>
          </View>

        </Surface>
      </View>
    </Modal>
  );
};

export default DetalhesCampanha;