import { StyleSheet } from "react-native";
import React from "react";
import Dashboard from "../components/Dashboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { Surface } from "react-native-paper";

const DashboardTab = () => {
  return (
    <Surface style={{ flex: 1 }}>
      <SafeAreaView
        className="flex-1 justify-center items-center"
        edges={["top", "left", "right"]}
      >
        <Dashboard />
      </SafeAreaView>
    </Surface>
  );
};

export default DashboardTab;

const styles = StyleSheet.create({});
