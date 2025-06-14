import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  SafeAreaView,
} from "react-native";
// import { Ionicons } from "@expo/vector-icons"; // Ajout de l'import

export default function WelcomeScreen({ navigation }) {
  const Container = Platform.OS === "ios" ? View : SafeAreaView;
  return (
    <Container style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Image
            source={require("../assets/smalllogo.webp")} // remplace par le bon chemin vers ton logo
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Kilishi d'origine</Text>
        <Text style={styles.subtitle}>
          Commandez le meilleur Kilishi de la ville, directement depuis votre
          smartphone.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Signin")}
      >
        <Text style={styles.buttonText}>Commencer</Text>
      </TouchableOpacity>
      {/* <View style={styles.circle} />  */}
      {/* <View style={styles.smallCircle} />  */}
      <View style={styles.bottomRCircle} />
      <View style={styles.bottomLCircle} />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa", // fond vert
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 60,
    overflow: "hidden",
  },
  logoContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 150,
  },
  logoCircle: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 0,
    marginBottom: 40,
    borderColor: "red",
    borderWidth: 2,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: Platform.OS === "android" ? 50 : 60,
    color: "red",
    marginBottom: 5,
    fontFamily: "Sacramento",
  },
  subtitle: {
    fontSize: Platform.OS === "ios" ? 16 : 16,
    fontWeight: "400",
    color: "#333",
    textAlign: "center",
    fontFamily: "PoppinsRegular",
  },
  button: {
    backgroundColor: "red",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    // position: "absolute",
    zIndex: 1,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 60,
    fontFamily: "PoppinsBold",
  },

  circle: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(107, 107, 107, 0.2)",
    top: -50,
    left: -50,
  },
  smallCircle: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 75,
    backgroundColor: "rgba(93, 90, 90, 0.2)",
    top: 60,
    right: 30,
  },

  bottomLCircle: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 75,
    backgroundColor: "rgba(248, 146, 146, 0.2)",
    bottom: -70,
    left: -10,
  },
  bottomRCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 205,
    backgroundColor: "rgba(248, 166, 166, 0.2)",
    bottom: -80,
    right: -60,
  },
});
