import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@billy_financas";

export const FinanceService = {
  transacoes: [] as any[],

  // 1. Carrega os dados do celular para a memória do app
  async carregarDados(): Promise<void> {
    try {
      const dados = await AsyncStorage.getItem(STORAGE_KEY);
      if (dados) {
        this.transacoes = JSON.parse(dados);
      }
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    }
  },

  // 2. Retorna a lista atual
  listarTodas(): any[] {
    // Retorna invertido para o mais recente aparecer no topo da lista
    return [...this.transacoes].reverse();
  },

  // 3. Adiciona uma nova despesa/entrada
  async adicionar(novaTransacao: any): Promise<void> {
    try {
      this.transacoes.push(novaTransacao);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.transacoes));
    } catch (error) {
      console.error("Erro ao salvar transação", error);
    }
  },

  // 4. Exclui um registro existente
  // 4. Exclui um registro existente direto da fonte (AsyncStorage)
  async remover(id: string): Promise<void> {
    try {
      const dados = await AsyncStorage.getItem(STORAGE_KEY);
      let lista = dados ? JSON.parse(dados) : [];

      // Forçamos ambos a virarem String para evitar conflito de tipo (Texto vs Número)
      lista = lista.filter((item: any) => String(item.id) !== String(id));

      this.transacoes = lista; // Atualiza a memória
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista)); // Salva no celular
    } catch (error) {
      console.error("Erro ao remover transação", error);
    }
  },

  // 5. Atualiza um registro existente direto da fonte
  async atualizar(transacaoEditada: any): Promise<void> {
    try {
      const dados = await AsyncStorage.getItem(STORAGE_KEY);
      let lista = dados ? JSON.parse(dados) : [];

      const index = lista.findIndex(
        (item: any) => String(item.id) === String(transacaoEditada.id),
      );

      if (index !== -1) {
        lista[index] = transacaoEditada;
        this.transacoes = lista; // Atualiza a memória
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista)); // Salva no celular
      }
    } catch (error) {
      console.error("Erro ao atualizar transação", error);
    }
  },

  // 6. Calcula a matemática do Dashboard
  calcularBalanco() {
    let entradas = 0;
    let saidas = 0;

    this.transacoes.forEach((t: any) => {
      if (t.tipo === "Entrada") {
        entradas += parseFloat(t.valor);
      } else if (t.tipo === "Saída") {
        saidas += parseFloat(t.valor);
      }
    });

    const total = entradas - saidas;

    return {
      entradas: entradas.toFixed(2),
      saidas: saidas.toFixed(2),
      total: total.toFixed(2),
    };
  },
};
