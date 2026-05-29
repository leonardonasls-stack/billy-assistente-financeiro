import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AuthService } from "../services/AuthService";
import { ProfilePictureService } from "../services/ProfilePictureService";

const PerfilScreen = ({ navigation }: any) => {
  const [biometriaAtiva, setBiometriaAtiva] = useState(false);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [modoEscuro, setModoEscuro] = useState(false);

  // Estado para a foto de perfil
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [carregandoFoto, setCarregandoFoto] = useState(false);

  // Simulando dados do usuário
  const usuario = {
    nome: "Sandero Silva",
    email: "sandero.billy@email.com",
    dataNascimento: "12/05/1995",
    cpf: "123.456.789-00",
  };

  useEffect(() => {
    // Carrega preferência de biometria
    AuthService.obterPreferenciaBiometria().then(setBiometriaAtiva);

    // Carrega a foto de perfil salva
    ProfilePictureService.obterFotoUri().then(setFotoUri);
  }, []);

  const toggleBiometria = async (novoStatus: boolean) => {
    const suporte = await AuthService.verificarSuporteHardware();
    if (!suporte && novoStatus === true) {
      Alert.alert("Erro", "Seu dispositivo não suporta biometria.");
      return;
    }
    setBiometriaAtiva(novoStatus);
    await AuthService.salvarPreferenciaBiometria(novoStatus);
  };

  // Lógica para alterar a foto (Câmera/Galeria)
  const handleAlterarFoto = () => {
    Alert.alert(
      "Foto de Perfil",
      "Escolha como deseja alterar sua foto:",
      [
        { text: "Tirar Foto (Câmera)", onPress: handleTirarFoto },
        { text: "Escolher da Galeria", onPress: handleEscolherGaleria },
        fotoUri
          ? {
              text: "Remover Foto Atual",
              onPress: handleRemoverFoto,
              style: "destructive",
            }
          : { text: "Cancelar", style: "cancel" },
        fotoUri ? { text: "Cancelar", style: "cancel" } : null,
      ].filter(Boolean) as any, // Remove o null caso não tenha fotoUri
    );
  };

  const processarNovaFoto = async (uri: string | null) => {
    if (uri) {
      setCarregandoFoto(true);
      try {
        await ProfilePictureService.salvarFotoUri(uri);
        setFotoUri(uri);
      } catch (e) {
        Alert.alert("Erro", "Não foi possível salvar a foto.");
      } finally {
        setCarregandoFoto(false);
      }
    }
  };

  const handleTirarFoto = async () => {
    try {
      const uri = await ProfilePictureService.tirarFoto();
      processarNovaFoto(uri);
    } catch (e: any) {
      Alert.alert("Aviso", e.message);
    }
  };

  const handleEscolherGaleria = async () => {
    try {
      const uri = await ProfilePictureService.escolherDaGaleria();
      processarNovaFoto(uri);
    } catch (e: any) {
      Alert.alert("Aviso", e.message);
    }
  };

  const handleRemoverFoto = () => {
    Alert.alert(
      "Remover Foto",
      "Tem certeza que deseja apagar sua foto de perfil atual?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            await ProfilePictureService.removerFoto();
            setFotoUri(null);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* AVATAR INTERATIVO */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleAlterarFoto}
          activeOpacity={0.8}
        >
          {carregandoFoto ? (
            <ActivityIndicator size="large" color="#0056b3" />
          ) : fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.avatarImagem} />
          ) : (
            <Text style={styles.avatarTexto}>{usuario.nome.charAt(0)}</Text>
          )}

          {/* Ícone de Câmera sobreposto */}
          <View style={styles.iconeCameraContainer}>
            <MaterialCommunityIcons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.nomeUsuario}>{usuario.nome}</Text>
        <Text style={styles.emailUsuario}>{usuario.email}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SEÇÃO 1: DADOS PESSOAIS */}
        <Text style={styles.sessaoTitulo}>Dados Pessoais</Text>
        <View style={styles.card}>
          <View style={styles.linhaInfo}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <Text style={styles.valor}>{usuario.dataNascimento}</Text>
          </View>
          <View style={styles.divisor} />
          <View style={styles.linhaInfo}>
            <Text style={styles.label}>CPF</Text>
            <Text style={styles.valor}>{usuario.cpf}</Text>
          </View>
        </View>

        {/* SEÇÃO 2: SEGURANÇA */}
        <Text style={styles.sessaoTitulo}>Segurança</Text>
        <View style={styles.card}>
          <View style={styles.linhaSwitch}>
            <View style={styles.iconeTexto}>
              <MaterialCommunityIcons
                name="fingerprint"
                size={24}
                color="#0056b3"
              />
              <Text style={styles.textoOpcao}>Login por Biometria</Text>
            </View>
            <Switch
              value={biometriaAtiva}
              onValueChange={toggleBiometria}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={biometriaAtiva ? "#2563EB" : "#F3F4F6"}
            />
          </View>

          <View style={styles.divisor} />

          <TouchableOpacity
            style={styles.linhaBotao}
            onPress={() =>
              Alert.alert("Em breve", "Tela de alterar senha na Fase 3.")
            }
          >
            <View style={styles.iconeTexto}>
              <MaterialCommunityIcons
                name="lock-reset"
                size={24}
                color="#0056b3"
              />
              <Text style={styles.textoOpcao}>Alterar Senha</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        {/* SEÇÃO 3: PREFERÊNCIAS */}
        <Text style={styles.sessaoTitulo}>Preferências</Text>
        <View style={styles.card}>
          <View style={styles.linhaSwitch}>
            <View style={styles.iconeTexto}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color="#0056b3"
              />
              <Text style={styles.textoOpcao}>Notificações de Gastos</Text>
            </View>
            <Switch
              value={notificacoesAtivas}
              onValueChange={setNotificacoesAtivas}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
            />
          </View>

          <View style={styles.divisor} />

          <View style={styles.linhaSwitch}>
            <View style={styles.iconeTexto}>
              <MaterialCommunityIcons
                name="theme-light-dark"
                size={24}
                color="#0056b3"
              />
              <Text style={styles.textoOpcao}>Modo Escuro (Beta)</Text>
            </View>
            <Switch
              value={modoEscuro}
              onValueChange={setModoEscuro}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
            />
          </View>
        </View>

        {/* BOTÃO SAIR */}
        <TouchableOpacity
          style={styles.botaoSair}
          onPress={() => navigation.navigate("Login")}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
          <Text style={styles.textoSair}>Sair da Conta</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BARRA INFERIOR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <MaterialCommunityIcons
            name="home-outline"
            size={28}
            color="#9CA3AF"
          />
          <Text style={styles.menuText}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Carteira")}
        >
          <MaterialCommunityIcons
            name="wallet-outline"
            size={28}
            color="#9CA3AF"
          />
          <Text style={styles.menuText}>Carteira</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="account" size={28} color="#0056b3" />
          <Text style={styles.menuTextAtivo}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    backgroundColor: "#0056b3",
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },

  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 6,
    position: "relative",
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
  },
  avatarImagem: { width: "100%", height: "100%" },
  avatarTexto: { fontSize: 36, fontWeight: "bold", color: "#0056b3" },
  iconeCameraContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0056b3",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  nomeUsuario: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  emailUsuario: { color: "#D1D5DB", fontSize: 14, marginTop: 5 },

  scrollContent: { padding: 20 },
  sessaoTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 15,
    marginLeft: 5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  linhaInfo: { paddingVertical: 10 },
  label: { fontSize: 12, color: "#9CA3AF", marginBottom: 4 },
  valor: { fontSize: 16, color: "#1F2937", fontWeight: "500" },

  linhaSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  linhaBotao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconeTexto: { flexDirection: "row", alignItems: "center" },
  textoOpcao: {
    fontSize: 16,
    color: "#1F2937",
    marginLeft: 15,
    fontWeight: "500",
  },

  divisor: { height: 1, backgroundColor: "#F3F4F6", width: "100%" },

  botaoSair: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    padding: 15,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
  },
  textoSair: {
    color: "#EF4444",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#fff",
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom: 5,
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  menuItem: { flex: 1, justifyContent: "center", alignItems: "center" },
  menuText: { fontSize: 12, color: "#9CA3AF", marginTop: 2, fontWeight: "500" },
  menuTextAtivo: {
    fontSize: 12,
    color: "#0056b3",
    marginTop: 2,
    fontWeight: "bold",
  },
});

export default PerfilScreen;
