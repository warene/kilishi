import React, { useCallback, useState } from "react";
import { Platform, SafeAreaView } from "react-native";
import { useFonts } from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "./screens/WelcomeScreen";
import SigninScreen from "./screens/SigninScreen";
import HomeScreen from "./screens/HomeScreen";
import NewProductScreen from "./screens/NewProductScreen";
import CartScreen from "./screens/CartScreen";
import CommandeScreen from "./screens/CommandeScreen";
import ProfilScreen from "./screens/ProfilScreen";
import UsersScreen from "./screens/UsersScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Sacramento: require("./assets/fonts/Sacramento-Regular.ttf"),
    PoppinsRegular: require("./assets/fonts/Poppins-Regular.ttf"),
    PoppinsBold: require("./assets/fonts/Poppins-Bold.ttf"),
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const onLayoutRootView = useCallback(async () => {
    // if (fontsLoaded) {
    // await SplashScreen.hideAsync();
    // }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      {isLoggedIn ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="NewProduct" component={NewProductScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Users" component={UsersScreen} />
          <Stack.Screen name="Commande" component={CommandeScreen} />
          <Stack.Screen name="Profil">
            {(props) => <ProfilScreen {...props} onLogout={handleLogout} />}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Signin">
            {(props) => <SigninScreen {...props} onSignin={handleLogin} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
