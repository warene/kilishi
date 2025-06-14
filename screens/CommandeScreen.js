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
import * as Haptics from "expo-haptics";
import MapModal from "./components/MapModal";
import jwt_decode from "jwt-decode";
import * as Linking from "expo-linking";
// import eventBus from "./Utils/EventBus";

export default function CommandeScreen({ navigation }) {
  const Container = Platform.OS === "ios" ? View : SafeAreaView;
  const [commandList, setCommandList] = useState([]);
  const [detailCommandList, setDetailCommandList] = useState([]);
  const [client, setClient] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStart, setIsLoadingStart] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const NGROK_URL = "https://kilishi.alwaysdata.net"; // Remplacez par votre URL ngrok
  const [valsearch, setValSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("en attente"); // null = tous, sinon 'en_attente', 'en_cours', 'livre'
  const [showModal, setShowModal] = useState(false);
  const [commandId, setCommandId] = useState(null);

  const [subTotal, setSubTotal] = useState(0);
  const deliveryFee = 1000; // Frais de livraison fixes pour l'exemple
  const [grandTotal, setGrandTotal] = useState(0);
  const [idUtilisateur, setIdUtilisateur] = useState("");
  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [telUtilisateur, setTelUtilisateur] = useState("");
  const [statutUtilisateur, setStatutUtilisateur] = useState("");
  const [photoUtilisateur, setPhotoUtilisateur] = useState("");
  const [villeUtilisateur, setVilleUtilisateur] = useState("");
  const [idCommande, setIdCommande] = useState("");
  const [statutUpdate, setStatutUpdate] = useState("");

  const annee = new Date().getFullYear();
  const jour = new Date().getDate();
  const cmdid = annee.toString() + jour.toString();

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          try {
            const decoded = jwt_decode(token);
            const storedUserId = decoded.user_id;
            const storedUserName = decoded.nom;
            const storedUserTel = decoded.telephone;
            const storedUserStatut = decoded.statut;
            const storedUserPhoto = decoded.photo;
            const storedUserVille = decoded.ville;
            setIdUtilisateur(storedUserId);
            setNomUtilisateur(storedUserName);
            setStatutUtilisateur(storedUserStatut);
            setTelUtilisateur(storedUserTel);
            setVilleUtilisateur(storedUserVille);
            setPhotoUtilisateur(storedUserPhoto);
            // console.log(storedUserId);
            // console.log(storedUserStatut);
            getCommandes(storedUserId, storedUserStatut, storedUserVille);
          } catch (error) {
            console.error("Erreur lors du décodage du token:", error);
          }
        }

        setActiveStatus("en attente");
      };

      fetchData();
    }, [getCommandes])
  );

  const getCommandes = async (user_id, statut, ville) => {
    setIsLoading(true);
    try {
      const response = await fetch(NGROK_URL + "/api/getcommandes", {
        // remplace IP locale de ton backend
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user_id,
          statut: statut,
          ville: ville,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const sortedData = data.sort((a, b) => b.id - a.id); // Trier par ID décroissant
        setCommandList(sortedData); // Mettre à jour l'état avec les données de l'API
      } else {
        Alert.alert("Erreur", "Impossible de charger les commandes.");
      }
    } catch (error) {
      Alert.alert("Oups", "Un problème est survenu!");
    } finally {
      setIsLoading(false);
    }
  };

  const getDetailCommande = async (id, client_id, status) => {
    setIsLoadingDetail(true);
    setShowModal(true);
    setCommandId("CMD-" + id.toString() + cmdid);
    getClientInfos(client_id);
    setIdCommande(id);
    setStatutUpdate(status);

    try {
      const response = await fetch(`${NGROK_URL}/api/getdetailcommande`, {
        // remplace IP locale de ton backend
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setDetailCommandList(data); // Mettre à jour l'état avec les données de l'API
        calculateTotals(data); // Calculer les totaux à partir des détails de la commande
        // setAllPharmaciesList(data); // Stocker toutes les pharmacies
      } else {
        Alert.alert(
          "Erreur",
          "Impossible de charger les details de la commande."
        );
      }
    } catch (error) {
      Alert.alert("Oups", "Un problème est survenu!");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const getClientInfos = async (client_id) => {
    try {
      const response = await fetch(`${NGROK_URL}/api/getclientinfos`, {
        // remplace IP locale de ton backend
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: client_id,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setClient(data);
      } else {
        Alert.alert(
          "Erreur",
          "Impossible de charger les informations du client."
        );
      }
    } catch (error) {
      Alert.alert(
        "Oups",
        "Un problème est survenu lors de la recuperation du client!"
      );
    }
  };

  const calculateTotals = (items) => {
    const currentSubTotal = items.reduce((sum, item) => {
      const prix = parseFloat(
        String(item.prix_unitaire).replace(/\s/g, "").replace(",", ".")
      );
      const quantity = parseInt(item.quantite) || 1;

      return sum + prix * quantity;
    }, 0);
    setSubTotal(currentSubTotal);
    items.length === 0
      ? setGrandTotal(0)
      : setGrandTotal(currentSubTotal + deliveryFee);
  };

  const handleSearching = (text) => {
    setValSearch(text);
  };

  const filteredCommandList = commandList.filter((commande) => {
    const normalize = (str) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const searchString = normalize(
      ("CMD" + commande.id.toString() + cmdid).toLowerCase()
    );
    const searchValue = normalize(valsearch.toLowerCase());

    const matchSearch = searchString.includes(searchValue);
    const matchStatus = activeStatus ? commande.status === activeStatus : true;

    return matchSearch && matchStatus;
  });

  const updateCommande = async (id, statut) => {
    setIsLoadingStart(true);
    try {
      const response = await fetch(`${NGROK_URL}/api/updatecommande`, {
        // remplace IP locale de ton backend
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          statut: statut,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setStatutUpdate(statut);
        getCommandes();
        if (statut == "en cours") {
          Alert.alert("Préparation", "Commande en cours");
        } else {
          Alert.alert("Succès", "Commande terminée");
        }
      } else {
        Alert.alert(
          "Erreur",
          "Impossible de demarrer ou terminer la commande."
        );
      }
    } catch (error) {
      Alert.alert(
        "Oups",
        "Un problème est survenu lors du demarrage de la commande!"
      );
    } finally {
      setIsLoadingStart(false);
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Container style={styles.container}>
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
              Commandes
            </Text>
            <View style={styles.profilebtnNone}></View>
          </View>
        </View>
        {isLoading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="red" />
          </View>
        ) : commandList.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              //   marginTop: -100,
            }}
          >
            <Ionicons name="receipt-outline" size={80} color="#ccc" />
            <Text
              style={{
                marginTop: 20,
                fontSize: 18,
                color: "#555",
                fontFamily: "PoppinsRegular",
              }}
            >
              Aucune commandes.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.body}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1, marginBottom: 40 }}>
                <View style={styles.inputBox}>
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color="#888"
                    style={styles.iconx}
                  />
                  <TextInput
                    placeholder="Rechercher une commande"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    keyboardType="default"
                    onChangeText={handleSearching}
                    value={valsearch}
                  />
                </View>
                <View style={styles.flexfilter2}>
                  <TouchableOpacity
                    style={[
                      styles.filterbtn2,
                      activeStatus === "en attente" && {
                        backgroundColor: "#ffe3e3",
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveStatus("en attente");
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={Platform.OS === "ios" ? 20 : 18}
                      color="#333"
                      style={styles.filtericon}
                    />
                    <Text style={styles.filtertext}>En attente</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterbtn2,
                      activeStatus === "en cours" && {
                        backgroundColor: "#ffe3e3",
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveStatus("en cours");
                    }}
                  >
                    <Ionicons
                      name="sync-outline"
                      size={Platform.OS === "ios" ? 20 : 18}
                      color="#333"
                      style={styles.filtericon}
                    />
                    <Text style={styles.filtertext}>En cours</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterbtn2,
                      activeStatus === "terminé" && {
                        backgroundColor: "#ffe3e3",
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveStatus("terminé");
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={Platform.OS === "ios" ? 20 : 18}
                      color="#333"
                      style={styles.filtericon}
                    />
                    <Text style={styles.filtertext}>Terminé</Text>
                  </TouchableOpacity>
                </View>
                {filteredCommandList.length === 0 ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 40,
                    }}
                  >
                    <Ionicons name="receipt-outline" size={80} color="#ccc" />
                    <Text
                      style={{
                        marginTop: 20,
                        fontSize: 18,
                        color: "#555",
                        fontFamily: "PoppinsRegular",
                      }}
                    >
                      Aucune commande trouvée.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.grid}>
                    {filteredCommandList.map((item) => (
                      <TouchableOpacity
                        style={styles.item}
                        key={item.id.toString()}
                        onPress={() => {
                          getDetailCommande(item.id, item.user_id, item.status);
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            width: "70%",
                          }}
                        >
                          <View style={styles.cadreicon}>
                            <Ionicons
                              name="receipt-outline"
                              size={32}
                              color="#000"
                              style={styles.icon}
                            />
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
                              CMD-{item.id}
                              {cmdid}
                            </Text>
                            <Text
                              style={{
                                fontFamily: "Poppins",
                                marginTop: 0,
                                marginBottom: 5,
                                fontSize: 13,
                                color: "#888",
                                width: Platform.OS === "ios" ? "100%" : "95%",
                                // backgroundColor: "#f2f2f2",
                              }}
                              numberOfLines={1} // Ajouté: Limite le texte à une seule ligne
                              ellipsizeMode="tail"
                            >
                              {item.ville} - {item.created_at}
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
                                {item.total} XAF
                              </Text>
                            </View>
                          </View>
                        </View>
                        {/* <TouchableOpacity style={styles.additembtn}>
                          <Ionicons
                            name="close-outline"
                            size={30}
                            color="#000"
                            style={styles.icon}
                          />
                        </TouchableOpacity> */}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        )}

        <MapModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          commandId={commandId}
        >
          <ScrollView style={styles.bodmodal}>
            {isLoadingDetail ? (
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
              <View style={styles.grid}>
                {statutUtilisateur !== "user" ? (
                  <View style={styles.bod}>
                    <View style={styles.imagePicker}>
                      {client.photo ? (
                        <Image
                          source={{
                            uri: `${NGROK_URL}/${client.photo}`,
                          }}
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
                    <Text style={styles.usernamex}>{client.nom}</Text>
                    <View style={{ flexDirection: "row" }}>
                      <TouchableOpacity
                        onPress={() => {
                          launchPhoneCall(client.telephone);
                        }}
                        style={styles.ppbtn}
                      >
                        <Ionicons name="call" size={20} color="#fff" />
                        {/* <Text style={styles.pptext}>Appeler</Text> */}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          launchWhatsApp(client.telephone);
                        }}
                        style={styles.ppbtnw}
                      >
                        <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                        {/* <Text style={styles.pptext}>Appeler</Text> */}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  ""
                )}
                {detailCommandList.map((item) => (
                  <View style={styles.item} key={item.produit_id.toString()}>
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
                            marginBottom: 0,
                            fontSize: 18,
                          }}
                        >
                          {item.produit_nom}
                        </Text>
                        <Text
                          style={{
                            color: "#777",
                            fontFamily: "PoppinsBold",
                            marginBottom: 5,
                          }}
                        >
                          Quantité : {item.quantite}
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
                            {item.prix_unitaire} XAF
                          </Text>
                        </View>
                      </View>
                    </View>
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
                  <View style={[styles.totalRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>TOTAL A PAYER</Text>
                    <Text style={styles.grandTotalAmount}>
                      {grandTotal} XAF
                    </Text>
                  </View>
                </View>

                {statutUtilisateur !== "user" ? (
                  <>
                    {statutUpdate === "en attente" ? (
                      <TouchableOpacity
                        style={styles.buttonrestyle}
                        onPress={() => {
                          updateCommande(idCommande, "en cours");
                        }}
                        disabled={isLoadingStart}
                      >
                        {isLoadingStart ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.textadd}>
                            Démmarer la commande
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : statutUpdate === "en cours" ? (
                      <TouchableOpacity
                        style={styles.buttonrestyle}
                        onPress={() => {
                          updateCommande(idCommande, "terminé");
                        }}
                        disabled={isLoadingStart}
                      >
                        {isLoadingStart ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.textadd}>
                            Terminer la commande
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.buttonrestylef}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#18B36A"
                          style={styles.filtericon}
                        />
                        <Text style={styles.textaddf}>Commande terminée</Text>
                      </View>
                    )}
                  </>
                ) : (
                  ""
                )}
              </View>
            )}
          </ScrollView>
        </MapModal>
      </Container>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  bodmodal: {
    flex: 1,
    padding: 20,
  },

  profilebtnNone: {
    width: 40,
    height: 40,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
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

  bod: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 20,
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

  usernamex: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    marginBottom: 6,
    color: "#333",
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

  pptext: {
    color: "#FFF",
    fontFamily: "PoppinsBold",
    marginLeft: 5,
  },

  buttonrestyle: {
    backgroundColor: "#18b36a",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 50,
  },
  iconadd: {
    marginRight: 5,
  },
  textadd: {
    color: "#fff",
    fontFamily: "PoppinsBold",
    fontSize: 16,
  },

  buttonrestylef: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 50,
  },
  iconaddf: {
    marginRight: 5,
  },
  textaddf: {
    color: "#18B36A",
    fontFamily: "PoppinsBold",
    fontSize: 16,
  },

  totalsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
    marginBottom: 10,
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

  inputBox: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    fontFamily: "PoppinsRegular",
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
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

  filterbtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 50,
    marginRight: 10,
  },

  filterbtn2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 50,
    marginRight: 10,
  },

  filtericon: {
    marginRight: 5,
  },

  filtertext: {
    fontSize: Platform.OS === "ios" ? 14 : 13,
    fontFamily: "PoppinsRegular",
    color: "#000",
  },

  body: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: 5,
    paddingHorizontal: 20,
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

  flexfilter: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },

  flexfilter2: {
    flexDirection: "row",
    marginTop: 0,
    marginBottom: 20,
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
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 0,
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
