import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Ajout de l'import
import { useRoute, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import MapModal from "./components/MapModal";
import * as Haptics from "expo-haptics";
import PhoneInput from "react-native-phone-number-input";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import { parsePhoneNumber } from "libphonenumber-js";

export default function ProfilScreen({ navigation, onLogout }) {
  const [nom, setNom] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [countryCode, setCountryCode] = useState("CM"); // Par défaut
  const NGROK_URL = "https://kilishi.alwaysdata.net"; // Remplacez par votre URL ngrok

  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [telUtilisateur, setTelUtilisateur] = useState("");
  const [idUtilisateur, setIdUtilisateur] = useState("");
  const [photoUtilisateur, setPhotoUtilisateur] = useState("");

  const [image, setImage] = useState(null);
  const phoneInput = useRef(null);
  const [value, setValue] = useState("");
  const [formattedValue, setFormattedValue] = useState("");
  const [errors, setErrors] = useState({});
  const [decodedx, setDecodedx] = useState({});

  useEffect(() => {
    const chargerUtilisateur = async () => {
      const token = await AsyncStorage.getItem("token");
      //   console.log("Token:", token);

      if (token) {
        try {
          const decoded = jwt_decode(token);
          setDecodedx(decoded);
          loadInfos(decoded);
        } catch (error) {
          console.error("Erreur lors du décodage du token:", error);
        }
      }
    };

    chargerUtilisateur();
  }, []);

  const loadInfos = async (decoded) => {
    const storedUserName = decoded.nom;
    const storedUserTel = decoded.telephone;
    const storedUserId = decoded.user_id;
    const storedUserPhoto = decoded.photo;
    try {
      const phoneNumber = parsePhoneNumber(storedUserTel);
      // console.log("Pays :", phoneNumber.country); // Affiche "CM"
      setCountryCode(phoneNumber.country); // Définit le code du pays
      setValue(phoneNumber.nationalNumber); // Définit le numéro de téléphone formaté
    } catch (error) {
      console.error("Numéro invalide");
    }

    setNomUtilisateur(storedUserName);
    setNom(storedUserName);
    setTelUtilisateur(storedUserTel);
    setIdUtilisateur(storedUserId);
    setFormattedValue(storedUserTel);
    setPhotoUtilisateur(storedUserPhoto);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Oui",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("token"); // Supprimez le token
              await AsyncStorage.removeItem("cart"); // Supprimez le token
              // await AsyncStorage.removeItem('isLoggedIn'); // Ou l'indicateur booléen
              // Alert.alert("Déconnexion", "Vous avez été déconnecté.");
              onLogout(); // Redirigez vers l'écran de connexion
            } catch (error) {
              console.error("Erreur lors de la déconnexion:", error);
              Alert.alert(
                "Erreur",
                "Impossible de se déconnecter. Veuillez réessayer."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handlePress = () => {
    const checkValid = phoneInput.current?.isValidNumber(value);
    return checkValid;
  };

  const validate = () => {
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

  const handleUpdate = async () => {
    if (validate()) {
      setIsLoading(true);
      //   console.log(nom, formattedValue, idUtilisateur);
      try {
        const response = await fetch(`${NGROK_URL}/api/updateuser`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nom,
            telephone: formattedValue,
            user_id: idUtilisateur,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setNomUtilisateur(nom);
          setTelUtilisateur(formattedValue);
          setShowModal(false);
          await AsyncStorage.setItem("token", data.token);
          Alert.alert("Succès", "Profil mis à jour.");
        } else {
          setErrors({ phone: "Ce numéro de téléphone est déjà utilisé." });
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour du profil:", error);
        Alert.alert(
          "Erreur",
          "Impossible de mettre à jour le profil. Veuillez réessayer."
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pickImage = async () => {
    // Demande les permissions (automatique avec expo-image-picker)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Accès à la galerie",
        "Pour choisir une photo pour votre produit, nous avons besoin d'accéder à votre galerie."
      );
      return;
    }

    // Ouvre la galerie
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      updatePhoto(result.assets[0].uri);
    }
  };

  const updatePhoto = async (photo) => {
    // console.log("handleRegister");

    const formData = new FormData();
    formData.append("user_id", idUtilisateur);

    console.log("Image URI:", photo);

    // 'image' est l'URI de l'image sélectionnée
    if (photo) {
      const uriParts = photo.split("/");
      const fileName = uriParts.pop();
      const typeMatch = /\.(\w+)$/.exec(fileName);
      const type = typeMatch ? `image/${typeMatch[1]}` : "image";

      formData.append("photo", {
        uri: photo,
        name: fileName,
        type: type,
      });

      try {
        const response = await fetch(`${NGROK_URL}/api/updatephoto`, {
          // remplace IP locale de ton backend
          method: "PUT",
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          await AsyncStorage.setItem("token", data.token);
          setPhotoUtilisateur(data.photo);
        } else {
          Alert.alert("Erreur", data.message);
        }
      } catch (error) {
        Alert.alert("Erreur de réseau", "Verifiez votre connexion internet.");
      }
    } else {
      Alert.alert("Erreur", "Aucune image sélectionnée.");
    }
  };

  const deletePhoto = async () => {
    setPhotoUtilisateur("");
    setImage("");
    try {
      const response = await fetch(`${NGROK_URL}/api/deletephoto`, {
        // remplace IP locale de ton backend
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: idUtilisateur,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem("token", data.token);
      } else {
        Alert.alert("Erreur", data.message);
      }
    } catch (error) {
      Alert.alert("Erreur de réseau", "Verifiez votre connexion internet.");
    }
  };

  return (
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
            Profil
          </Text>
          {/* <View style={styles.profilebtnNone}></View> */}
          <View style={styles.inline}>
            <TouchableOpacity
              style={styles.profilebtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowModal(true);
                loadInfos(decodedx);
              }}
            >
              <Ionicons
                name="pencil-outline"
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <View style={styles.bod}>
                <View style={styles.imagePicker}>
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={styles.selectedImage}
                    />
                  ) : photoUtilisateur ? (
                    <Image
                      source={{ uri: `${NGROK_URL}/${photoUtilisateur}` }}
                      style={styles.selectedImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons
                        name="person"
                        size={50}
                        color="#888"
                        // style={styles.iconx} // Peut-être pas nécessaire ici ou ajuster
                      />
                    </View>
                  )}
                </View>
                <Text style={styles.usernamex}>{nomUtilisateur}</Text>
                <View style={styles.inlinebox}>
                  <TouchableOpacity onPress={pickImage} style={styles.ppbtn}>
                    <Ionicons
                      name="image"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 5 }} // Peut-être pas nécessaire ici ou ajuster
                    />
                    <Text style={styles.pptext}>Modifier la photo</Text>
                  </TouchableOpacity>
                  {photoUtilisateur ? (
                    <TouchableOpacity
                      style={styles.ppbtn2}
                      onPress={deletePhoto}
                    >
                      <Ionicons
                        name="trash"
                        size={20}
                        color="#fff"
                        // style={styles.iconx} // Peut-être pas nécessaire ici ou ajuster
                      />
                    </TouchableOpacity>
                  ) : (
                    ""
                  )}
                </View>
              </View>
              {/* Si vous voulez garder le bouton texte séparé, vous pouvez le remettre ici */}

              <View style={styles.group}>
                <Text style={styles.label}>Nom</Text>
                <View style={styles.inputBox}>
                  <View style={styles.inlinebox}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color="#888"
                      style={styles.iconx}
                    />
                    <View style={styles.noinput}>
                      <Text style={styles.noinputText}>{nomUtilisateur}</Text>
                    </View>
                  </View>
                  {/* <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#999"
                    style={styles.iconr}
                  /> */}
                </View>
              </View>

              <View style={styles.group}>
                <Text style={styles.label}>Téléphone</Text>
                <View style={styles.inputBox}>
                  <View style={styles.inlinebox}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color="#888"
                      style={styles.iconx}
                    />
                    <View style={styles.noinput}>
                      <Text style={styles.noinputText}>{telUtilisateur}</Text>
                    </View>
                  </View>
                  {/* <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#999"
                    style={styles.iconr}
                  /> */}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Déconnexion</Text>
      </TouchableOpacity>

      <MapModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        commandId="Modification"
      >
        <ScrollView style={styles.bodmodal}>
          <View style={styles.group}>
            <Text style={styles.label}>Nom</Text>
            <View style={styles.inputBox}>
              <View style={styles.inlinebox}>
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
            </View>
            {errors.nom && <Text style={styles.error}>{errors.nom}</Text>}
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Téléphone</Text>
            <View style={styles.inputBox}>
              <View style={styles.inlinebox}>
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
                  defaultCode={countryCode} // Code du pays par défaut
                  //   withShadow // Ajoute une ombre
                  //   autoFocus // Focus automatique sur l'input au chargement
                  containerStyle={styles.phoneInputContainer}
                  textContainerStyle={styles.phoneTextContainer} // Style pour le conteneur du texte et du code pays
                  textInputStyle={styles.textInput}
                  codeTextStyle={styles.codeText}
                  flagButtonStyle={styles.flagButton}
                />
              </View>
            </View>
            {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
          </View>
          <TouchableOpacity style={styles.buttonrestyle} onPress={handleUpdate}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.textadd}>Modifier</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </MapModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  usernamex: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    marginBottom: 6,
    color: "#333",
  },

  bodmodal: {
    flex: 1,
    padding: 20,
  },

  ppbtn: {
    padding: 10,
    height: 40,
    backgroundColor: "#343434",
    borderRadius: 5,
    marginHorizontal: 5,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  ppbtn2: {
    padding: 10,
    height: 40,
    backgroundColor: "red",
    borderRadius: 5,
    marginHorizontal: 5,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  pptext: {
    color: "#FFF",
    fontFamily: "PoppinsBold",
  },

  buttonrestyle: {
    backgroundColor: "red",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  iconadd: {
    marginRight: 5,
  },
  textadd: {
    color: "#fff",
    fontFamily: "PoppinsBold",
    fontSize: 16,
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

  imagePicker: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    height: 100,
    width: 100,
    borderRadius: 100,
    marginBottom: 10,
    marginTop: 10,
    // borderWidth: 1,
    // borderColor: "#ddd",
    overflow: "hidden", // Pour que l'image ne dépasse pas si elle est plus grande
  },
  selectedImage: {
    width: "100%",
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

  bod: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: 20,
  },

  button: {
    backgroundColor: "#ffe3e3",
    paddingVertical: 10,
    // paddingHorizontal: 40,
    borderRadius: 10,
    positional: "absolute",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 55,
    left: 20,
    right: 20,
  },
  buttonText: {
    color: "red",
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

  inlinebox: {
    flexDirection: "row",
    alignItems: "center",
  },

  profilebtn: {
    width: 40,
    height: 40,
    backgroundColor: "#eee",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  profilebtnNone: {
    width: 40,
    height: 40,
    // backgroundColor: "#eee",
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
  iconx: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    fontFamily: "PoppinsRegular",
    fontSize: 16,
  },

  noinput: {
    height: 45,
    fontFamily: "PoppinsRegular",
    fontSize: 16,
    width: "88%",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },

  noinputText: {
    color: "#888",
    fontSize: 16,
  },

  iconr: {
    marginRight: 10,
  },

  group: {
    marginTop: 20,
  },

  label: {
    color: "#777",
    fontFamily: "PoppinsBold",
    fontSize: 16,
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
