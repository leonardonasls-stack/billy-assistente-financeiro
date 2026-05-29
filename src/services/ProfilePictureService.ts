import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const PROFILE_PIC_KEY = "@billy_profile_pic_uri";

export const ProfilePictureService = {
  // 1. Pede permissão e abre a Câmera
  async tirarFoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permissão de câmera negada.");
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Permite cortar a foto redonda
      aspect: [1, 1],
      quality: 0.5, // Comprime para não ocupar muito espaço
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  },

  // 2. Pede permissão e abre a Galeria
  async escolherDaGaleria(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permissão de galeria negada.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  },

  // 3. Salva o URI no celular
  async salvarFotoUri(uri: string): Promise<void> {
    await AsyncStorage.setItem(PROFILE_PIC_KEY, uri);
  },

  // 4. Lê o URI salvo
  async obterFotoUri(): Promise<string | null> {
    return await AsyncStorage.getItem(PROFILE_PIC_KEY);
  },

  // 5. Remove a foto
  async removerFoto(): Promise<void> {
    await AsyncStorage.removeItem(PROFILE_PIC_KEY);
  },
};
