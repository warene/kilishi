import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PhoneInput from "react-native-phone-number-input";
import OtpInput from "./components/OtpInput";

export default function SigninScreen({ onSignin }) {
  const Container = Platform.OS === "ios" ? View : SafeAreaView;
  const [nom, setNom] = useState("");
  const [confirm, setConfirm] = useState(0);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("red");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(""); // Ajoute cet état

  const [value, setValue] = useState("");
  const [formattedValue, setFormattedValue] = useState("");
  const phoneInput = useRef(null);
  const NGROK_URL = "https://kilishi.alwaysdata.net";

  const handleNext = async () => {
    // const response = await fetch(`${NGROK_URL}/api/sendcode`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    // });
    // const data = await response.json();
    // if (response.ok) {
    //   await AsyncStorage.setItem("token", data.token);
    //   onSignin();
    // } else {
    //   setMessage("Erreur lors de l'inscription");
    //   setMessageColor("red");
    // }
    setErrors({});
    setMessage("");

    if (confirm === 0) {
      // Vérification téléphone
      if (!value.trim()) {
        setErrors({ phone: "Le numéro de téléphone est requis." });
        return;
      }
      if (!phoneInput.current?.isValidNumber(value)) {
        setErrors({ phone: "Format de numéro de téléphone incorrect." });
        return;
      }
      setConfirm(1); // Passe à l'étape OTP
      return;
    }

    if (confirm === 1) {
      // Vérification OTP
      if (!otp || otp.length !== 6) {
        setErrors({ otpx: "Le code OTP doit contenir 6 chiffres." });
        return;
      }
      setConfirm(2); // Passe à l'étape nom
      return;
    }

    if (confirm === 2) {
      // Vérification nom puis appel API
      if (!nom.trim()) {
        setErrors({ nom: "Le nom est requis." });
        return;
      }
      // Appel API ici
      setIsLoading(true);
      // console.log(nom, formattedValue, otp);

      try {
        const response = await fetch(`${NGROK_URL}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: nom,
            telephone: formattedValue,
            // otp: otp,
          }),
        });
        const data = await response.json();
        // console.log(data);
        if (response.ok) {
          await AsyncStorage.setItem("token", data.token);
          onSignin();
        } else {
          setMessage("Erreur lors de l'inscription");
          setMessageColor("red");
        }
      } catch (error) {
        setMessage("Erreur de réseau : " + data.msgsystem);
        setMessageColor("red");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Container style={styles.container}>
        {Platform.OS === "ios" && <StatusBar barStyle="dark-content" />}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <Image
                  source={require("../assets/smalllogo.webp")}
                  style={styles.logo}
                />
              </View>
              <Text style={styles.title}>Kilishi d'origine</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Rejoindre la communauté</Text>

              {message !== "" && (
                <Text
                  style={{
                    color: messageColor,
                    marginBottom: 10,
                    textAlign: "center",
                  }}
                >
                  {message}
                </Text>
              )}

              {confirm === 1 ? (
                <>
                  <OtpInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onSubmit={(code) => setOtp(code)}
                  />
                  {errors.otpx && (
                    <Text style={styles.error}>{errors.otpx}</Text>
                  )}
                </>
              ) : confirm === 2 ? (
                <>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color="#888"
                      style={styles.icon}
                    />
                    <TextInput
                      placeholder="Nom d'utilisateur"
                      placeholderTextColor="#aaa"
                      style={styles.input}
                      keyboardType="default"
                      onChangeText={setNom}
                      value={nom}
                    />
                  </View>
                  {errors.nom && <Text style={styles.error}>{errors.nom}</Text>}
                </>
              ) : (
                <>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color="#888"
                      style={styles.icon}
                    />
                    <PhoneInput
                      ref={phoneInput}
                      defaultValue={value}
                      layout="second" // 'first' pour le drapeau/code avant l'input, 'second' pour l'input avant
                      onChangeText={(text) => {
                        setValue(text);
                      }}
                      onChangeFormattedText={(text) => {
                        setFormattedValue(text);
                      }}
                      placeholder="Numéro (Whatsapp)"
                      //   withLightTheme // Si vous avez un thème sombre
                      defaultCode="CM" // Code du pays par défaut
                      //   withShadow // Ajoute une ombre
                      //   autoFocus // Focus automatique sur l'input au chargement
                      containerStyle={styles.phoneInputContainer}
                      textContainerStyle={styles.phoneTextContainer} // Style pour le conteneur du texte et du code pays
                      textInputStyle={styles.textInput}
                      codeTextStyle={styles.codeText}
                      flagButtonStyle={styles.flagButton}
                    />
                  </View>
                  {errors.phone && (
                    <Text style={styles.error}>{errors.phone}</Text>
                  )}
                </>
              )}

              <TouchableOpacity
                style={styles.button}
                onPress={handleNext}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {confirm === 2 ? "Rejoindre maintenant" : "Suivant"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={styles.circle} />
        <View style={styles.smallCircle} />
        <View style={styles.bottomRCircle} />
        <View style={styles.bottomLCircle} />
      </Container>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "left",
    width: "100%",
    overflow: "hidden",
  },
  phoneInputContainer: {
    width: "90%",
    backgroundColor: "#f2f2f2",
    flex: 1,
  },
  phoneTextContainer: {
    // Style pour la partie contenant le code pays et le champ de saisie
    backgroundColor: "#f2f2f2", // Doit correspondre à phoneInputContainer pour l'uniformité
    borderRadius: 8, // Assortir les coins arrondis pour l'intérieur aussi
    paddingVertical: 0, // Enlever le padding vertical par défaut de la bibliothèque si besoin
    // paddingHorizontal: 5, // Ajustez si vous voulez un padding interne minimal
  },
  textInput: {
    fontSize: 16,
    color: "#333",
    height: 45,
    fontFamily: "PoppinsRegular",
  },
  codeText: {
    fontSize: 16,
    color: "#333",
  },

  flagButton: {
    width: 70,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  header: { alignItems: "center", marginTop: 60 },
  logoCircle: {
    backgroundColor: "white",
    borderRadius: 30,
    padding: 0,
    marginBottom: 40,
    marginTop: 50,
    borderColor: "red",
    borderWidth: 2,
  },
  logo: { width: 100, height: 100 },
  title: {
    fontSize: 50,
    color: "red",
    fontFamily: "Sacramento",
  },
  formContainer: {
    marginTop: 3,
    backgroundColor: "#fafafa",
    width: "100%",
    borderRadius: 20,
    padding: 30,
    flex: 1,
  },
  formTitle: {
    fontSize: 23,
    marginBottom: 30,
    alignSelf: "center",
    fontFamily: "PoppinsRegular",
  },
  inputBox: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    fontFamily: "PoppinsRegular",
    fontSize: Platform.OS === "android" ? 16 : 16,
  },
  button: {
    backgroundColor: "red",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "PoppinsBold",
  },
  footerText: {
    textAlign: "center",
    color: "#333",
    fontFamily: "Lexend",
  },

  circle: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(248, 166, 166, 0.2)",
    top: -50,
    left: -50,
  },

  smallCircle: {
    position: "absolute",
    width: 120,
    height: 130,
    borderRadius: 35,
    backgroundColor: "rgba(248, 166, 166, 0.2)",
    top: -60,
    right: -10,
    transform: [{ rotate: "-30deg" }],
  },

  bottomLCircle: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 75,
    backgroundColor: "rgba(248, 166, 166, 0.2)",
    bottom: 60,
    left: 30,
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
  error: {
    color: "red",
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
    fontFamily: "PoppinsRegular",
    fontSize: 13,
  },
});
