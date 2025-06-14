import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons"; // Ajout de l'import

const MapModal = ({ visible, onClose, commandId, children }) => {
  return (
    <View>
      <Modal
        isVisible={visible}
        onBackdropPress={onClose}
        onSwipeComplete={onClose}
        swipeDirection={null}
        backdropOpacity={0.5} // 👈 opacité du fond
        propagateSwipe={true} // 👈 permet aux enfants de gérer les scroll/touch
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.headmodal}>
            <View
              style={{
                width: 40,
              }}
            ></View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#555",
                textAlign: "center",
              }}
            >
              {commandId}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={{ fontSize: 20, color: "#007bff" }}>
                <Ionicons
                  name="close-outline"
                  size={35}
                  color="#555"
                  style={styles.icon}
                />
              </Text>
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#f9f9f9",
    padding: 0,
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "88%", // ✅ hauteur minimale de la modal
    // maxHeight: "80%", // ✅ limite la hauteur pour éviter que le clavier la coupe
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "hidden",
    position: "absolute",
    zIndex: 2,
  },

  headmodal: {
    padding: 10,
    // backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  },
});

export default MapModal;
