import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Agora o Header recebe as informações e o controle do "olhinho" vindos do Dashboard
export const Header = ({
  saldoTotal,
  mostrarValores,
  onToggleValores,
}: any) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.boasVindas}>
          <Text style={styles.textoOla}>Olá, Sandero!</Text>
          <Text style={styles.textoBemVindo}>Bem-vindo de volta.</Text>
        </View>
        <TouchableOpacity style={styles.iconeNotificacao}>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.saldoLabel}>Saldo Atual</Text>

      <View style={styles.saldoContainer}>
        {/* O valor muda para pontinhos se a visibilidade estiver desligada */}
        <Text style={styles.saldoValor}>
          R$ {mostrarValores ? saldoTotal : "••••"}
        </Text>

        {/* O botão agora chama a função que salva no celular */}
        <TouchableOpacity onPress={onToggleValores} style={styles.iconeOlho}>
          <MaterialCommunityIcons
            name={mostrarValores ? "eye-outline" : "eye-off-outline"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0056b3",
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  boasVindas: {
    flex: 1,
  },
  textoOla: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  textoBemVindo: {
    color: "#D1D5DB",
    fontSize: 14,
  },
  iconeNotificacao: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
  },
  saldoLabel: {
    color: "#D1D5DB",
    fontSize: 14,
    marginBottom: 5,
  },
  saldoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  saldoValor: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  iconeOlho: {
    marginLeft: 15,
    padding: 5,
  },
});
