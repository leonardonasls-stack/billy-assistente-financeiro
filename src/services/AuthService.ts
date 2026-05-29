import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

const BIOMETRIA_KEY = "@billy_biometria_ativa";

export const AuthService = {
  // Verifica se o celular suporta biometria
  async verificarSuporteHardware(): Promise<boolean> {
    const suportado = await LocalAuthentication.hasHardwareAsync();
    const cadastrado = await LocalAuthentication.isEnrolledAsync();
    return suportado && cadastrado;
  },

  // Salva a preferência do usuário (Ativado/Desativado)
  async salvarPreferenciaBiometria(status: boolean): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIA_KEY, JSON.stringify(status));
  },

  // Lê a preferência do usuário
  async obterPreferenciaBiometria(): Promise<boolean> {
    const valor = await AsyncStorage.getItem(BIOMETRIA_KEY);
    return valor ? JSON.parse(valor) : false;
  },

  // Dispara o sensor (FaceID ou Digital)
  async autenticarBiometria(): Promise<boolean> {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: "Acesse o Billy com sua biometria",
      fallbackLabel: "Usar senha",
      disableDeviceFallback: false,
    });
    return resultado.success;
  },
};
