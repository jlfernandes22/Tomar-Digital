import React from "react";
import { View, Modal, ScrollView, Image } from "react-native";
import { Surface, Text, useTheme, IconButton, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "./CustomButton";
import { API_URL } from "@/constants/api";

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
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20 
      }}>
        
        <Surface style={{ 
          width: '100%', 
          backgroundColor: theme.colors.surfaceContainerHighest, 
          borderRadius: 24, 
          padding: 20,
          elevation: 10 
        }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Detalhes</Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          <Divider style={{ marginVertical: 10 }} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ paddingVertical: 10 }}>
              
              {/* 1. CORREÇÃO: title -> titulo */}
              <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {String(campaign.titulo || "Sem título")}
              </Text>
              
              {/* 2. CORREÇÃO: description -> descricao */}
              <Text variant="bodyMedium" style={{ marginVertical: 15, color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
                {String(campaign.descricao || "Sem descrição disponível")}
              </Text>

              <Divider style={{ marginVertical: 15 }} />

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
                      backgroundColor: theme.colors.surfaceContainer, 
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: theme.colors.outlineVariant
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        {/* 3. CORREÇÃO: pack.title -> pack.rewardDescription */}
                        <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                          {String(pack.rewardDescription || "Pack " + (index + 1))}
                        </Text>
                        
                        {/* Se tiveres um campo de descrição no pack, ajusta aqui, 
                            senão podes remover este Text de baixo */}
                        <Text variant="bodySmall" style={{ marginTop: 4 }}>
                          Stock: {pack.stock} unidades
                        </Text>
                      </View>
                      
                      {/* 4. CORREÇÃO: pack.price -> pack.pointsCost */}
                      <Text variant="titleMedium" style={{ color: theme.colors.primary, marginLeft: 10 }}>
                        {String(pack.pointsCost || 0)} pts
                      </Text>
                    </View>
                  </Surface>
                ))
              ) : (
                <Text variant="bodySmall" style={{ fontStyle: 'italic' }}>
                  Nenhum pack detalhado nesta campanha.
                </Text>
              )}

            <View style={{width: '50%', flexDirection: 'row', alignItems: 'center' }}>
                
                <Image
                source={{ uri: `${API_URL}/mostrarImagem/${campaign.logo}` }}
                style={{
                  width: '100%', // ou um valor fixo como 200
                  height: 150,    // valor fixo obrigatório
                  borderRadius: 8,
                  marginVertical: 10,
                }}
                resizeMode="contain" // Mantém a proporção da imagem
              />
              <Image
                source={{ uri: `${API_URL}/mostrarImagem/${campaign.logo}` }}
                style={{
                  width: '100%', // ou um valor fixo como 200
                  height: 150,    // valor fixo obrigatório
                  borderRadius: 8,
                  marginVertical: 10,
                }}
                resizeMode="contain" // Mantém a proporção da imagem
              />
          </View> 
          <View style={{ flexDirection: 'row', justifyContent: "space-evenly", alignItems: 'center' }}>
             <Text>Logótipo: </Text>
              <Text>Panfleto: </Text>

          </View>
              {/* 5. CORREÇÃO: expirationDate -> DataExpiracao */}
              <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="labelLarge" style={{ color: theme.colors.error }}>
                  📅 Expira em: {campaign.DataExpiracao ? new Date(campaign.DataExpiracao).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={{ marginTop: 20 }}>
            {/*TEMOS DE FAZER ESTA PARTE AINDA*/}
            <CustomButton  onPress={() => console.log("Aderir", campaign._id)}>
              Aderir à Campanha
            </CustomButton>
          </View>

        </Surface>
      </View>
    </Modal>
  );
};
export default DetalhesCampanha;