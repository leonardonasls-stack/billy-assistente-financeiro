import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as Yup from "yup";

import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../services/firebaseConfig";

// 1. ESQUEMAS DE VALIDAÇÃO (Agora com Sobrenome)
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("E-mail inválido").required("Informe seu e-mail"),
  password: Yup.string().required("Informe sua senha"),
});

const CadastroSchema = Yup.object().shape({
  nome: Yup.string().min(2, "Muito curto!").required("Informe seu nome"),
  sobrenome: Yup.string()
    .min(2, "Muito curto!")
    .required("Informe seu sobrenome"),
  dataNascimento: Yup.string()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/, "Formato: DD/MM/AAAA")
    .required("Informe sua data de nascimento"),
  email: Yup.string()
    .email("E-mail inválido")
    .required("Informe um e-mail válido"),
  password: Yup.string().min(6, "Mínimo 6 dígitos").required("Crie uma senha"),
});

const LoginScreen = ({ navigation }: any) => {
  const [biometriaAtiva, setBiometriaAtiva] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);

  // Função para aplicar a máscara de data (DD/MM/AAAA) automaticamente
  const aplicarMascaraData = (texto: string) => {
    // Remove tudo o que não for número
    const apenasNumeros = texto.replace(/\D/g, "");

    // Limita a no máximo 8 dígitos (DDMMAAAA)
    const numerosLimitados = apenasNumeros.substring(0, 8);

    // Aplica a formatação com as barras baseado no tamanho do texto
    if (numerosLimitados.length <= 2) {
      return numerosLimitados;
    }
    if (numerosLimitados.length <= 4) {
      return `${numerosLimitados.substring(0, 2)}/${numerosLimitados.substring(2)}`;
    }
    return `${numerosLimitados.substring(0, 2)}/${numerosLimitados.substring(2, 4)}/${numerosLimitados.substring(4)}`;
  };

  useEffect(() => {
    const iniciarBiometria = async () => {
      const ativa = await AuthService.obterPreferenciaBiometria();
      setBiometriaAtiva(ativa);

      if (ativa) {
        const sucesso = await AuthService.autenticarBiometria();
        if (sucesso) {
          navigation.navigate("Dashboard");
        }
      }
    };
    iniciarBiometria();
  }, []);

  const dispararBiometriaNovamente = async () => {
    const sucesso = await AuthService.autenticarBiometria();
    if (sucesso) {
      navigation.navigate("Dashboard");
    }
  };

  const handleAutenticacao = async (values: any) => {
    setLoading(true);
    try {
      if (isLoginMode) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password,
        );

        await UserService.baixarPerfilNuvem(userCredential.user.uid);
        navigation.navigate("Dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password,
        );

        // Salvando Nome e Sobrenome separados no banco de dados
        const novoPerfil = {
          nome: values.nome,
          sobrenome: values.sobrenome,
          dataNascimento: values.dataNascimento,
          email: values.email,
        };

        await UserService.salvarPerfilLocal(novoPerfil);
        UserService.sincronizarPerfilNuvem(userCredential.user.uid, novoPerfil);

        Alert.alert("Sucesso!", "Conta criada com sucesso!");
        navigation.navigate("Dashboard");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={require("../../assets/fundo-login.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.overlay}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
            />

            <Text style={styles.titulo}>Billy - O Assistente</Text>

            <Text style={styles.subtituloTexto}>
              {isLoginMode ? "Acesse sua conta" : "Crie sua conta no Firebase"}
            </Text>

            <Formik
              initialValues={{
                email: "",
                password: "",
                nome: "",
                sobrenome: "",
                dataNascimento: "",
              }}
              validationSchema={isLoginMode ? LoginSchema : CadastroSchema}
              onSubmit={handleAutenticacao}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                setFieldValue,
                values,
                errors,
                touched,
                resetForm,
              }) => (
                <View style={{ width: "100%" }}>
                  {!isLoginMode && (
                    <>
                      {/* CAIXA DE NOME */}
                      <TextInput
                        style={styles.input}
                        placeholder="Nome"
                        placeholderTextColor="#666"
                        value={values.nome}
                        onChangeText={handleChange("nome")}
                        onBlur={handleBlur("nome")}
                      />
                      {touched.nome && errors.nome && (
                        <Text style={styles.errorText}>
                          {String(errors.nome)}
                        </Text>
                      )}

                      {/* CAIXA DE SOBRENOME */}
                      <TextInput
                        style={styles.input}
                        placeholder="Sobrenome"
                        placeholderTextColor="#666"
                        value={values.sobrenome}
                        onChangeText={handleChange("sobrenome")}
                        onBlur={handleBlur("sobrenome")}
                      />
                      {touched.sobrenome && errors.sobrenome && (
                        <Text style={styles.errorText}>
                          {String(errors.sobrenome)}
                        </Text>
                      )}

                      {/* CAIXA DE DATA DE NASCIMENTO */}
                      <TextInput
                        style={styles.input}
                        placeholder="Data de Nascimento (DD/MM/AAAA)"
                        placeholderTextColor="#666"
                        value={values.dataNascimento}
                        // MUDANÇA AQUI: Mascara o texto antes de salvar no Formik
                        onChangeText={(texto) => {
                          const dataFormatada = aplicarMascaraData(texto);
                          setFieldValue("dataNascimento", dataFormatada);
                        }}
                        onBlur={handleBlur("dataNascimento")}
                        keyboardType="numeric"
                        maxLength={10} // Evita que o usuário digite números a mais
                      />
                      {touched.dataNascimento && errors.dataNascimento && (
                        <Text style={styles.errorText}>
                          {String(errors.dataNascimento)}
                        </Text>
                      )}
                    </>
                  )}

                  <TextInput
                    style={[
                      styles.input,
                      touched.email && errors.email ? styles.inputError : null,
                    ]}
                    placeholder="E-mail"
                    placeholderTextColor="#666"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{String(errors.email)}</Text>
                  )}

                  <TextInput
                    style={[
                      styles.input,
                      touched.password && errors.password
                        ? styles.inputError
                        : null,
                    ]}
                    placeholder="Senha"
                    placeholderTextColor="#666"
                    secureTextEntry={true}
                    value={values.password}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                  />
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>
                      {String(errors.password)}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.botao,
                      !isLoginMode && styles.botaoCadastroMode,
                    ]}
                    onPress={() => handleSubmit()}
                    activeOpacity={0.7}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.textoBotao}>
                        {isLoginMode ? "Entrar" : "Finalizar Cadastro"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botaoAlternar}
                    onPress={() => {
                      resetForm();
                      setIsLoginMode(!isLoginMode);
                    }}
                  >
                    <Text style={styles.textoAlternar}>
                      {isLoginMode
                        ? "Não tem uma conta? Cadastre-se"
                        : "Já possui conta? Faça o Login"}
                    </Text>
                  </TouchableOpacity>

                  {biometriaAtiva && isLoginMode && (
                    <TouchableOpacity
                      style={styles.botaoBiometria}
                      onPress={dispararBiometriaNovamente}
                    >
                      <MaterialCommunityIcons
                        name="fingerprint"
                        size={40}
                        color="#0056b3"
                      />
                      <Text style={styles.textoBiometria}>
                        Entrar com Digital
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Formik>

            <Text style={styles.footer}>LLSystem</Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrollContainer: { flexGrow: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: { width: 120, height: 120, marginBottom: 20, borderRadius: 60 },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0056b3",
    textAlign: "center",
  },
  subtituloTexto: {
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 30,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    height: 55,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
  },
  botao: {
    width: "100%",
    height: 50,
    backgroundColor: "#0056b3",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    elevation: 3,
  },
  botaoCadastroMode: {
    backgroundColor: "#10B981",
  },
  textoBotao: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  botaoAlternar: { marginTop: 20, alignItems: "center" },
  textoAlternar: {
    color: "#0056b3",
    fontSize: 15,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  footer: { marginTop: 40, fontSize: 12, color: "#333", fontWeight: "bold" },
  inputError: { borderColor: "#E74C3C", borderWidth: 2 },
  errorText: {
    color: "#E74C3C",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 5,
    alignSelf: "flex-start",
    fontWeight: "bold",
  },
  botaoBiometria: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    padding: 10,
  },
  textoBiometria: {
    color: "#0056b3",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
});

export default LoginScreen;
