import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { FinanceService } from "../services/FinanceService";

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

const mesesNomes = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function HistoricoMensalScreen({ navigation }: any) {
  const [listaCompleta, setListaCompleta] = useState<any[]>([]);
  const [mesReferencia, setMesReferencia] = useState(new Date());

  const [totalGasto, setTotalGasto] = useState(0);
  const [categoriasAgrupadas, setCategoriasAgrupadas] = useState<any[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [detalhesCategoria, setDetalhesCategoria] = useState<any[]>([]);
  useFocusEffect(
    useCallback(() => {
      const carregarBanco = async () => {
        const lista = await FinanceService.carregarDados();
        setListaCompleta(lista || []);
      };
      carregarBanco();
    }, []),
  );

  useEffect(() => {
    const ano = mesReferencia.getFullYear();
    const mes = String(mesReferencia.getMonth() + 1).padStart(2, "0");
    const anoMesAlvo = `${ano}-${mes}`;

    const saidasDoMes = listaCompleta.filter((t: any) => {
      if (!t.createdAt || t.tipo !== "Saída") return false;
      return t.createdAt.startsWith(anoMesAlvo);
    });

    let somaTotal = 0;
    const dicionarioCategorias: { [key: string]: number } = {};

    saidasDoMes.forEach((t: any) => {
      const valor = parseFloat(t.valor || 0);
      somaTotal += valor;

      const cat = t.categoria || "Outros";
      dicionarioCategorias[cat] = (dicionarioCategorias[cat] || 0) + valor;
    });

    const listaFormatada = Object.keys(dicionarioCategorias).map((chave) => ({
      id: chave,
      nome: chave,
      valorTotal: dicionarioCategorias[chave],
      porcentagem:
        somaTotal > 0 ? (dicionarioCategorias[chave] / somaTotal) * 100 : 0,
    }));

    listaFormatada.sort((a, b) => b.valorTotal - a.valorTotal);

    setTotalGasto(somaTotal);
    setCategoriasAgrupadas(listaFormatada);
  }, [mesReferencia, listaCompleta]);

  const irParaMesAnterior = () => {
    setMesReferencia(
      new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() - 1, 1),
    );
  };

  const irParaMesProximo = () => {
    setMesReferencia(
      new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 1),
    );
  };

  const abrirDetalhesCategoria = (categoria: string) => {
    const ano = mesReferencia.getFullYear();
    const mes = String(mesReferencia.getMonth() + 1).padStart(2, "0");
    const anoMesAlvo = `${ano}-${mes}`;

    const itensCategoria = listaCompleta.filter((t: any) => {
      if (!t.createdAt || t.tipo !== "Saída") return false;
      const cat = t.categoria || "Outros";
      return cat === categoria && t.createdAt.startsWith(anoMesAlvo);
    });

    setCategoriaSelecionada(categoria);
    setDetalhesCategoria(itensCategoria);
    setModalVisivel(true);
  };

  const nomeMesExibicao = `${mesesNomes[mesReferencia.getMonth()]} de ${mesReferencia.getFullYear()}`;

  // Substituímos a SafeAreaView por View normal, pois agora controlamos o recuo pelo padding do cabeçalho
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* CABEÇALHO PADRÃO DO APP (Azul, arredondado e descido da câmera) */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Resumo Mensal</Text>

        <View style={styles.seletorMes}>
          <TouchableOpacity onPress={irParaMesAnterior} style={styles.setaBtn}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={32}
              color="#fff"
            />
          </TouchableOpacity>

          <Text style={styles.nomeMes}>{nomeMesExibicao}</Text>

          <TouchableOpacity onPress={irParaMesProximo} style={styles.setaBtn}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={32}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardTotal}>
        <Text style={styles.labelTotal}>Total Gasto no Mês</Text>
        <Text style={styles.valorTotal}>R$ {totalGasto.toFixed(2)}</Text>
      </View>

      <Text style={styles.sessaoTitulo}>Gastos por Categoria</Text>

      <FlatList
        data={categoriasAgrupadas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.textoVazio}>
            Nenhum gasto registrado neste mês.
          </Text>
        }
        renderItem={({ item }) => {
          const estiloCat = obterEstiloCategoria(item.nome);
          return (
            // 🌟 AGORA É UM BOTÃO CLICÁVEL 🌟
            <TouchableOpacity
              style={styles.itemCategoria}
              activeOpacity={0.7}
              onPress={() => abrirDetalhesCategoria(item.nome)}
            >
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

              <View style={styles.infoContainer}>
                <Text style={styles.nomeCategoria}>{item.nome}</Text>
                <Text style={styles.porcentagemTexto}>
                  {item.porcentagem.toFixed(0)}% do total
                </Text>
              </View>

              <Text style={styles.valorCategoria}>
                R$ {item.valorTotal.toFixed(2)}
              </Text>

              {/* Ícone de seta indicando que pode clicar */}
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#D1D5DB"
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.bottomBar}>
        {/* 🌟 MODAL DE DETALHES DA CATEGORIA 🌟 */}
        <Modal visible={modalVisivel} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Gastos com {categoriaSelecionada}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisivel(false)}
                  style={styles.btnFecharModal}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={detalhesCategoria}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <View style={styles.itemDetalhe}>
                    <View style={styles.infoDetalhe}>
                      <Text style={styles.descDetalhe} numberOfLines={1}>
                        {item.descricao}
                      </Text>
                      <Text style={styles.dataDetalhe}>{item.dataHora}</Text>
                    </View>
                    <Text style={styles.valorDetalhe}>
                      - R$ {parseFloat(item.valor).toFixed(2)}
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <MaterialCommunityIcons
            name="home-outline"
            size={28}
            color="#9CA3AF"
          />
          <Text style={styles.menuText}>Início</Text>
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

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons
            name="calendar-month"
            size={28}
            color="#0056b3"
          />
          <Text style={styles.menuTextAtivo}>Histórico</Text>
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },

  // CABEÇALHO ATUALIZADO
  header: {
    backgroundColor: "#0056b3", // Azul principal do App
    paddingHorizontal: 25,
    paddingTop: 50, // RECUO DO NOTCH DA CÂMERA AQUI
    paddingBottom: 20,
    borderBottomLeftRadius: 30, // Bordas arredondadas como na Home e Carteira
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },

  seletorMes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
  },
  setaBtn: { padding: 5 },
  nomeMes: { fontSize: 18, fontWeight: "bold", color: "#fff" }, // Textos e botões brancos para contraste

  // CARD CENTRAL
  cardTotal: {
    backgroundColor: "#071ff7",
    margin: 20,
    padding: 22,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  labelTotal: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  valorTotal: { color: "#fff", fontSize: 32, fontWeight: "bold", marginTop: 5 },

  sessaoTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 20,
    marginBottom: 15,
  },
  itemCategoria: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    borderRadius: 14,
    elevation: 1,
  },
  iconeContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  infoContainer: { flex: 1 },
  nomeCategoria: { fontSize: 16, fontWeight: "bold", color: "#1F2937" },
  porcentagemTexto: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  valorCategoria: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 10,
  },
  textoVazio: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 40,
    fontSize: 15,
  },

  bottomBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
  btnFecharModal: {
    padding: 8,
    borderRadius: 12,
  },
  itemDetalhe: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  infoDetalhe: {
    flex: 1,
    marginRight: 12,
  },
  descDetalhe: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  dataDetalhe: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  valorDetalhe: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#DC2626",
  },
});
