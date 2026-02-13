import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';


const Dashboard = () => {
  
    const {user} = useAuth();
    const [allInfo,setAllInfo] = useState({ categories: [], cities: [] });
    const [loading, setLoading] = useState(true);
    
    //altura e largura do chart
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const chartWidth = screenWidth;         // Largura total
    const chartHeight = screenHeight / 3;
    
    //paleta de cores temporária
    const CHART_COLORS = ["#f39c12", "#e74c3c", "#8e44ad", "#3498db", "#2ecc71", "#34495e"];

    //hook para descobrir tamanho das abas
    const tabBarHeight = useBottomTabBarHeight();

    const fetchAllInfo = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_URL}/dashboard`, {
            method: 'GET', 
            headers: { 
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          }
          });
        if (response.ok) {
            const data = await response.json();
            setAllInfo(data);
            console.log(data)
          } else {
            console.error("Erro na resposta:", response.status);
          }
        } catch (error) {
          Alert.alert("Erro", "Não foi possível carregar os pedidos.");
        } finally {
          setLoading(false);
        }
      };  
  
      useEffect(() => { if (user?.token) fetchAllInfo(); }, [user?.token]);
  
    

      //função para formatar os dados recebidos da API
      //{"categories": [{"_id": "x", "total": x}], "cities": [{"_id": "x", "total": x}]}
      const formatData = (dataArray: any[]) => {

        return(dataArray.map((item,index) =>({

          name: item._id,
          population: item.total,
          color: CHART_COLORS[index % CHART_COLORS.length],
          legendFontColor: "#7F7F7F",
          legendFontSize: 12
        }      
      )))

        

      }
  
        
  
          if(loading){
            return(<ActivityIndicator size="large" color="#3498db" ></ActivityIndicator>)
          }else{
            return(

                <ScrollView style={{marginBottom: tabBarHeight}} >

                  {/* --- GRÁFICO 1: Utilizadores por Cidade --- */}
                  <Text className='ml-auto mr-auto text-xl'>Utilizadores por cidade</Text>
                  <View>
                  <PieChart
                  data={formatData(allInfo.cities)}
                  chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  width={chartWidth}
                  height={chartHeight}
                  paddingLeft='0'
                  center={[chartWidth / 4, 0]}
                  hasLegend={false}
                  />
                  {formatData(allInfo.cities).map((item,index) =>(
                    <View key={index} className='flex-row row-auto'>
                      <View className='rounded-full mr-10 w-6 h-6' style={{backgroundColor: item.color}}/>
                      <Text className='flex-1 color-black text-sm' >
                        {item.name} ({item.population})
                      </Text>
                    </View>
                  ))}
                  </View>
                
                  {/* --- GRÁFICO 2: Tipo de negócios --- */}
                  <Text className='ml-auto mr-auto text-xl'>Negócios por categorias</Text>
                  <PieChart
                  data={formatData(allInfo.categories)}
                  chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  width={chartWidth}
                  height={chartHeight}
                  paddingLeft='0'
                  center={[chartWidth / 4, 0]}
                  hasLegend={false}
                  />
                  {formatData(allInfo.categories).map((item,index) =>(
                    <View key={index} className='flex-row row-auto'>
                      <View className='rounded-full mr-10 w-6 h-6' style={{backgroundColor: item.color}}/>
                      <Text className='flex-1 color-black text-sm' >
                        {item.name} ({item.population})
                      </Text>
                    </View>
                  ))}
                </ScrollView>

  

            )
          }

           
          
}

export default Dashboard

const styles = StyleSheet.create({})