import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const PROFILE_KEY = "@billy_user_profile";

export const UserService = {
  // Salva o perfil no celular para acesso instantâneo
  async salvarPerfilLocal(perfil: any) {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(perfil));
    } catch (error) {
      console.error("Erro ao salvar perfil local:", error);
    }
  },

  // Busca o perfil que está salvo no celular
  async obterPerfilLocal() {
    try {
      const dados = await AsyncStorage.getItem(PROFILE_KEY);
      return dados ? JSON.parse(dados) : null;
    } catch (error) {
      console.error("Erro ao obter perfil local:", error);
      return null;
    }
  },

  // Sincroniza o perfil com a nuvem em segundo plano (Sem travar a tela)
  async sincronizarPerfilNuvem(uid: string, perfil: any) {
    try {
      const userRef = doc(db, "usuarios", uid);
      await setDoc(userRef, perfil, { merge: true });
      console.log("Perfil sincronizado com o Firestore!");
    } catch (error) {
      console.error("Erro ao sincronizar perfil na nuvem:", error);
    }
  },

  // Baixa o perfil da nuvem no momento do Login
  async baixarPerfilNuvem(uid: string) {
    try {
      const userRef = doc(db, "usuarios", uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const perfil = docSnap.data();
        await this.salvarPerfilLocal(perfil);
        return perfil;
      }
    } catch (error) {
      console.error("Erro ao baixar perfil da nuvem:", error);
    }
    return null;
  },

  // Limpa os dados do celular quando o usuário faz Logout
  async limparPerfilLocal() {
    await AsyncStorage.removeItem(PROFILE_KEY);
  },
};
