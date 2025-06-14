import React, { useState, useCallback, useRef, useEffect } from "react";
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
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Ajout de l'import
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import jwt_decode from "jwt-decode";
// import eventBus from "./Utils/EventBus";

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingx, setIsLoadingx] = useState(false);
  const [subTotal, setSubTotal] = useState(0);
  const deliveryFee = 1000; // Frais de livraison fixes pour l'exemple
  const [grandTotal, setGrandTotal] = useState(0);
  const NGROK_URL = "https://kilishi.alwaysdata.net"; // Remplacez par votre URL ngrok
  // const NGROK_URL = "https://1ab5-102-244-161-143.ngrok-free.app"; // Remplacez par votre URL ngrok

  const [selectedValue, setSelectedValue] = useState("Yaoundé");
  const [idUtilisateur, setIdUtilisateur] = useState("");

  useEffect(() => {
    const chargerUtilisateur = async () => {
      const token = await AsyncStorage.getItem("token");
      //   console.log("Token:", token);

      if (token) {
        try {
          const decoded = jwt_decode(token);
          const storedUserId = decoded.user_id;
          setIdUtilisateur(storedUserId);
        } catch (error) {
          console.error("Erreur lors du décodage du token:", error);
        }
      }
    };

    chargerUtilisateur();
  }, []);

  const loadCartItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const cartString = await AsyncStorage.getItem("cart");
      const items = cartString ? JSON.parse(cartString) : [];
      setCartItems(items);
      calculateTotals(items);
    } catch (error) {
      console.error("Erreur lors du chargement du panier:", error);
      Alert.alert("Erreur", "Impossible de charger le panier.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCartItems();
    }, [loadCartItems])
  );

  const calculateTotals = (items) => {
    const currentSubTotal = items.reduce((sum, item) => {
      const prix = parseFloat(
        String(item.prix).replace(/\s/g, "").replace(",", ".")
      );
      const quantity = parseInt(item.quantity) || 1;

      return sum + prix * quantity;
    }, 0);
    setSubTotal(currentSubTotal);
    items.length === 0
      ? setGrandTotal(0)
      : setGrandTotal(currentSubTotal + deliveryFee);
  };

  const updateCartAndRecalculate = async (updatedCart) => {
    await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
    calculateTotals(updatedCart);
  };

  const increaseQuantity = async (id) => {
    const updatedCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    await updateCartAndRecalculate(updatedCart);
  };

  const decreaseQuantity = async (id) => {
    const updatedCart = cartItems.map((item) =>
      item.id === id
        ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 }
        : item
    );
    await updateCartAndRecalculate(updatedCart);
  };

  const removeItem = async (id) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);
    await updateCartAndRecalculate(updatedCart);
  };

  const clearCart = async () => {
    await AsyncStorage.removeItem("cart");
    setCartItems([]);
    setSubTotal(0);
    setGrandTotal(0); // Si tu veux que le total soit juste le frais de livraison
  };

  const slideAnim = useRef(new Animated.Value(-200)).current;

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
    Keyboard.dismiss;
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const sendOrder = async () => {
    setIsLoadingx(true);
    const order = {
      ville: selectedValue,
      total: grandTotal,
      items: cartItems.map((item) => ({
        produit_id: item.id,
        quantity: item.quantity,
        prix_unitaire: parseFloat(
          item.prix.replace(/\s/g, "").replace(",", ".")
        ),
      })),
      user_id: idUtilisateur,
    };

    try {
      const response = await fetch(`${NGROK_URL}/api/commande`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(order),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Succès", "Votre commande a bien été envoyée !");
        await clearCart(); // Vide le panier
        navigation.replace("Commande");
      } else {
        Alert.alert("Erreur", data.message || "Erreur lors de l'envoi.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Une erreur est survenue.");
    } finally {
      setIsLoadingx(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={closePicker}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.flexline}>
            <TouchableOpacity
              style={styles.profilebtn}
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Ionicons
                name="chevron-back-outline"
                size={27}
                color="#333"
                style={styles.icon}
              />
            </TouchableOpacity>
            <Text style={{ fontSize: 23, fontFamily: "PoppinsBold" }}>
              Panier
            </Text>
            <View style={styles.inline}>
              <TouchableOpacity style={styles.profilebtn} onPress={clearCart}>
                <Ionicons
                  name="trash-bin-outline"
                  size={23}
                  color="#333"
                  style={styles.icon}
                />
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
        ) : cartItems.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Ionicons name="bag-outline" size={80} color="#ccc" />
            <Text
              style={{
                marginTop: 20,
                fontSize: 18,
                color: "#555",
                fontFamily: "PoppinsRegular",
              }}
            >
              Votre panier est vide.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.body}>
            <TouchableWithoutFeedback onPress={closePicker}>
              <View style={{ flex: 1, marginBottom: 110 }}>
                <View style={styles.grid}>
                  {cartItems.map((item) => (
                    <View style={styles.item} key={item.id.toString()}>
                      <View style={{ flexDirection: "row" }}>
                        <Image
                          source={{ uri: `${NGROK_URL}/${item.photo}` }}
                          style={styles.itemImage}
                        />
                        <View style={{ marginLeft: 20 }}>
                          <Text
                            style={{
                              fontFamily: "PoppinsBold",
                              marginTop: 5,
                              marginBottom: 5,
                              fontSize: Platform.OS === "ios" ? 18 : 16,
                            }}
                          >
                            {item.nom}
                          </Text>
                          <View style={styles.itemprix}>
                            <Ionicons
                              name="cash-outline"
                              size={20}
                              color="#18B36A"
                              style={styles.iconadd}
                            />
                            <Text
                              style={{
                                color: "#18B36A",
                                fontFamily: "PoppinsBold",
                                marginLeft: 5,
                              }}
                            >
                              {item.prix} XAF
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 10,
                            }}
                          >
                            <TouchableOpacity
                              style={styles.minusbtn}
                              onPress={() => decreaseQuantity(item.id)}
                            >
                              <Ionicons
                                name="remove"
                                size={20}
                                color="#000"
                                style={styles.iconpm}
                              />
                            </TouchableOpacity>
                            <Text
                              style={{
                                fontSize: 16,
                                fontFamily: "poppinsBold",
                              }}
                            >
                              {item.quantity}
                            </Text>
                            <TouchableOpacity
                              style={styles.plusbtn}
                              onPress={() => increaseQuantity(item.id)}
                            >
                              <Ionicons
                                name="add"
                                size={20}
                                color="#fff"
                                style={styles.iconpm}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.additembtn}
                        onPress={() => removeItem(item.id)}
                      >
                        <Ionicons
                          name="close-outline"
                          size={30}
                          color="#000"
                          style={styles.icon}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <View style={styles.totalsContainer}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Sous Total</Text>
                      <Text style={styles.totalAmount}>{subTotal} XAF</Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Livraison</Text>
                      <Text style={styles.totalAmount}>{deliveryFee} XAF</Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Ville de Livraison</Text>
                      <TouchableOpacity
                        style={styles.ville}
                        onPress={openPicker}
                      >
                        <Ionicons
                          name="chevron-down-outline"
                          size={20}
                          color="#000"
                          style={styles.icon}
                        />
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
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.totalRow, styles.grandTotalRow]}>
                      <Text style={styles.grandTotalLabel}>TOTAL A PAYER</Text>
                      <Text style={styles.grandTotalAmount}>
                        {grandTotal} XAF
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={sendOrder}
          disabled={cartItems.length === 0 || isLoading}
        >
          {isLoadingx ? <ActivityIndicator size="small" color="#fff" /> : ""}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="cash-outline"
              size={27}
              color="white"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.buttonText}>{grandTotal} XAF</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.buttonText}>Commander</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={27}
              color="white"
              style={styles.iconpay}
            />
          </View>
        </TouchableOpacity>
        <TouchableWithoutFeedback>
          <Animated.View
            style={[styles.pickerContainer, { bottom: slideAnim }]}
          >
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
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  ville: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    backgroundColor: "#eee",
    borderRadius: 5,
  },

  pickerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 5,
  },

  totalsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  grandTotalLabel: {
    fontFamily: "PoppinsBold",
    fontSize: 20,
    color: "#000",
  },
  grandTotalAmount: {
    fontFamily: "PoppinsBold",
    fontSize: 20,
    fontFamily: "PoppinsBold",
  },

  totalLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 16,
    color: "#333",
  },
  totalAmount: {
    fontFamily: "PoppinsBold",
    fontSize: 16,
    color: "#333",
  },

  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    marginTop: 5,
  },

  minusbtn: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#eee",
    padding: 3,
    borderRadius: 8,
    marginRight: 10,
  },

  plusbtn: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#0e50a9",
    padding: 3,
    backgroundColor: "#0e50a9",
    borderRadius: 8,
    marginLeft: 10,
  },

  body: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: 5,
    paddingHorizontal: 20,
  },

  button: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    backgroundColor: "#18B36A",
    paddingVertical: 20,
    paddingHorizontal: 14,
    bottom: Platform.OS === "ios" ? 40 : 55,
    left: 20,
    right: 20,
    borderRadius: 20,
    positional: "absolute",
    zIndex: 1,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    // paddingHorizontal: 60,
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

  item: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    paddingVertical: 5,
    paddingHorizontal: 10,
    textAlign: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 10,
  },

  itemImage: {
    width: 60,
    height: 100,
  },

  grid: {
    flexDirection: "column",
  },

  itemprix: {
    flexDirection: "row",
  },
});
