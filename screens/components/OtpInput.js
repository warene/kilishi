// Ajoute ce composant dans ton fichier ou dans un fichier séparé

import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";

export default function OtpInput({ length = 6, value, onChange, onSubmit }) {
  // Utilise la valeur du parent ou un tableau vide
  const otp = value
    ? value.split("").concat(Array(length).fill("")).slice(0, length)
    : Array(length).fill("");

  const inputs = useRef([]);

  const handleChange = (text, index) => {
    if (/^\d*$/.test(text)) {
      let newOtp = otp.slice();
      newOtp[index] = text;
      const joined = newOtp.join("").slice(0, length);
      onChange && onChange(joined);

      // Focus next input
      if (text && index < length - 1) {
        inputs.current[index + 1].focus();
      }
      // Submit if last digit filled
      if (index === length - 1 && text.length === 1) {
        onSubmit && onSubmit(joined);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.otpRow}>
      {otp.map((digit, idx) => (
        <TextInput
          key={idx}
          ref={(ref) => (inputs.current[idx] = ref)}
          style={styles.otpBox}
          keyboardType="numeric"
          maxLength={1}
          value={digit}
          onChangeText={(text) => handleChange(text, idx)}
          onKeyPress={(e) => handleKeyPress(e, idx)}
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  otpBox: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginHorizontal: 5,
    fontSize: 24,
    backgroundColor: "#f2f2f2",
    fontFamily: "PoppinsBold",
  },
});
