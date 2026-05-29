import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FinanceService } from "../services/FinanceService";

const DetalhesScreen = ({ route, navigation }: any) => {
  const { item } = route.params;
  const isEntrada = item.tipo === "Entrada";

  // Função para confirmar e excluir
  const handleExcluir = () => {
    Alert.alert(
      "Excluir Registro",
      "Tem certeza que deseja apagar esta movimentação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            await FinanceService.remover(item.id); // Executa a remoção blindada
            navigation.goBack(); // Volta para o Dashboard atualizando a lista na hora!
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerForm}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btnVoltar}
        >
          <Text style={styles.txtBtnVoltar}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Detalhes</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cabecalhoCard}>
            <Text style={styles.descricao} numberOfLines={1}>
              {item.descricao}
            </Text>
            <Text
              style={[
                styles.valor,
                { color: isEntrada ? "#10B981" : "#EF4444" },
              ]}
            >
              {isEntrada ? "+" : "-"} R$ {item.valor}
            </Text>
          </View>

          <View style={styles.divisor} />

          <View style={styles.linhaInfo}>
            <Text style={styles.label}>Categoria</Text>
            <Text style={styles.valorInfo}>
              {item.categoria || "Não categorizado"}
            </Text>
          </View>

          <View style={styles.linhaInfo}>
            <Text style={styles.label}>Data e Hora</Text>
            <Text style={styles.valorInfo}>{item.dataHora}</Text>
          </View>

          <View style={styles.linhaInfo}>
            <Text style={styles.label}>Tipo</Text>
            <Text
              style={[
                styles.badge,
                { backgroundColor: isEntrada ? "#10B981" : "#EF4444" },
              ]}
            >
              {item.tipo}
            </Text>
          </View>

          <View style={styles.divisor} />

          {/* NOVOS BOTÕES DE AÇÃO */}
          <View style={styles.areaBotoes}>
            <TouchableOpacity
              style={[styles.botaoAcao, { backgroundColor: "#E5E7EB" }]}
              onPress={() => navigation.navigate("Editar", { item: item })}
            >
              <Feather name="edit-2" size={18} color="#4B5563" />
              <Text style={[styles.textoBotaoAcao, { color: "#4B5563" }]}>
                Editar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botaoAcao, { backgroundColor: "#FEE2E2" }]}
              onPress={handleExcluir}
            >
              <Feather name="trash-2" size={18} color="#EF4444" />
              <Text style={[styles.textoBotaoAcao, { color: "#EF4444" }]}>
                Apagar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  headerForm: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0056b3",
    padding: 20,
    paddingTop: 50,
  },
  btnVoltar: { padding: 10 },
  txtBtnVoltar: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  titulo: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  content: { padding: 15, marginTop: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cabecalhoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  descricao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
    marginRight: 10,
  },
  valor: { fontSize: 16, fontWeight: "bold" },
  divisor: {
    height: 1,
    backgroundColor: "#E5E7EB",
    width: "100%",
    marginBottom: 15,
  },
  linhaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  label: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  valorInfo: { fontSize: 14, color: "#1F2937", fontWeight: "bold" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    overflow: "hidden",
  },

  // Estilos da nova área de botões
  areaBotoes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  botaoAcao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  textoBotaoAcao: { fontWeight: "bold", marginLeft: 8, fontSize: 14 },
});

export default DetalhesScreen;
