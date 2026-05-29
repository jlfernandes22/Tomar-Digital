import React from "react";
import { View, ScrollView, Linking } from "react-native";
import { Text, useTheme, Divider, Surface } from "react-native-paper";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "./CustomButton"; // Mantendo o teu botão costumizado

const TermosCondicoes = () => {
  const theme = useTheme();

  const handleOpenEmail = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView  style={{ flex: 1 }} edges={["top", "left", "right"]}>
        

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* HEADER / TITULO */}
          <View
            style={{
              alignItems: "center",
              paddingVertical: 30,
              paddingHorizontal: 20,
              backgroundColor: theme.colors.secondaryContainer,
            }}
          >
            <Text
              variant="headlineSmall"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              📱 Tomar+Digital
            </Text>
            <Text
              variant="titleMedium"
              style={{
                marginTop: 8,
                color: theme.colors.onSecondaryContainer,
                textAlign: "center",
              }}
            >
              Termos e Condições de Utilização
            </Text>
          </View>

          {/* CONTEÚDO DOS TERMOS */}
          <View style={{ padding: 20, gap: 24 }}>
            
            {/* Introdução */}
            <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
              Estes Termos e Condições (”Termos”) regem o seu uso do
              Tomar+Digital ("Aplicação"), desenvolvido por Ângela Carolina da
              Silva Sebastião e José Luís Fernandes ("Desenvolvedores"). Ao
              baixar, instalar ou usar a Aplicação, concorda em ficar vinculado
              a estes termos. Se não concordar com estes Termos, não use a
              Aplicação.
            </Text>

            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

            {/* Secção: Definições */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.primary }}>
                📚 Definições
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                • <Text style={{ fontWeight: "bold" }}>"Utilizador"</Text> refere-se a qualquer pessoa que baixe, instale ou use a Aplicação.{"\n"}
                • <Text style={{ fontWeight: "bold" }}>"Conteúdo"</Text> refere-se a qualquer texto, imagem, vídeo, áudio ou outra mídia disponível por meio da Aplicação.
              </Text>
            </View>

            {/* Secção: Licença */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.primary }}>
                🎁 Licença
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                Sujeito ao seu cumprimento destes Termos, o Desenvolvedor
                concede-lhe uma licença limitada, não exclusiva e intransferível
                para baixar, instalar e usar a Aplicação para fins pessoais e
                não comerciais.
              </Text>
            </View>

            {/* Secção: Conduta do Utilizador */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.primary }}>
                🔐 Conduta do Utilizador
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                Concorda em não:
              </Text>
              <Surface
                elevation={1}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: theme.colors.surfaceVariant,
                  gap: 8,
                }}
              >
                <Text variant="bodyMedium">• Usar a Aplicação para quaisquer fins ilegais ou fraudulentos.</Text>
                <Text variant="bodyMedium">• Copiar, modificar, adaptar ou criar obras derivadas da Aplicação ou do seu Conteúdo.</Text>
                <Text variant="bodyMedium">• Interferir, interromper ou sobrecarregar a Aplicação ou sua infraestrutura subjacente.</Text>
                <Text variant="bodyMedium">• Tentar obter acesso não autorizado à Aplicação ou a quaisquer sistemas ou redes associados.</Text>
              </Surface>
            </View>

            {/* Secção: Direitos de Propriedade Intelectual */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.primary }}>
                💾 Direitos de Propriedade Intelectual
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                Todos os direitos, títulos e interesses relativos à Aplicação,
                incluindo o seu Conteúdo e quaisquer direitos de propriedade
                intelectual associados, são propriedade exclusiva dos
                Desenvolvedores e dos seus licenciadores. Não pode reproduzir,
                distribuir ou criar obras derivadas da Aplicação ou do seu
                Conteúdo sem a permissão expressa por escrito dos
                Desenvolvedores.
              </Text>
            </View>

            {/* Secção: Aviso Legal */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.error }}>
                🛡️ Aviso Legal
              </Text>
              <Surface
                elevation={0}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.error,
                  backgroundColor: theme.colors.errorContainer,
                }}
              >
                <Text
                  variant="bodyMedium"
                  style={{
                    lineHeight: 22,
                    color: theme.colors.onErrorContainer,
                    fontWeight: "500",
                  }}
                >
                  A APLICAÇÃO É FORNECIDA "NO ESTADO EM QUE SE ENCONTRA" E
                  "CONFORME DISPONÍVEL", SEM GARANTIAS DE QUALQUER TIPO,
                  EXPRESSAS OU IMPLÍCITAS, INCLUINDO, MAS NÃO SE LIMITANDO A,
                  GARANTIAS DE COMERCIABILIDADE, ADEQUAÇÃO A UM FIM ESPECÍFICO
                  E NÃO VIOLAÇÃO DE DIREITOS. OS DESENVOLVEDORES NÃO GARANTEM
                  QUE A APLICAÇÃO SERÁ ININTERRUPTA, LIVRE DE ERROS OU
                  COMPLETAMENTE SEGURA.
                </Text>
              </Surface>
            </View>

            {/* Secção: Limitação de Responsabilidade */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.primary }}>
                ⚖️ Limitação de Responsabilidade
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                Na máxima extensão permitida pela legislação aplicável, os
                desenvolvedores não serão responsáveis por quaisquer danos
                indiretos, incidentais, consequenciais, especiais ou exemplares
                decorrentes do uso da aplicação ou a ela relacionados, mesmo que
                tenha sido avisado da possibilidade de tais danos.
              </Text>
            </View>

            {/* Secção: Lei Aplicável */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.primary }}>
                🌐 Lei Aplicável
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                Estes Termos serão regidos e interpretados de acordo com as leis
                de Portugal, sem levar em consideração os seus princípios de
                conflito de leis.
              </Text>
            </View>

            {/* Secção: Modificações */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.primary }}>
                🔄 Modificações
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                Os desenvolvedores reservam-se ao direito de modificar estes
                Termos a qualquer momento, a seu exclusivo critério. O seu uso
                continuado da aplicação após qualquer modificação constitui a
                sua aceitação dos Termos modificados.
              </Text>
            </View>

            <Divider style={{ backgroundColor: theme.colors.outlineVariant, marginTop: 10 }} />

            {/* Secção: Informações de Contato / BOTÃO */}
            <View style={{ marginTop: 10, marginBottom: 30, gap: 12 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: "bold", color: theme.colors.primary, textAlign: "center" }}
              >
                📩 Informações de Contato
              </Text>
              <Text variant="bodyMedium" style={{ textAlign: "center", lineHeight: 22, paddingHorizontal: 10 }}>
                Caso tenha alguma dúvida ou preocupação sobre estes Termos ou a
                Aplicação, entre em contato com os Desenvolvedores.
              </Text>

              <CustomButton
                onPress={() => handleOpenEmail("mailto:tomardigitalsuporte@gmail.com")}
                icon="email-outline"
              >
                Enviar Email de Suporte
              </CustomButton>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
};

export default TermosCondicoes;