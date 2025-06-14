import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  Platform,
  SafeAreaView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons"; // Ajout de l'import
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import eventBus from "./Utils/EventBus"; // Assurez-vous que le chemin est correct
import jwt_decode from "jwt-decode";

export default function HomeScreen({ navigation, route }) {
  const Container = Platform.OS === "ios" ? View : SafeAreaView;
  const [valsearch, setValSearch] = useState("");
  const [productList, setProductList] = useState([]); // État pour stocker les médicaments
  const [isLoading, setIsLoading] = useState(false); // État pour stocker les médicaments
  const [cartItemCount, setCartItemCount] = useState(0); // État pour la quantité totale dans le panier
  const [productsInCartIds, setProductsInCartIds] = useState(new Set()); // IDs des produits dans le panier
  const [refreshing, setRefreshing] = useState(false);

  const isFocused = useIsFocused();

  const scale = useRef(new Animated.Value(1)).current;

  const NGROK_URL = "https://kilishi.alwaysdata.net"; // Remplacez par votre URL ngrok

  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [statutUtilisateur, setStatutUtilisateur] = useState("");
  const [idUtilisateur, setIdUtilisateur] = useState("");
  const [photoUtilisateur, setPhotoUtilisateur] = useState("");

  useEffect(() => {
    const chargerUtilisateur = async () => {
      const token = await AsyncStorage.getItem("token");
      //   console.log("Token:", token);

      if (token) {
        try {
          const decoded = jwt_decode(token);
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
    const storedUserId = decoded.user_id;
    const storedUserPhoto = decoded.photo;
    const storedUserStatut = decoded.statut;

    setNomUtilisateur(storedUserName);
    setIdUtilisateur(storedUserId);
    setStatutUtilisateur(storedUserStatut);
    setPhotoUtilisateur(storedUserPhoto);
  };

  const animatePress = (callback) => {
    // Effet de rebond
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 2,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback(); // Exécute le callback si fourni
    });
  };

  useEffect(() => {
    getProduits(); // Charger les médicaments au montage initial
    updateCartItemCount(); // Mettre à jour le compteur du panier au montage initial
  }, [getProduits, updateCartItemCount]);

  // Se lance à chaque fois que l'écran Home devient actif (focus)
  useFocusEffect(
    useCallback(() => {
      updateCartItemCount();
      loadInfos(); // Charger les informations de l'utilisateur
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);

    getProduits().then(() => {
      setRefreshing(false);
    });
  };

  useEffect(() => {
    const onCartUpdated = () => {
      getProduits();
      updateCartItemCount();
    };

    eventBus.on("cartUpdated", onCartUpdated);

    return () => {
      eventBus.off("cartUpdated", onCartUpdated);
    };
  }, []);

  const getProduits = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${NGROK_URL}/api/getproducts`, {
        // remplace IP locale de ton backend
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        setProductList(data); // Mettre à jour l'état avec les données de l'API
        // setAllPharmaciesList(data); // Stocker toutes les pharmacies
      } else {
        Alert.alert("Erreur", "Impossible de charger les produits.");
      }
    } catch (error) {
      Alert.alert("Oups", "Un problème est survenu!");
    } finally {
      setIsLoading(false);
    }
  });

  // Effet pour actualiser si on revient de NewProductScreen avec le paramètre productAdded
  // useEffect(() => {
  //   if (isFocused && route.params?.productAdded) {
  //     getProduits();
  //     // Réinitialiser le paramètre pour éviter de recharger lors des prochains focus
  //     navigation.setParams({ productAdded: undefined });
  //   }
  // }, [isFocused, route.params?.productAdded, navigation, getProduits]);

  const handleSearching = (text) => {
    setValSearch(text);
  };

  const addToCart = async (produit) => {
    // Animer uniquement lors de l'ajout
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // retour haptique
    try {
      let cart = await AsyncStorage.getItem("cart");
      cart = cart ? JSON.parse(cart) : [];

      // Vérifier si le produit est déjà dans le panier
      const existingProductIndex = cart.findIndex(
        (item) => item.id === produit.id
      ); // Supposant que vos produits ont un 'id' unique

      if (existingProductIndex > -1) {
        // Si le produit existe, augmenter la quantité
        // Pour cet exemple, nous allons juste notifier. Une logique plus complexe pourrait incrémenter la quantité.
        cart[existingProductIndex].quantity += 1;
        // animatePress();
        // updateCartItemCount(); // Mettre à jour le compteur du panier
        // Alert.alert("Panier", `${produit.nom} est déjà dans votre panier.`);
        animatePress();
        updateCartItemCount();
      } else {
        // Ajouter le nouveau produit avec une quantité initiale de 1
        // Assurez-vous que votre objet produit a un 'id'

        if (!produit.id) {
          // Si l'ID n'est pas directement sur l'objet produit, essayez de le générer ou d'utiliser une autre propriété unique
          // Pour cet exemple, on va utiliser le nom comme fallback, mais un ID unique est préférable
          console.warn(
            "Le produit n'a pas d'ID unique. Utilisation du nom comme fallback."
          );
          cart.push({ ...produit, id: produit.nom, quantity: 1 });
        } else {
          cart.push({ ...produit, quantity: 1 });
        }
        await AsyncStorage.setItem("cart", JSON.stringify(cart));
        animatePress();
        updateCartItemCount();
        // Alert.alert(
        //   "Ajouté au panier",
        //   `${produit.nom} a été ajouté à votre panier !`
        // );
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout au panier:", error);
      Alert.alert("Erreur", "Impossible d'ajouter le produit au panier.");
    }
  };

  // Fonction pour récupérer et mettre à jour le nombre total d'articles dans le panier
  const updateCartItemCount = React.useCallback(async () => {
    try {
      const cartString = await AsyncStorage.getItem("cart");
      const cart = cartString ? JSON.parse(cartString) : [];
      let totalCount = 0;
      cart.forEach((item) => {
        totalCount += item.quantity;
      });
      setCartItemCount(totalCount);
      const idsInCart = new Set(cart.map((item) => item.id));
      // setProductsInCartIds(idsInCart);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du nombre d'articles du panier:",
        error
      );
    }
  }, []);

  const filteredProductList = productList.filter((produit) =>
    produit.nom.toLowerCase().includes(valsearch.toLowerCase())
  );

  const handleDelete = async (id) => {
    Alert.alert(
      "Suppression",
      "Êtes-vous sûr de vouloir supprimer ce produit ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Oui",
          onPress: async () => {
            try {
              const response = await fetch(`${NGROK_URL}/api/deleteproduit`, {
                // remplace IP locale de ton backend
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id: id,
                }),
              });

              const data = await response.json();
              if (response.ok) {
                getProduits();
                Alert.alert("Succès", "Produit supprimé");
              } else {
                Alert.alert(
                  "Erreur",
                  "Impossible de charger les informations du client."
                );
              }
            } catch (error) {
              console.error("Erreur lors de la suppression:", error);
              Alert.alert(
                "Erreur",
                "Impossible de supprimer. Veuillez réessayer."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Container style={styles.container}>
      <View style={styles.header}>
        <View style={styles.flexline}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../assets/logok.png")} // remplace par le bon chemin vers ton logo
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.inline}>
            {statutUtilisateur !== "user" ? (
              <TouchableOpacity
                style={styles.additembtn}
                onPress={() => {
                  navigation.navigate("NewProduct");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={32}
                  color="#000"
                  style={styles.icon}
                />
              </TouchableOpacity>
            ) : (
              ""
            )}
            <TouchableOpacity
              style={styles.additembtn}
              onPress={() => {
                navigation.navigate("Commande");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name="receipt-outline"
                size={25}
                color="#000"
                style={styles.icon}
              />
            </TouchableOpacity>
            {statutUtilisateur === "user" ? (
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: scale,
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={styles.cartbtn}
                  onPress={() => {
                    navigation.navigate("Cart");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  {cartItemCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={{ color: "white" }}>{cartItemCount}</Text>
                    </View>
                  )}
                  <Ionicons
                    name="bag-handle-outline"
                    size={28}
                    color="#000"
                    style={styles.icon}
                  />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <TouchableOpacity
                style={styles.cartbtn}
                onPress={() => {
                  navigation.navigate("Users");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons
                  name="people-circle-outline"
                  size={33}
                  color="#000"
                  style={styles.icon}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.profilebtn}
              onPress={() => {
                loadInfos(); // Charger les informations de l'utilisateur
                navigation.navigate("Profil");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              {photoUtilisateur ? (
                <Image
                  source={{
                    uri: `${NGROK_URL}/${photoUtilisateur}`,
                  }}
                  style={styles.selectedImage}
                />
              ) : (
                <Ionicons
                  name="person"
                  size={27}
                  color="#999"
                  style={styles.icon}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="red" />
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2196F3"]}
              progressBackgroundColor="#E3F2FD"
            />
          }
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <View style={styles.inputBox}>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color="#888"
                  style={styles.iconx}
                />
                <TextInput
                  placeholder="Rechercher un produit"
                  placeholderTextColor="#aaa"
                  style={styles.input}
                  keyboardType="default"
                  onChangeText={handleSearching}
                  value={valsearch}
                />
              </View>

              {filteredProductList.length === 0 ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: 40,
                  }}
                >
                  <Ionicons name="search-outline" size={80} color="#ccc" />
                  <Text
                    style={{
                      marginTop: 20,
                      fontSize: 18,
                      color: "#555",
                      fontFamily: "PoppinsRegular",
                    }}
                  >
                    Aucun resultat trouvée.
                  </Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {filteredProductList.map((produit) => (
                    <View
                      style={styles.item}
                      key={produit.id} // Utiliser produit.id si disponible, sinon produit.nom comme fallback
                    >
                      <View style={styles.itemprix}>
                        <Ionicons
                          name="cash-outline"
                          size={20}
                          color="white"
                          style={styles.iconadd}
                        />
                        <Text style={{ color: "white" }}>
                          {produit.prix} XAF
                        </Text>
                      </View>

                      <Image
                        source={{
                          uri: `${NGROK_URL}/${produit.photo}`,
                        }}
                        style={styles.itemImage}
                      />
                      <Text
                        style={{
                          fontFamily: "PoppinsBold",
                          marginTop: 5,
                          fontSize: 16,
                          textAlign: "center",
                        }}
                      >
                        {produit.nom}
                      </Text>
                      {statutUtilisateur !== "user" ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 10,
                          }}
                        >
                          <TouchableOpacity
                            style={styles.buttonrestylem}
                            onPress={() =>
                              navigation.navigate("NewProduct", { produit })
                            } // Lier la fonction ici
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={23}
                              color="#09F"
                              style={styles.iconaddm}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.buttonrestyled}
                            onPress={() => handleDelete(produit.id)} // Lier la fonction ici
                          >
                            <Ionicons
                              name="trash-outline"
                              size={23}
                              color="red"
                              style={styles.iconaddm}
                            />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.buttonrestyle}
                          onPress={() => addToCart(produit)} // Lier la fonction ici
                        >
                          <Ionicons
                            name="bag-add-outline"
                            size={20}
                            color="red"
                            style={styles.iconadd}
                          />
                          <Text style={styles.textadd}>Ajouter</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      )}

      {/* {cartItemCount > 0 && ( 
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Cart")}
        >
          <Text style={styles.buttonTextx}>
            {cartItemCount} Produit{cartItemCount > 1 ? "s" : ""} ajouté
            {cartItemCount > 1 ? "s" : ""} au panier
          </Text>
          <Ionicons
            name="chevron-forward-outline"
            size={27}
            color="white"
            style={styles.iconpay}
          />
        </TouchableOpacity>
      )} */}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  selectedImage: {
    width: "100%",
    height: "100%",
  },

  alreadyInCartText: {
    fontFamily: "PoppinsRegular",
    fontSize: 14,
    color: "red", // Couleur pour indiquer que c'est déjà ajouté
    marginTop: 2, // Pour aligner avec le bouton
    // paddingVertical: 10, // Pour occuper une hauteur similaire au bouton
    // paddingHorizontal: 20,
    marginLeft: 5,
    textAlign: "center",
  },

  badge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },

  button: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    backgroundColor: "#343434",
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 20,
    paddingHorizontal: 14,
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 20,
    positional: "absolute",
    zIndex: 1,
    alignItems: "center",
  },
  buttonTextx: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
    // paddingHorizontal: 60,
    fontFamily: "PoppinsRegular",
  },

  body: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: 5,
    paddingHorizontal: 20,
  },

  logoCircle: {
    // backgroundColor: "#ccc",
    borderRadius: 10,
    padding: 0,
  },
  logo: {
    width: 120,
    height: 55,
  },

  buttonrestyle: {
    backgroundColor: "#ffe3e3",
    paddingVertical: 10,
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
    color: "red",
    fontFamily: "PoppinsBold",
    fontSize: 14,
  },

  buttonrestyled: {
    backgroundColor: "#ffe3e3",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonrestylem: {
    backgroundColor: "#0099ff38",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginRight: 10,
  },

  itemprix: {
    position: "absolute",
    zIndex: 1,
    top: -15,
    // backgroundColor: "#e3efff",
    backgroundColor: "#0e50a9",
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    fontFamily: "PoppinsBold",
    fontSize: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  header: {
    width: "100%",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 53 : 40,
    paddingBottom: 5,
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

  cartbtn: {
    marginRight: 10,
    width: 40,
    height: 40,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  additembtn: {
    width: 40,
    height: 40,
    marginRight: 10,
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
    overflow: "hidden",
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
  },

  item: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 10,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 10,
  },

  itemImage: {
    width: 100,
    height: 175,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
});
