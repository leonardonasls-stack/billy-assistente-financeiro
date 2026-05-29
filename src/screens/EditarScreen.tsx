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

// As duas listas separadas de categorias
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

const EditarScreen = ({ route, navigation }: any) => {
  const { item } = route.params;
  const [modalCategoriaVisivel, setModalCategoriaVisivel] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Editar Movimentação</Text>

      <Formik
        initialValues={{
          descricao: String(item.descricao || ""),
          valor: String(item.valor || ""),
          tipo: String(item.tipo || ""),
          categoria: String(item.categoria || ""),
        }}
        validationSchema={MovimentacaoSchema}
        onSubmit={async (values) => {
          const transacaoAtualizada = {
            id: item.id,
            descricao: values.descricao,
            tipo: values.tipo,
            categoria: values.categoria,
            valor: values.valor.replace(",", "."),
            dataHora: item.dataHora,
          };

          await FinanceService.atualizar(transacaoAtualizada);

          Alert.alert("Sucesso", "Registro atualizado com sucesso!");
          navigation.navigate("Dashboard", { atualizado: true });
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
          // Lógica para saber qual lista mostrar baseada no tipo selecionado
          const listaCategoriasAtiva =
            values.tipo === "Entrada" ? categoriasEntrada : categoriasSaida;

          return (
            <View style={styles.card}>
              {/* TIPO DE MOVIMENTAÇÃO */}
              <Text style={styles.label}>Tipo de Movimentação</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[
                    styles.tipoBotao,
                    values.tipo === "Entrada" && styles.botaoEntrada,
                  ]}
                  onPress={() => {
                    setFieldValue("tipo", "Entrada");
                    if (values.tipo !== "Entrada")
                      setFieldValue("categoria", "");
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
                    if (values.tipo !== "Saída") setFieldValue("categoria", "");
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
                <Text style={styles.errorText}>{String(errors.tipo)}</Text>
              )}

              {/* CATEGORIA */}
              <Text style={styles.label}>Categoria</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  !values.tipo && { opacity: 0.6 },
                ]}
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
                <Text style={styles.errorText}>{String(errors.categoria)}</Text>
              )}

              {/* MODAL DE CATEGORIAS */}
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

              {/* DESCRIÇÃO */}
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.input}
                onChangeText={handleChange("descricao")}
                onBlur={handleBlur("descricao")}
                value={values.descricao}
              />
              {touched.descricao && errors.descricao && (
                <Text style={styles.errorText}>{String(errors.descricao)}</Text>
              )}

              {/* VALOR */}
              <Text style={styles.label}>Valor (R$)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                onChangeText={handleChange("valor")}
                onBlur={handleBlur("valor")}
                value={values.valor}
              />
              {touched.valor && errors.valor && (
                <Text style={styles.errorText}>{String(errors.valor)}</Text>
              )}

              {/* BOTÕES DE SALVAR E CANCELAR */}
              <View style={styles.botoesRodape}>
                <TouchableOpacity
                  style={[styles.botaoRodape, { backgroundColor: "#9CA3AF" }]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.textoBotaoRodape}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.botaoRodape, { backgroundColor: "#2563EB" }]}
                  onPress={() => handleSubmit()}
                >
                  <Text style={styles.textoBotaoRodape}>Salvar Alterações</Text>
                </TouchableOpacity>
              </View>
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
  botoesRodape: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  botaoRodape: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  textoBotaoRodape: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default EditarScreen;
