import { StyleSheet } from 'react-native'
import React from 'react'
import Dashboard from '../components/dashboard';
import { SafeAreaView } from 'react-native-safe-area-context';

const dashboardTab = () => {
  
    return(

        <SafeAreaView className='flex-1 justify-center items-center' edges={['top', 'left', 'right']} >

            <Dashboard/>

        </SafeAreaView>
      
    )


}

export default dashboardTab

const styles = StyleSheet.create({})