import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    setDoc,
    where,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { UserService } from "./UserService";
const STORAGE_KEY = "@billy_transacoes";

export const FinanceService = {
  // ==========================================
  // 2. GRAVAÇÃO (Híbrida: Celular -> Nuvem)
  // ==========================================
  // ==========================================
  // 1. SALVAMENTO COM MARCAÇÃO DE SYNC
  // ==========================================
  async salvarTransacao(transacao: any) {
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      const perfilLocal = await UserService.obterPerfilLocal();
      const userId = user?.uid || perfilLocal?.uid;

      if (!userId) throw new Error("Usuário não identificado.");

      const idLocal = Date.now().toString();
      const novaTransacao = {
        ...transacao,
        id: idLocal,
        userId: userId,
        createdAt: new Date().toISOString(),
        sincronizado: false, // 👈 Nasce como FALSE porque ainda não bateu no servidor
      };

      // Salva local imediato
      const listaAtual = await this.carregarDados();
      listaAtual.push(novaTransacao);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listaAtual));

      // Dispara para o Firestore em background
      this.sincronizarCadastro(novaTransacao);

      return idLocal;
    } catch (error) {
      console.error("Erro ao salvar:", error);
      throw error;
    }
  },

  // ==========================================
  // 2. RECONCILIAÇÃO COM DETECÇÃO DE DELETADOS
  // ==========================================
  async carregarDados() {
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      const perfilLocal = await UserService.obterPerfilLocal();
      const userId = user?.uid || perfilLocal?.uid;

      // Busca o cache local atual do aparelho
      const dadosLocaisBrutos = await AsyncStorage.getItem(STORAGE_KEY);
      const transacoesLocais: any[] = dadosLocaisBrutos
        ? JSON.parse(dadosLocaisBrutos)
        : [];

      if (userId) {
        try {
          // REMOVA O orderBy DAQUI DE DENTRO
          const q = query(
            collection(db, "transacoes"),
            where("userId", "==", userId),
          );

          const querySnapshot = await getDocs(q);

          const transacoesNuvem = querySnapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data(),
            sincronizado: true,
          }));

          const mapaTransacoes = new Map();

          // PASSO A: A Nuvem é a nossa verdade absoluta para dados ativos.
          // Inserimos todas as transações da nuvem no mapa primeiro.
          transacoesNuvem.forEach((tNuvem) =>
            mapaTransacoes.set(tNuvem.id, tNuvem),
          );

          // PASSO B: Analisamos o cache do celular para tratar os deltas
          // PASSO B: Analisamos o cache do celular para tratar os deltas
          transacoesLocais.forEach((tLocal) => {
            if (!mapaTransacoes.has(tLocal.id)) {
              // A CORREÇÃO: Só protegemos o dado se ele for EXPLICITAMENTE offline (false).
              // Se for "true" ou "undefined" (registro antigo legado), ele deve ser apagado.
              if (tLocal.sincronizado === false) {
                // Cenário 1: É UM REGISTRO NOVO CRIADO OFFLINE! (Protegemos)
                mapaTransacoes.set(tLocal.id, tLocal);
              } else {
                // Cenário 2: Ele era da nuvem ou é um registro antigo que sumiu -> FOI DELETADO!
                console.log(
                  `Detectado registro fantasma/deletado na nuvem: ${tLocal.id}`,
                );
              }
            } else {
              // Se já está no mapa, fazemos a checagem normal de atualização por data
              const tNuvem = mapaTransacoes.get(tLocal.id);
              const dataLocal = new Date(tLocal.createdAt || 0).getTime();
              const dataNuvem = new Date(tNuvem.createdAt || 0).getTime();

              if (dataLocal > dataNuvem) {
                mapaTransacoes.set(tLocal.id, tLocal); // Prevalece o mais recente
              }
            }
          });

          // Converte o mapa final limpo de volta para Array
          const listaReconciliada = Array.from(mapaTransacoes.values());

          // Sobrescreve o armazenamento local com a lista perfeitamente espelhada
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(listaReconciliada),
          );

          return listaReconciliada.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        } catch (netError) {
          console.log(
            "Sem conexão para sincronizar exclusões. Usando cache local.",
          );
        }
      }

      return transacoesLocais.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error) {
      console.error("Erro crítico na sincronização: ", error);
      return [];
    }
  },

  // O "Fantasma" que salva na nuvem silenciosamente
  async sincronizarCadastro(transacao: any) {
    try {
      // Usamos setDoc em vez de addDoc para OBRIGAR o Firebase a usar o nosso ID local
      const transacaoRef = doc(db, "transacoes", transacao.id);
      await setDoc(transacaoRef, transacao);
      console.log("Sincronização invisível concluída!");
    } catch (error) {
      console.error("Erro na sincronização: ", error);
      // Aqui, num app de mercado, colocaríamos numa fila para tentar de novo se estiver sem internet.
    }
  },

  // ==========================================
  // 3. EXCLUSÃO (Híbrida: Celular -> Nuvem)
  // ==========================================
  async removerTransacao(id: string) {
    try {
      // A) APAGA DO CELULAR (Imediato)
      const listaAtual = await this.carregarDados();
      const novaLista = listaAtual.filter((t: any) => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));

      // B) DISPARA O FANTASMA PARA APAGAR NA NUVEM
      this.sincronizarExclusao(id);
    } catch (error) {
      console.error("Erro ao excluir localmente: ", error);
      throw error;
    }
  },

  // O "Fantasma" que apaga na nuvem silenciosamente
  async sincronizarExclusao(id: string) {
    try {
      const transacaoRef = doc(db, "transacoes", id);
      await deleteDoc(transacaoRef);
      console.log("Exclusão sincronizada com a nuvem!");
    } catch (error) {
      console.error("Erro ao sincronizar exclusão: ", error);
    }
  },
  // ==========================================
  // 4. ATUALIZAÇÃO (Híbrida: Celular -> Nuvem)
  // ==========================================
  async atualizarTransacao(id: string, dadosAtualizados: any) {
    try {
      // A) ATUALIZA NO CELULAR (Imediato)
      const listaAtual = await this.carregarDados();
      const index = listaAtual.findIndex((t: any) => t.id === id);

      if (index !== -1) {
        // Mescla os dados antigos com os novos
        listaAtual[index] = { ...listaAtual[index], ...dadosAtualizados };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listaAtual));
      }

      // B) DISPARA O FANTASMA PARA ATUALIZAR NA NUVEM
      this.sincronizarAtualizacao(id, dadosAtualizados);
    } catch (error) {
      console.error("Erro ao atualizar localmente: ", error);
      throw error;
    }
  },

  // O "Fantasma" que edita na nuvem silenciosamente
  // O "Fantasma" que edita na nuvem de forma resiliente
  async sincronizarAtualizacao(id: string, dadosAtualizados: any) {
    try {
      const transacaoRef = doc(db, "transacoes", id);

      // CORREÇÃO: setDoc com merge substitui o updateDoc com muito mais segurança
      await setDoc(transacaoRef, dadosAtualizados, { merge: true });

      console.log("Edição sincronizada com a nuvem com sucesso!");
    } catch (error) {
      console.error("Erro ao sincronizar edição no Firestore: ", error);
    }
  },
};
