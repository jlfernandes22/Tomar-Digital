import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext"; 
import { useEffect, useState } from "react";
import { API_URL } from "@/constants/api";
import Dashboard from "../components/dashboard";
import Map from "../components/map"

export default function Index() {

  return (

    <SafeAreaView className="flex-1 justify-center items-center">
      <Map/>
    </SafeAreaView>

  )
  
}
