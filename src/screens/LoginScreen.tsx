import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import {
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
import { loginSchema } from "../schemas/loginSchema";
import { AuthService } from "../services/AuthService";

const LoginScreen = ({ navigation }: any) => {
  const [biometriaAtiva, setBiometriaAtiva] = useState(false);

  // 1. INICIALIZAÇÃO DA BIOMETRIA
  useEffect(() => {
    const iniciarBiometria = async () => {
      const ativa = await AuthService.obterPreferenciaBiometria();
      setBiometriaAtiva(ativa);

      // Se estiver ativa, tenta ler a digital/rosto assim que o app abre
      if (ativa) {
        const sucesso = await AuthService.autenticarBiometria();
        if (sucesso) {
          navigation.navigate("Dashboard");
        }
      }
    };
    iniciarBiometria();
  }, []);

  // Função caso o usuário queira disparar a biometria manualmente no botão
  const dispararBiometriaNovamente = async () => {
    const sucesso = await AuthService.autenticarBiometria();
    if (sucesso) {
      navigation.navigate("Dashboard");
    }
  };

  // 2. LÓGICA MANUAL (Formik)
  const handleLogin = async (values: any) => {
    console.log("Dados validados pelo Yup prontos para envio:", values);

    if (
      values.email.toLowerCase() === "admin@billy.com" &&
      values.password === "123456"
    ) {
      navigation.navigate("Dashboard");
    } else {
      Alert.alert("Erro", "Usuário ou senha inválidos.");
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

            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={loginSchema}
              onSubmit={handleLogin}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <View style={{ width: "100%" }}>
                  <TextInput
                    style={[
                      styles.input,
                      touched.email && errors.email ? styles.inputError : null,
                    ]}
                    placeholder="E-mail ou Usuário"
                    placeholderTextColor="#666"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    autoCapitalize="none"
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
                    style={styles.botao}
                    onPress={() => handleSubmit()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.textoBotao}>Acessar Sistema</Text>
                  </TouchableOpacity>

                  {/* BOTÃO DA BIOMETRIA (Só aparece se ativado no perfil) */}
                  {biometriaAtiva && (
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
  background: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#0056b3",
    textAlign: "center",
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
  textoBotao: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    color: "#333",
  },
  inputError: {
    borderColor: "#E74C3C",
    borderWidth: 2,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 5,
    alignSelf: "flex-start",
    fontWeight: "bold",
  },
  // --- Estilos da Biometria ---
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
