import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Ajout de l'import
import { useRoute, useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
import MapModal from "./components/MapModal";
import * as Haptics from "expo-haptics";
import PhoneInput from "react-native-phone-number-input";
import { Picker } from "@react-native-picker/picker";

export default function UsersScreen({ navigation }) {
  const [nom, setNom] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBtn, setIsLoadingBtn] = useState(false);
  const [valsearch, setValSearch] = useState("");
  const [usersList, setUsersList] = useState([]);
  const NGROK_URL = "https://kilishi.alwaysdata.net"; // Remplacez par votre URL ngrok
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("red");
  const [selectedValue, setSelectedValue] = useState("Yaoundé");

  const [value, setValue] = useState("");
  const [formattedValue, setFormattedValue] = useState("");
  const phoneInput = useRef(null);
  const slideAnim = useRef(new Animated.Value(-200)).current;

  const handlePress = () => {
    const checkValid = phoneInput.current?.isValidNumber(value);
    return checkValid;
  };

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Ouvre la modal et lance l’animation slide up
  const openPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(slideAnim, {
      toValue: 190, // Position finale (à ajuster)
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Ferme la modal avec slide down puis cache la modal
  const closePicker = () => {
    // console.log("ok");
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const validate = () => {
    setMessage("");
    const newErrors = {};
    if (!nom.trim()) {
      newErrors.nom = "Le nom est requis.";
    }

    if (!value.trim()) {
      newErrors.phone = "Le numéro de téléphone est requis.";
    } else {
      const validNumber = handlePress();
      if (!validNumber) {
        newErrors.phone = "Format de numéro de téléphone incorrect.";
      }
    }

    setErrors(newErrors);
    // console.log(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    // console.log("handleRegister");

    if (validate()) {
      setMessage("");
      setMessageColor("red");
      setIsLoadingBtn(true);
      try {
        const response = await fetch(`${NGROK_URL}/api/createadmin`, {
          // remplace IP locale de ton backend
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Assurez-vous que ces champs correspondent à ce que votre API attend
            nom: nom,
            telephone: formattedValue, // ou value, selon le format attendu par l'API
            ville: selectedValue, // ou value, selon le format attendu par l'API
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setMessage("Andministrateur créée !");
          setMessageColor("green");
          setNom("");
          setFormattedValue("");
          setValue("");
          getUsers();
          setTimeout(() => {
            setShowModal(false);
          }, 500);

          // Enregistrer le token dans AsyncStorage
        } else {
          setErrors({ phone: "Ce numéro de téléphone est déjà utilisé." });
        }
      } catch (error) {
        setMessage("Erreur de réseau : Verifiez votre connexion internet");
        setMessageColor("red");
      } finally {
        setIsLoadingBtn(false);
      }
    }
  };

  const handleSearching = (text) => {
    setValSearch(text);
  };

  const filteredUsersList = usersList.filter((user) =>
    user.nom.toLowerCase().includes(valsearch.toLowerCase())
  );

  const getUsers = async () => {
    setIsLoading(true);
    setMessage("");
    setMessageColor("red");
    try {
      const response = await fetch(`${NGROK_URL}/api/getusers`, {
        // remplace IP locale de ton backend
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        setUsersList(data);
      } else {
        Alert.alert("Erreur", "Impossible de charger les utilisateurs.");
      }
    } catch (error) {
      Alert.alert(
        "Oups",
        "Un problème est survenu lors de la recuperation des utilisateurs!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const launchPhoneCall = async (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred", err)
    );
  };

  const launchWhatsApp = async (phoneNumber) => {
    // Assurez-vous que le numéro est au format international sans espaces ni +
    let phone = phoneNumber.replace(/\D/g, "");
    if (phone.startsWith("0")) {
      // Si le numéro commence par 0, ajoutez l'indicatif pays (ex: 237 pour le Cameroun)
      phone = "237" + phone.slice(1);
    }
    const url = `whatsapp://send?phone=${phone}`;
    Linking.openURL(url).catch(() =>
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir WhatsApp. Vérifiez que l'application est installée."
      )
    );
  };

  return (
    <TouchableWithoutFeedback onPress={closePicker}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.flexline}>
            <TouchableOpacity
              style={styles.profilebtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="chevron-back-outline"
                size={27}
                color="#333"
                style={styles.icon}
              />
            </TouchableOpacity>
            <Text style={{ fontSize: 23, fontFamily: "PoppinsBold" }}>
              Utilisateurs
            </Text>
            <View style={styles.inline}>
              <TouchableOpacity
                style={styles.profilebtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowModal(true);
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={23}
                  color="#333"
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {Platform.OS === "ios" && <StatusBar barStyle="dark-content" />}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.body}>
            <View style={{ flex: 1 }}>
              <View style={styles.inputBox}>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color="#888"
                  style={styles.iconx}
                />
                <TextInput
                  placeholder="Rechercher un utilisateur"
                  placeholderTextColor="#aaa"
                  style={styles.input}
                  keyboardType="default"
                  onChangeText={handleSearching}
                  value={valsearch}
                />
              </View>
              {isLoading ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="large" color="red" />
                </View>
              ) : (
                <>
                  {filteredUsersList.length === 0 ? (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: 40,
                      }}
                    >
                      <Ionicons
                        name="people-circle-outline"
                        size={80}
                        color="#ccc"
                      />
                      <Text
                        style={{
                          marginTop: 20,
                          fontSize: 18,
                          color: "#555",
                          fontFamily: "PoppinsRegular",
                        }}
                      >
                        Aucun utilisateur trouvé.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.grid}>
                      {filteredUsersList.map((item) => (
                        <View style={styles.item} key={item.id.toString()}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              width: "70%",
                            }}
                          >
                            <View style={styles.profilebtnx}>
                              {item.photo ? (
                                <Image
                                  source={{
                                    uri: `${NGROK_URL}/${item.photo}`,
                                  }}
                                  style={styles.selectedImagex}
                                />
                              ) : (
                                <Ionicons
                                  name="person"
                                  size={27}
                                  color="#999"
                                  style={styles.icon}
                                />
                              )}
                            </View>
                            <View style={{ marginLeft: 20 }}>
                              <Text
                                style={{
                                  fontFamily: "PoppinsBold",
                                  marginTop: 5,
                                  marginBottom: 0,
                                  fontSize: 18,
                                }}
                              >
                                {item.nom}
                              </Text>
                              <Text
                                style={{
                                  fontFamily: "Poppins",
                                  marginTop: 0,
                                  marginBottom: 0,
                                  fontSize: 13,
                                  color: "#888",
                                  width: "100%",
                                  // backgroundColor: "#f2f2f2",
                                }}
                                numberOfLines={1} // Ajouté: Limite le texte à une seule ligne
                                ellipsizeMode="tail"
                              >
                                {item.telephone}
                              </Text>
                            </View>
                          </View>
                          {item.statut == "admin" ? (
                            <View style={styles.itemprix}>
                              <Text
                                style={{
                                  color: "#18B36A",
                                  fontFamily: "PoppinsBold",
                                  marginLeft: 5,
                                  fontSize: Platform.OS === "ios" ? 13 : 11,
                                }}
                              >
                                {item.statut == "admin" ? "Administrateur" : ""}
                              </Text>
                            </View>
                          ) : (
                            <View style={{ flexDirection: "row" }}>
                              <TouchableOpacity
                                onPress={() => {
                                  launchPhoneCall(item.telephone);
                                }}
                                style={styles.ppbtn}
                              >
                                <Ionicons
                                  name="call"
                                  size={Platform.OS === "ios" ? 18 : 16}
                                  color="#fff"
                                />
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => {
                                  launchWhatsApp(item.telephone);
                                }}
                                style={styles.ppbtnw}
                              >
                                <Ionicons
                                  name="logo-whatsapp"
                                  size={Platform.OS === "ios" ? 18 : 16}
                                  color="#fff"
                                />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              <MapModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                commandId="Nouvel administrateur"
              >
                <ScrollView style={styles.bodmodal}>
                  <View style={{ marginTop: 30 }}>
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
                    <View style={styles.inputBox}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#888"
                        style={styles.iconx}
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
                    {errors.nom && (
                      <Text style={styles.error}>{errors.nom}</Text>
                    )}

                    <View style={styles.inputBox}>
                      <Ionicons
                        name="call-outline"
                        size={20}
                        color="#888"
                        style={styles.iconx}
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

                    <TouchableOpacity
                      style={styles.inputBoxx}
                      onPress={openPicker}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          fontFamily: "poppins",
                          marginLeft: 5,
                        }}
                      >
                        {selectedValue}
                      </Text>
                      <Ionicons
                        name="chevron-down-outline"
                        size={20}
                        color="#000"
                        style={styles.icon}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.button}
                      onPress={handleRegister}
                      disabled={isLoadingBtn}
                    >
                      {isLoadingBtn ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Créer</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                {/* <TouchableWithoutFeedback> */}
                <Animated.View
                  style={[styles.pickerContainer, { bottom: slideAnim }]}
                >
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closePicker}
                  >
                    <Text style={{ fontSize: 20, color: "#007bff" }}>
                      <Ionicons
                        name="close-outline"
                        size={35}
                        color="#555"
                        style={styles.icon}
                      />
                    </Text>
                  </TouchableOpacity>
                  <Picker
                    selectedValue={selectedValue}
                    onValueChange={(itemValue, itemIndex) =>
                      setSelectedValue(itemValue)
                    }
                    style={{
                      height: 190,
                      width: "100%",
                      height: 190,
                      backgroundColor: "white",
                      position: "absolute",
                      bottom: -190,
                      backgroundColor: "#fff",
                      borderTopColor: "#eee",
                      borderTopWidth: 1,
                      overflow: "hidden",

                      paddingHorizontal: 20,
                    }}
                    // dropdownIconColor="#FF0000"
                  >
                    <Picker.Item label="Maroua" value="Maroua" />
                    <Picker.Item label="Ngaoundéré" value="Ngaoundéré" />
                    <Picker.Item label="Yaoundé" value="Yaoundé" />
                  </Picker>
                </Animated.View>
                {/* </TouchableWithoutFeedback> */}
              </MapModal>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  closeButton: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
    width: 40,
    zIndex: 2,
    height: 40,
    backgroundColor: "#eee",
    position: "absolute",
    top: 10,
    right: 10,
  },

  pickerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 5,
  },

  bodmodal: {
    flex: 1,
    padding: 20,
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

  ppbtn: {
    paddingHorizontal: 15,
    height: 40,
    backgroundColor: "#0e50a9",
    borderRadius: 25,
    marginHorizontal: 5,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  ppbtnw: {
    paddingHorizontal: 15,
    height: 40,
    backgroundColor: "#25D366",
    borderRadius: 25,
    marginHorizontal: 5,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  pptext: {
    color: "#FFF",
    fontFamily: "PoppinsBold",
    marginLeft: 5,
  },

  profilebtnx: {
    width: 50,
    height: 50,
    backgroundColor: "#eee",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  selectedImagex: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  imagePicker: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 10,
    // borderWidth: 1,
    // borderColor: "#ddd",
    overflow: "hidden", // Pour que l'image ne dépasse pas si elle est plus grande
  },
  selectedImage: {
    width: "50%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerText: {
    marginTop: 8,
    color: "#555",
    fontSize: 16,
    fontFamily: "PoppinsRegular",
  },

  body: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: 5,
    paddingHorizontal: 20,
  },

  button: {
    backgroundColor: "red",
    paddingVertical: 14,
    marginBottom: 30,
    marginHorizontal: 0,
    // paddingHorizontal: 40,
    borderRadius: 10,
    positional: "absolute",
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 60,
    fontFamily: "PoppinsBold",
  },
  header: {
    width: "100%",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 53,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  flexline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inline: {
    flexDirection: "row",
  },

  profilebtn: {
    width: 40,
    height: 40,
    backgroundColor: "#eee",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  inputBox: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    fontFamily: "PoppinsRegular",
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 20,
    marginTop: 10,
  },

  inputBoxx: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    fontFamily: "PoppinsRegular",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginBottom: 20,
    marginTop: 10,
    height: 45,
  },
  iconx: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    fontFamily: "PoppinsRegular",
    fontSize: 16,
  },

  item: {
    width: "100%",
    paddingVertical: 8,
    // paddingHorizontal: 10,
    textAlign: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  error: {
    color: "red",
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
    fontFamily: "Lexend",
    fontSize: 13,
  },
});
