import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileDetails from "../components/ProfileDetails";
import { Surface, useTheme } from "react-native-paper";

const Profile = () => {
  const theme = useTheme();
  return (
    <Surface style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ProfileDetails />
      </SafeAreaView>
    </Surface>
  );
};

export default Profile;
