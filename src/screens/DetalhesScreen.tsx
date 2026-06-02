import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { FinanceService } from "../services/FinanceService";

const DetalhesScreen = ({ route, navigation }: any) => {
  // Recupera a movimentação que foi clicada no Dashboard
  const { item } = route.params;

  // Lógica assíncrona de exclusão integrada com o Firebase + AsyncStorage
  const handleExcluir = () => {
    Alert.alert(
      "Excluir Registro",
      "Tem certeza que deseja apagar esta transação do celular e da nuvem?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              // Executa a remoção híbrida imediata
              await FinanceService.removerTransacao(item.id);

              Alert.alert("Sucesso", "Registro excluído com sucesso!");
              // Retorna ao Dashboard forçando a atualização da lista
              navigation.navigate("Dashboard", { atualizado: true });
            } catch (error) {
              Alert.alert("Erro", "Não foi possível deletar o registro.");
            }
          },
        },
      ],
    );
  };

  const ehEntrada = item.tipo === "Entrada";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* TOPO DO CARD COM ÍCONE DINÂMICO */}
        <View style={styles.headerRow}>
          <Text style={styles.titulo}>Detalhes do Registro</Text>
          <MaterialCommunityIcons
            name={ehEntrada ? "arrow-up-circle" : "arrow-down-circle"}
            size={36}
            color={ehEntrada ? "#10B981" : "#EF4444"}
          />
        </View>

        <View style={styles.divisor} />

        {/* CAMPOS DE INFORMAÇÃO */}
        <View style={styles.infoGroup}>
          <Text style={styles.label}>Descrição</Text>
          <Text style={styles.valorTexto}>{item.descricao}</Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Valor</Text>
          <Text
            style={[
              styles.valorNumerico,
              { color: ehEntrada ? "#10B981" : "#EF4444" },
            ]}
          >
            R$ {parseFloat(item.valor).toFixed(2)}
          </Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Tipo</Text>
          <Text
            style={[
              styles.tipoTag,
              {
                backgroundColor: ehEntrada ? "#E6F4EA" : "#FCE8E6",
                color: ehEntrada ? "#137333" : "#C5221F",
              },
            ]}
          >
            {item.tipo}
          </Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Categoria</Text>
          <Text style={styles.valorTexto}>{item.categoria || "Outros"}</Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Data e Hora do Cadastro</Text>
          <Text style={styles.dataTexto}>
            {item.dataHora || "Não informada"}
          </Text>
        </View>

        {/* BARRA DE AÇÕES (VOLTAR, EDITAR, EXCLUIR) */}
        <View style={styles.botoesContainer}>
          <TouchableOpacity
            style={[styles.botao, { backgroundColor: "#9CA3AF" }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            <Text style={styles.textoBotao}>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botao, { backgroundColor: "#2563EB" }]}
            onPress={() => navigation.navigate("Editar", { item })}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
            <Text style={styles.textoBotao}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botao, { backgroundColor: "#EF4444" }]}
            onPress={handleExcluir}
          >
            <MaterialCommunityIcons name="trash-can" size={20} color="#fff" />
            <Text style={styles.textoBotao}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F5F7FA",
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },
  divisor: {
    height: 1,
    backgroundColor: "#E5E7EB",
    width: "100%",
    marginBottom: 20,
  },
  infoGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  valorTexto: {
    fontSize: 18,
    color: "#1F2937",
    fontWeight: "500",
  },
  valorNumerico: {
    fontSize: 26,
    fontWeight: "bold",
  },
  dataTexto: {
    fontSize: 15,
    color: "#4B5563",
  },
  tipoTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  botoesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  botao: {
    flex: 1,
    flexDirection: "row",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    elevation: 2,
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default DetalhesScreen;
