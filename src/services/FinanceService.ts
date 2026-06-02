import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
const STORAGE_KEY = "@billy_transacoes";

export const FinanceService = {
  // ==========================================
  // 1. LEITURA (Velocidade da Luz - Offline)
  // ==========================================
  // ==========================================
  // 1. LEITURA HÍBRIDA (Nuvem + Local)
  // ==========================================
  async carregarDados() {
    try {
      const user = auth.currentUser;

      // Se o usuário estiver logado, tenta buscar as novidades da nuvem primeiro
      if (user) {
        try {
          const q = query(
            collection(db, "transacoes"),
            where("userId", "==", user.uid),
          );
          const querySnapshot = await getDocs(q);

          const transacoesNuvem = querySnapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }));

          // Se encontrou dados na nuvem, atualiza o celular e retorna ordenado
          if (transacoesNuvem.length > 0) {
            await AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(transacoesNuvem),
            );

            return transacoesNuvem.sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          }
        } catch (netError) {
          // Se cair aqui, significa que o dispositivo está sem internet (offline)
          console.log(
            "Dispositivo offline ou falha de rede. Carregando do cache local...",
          );
        }
      }

      // FALLBACK: Se estiver sem internet ou o Firestore estiver vazio, usa o AsyncStorage
      const dados = await AsyncStorage.getItem(STORAGE_KEY);
      const transacoes = dados ? JSON.parse(dados) : [];

      return transacoes.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error) {
      console.error("Erro crítico ao carregar dados: ", error);
      return [];
    }
  },

  // ==========================================
  // 2. GRAVAÇÃO (Híbrida: Celular -> Nuvem)
  // ==========================================
  async salvarTransacao(transacao: any) {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    // 1. Monta o objeto gerando um ID único no PRÓPRIO CELULAR
    const idLocal = Date.now().toString();
    const novaTransacao = {
      ...transacao,
      id: idLocal,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      // A) SALVA NO CELULAR (Imediato)
      const listaAtual = await this.carregarDados();
      listaAtual.push(novaTransacao);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listaAtual));

      // B) DISPARA O FANTASMA PARA A NUVEM
      // Note que NÃO usamos o 'await' aqui. A tela não vai esperar isso terminar!
      this.sincronizarCadastro(novaTransacao);

      return idLocal; // Retorna sucesso para a tela instantaneamente
    } catch (error) {
      console.error("Erro ao salvar localmente: ", error);
      throw error;
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
