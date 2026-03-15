import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileDetails from "../components/ProfileDetails";

const profile = () => {
  return (
    <SafeAreaView>
      <ProfileDetails />
    </SafeAreaView>
  );
};

export default profile;
