import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Header } from "../components/Header";
import { FinanceService } from "../services/FinanceService";
import { UserService } from "../services/UserService";

const obterEstiloCategoria = (categoria: string) => {
  switch (categoria) {
    case "Alimentação":
      return {
        icone: "silverware-fork-knife",
        corFundo: "#FEF3C7",
        corIcone: "#D97706",
      };
    case "Transporte":
      return { icone: "car", corFundo: "#DBEAFE", corIcone: "#2563EB" };
    case "Lazer":
      return {
        icone: "ticket-confirmation",
        corFundo: "#EDE9FE",
        corIcone: "#7C3AED",
      };
    case "Educação":
      return { icone: "school", corFundo: "#D1FAE5", corIcone: "#059669" };
    case "Moradia":
      return { icone: "home", corFundo: "#FCE7F3", corIcone: "#DB2777" };
    case "Saúde":
      return { icone: "medical-bag", corFundo: "#FEE2E2", corIcone: "#DC2626" };
    case "Salário":
      return {
        icone: "cash-multiple",
        corFundo: "#D1FAE5",
        corIcone: "#059669",
      };
    case "Vale Alimentação":
      return { icone: "food-apple", corFundo: "#FEF3C7", corIcone: "#D97706" };
    case "Vale Refeição":
      return { icone: "silverware", corFundo: "#FEF3C7", corIcone: "#D97706" };
    case "Bônus/Flash":
      return {
        icone: "credit-card-flash-outline",
        corFundo: "#EDE9FE",
        corIcone: "#7C3AED",
      };
    default:
      return { icone: "wallet", corFundo: "#F3F4F6", corIcone: "#4B5563" };
  }
};

const DashboardScreen = ({ navigation }: any) => {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [resumo, setResumo] = useState({
    total: "0.00",
    entradas: "0.00",
    saidas: "0.00",
  });
  const [mostrarValores, setMostrarValores] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const carregarDados = async () => {
        try {
          // A ÚNICA ALTERAÇÃO FOI AQUI: Recebe a lista direto do motor Híbrido
          const lista = await FinanceService.carregarDados();
          setTransacoes(lista || []);

          const ent = (lista || [])
            .filter((t: any) => t.tipo === "Entrada")
            .reduce((acc: number, t: any) => acc + parseFloat(t.valor), 0);
          const sai = (lista || [])
            .filter((t: any) => t.tipo === "Saída")
            .reduce((acc: number, t: any) => acc + parseFloat(t.valor), 0);

          setResumo({
            total: (ent - sai).toFixed(2),
            entradas: ent.toFixed(2),
            saidas: sai.toFixed(2),
          });
        } catch (error) {
          console.error("Erro ao carregar dados", error);
        }
      };
      carregarDados();
    }, []),
  );

  useEffect(() => {
    const carregarPreferenciaVisibilidade = async () => {
      try {
        const statusSalvo = await AsyncStorage.getItem(
          "@billy_valores_visiveis",
        );
        if (statusSalvo !== null) {
          setMostrarValores(JSON.parse(statusSalvo));
        }
      } catch (error) {
        console.error("Erro ao carregar preferência de visibilidade", error);
      }
    };
    carregarPreferenciaVisibilidade();
  }, []);

  const toggleVisibilidade = async () => {
    try {
      const novoStatus = !mostrarValores;
      setMostrarValores(novoStatus);
      await AsyncStorage.setItem(
        "@billy_valores_visiveis",
        JSON.stringify(novoStatus),
      );
    } catch (error) {
      console.error("Erro ao salvar preferência de visibilidade", error);
    }
  };
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  useFocusEffect(
    useCallback(() => {
      const carregarDados = async () => {
        try {
          // Carrega o nome do usuário do AsyncStorage
          // Puxa o perfil e extrai APENAS a primeira palavra do nome
          const perfil = await UserService.obterPerfilLocal();
          if (perfil && perfil.nome) {
            const primeiroNome = perfil.nome.split(" ")[0];
            setNomeUsuario(primeiroNome);
          }
          const lista = await FinanceService.carregarDados();
          setTransacoes(lista || []);

          const ent = (lista || [])
            .filter((t: any) => t.tipo === "Entrada")
            .reduce((acc: number, t: any) => acc + parseFloat(t.valor), 0);
          const sai = (lista || [])
            .filter((t: any) => t.tipo === "Saída")
            .reduce((acc: number, t: any) => acc + parseFloat(t.valor), 0);

          setResumo({
            total: (ent - sai).toFixed(2),
            entradas: ent.toFixed(2),
            saidas: sai.toFixed(2),
          });
        } catch (error) {
          console.error("Erro ao carregar dados", error);
        }
      };
      carregarDados();
    }, []),
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Header
        saldoTotal={resumo.total}
        mostrarValores={mostrarValores}
        onToggleValores={toggleVisibilidade}
        nomeUsuario={nomeUsuario} // <-- Passando o nome dinâmico para o componente
      />

      <View style={styles.resumoContainer}>
        <View style={[styles.cardResumo, { borderLeftColor: "#10B981" }]}>
          <Text style={styles.resumoLabel}>Entradas</Text>
          <Text style={styles.valorEntrada}>
            R$ {mostrarValores ? resumo.entradas : "••••"}
          </Text>
        </View>
        <View style={[styles.cardResumo, { borderLeftColor: "#EF4444" }]}>
          <Text style={styles.resumoLabel}>Saídas</Text>
          <Text style={styles.valorSaida}>
            R$ {mostrarValores ? resumo.saidas : "••••"}
          </Text>
        </View>
      </View>

      <Text style={styles.tituloSessao}>Últimas Movimentações</Text>

      <FlatList
        data={transacoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const estiloCat = obterEstiloCategoria(item.categoria);
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Detalhes", { item: item })}
            >
              <View style={styles.itemGasto}>
                <View
                  style={[
                    styles.iconeContainer,
                    { backgroundColor: estiloCat.corFundo },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={estiloCat.icone as any}
                    size={24}
                    color={estiloCat.corIcone}
                  />
                </View>
                <View style={styles.textosContainer}>
                  <Text style={styles.itemDescricao} numberOfLines={1}>
                    {item.descricao}
                  </Text>
                  <Text style={styles.itemCategoria}>
                    {item.categoria || item.tipo}
                  </Text>
                  <Text style={styles.dataHoraTexto}>{item.dataHora}</Text>
                </View>
                <Text
                  style={[
                    styles.itemValor,
                    { color: item.tipo === "Entrada" ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {item.tipo === "Entrada" ? "+" : "-"} R${" "}
                  {mostrarValores ? parseFloat(item.valor).toFixed(2) : "••••"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhuma transação registrada ainda.</Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity
        style={styles.botaoAdd}
        onPress={() => navigation.navigate("Cadastro")}
      >
        <Text style={styles.textoBotaoAdd}>+</Text>
      </TouchableOpacity>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="home" size={28} color="#0056b3" />
          <Text style={styles.menuTextAtivo}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Carteira")}
        >
          <MaterialCommunityIcons
            name="wallet-outline"
            size={28}
            color="#9CA3AF"
          />
          <Text style={styles.menuText}>Carteira</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Perfil")}
        >
          <MaterialCommunityIcons
            name="account-outline"
            size={28}
            color="#9CA3AF"
          />
          <Text style={styles.menuText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  resumoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 25,
  },
  cardResumo: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 18,
    borderRadius: 12,
    borderLeftWidth: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resumoLabel: { fontSize: 12, color: "#666", marginBottom: 5 },
  valorEntrada: { fontSize: 18, color: "#10B981", fontWeight: "bold" },
  valorSaida: { fontSize: 18, color: "#EF4444", fontWeight: "bold" },
  tituloSessao: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 15,
    color: "#333",
  },
  itemGasto: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  iconeContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textosContainer: { flex: 1, justifyContent: "center" },
  itemDescricao: { fontSize: 16, fontWeight: "bold", color: "#1F2937" },
  itemCategoria: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  dataHoraTexto: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  itemValor: { fontSize: 16, fontWeight: "bold", marginLeft: 10 },
  vazio: { textAlign: "center", marginTop: 50, color: "#999", fontSize: 16 },
  botaoAdd: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    backgroundColor: "#0056b3",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  textoBotaoAdd: { color: "#fff", fontSize: 35, fontWeight: "300" },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom: 5,
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  menuItem: { flex: 1, justifyContent: "center", alignItems: "center" },
  menuText: { fontSize: 12, color: "#9CA3AF", marginTop: 2, fontWeight: "500" },
  menuTextAtivo: {
    fontSize: 12,
    color: "#0056b3",
    marginTop: 2,
    fontWeight: "bold",
  },
});

export default DashboardScreen;
