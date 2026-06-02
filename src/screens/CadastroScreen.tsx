import { Formik } from "formik";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as Yup from "yup";
import { FinanceService } from "../services/FinanceService";

const MovimentacaoSchema = Yup.object().shape({
  descricao: Yup.string().min(3, "Muito curto!").required("Informe o que é"),
  valor: Yup.number()
    .positive("Valor deve ser positivo")
    .required("Informe o valor"),
  tipo: Yup.string().required("Selecione Entrada ou Saída"),
  categoria: Yup.string().required("Selecione uma categoria"),
});

// Nossas duas listas separadas e inteligentes!
const categoriasSaida = [
  "Alimentação",
  "Transporte",
  "Lazer",
  "Educação",
  "Moradia",
  "Saúde",
  "Outros",
];
const categoriasEntrada = [
  "Salário",
  "Vale Alimentação",
  "Vale Refeição",
  "Bônus/Flash",
  "Outros",
];

const CadastroScreen = ({ navigation }: any) => {
  const [modalCategoriaVisivel, setModalCategoriaVisivel] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Nova Movimentação</Text>

      <Formik
        initialValues={{ descricao: "", valor: "", tipo: "", categoria: "" }}
        validationSchema={MovimentacaoSchema}
        onSubmit={async (valores, { resetForm }) => {
          try {
            // Cria a data e hora formatada automaticamente (ex: "24/10/2023 - 14:30")
            const agora = new Date();
            const dataFormatada = `${agora.getDate().toString().padStart(2, "0")}/${(agora.getMonth() + 1).toString().padStart(2, "0")}/${agora.getFullYear()} - ${agora.getHours().toString().padStart(2, "0")}:${agora.getMinutes().toString().padStart(2, "0")}`;

            // Junta os valores do form com a data gerada
            const transacaoCompleta = {
              ...valores,
              dataHora: dataFormatada,
            };

            await FinanceService.salvarTransacao(transacaoCompleta);

            // Sucesso!
            Alert.alert("Sucesso", "Movimentação registrada!");
            resetForm();
            navigation.navigate("Dashboard");
          } catch (error: any) {
            // Agora o erro real será exibido na tela para sabermos exatamente o que falhou
            Alert.alert(
              "Erro ao Salvar",
              error.message ||
                "Ocorreu um erro desconhecido ao tentar salvar no banco de dados.",
            );
            console.error("ERRO NO CADASTRO:", error);
          }
        }}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
          values,
          errors,
          touched,
        }) => {
          // Lógica que decide qual lista mostrar no modal baseado na escolha do Tipo
          const listaCategoriasAtiva =
            values.tipo === "Entrada" ? categoriasEntrada : categoriasSaida;

          return (
            <View style={styles.card}>
              <Text style={styles.label}>Tipo de Movimentação</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[
                    styles.tipoBotao,
                    values.tipo === "Entrada" && styles.botaoEntrada,
                  ]}
                  onPress={() => {
                    setFieldValue("tipo", "Entrada");
                    setFieldValue("categoria", ""); // Limpa a categoria se mudar o tipo
                  }}
                >
                  <Text
                    style={
                      values.tipo === "Entrada"
                        ? styles.textoBranco
                        : styles.textoEntrada
                    }
                  >
                    Entrada
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tipoBotao,
                    values.tipo === "Saída" && styles.botaoSaida,
                  ]}
                  onPress={() => {
                    setFieldValue("tipo", "Saída");
                    setFieldValue("categoria", ""); // Limpa a categoria se mudar o tipo
                  }}
                >
                  <Text
                    style={
                      values.tipo === "Saída"
                        ? styles.textoBranco
                        : styles.textoSaida
                    }
                  >
                    Saída
                  </Text>
                </TouchableOpacity>
              </View>
              {touched.tipo && errors.tipo && (
                <Text style={styles.errorText}>{errors.tipo}</Text>
              )}

              <Text style={styles.label}>Categoria</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  !values.tipo && { opacity: 0.6 },
                ]} // Fica um pouco apagado se não escolher o tipo
                onPress={() => {
                  if (!values.tipo) {
                    Alert.alert(
                      "Aviso",
                      "Por favor, selecione primeiro se é uma Entrada ou Saída.",
                    );
                    return;
                  }
                  setModalCategoriaVisivel(true);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    values.categoria
                      ? styles.dropdownText
                      : styles.dropdownPlaceholder
                  }
                >
                  {values.categoria || "Clique para escolher..."}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
              {touched.categoria && errors.categoria && (
                <Text style={styles.errorText}>{errors.categoria}</Text>
              )}

              {/* MODAL DINÂMICO */}
              <Modal
                visible={modalCategoriaVisivel}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalCategoriaVisivel(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPressOut={() => setModalCategoriaVisivel(false)}
                >
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitulo}>
                      Selecione a Categoria
                    </Text>

                    {listaCategoriasAtiva.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={styles.modalItem}
                        onPress={() => {
                          setFieldValue("categoria", cat);
                          setModalCategoriaVisivel(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.modalItemText,
                            values.categoria === cat &&
                              styles.modalItemTextAtivo,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>

              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Pagamento, Compra..."
                onChangeText={handleChange("descricao")}
                onBlur={handleBlur("descricao")}
                value={values.descricao}
              />
              {touched.descricao && errors.descricao && (
                <Text style={styles.errorText}>{errors.descricao}</Text>
              )}

              <Text style={styles.label}>Valor (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                onChangeText={handleChange("valor")}
                onBlur={handleBlur("valor")}
                value={values.valor}
              />
              {touched.valor && errors.valor && (
                <Text style={styles.errorText}>{errors.valor}</Text>
              )}

              <TouchableOpacity
                style={styles.botaoSalvar}
                onPress={() => handleSubmit()}
              >
                <Text style={styles.textoBotaoSalvar}>Salvar Registro</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F5F7FA",
    flexGrow: 1,
    justifyContent: "center",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4B5563",
    marginTop: 15,
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tipoBotao: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  botaoEntrada: { backgroundColor: "#10B981", borderColor: "#10B981" },
  botaoSaida: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  textoBranco: { color: "#fff", fontWeight: "bold" },
  textoEntrada: { color: "#10B981" },
  textoSaida: { color: "#EF4444" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
  },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
  botaoSalvar: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 8,
    marginTop: 30,
    alignItems: "center",
  },
  textoBotaoSalvar: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#F9FAFB",
  },
  dropdownPlaceholder: { color: "#9CA3AF", fontSize: 16 },
  dropdownText: { color: "#1F2937", fontSize: 16, fontWeight: "500" },
  dropdownIcon: { color: "#6B7280", fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 15,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemText: { fontSize: 16, color: "#4B5563", textAlign: "center" },
  modalItemTextAtivo: { color: "#0056b3", fontWeight: "bold" },
});

export default CadastroScreen;
