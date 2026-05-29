import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { FinanceService } from "../services/FinanceService";

const CarteiraScreen = ({ navigation }: any) => {
  const [analise, setAnalise] = useState({
    entradas: 0,
    idealNecessidades: 0,
    idealDesejos: 0,
    gastosFixos: 0,
    gastosVariaveis: 0,
    gastoNecessidades: 0,
    gastoDesejos: 0,
    saldoLivre: 0,
    reservaIdeal: 0,
  });

  useFocusEffect(
    useCallback(() => {
      const carregarDados = async () => {
        await FinanceService.carregarDados();
        const transacoes = FinanceService.listarTodas();

        // 1. Entradas
        const entradas = transacoes
          .filter((t) => t.tipo === "Entrada")
          .reduce((acc, t) => acc + parseFloat(t.valor), 0);

        // 2. Raio-X das Necessidades (Fixas vs Variáveis)
        const categoriasFixas = ["Moradia", "Educação", "Saúde"];
        const gastosFixos = transacoes
          .filter(
            (t) => t.tipo === "Saída" && categoriasFixas.includes(t.categoria),
          )
          .reduce((acc, t) => acc + parseFloat(t.valor), 0);

        const categoriasVariaveis = ["Alimentação", "Transporte"];
        const gastosVariaveis = transacoes
          .filter(
            (t) =>
              t.tipo === "Saída" && categoriasVariaveis.includes(t.categoria),
          )
          .reduce((acc, t) => acc + parseFloat(t.valor), 0);

        const gastoNecessidades = gastosFixos + gastosVariaveis;

        // 3. Desejos
        const categoriasDesejos = ["Lazer", "Outros"];
        const gastoDesejos = transacoes
          .filter(
            (t) =>
              t.tipo === "Saída" && categoriasDesejos.includes(t.categoria),
          )
          .reduce((acc, t) => acc + parseFloat(t.valor), 0);

        const totalGastos = gastoNecessidades + gastoDesejos;
        const saldoLivre = entradas - totalGastos;

        // A Reserva Ideal é 3x o custo de vida básico da pessoa
        const reservaIdeal =
          gastoNecessidades > 0 ? gastoNecessidades * 3 : entradas * 1.5;

        setAnalise({
          entradas,
          idealNecessidades: entradas * 0.5,
          idealDesejos: entradas * 0.3,
          gastosFixos,
          gastosVariaveis,
          gastoNecessidades,
          gastoDesejos,
          saldoLivre,
          reservaIdeal,
        });
      };
      carregarDados();
    }, []),
  );

  const getPorcentagem = (gasto: number, ideal: number): any => {
    if (ideal === 0) return "0%";
    const pct = (gasto / ideal) * 100;
    return `${Math.min(pct, 100)}%`;
  };

  const corBarraNecessidade =
    analise.gastoNecessidades > analise.idealNecessidades
      ? "#EF4444"
      : "#10B981";
  const corBarraDesejo =
    analise.gastoDesejos > analise.idealDesejos ? "#EF4444" : "#10B981";

  // O CONSELHEIRO BILLY: Gera mensagens inteligentes baseadas no saldo
  // O CONSELHEIRO BILLY: Gera alertas baseados nas porcentagens reais!
  const gerarConselho = () => {
    if (analise.entradas === 0)
      return "Registre suas entradas (salário, bônus) para eu poder analisar sua saúde financeira.";

    // Calcula a porcentagem exata da renda que já foi gasta
    const pctNecessidades =
      (analise.gastoNecessidades / analise.entradas) * 100;
    const pctDesejos = (analise.gastoDesejos / analise.entradas) * 100;

    // Cenário 1: Estourou os dois limites!
    if (pctNecessidades > 50 && pctDesejos > 30) {
      return `🚨 Cuidado duplo! Suas Necessidades estão em ${pctNecessidades.toFixed(0)}% e Desejos em ${pctDesejos.toFixed(0)}%. Você ultrapassou os dois limites recomendados. Freio total nos gastos!`;
    }

    // Cenário 2: Estourou apenas os Desejos (Lazer/Compras)
    if (pctDesejos > 30) {
      return `⚠️ Alerta de Lazer: Você já comprometeu ${pctDesejos.toFixed(0)}% da sua renda com Desejos (o limite é 30%). Segure as compras não essenciais para não faltar no fim do mês!`;
    }

    // Cenário 3: Estourou apenas as Necessidades (Contas Básicas)
    if (pctNecessidades > 50) {
      return `⚠️ Alerta no Essencial: Suas Necessidades bateram ${pctNecessidades.toFixed(0)}% (o limite é 50%). Como é difícil cortar contas fixas, tente espremer os gastos variáveis (mercado/transporte).`;
    }

    // Cenário 4: Não estourou as porcentagens, mas fechou no vermelho (ex: teve um gasto "Outros" não categorizado)
    if (analise.saldoLivre < 0) {
      return `🚨 Alerta Vermelho! Você está gastando R$ ${Math.abs(analise.saldoLivre).toFixed(2)} a mais do que ganha.`;
    }

    // Cenário 5: Tudo perfeito
    return `🌟 Orçamento saudável! Você está gastando dentro dos limites e sobraram R$ ${analise.saldoLivre.toFixed(2)}. Transfira isso agora para a sua Caixinha de Emergência!`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.tituloApp}>Educação Financeira</Text>
        </View>
        <Text style={styles.subtituloHeader}>
          Aprenda a controlar seu dinheiro e construir riqueza passo a passo.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* CONSELHEIRO BILLY */}
        <View style={styles.cardConselheiro}>
          <View style={styles.linhaTituloCard}>
            <MaterialCommunityIcons
              name="robot-outline"
              size={24}
              color="#0056b3"
            />
            <Text style={[styles.tituloCard, { color: "#0056b3" }]}>
              Conselho do Billy
            </Text>
          </View>
          <Text style={styles.textoConselho}>{gerarConselho()}</Text>
        </View>

        {/* 50% NECESSIDADES (COM RAIO-X) */}
        <View style={styles.cardAnalise}>
          <View style={styles.linhaTituloCard}>
            <MaterialCommunityIcons
              name="home-heart"
              size={24}
              color="#0056b3"
            />
            <Text style={styles.tituloCard}>50% Necessidades</Text>
          </View>
          <Text style={styles.descricaoCard}>
            O seu custo de vida obrigatório.
          </Text>

          <View style={styles.linhaValores}>
            <Text style={styles.valorGasto}>
              R$ {analise.gastoNecessidades.toFixed(2)}
            </Text>
            <Text style={styles.valorIdeal}>
              de R$ {analise.idealNecessidades.toFixed(2)}
            </Text>
          </View>

          <View style={styles.barraFundo}>
            <View
              style={[
                styles.barraProgresso,
                {
                  width: getPorcentagem(
                    analise.gastoNecessidades,
                    analise.idealNecessidades,
                  ),
                  backgroundColor: corBarraNecessidade,
                },
              ]}
            />
          </View>

          {/* RAIO X */}
          <View style={styles.raioXContainer}>
            <Text style={styles.tituloRaioX}>Raio-X de Cortes:</Text>
            <View style={styles.linhaRaioX}>
              <Text style={styles.textoRaioX}>🔒 Fixas (Difícil cortar):</Text>
              <Text style={styles.valorRaioX}>
                R$ {analise.gastosFixos.toFixed(2)}
              </Text>
            </View>
            <View style={styles.linhaRaioX}>
              <Text style={styles.textoRaioX}>
                ✂️ Variáveis (Dá pra economizar):
              </Text>
              <Text style={styles.valorRaioX}>
                R$ {analise.gastosVariaveis.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* 30% DESEJOS */}
        <View style={styles.cardAnalise}>
          <View style={styles.linhaTituloCard}>
            <MaterialCommunityIcons name="shopping" size={24} color="#7C3AED" />
            <Text style={styles.tituloCard}>30% Desejos e Lazer</Text>
          </View>
          <Text style={styles.descricaoCard}>
            Saídas, assinaturas e coisas que você pode viver sem.
          </Text>

          <View style={styles.linhaValores}>
            <Text style={styles.valorGasto}>
              R$ {analise.gastoDesejos.toFixed(2)}
            </Text>
            <Text style={styles.valorIdeal}>
              de R$ {analise.idealDesejos.toFixed(2)}
            </Text>
          </View>

          <View style={styles.barraFundo}>
            <View
              style={[
                styles.barraProgresso,
                {
                  width: getPorcentagem(
                    analise.gastoDesejos,
                    analise.idealDesejos,
                  ),
                  backgroundColor: corBarraDesejo,
                },
              ]}
            />
          </View>
        </View>

        {/* A GRANDE META: RESERVA DE EMERGÊNCIA */}
        <View style={styles.cardAnalise}>
          <View style={styles.linhaTituloCard}>
            <MaterialCommunityIcons
              name="shield-check"
              size={24}
              color="#10B981"
            />
            <Text style={styles.tituloCard}>A Grande Meta</Text>
          </View>
          <Text style={styles.descricaoCard}>
            Seu primeiro objetivo financeiro é ter 3 meses do seu custo de vida
            guardados numa Caixinha.
          </Text>

          <View style={styles.caixaMeta}>
            <Text style={styles.textoMeta}>
              Sua Reserva de Emergência Ideal:
            </Text>
            <Text style={styles.valorMeta}>
              R$ {analise.reservaIdeal.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BARRA INFERIOR (BOTTOM MENU) */}
      <View style={styles.bottomBar}>
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

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="wallet" size={28} color="#0056b3" />
          <Text style={styles.menuTextAtivo}>Carteira</Text>
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
  header: {
    backgroundColor: "#0056b3",
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  tituloApp: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  subtituloHeader: {
    color: "#D1D5DB",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  content: { padding: 20 },

  cardConselheiro: {
    backgroundColor: "#E0F2FE",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  textoConselho: {
    fontSize: 15,
    color: "#0369A1",
    lineHeight: 22,
    marginTop: 5,
    fontWeight: "500",
  },

  cardAnalise: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  linhaTituloCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  tituloCard: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 10,
  },
  descricaoCard: { fontSize: 13, color: "#6B7280", marginBottom: 15 },

  linhaValores: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  valorGasto: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
  valorIdeal: { fontSize: 14, color: "#9CA3AF", marginLeft: 5 },

  barraFundo: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 5,
    overflow: "hidden",
  },
  barraProgresso: { height: "100%", borderRadius: 5 },

  raioXContainer: {
    marginTop: 15,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  tituloRaioX: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  linhaRaioX: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  textoRaioX: { fontSize: 13, color: "#4B5563" },
  valorRaioX: { fontSize: 13, fontWeight: "bold", color: "#1F2937" },

  caixaMeta: {
    backgroundColor: "#D1FAE5",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  textoMeta: { fontSize: 14, color: "#065F46", fontWeight: "500" },
  valorMeta: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#047857",
    marginTop: 5,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
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

export default CarteiraScreen;
