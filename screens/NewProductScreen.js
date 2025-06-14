import React, { useState, useEffect } from "react";
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
import eventBus from "./Utils/EventBus";

export default function NewProductScreen({ navigation }) {
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modif, setModif] = useState(false);
  const route = useRoute();

  const [image, setImage] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [id, setId] = useState("");
  const NGROK_URL = "https://kilishi.alwaysdata.net";

  useEffect(() => {
    if (route.params) {
      const { produit } = route.params;
      setModif(true);
      console.log(produit);
      setId(produit.id);
      setNom(produit.nom);
      setPrix(produit.prix);
      setImage(`${NGROK_URL}/${produit.photo}`);
      setImageChanged(false); // L'image n'a pas encore été changée
    } else {
      setModif(false);
      setImageChanged(false); // L'image n'a pas encore été changée
    }
  }, [route.params]);

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
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setImageChanged(true); // L'image a été changée
    }
  };

  const validate = () => {
    if (!nom.trim()) {
      Alert.alert("Erreur", "Entrez un nom pour le produit.");
      return false;
    }

    if (!prix.trim() || isNaN(prix) || parseFloat(prix) <= 0) {
      Alert.alert("Erreur", "Entrez un prix pour le produit.");
      return false;
    }

    if (!image) {
      Alert.alert("Erreur", "Sélectionnez une image pour le produit.");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    // console.log("handleRegister");

    if (validate()) {
      // ici tu peux faire un fetch() vers le backend Flask
      // fetch('/register', { ... })
      setIsLoading(true);

      const formData = new FormData();
      formData.append("nom", nom);
      formData.append("prix", prix);
      if (modif) {
        formData.append("id", id);
      }

      // 'image' est l'URI de l'image sélectionnée
      // Ajoute la photo seulement si elle a été changée ou si c'est une création
      if (!modif || imageChanged) {
        if (image) {
          const uriParts = image.split("/");
          const fileName = uriParts.pop();
          const typeMatch = /\.(\w+)$/.exec(fileName);
          const type = typeMatch ? `image/${typeMatch[1]}` : "image";

          formData.append("photo", {
            uri: image,
            name: fileName,
            type: type,
          });
        }
        formData.append("imageChanged", "yes");
      } else if (modif && !imageChanged) {
        // Si on modifie mais qu'on n'a pas changé l'image, on peut envoyer le nom de l'image existante
        formData.append("photo", route.params.produit.photo);
        formData.append("imageChanged", "no");
      }

      try {
        const response = await fetch(
          `${NGROK_URL}/api/${modif ? "updateproduct" : "addproduct"}`,
          {
            // remplace IP locale de ton backend
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        if (response.ok) {
          //   Alert.alert("Succès", "Produit ajouté avec succès !");
          setNom("");
          setPrix("");
          setImage(null);
          eventBus.emit("cartUpdated");
          navigation.goBack(); // Naviguer avec un paramètre
        } else {
          Alert.alert("Erreur", data.message);
        }
      } catch (error) {
        Alert.alert("Erreur de réseau", "Verifiez votre connexion internet.");
      } finally {
        setIsLoading(false);
      }
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
          <Text
            style={{
              fontSize: Platform.OS === "ios" ? 23 : 20,
              fontFamily: "PoppinsBold",
            }}
          >
            {modif ? "Modifier le produit" : "Nouveau produit"}
          </Text>
          <View style={styles.profilebtnNone}></View>
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
              <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={50}
                      color="#888"
                      // style={styles.iconx} // Peut-être pas nécessaire ici ou ajuster
                    />
                    <Text style={styles.imagePickerText}>
                      Ajouter une photo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Si vous voulez garder le bouton texte séparé, vous pouvez le remettre ici */}
              {image ? (
                <Button title="Choisir une photo" onPress={pickImage} />
              ) : (
                ""
              )}

              <View style={styles.inputBox}>
                <Ionicons
                  name="pencil-outline"
                  size={20}
                  color="#888"
                  style={styles.iconx}
                />
                <TextInput
                  placeholder="Nom du produit"
                  placeholderTextColor="#aaa"
                  style={styles.input}
                  keyboardType="default"
                  onChangeText={setNom}
                  value={nom}
                />
              </View>
              <View style={styles.inputBox}>
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color="#888"
                  style={styles.iconx}
                />
                <TextInput
                  placeholder="Prix du produit"
                  placeholderTextColor="#aaa"
                  style={styles.input}
                  keyboardType="numeric"
                  onChangeText={setPrix}
                  value={prix}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {modif ? "Modifier" : "Ajouter"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    bottom: Platform.OS === "ios" ? 40 : 55,
    marginHorizontal: 20,
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

  profilebtnNone: {
    width: 40,
    height: 40,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
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
  iconx: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    fontFamily: "PoppinsRegular",
    fontSize: 16,
  },
});
