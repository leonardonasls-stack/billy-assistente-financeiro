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

// IMPORTAÇÕES DO FIREBASE
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../services/firebaseConfig";

// ESQUEMAS DE VALIDAÇÃO DINÂMICOS
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

  // MÁSCARA AUTOMÁTICA DE DATA
  const aplicarMascaraData = (texto: string) => {
    const apenasNumeros = texto.replace(/\D/g, "");
    const numerosLimitados = apenasNumeros.substring(0, 8);

    if (numerosLimitados.length <= 2) return numerosLimitados;
    if (numerosLimitados.length <= 4) {
      return `${numerosLimitados.substring(0, 2)}/${numerosLimitados.substring(2)}`;
    }
    return `${numerosLimitados.substring(0, 2)}/${numerosLimitados.substring(2, 4)}/${numerosLimitados.substring(4)}`;
  };

  // INICIALIZAÇÃO DA BIOMETRIA 100% OFFLINE-FIRST CORRIGIDA
  // INICIALIZAÇÃO DA BIOMETRIA
  // INICIALIZAÇÃO DA BIOMETRIA
  useEffect(() => {
    const iniciarBiometria = async () => {
      const ativa = await AuthService.obterPreferenciaBiometria();
      setBiometriaAtiva(ativa);

      if (ativa) {
        const sucesso = await AuthService.autenticarBiometria();
        if (sucesso) {
          const perfilLocal = await UserService.obterPerfilLocal();

          // Regra inteligente: se tem nome no cofre, tá ancorado e pode entrar!
          if (perfilLocal && perfilLocal.nome) {
            navigation.navigate("Dashboard");
          } else {
            Alert.alert(
              "Configuração Inicial",
              "Por favor, realize o primeiro login com e-mail e senha para sincronizar seu dispositivo.",
            );
          }
        }
      }
    };
    iniciarBiometria();
  }, []);

  // DISPARO MANUAL
  const dispararBiometriaNovamente = async () => {
    const sucesso = await AuthService.autenticarBiometria();
    if (sucesso) {
      const perfilLocal = await UserService.obterPerfilLocal();
      if (perfilLocal && perfilLocal.nome) {
        navigation.navigate("Dashboard");
      } else {
        Alert.alert(
          "Aviso",
          "Por favor, faça o login manual com e-mail e senha uma primeira vez.",
        );
      }
    }
  };
  // LÓGICA DE AUTENTICAÇÃO ATUALIZADA E BLINDADA
  const handleAutenticacao = async (values: any) => {
    setLoading(true);
    try {
      if (isLoginMode) {
        // FLUXO DE LOGIN CONVENCIONAL
        const userCredential = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password,
        );

        // 1. Tenta baixar os dados existentes na nuvem
        await UserService.baixarPerfilNuvem(userCredential.user.uid);

        // 2. GARANTIA DE PERSISTÊNCIA LOCAL (Evita o ciclo infinito da biometria)
        const perfilExistente = (await UserService.obterPerfilLocal()) || {};
        const perfilConsolidado = {
          ...perfilExistente,
          uid: userCredential.user.uid,
          email: values.email,
          nome: perfilExistente.nome || "Usuário", // Fallback seguro caso esteja totalmente offline
        };

        await UserService.salvarPerfilLocal(perfilConsolidado);
        navigation.navigate("Dashboard");
      } else {
        // FLUXO DE CADASTRO NOVO
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password,
        );

        const novoPerfil = {
          uid: userCredential.user.uid,
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

                      <TextInput
                        style={styles.input}
                        placeholder="Data de Nascimento (DD/MM/AAAA)"
                        placeholderTextColor="#666"
                        value={values.dataNascimento}
                        onChangeText={(texto) => {
                          const dataFormatada = aplicarMascaraData(texto);
                          setFieldValue("dataNascimento", dataFormatada);
                        }}
                        onBlur={handleBlur("dataNascimento")}
                        keyboardType="numeric"
                        maxLength={10}
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
