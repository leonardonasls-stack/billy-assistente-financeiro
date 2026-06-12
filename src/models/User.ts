import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

const PERFIL_KEY = "@billy_perfil";

export const UserService = {
  async obterPerfilLocal() {
    try {
      const dados = await AsyncStorage.getItem(PERFIL_KEY);
      return dados ? JSON.parse(dados) : null;
    } catch (error) {
      return null;
    }
  },

  async salvarPerfilLocal(perfil: any) {
    try {
      // A MÁGICA DA BLINDAGEM: Mescla os dados novos com os antigos para NUNCA perder o UID ancorado
      const perfilAntigo = (await this.obterPerfilLocal()) || {};
      const perfilConsolidado = { ...perfilAntigo, ...perfil };
      await AsyncStorage.setItem(PERFIL_KEY, JSON.stringify(perfilConsolidado));
    } catch (error) {
      console.error("Erro ao salvar perfil local", error);
    }
  },

  async limparPerfilLocal() {
    await AsyncStorage.removeItem(PERFIL_KEY);
  },

  async baixarPerfilNuvem(uid: string) {
    try {
      const docRef = doc(db, "usuarios", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const dadosNuvem = docSnap.data();
        // Salva os dados forçando a reinjeção do UID
        await this.salvarPerfilLocal({ ...dadosNuvem, uid: uid });
        return dadosNuvem;
      }
      return null;
    } catch (error) {
      console.error("Erro ao baixar perfil da nuvem", error);
      return null;
    }
  },

  async sincronizarPerfilNuvem(uid: string, perfil: any) {
    try {
      await setDoc(doc(db, "usuarios", uid), perfil, { merge: true });
    } catch (error) {
      console.error("Erro ao sincronizar perfil", error);
    }
  },
};
