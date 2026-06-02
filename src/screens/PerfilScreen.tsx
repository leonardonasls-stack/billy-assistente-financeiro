import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../services/AuthService";
import { FinanceService } from "../services/FinanceService";
import { auth, db } from "../services/firebaseConfig";
import { UserService } from "../services/UserService";
const PerfilScreen = ({ navigation }: any) => {
  const [perfil, setPerfil] = useState<any>(null);
  const [resumo, setResumo] = useState({
    saldo: "0.00",
    qtd: 0,
    gasto: "0.00",
  });
  const [biometriaAtiva, setBiometriaAtiva] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  // Novo estado para controlar o Modal Customizado da Foto
  const [modalFotoVisivel, setModalFotoVisivel] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const carregarDados = async () => {
        const dadosPerfil = await UserService.obterPerfilLocal();
        setPerfil(dadosPerfil);

        if (dadosPerfil && dadosPerfil.foto) {
          setFotoUri(dadosPerfil.foto);
        }

        const biometriaStatus = await AuthService.obterPreferenciaBiometria();
        setBiometriaAtiva(biometriaStatus);

        const transacoes = await FinanceService.carregarDados();
        const ent = transacoes
          .filter((t: any) => t.tipo === "Entrada")
          .reduce((acc: number, t: any) => acc + parseFloat(t.valor), 0);
        const sai = transacoes
          .filter((t: any) => t.tipo === "Saída")
          .reduce((acc: number, t: any) => acc + parseFloat(t.valor), 0);

        setResumo({
          saldo: (ent - sai).toFixed(2),
          qtd: transacoes.length,
          gasto: sai.toFixed(2),
        });
      };
      carregarDados();
    }, []),
  );

  // === FUNÇÕES SEPARADAS PARA CÂMERA E GALERIA ===
  const abrirCamera = async () => {
    setModalFotoVisivel(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "O Billy precisa de acesso à câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      salvarNovaFoto(result.assets[0].uri);
    }
  };

  const abrirGaleria = async () => {
    setModalFotoVisivel(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "O Billy precisa de acesso à galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      salvarNovaFoto(result.assets[0].uri);
    }
  };

  const salvarNovaFoto = async (uri: string) => {
    setFotoUri(uri);
    const perfilAtualizado = { ...perfil, foto: uri };
    setPerfil(perfilAtualizado);

    await UserService.salvarPerfilLocal(perfilAtualizado);

    const user = auth.currentUser;
    if (user) {
      UserService.sincronizarPerfilNuvem(user.uid, perfilAtualizado);
    }
  };
  // =====================================

  const handleToggleBiometria = async () => {
    try {
      const novoStatus = !biometriaAtiva;
      setBiometriaAtiva(novoStatus);
      await AuthService.salvarPreferenciaBiometria(novoStatus);
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível alterar a configuração de biometria.",
      );
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    await UserService.limparPerfilLocal();
    navigation.replace("Login");
  };

  const handleExcluirConta = () => {
    Alert.alert(
      "Excluir Conta",
      "Esta ação apagará todos os seus registros financeiros. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) return;

              const q = query(
                collection(db, "transacoes"),
                where("userId", "==", user.uid),
              );
              const querySnapshot = await getDocs(q);

              const promessasDelecao = querySnapshot.docs.map((documento) =>
                deleteDoc(doc(db, "transacoes", documento.id)),
              );
              await Promise.all(promessasDelecao);

              await deleteDoc(doc(db, "usuarios", user.uid));
              await user.delete();

              await AsyncStorage.removeItem("@billy_transacoes");
              await UserService.limparPerfilLocal();

              navigation.replace("Login");
            } catch (error: any) {
              if (error.code === "auth/requires-recent-login") {
                Alert.alert(
                  "Aviso",
                  "Faça login novamente para realizar esta ação de segurança.",
                );
              }
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#4B5563"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialCommunityIcons
              name="pencil-outline"
              size={24}
              color="#2563EB"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.8}
            onPress={() => setModalFotoVisivel(true)} // Abre o nosso novo modal
          >
            <View style={styles.avatarContainer}>
              {fotoUri ? (
                <Image source={{ uri: fotoUri }} style={styles.profileImage} />
              ) : (
                <MaterialCommunityIcons name="account" size={60} color="#fff" />
              )}
            </View>
            <View style={styles.cameraBadge}>
              <MaterialCommunityIcons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.nameText}>
            {perfil
              ? `${perfil.nome} ${perfil.sobrenome || ""}`.trim()
              : "Carregando..."}
          </Text>
          <Text style={styles.locationText}>Maceió, AL</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Saldo</Text>
            <Text style={styles.statValue}>R$ {resumo.saldo}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Registros</Text>
            <Text style={styles.statValue}>{resumo.qtd}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Gastos</Text>
            <Text style={styles.statValue}>R$ {resumo.gasto}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <View style={styles.menuItemAcao}>
            <MaterialCommunityIcons
              name="email-outline"
              size={24}
              color="#2563EB"
              style={styles.menuIcon}
            />
            <Text style={styles.menuTextAcao}>
              {perfil?.email || "Email não informado"}
            </Text>
          </View>

          <View style={styles.menuItemAcao}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={24}
              color="#2563EB"
              style={styles.menuIcon}
            />
            <Text style={styles.menuTextAcao}>
              Nasc: {perfil?.dataNascimento || "Não informada"}
            </Text>
          </View>

          <View style={styles.menuItemBiometria}>
            <View style={styles.biometriaEsquerda}>
              <MaterialCommunityIcons
                name="fingerprint"
                size={24}
                color="#2563EB"
                style={styles.menuIcon}
              />
              <Text style={styles.menuTextAcao}>Acesso por Biometria</Text>
            </View>
            <Switch
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={biometriaAtiva ? "#2563EB" : "#F3F4F6"}
              onValueChange={handleToggleBiometria}
              value={biometriaAtiva}
            />
          </View>

          <TouchableOpacity style={styles.menuItemAcao} onPress={handleLogout}>
            <MaterialCommunityIcons
              name="logout"
              size={24}
              color="#F59E0B"
              style={styles.menuIcon}
            />
            <Text style={[styles.menuTextAcao, { color: "#F59E0B" }]}>
              Sair da Conta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemAcao}
            onPress={handleExcluirConta}
          >
            <MaterialCommunityIcons
              name="account-remove-outline"
              size={24}
              color="#EF4444"
              style={styles.menuIcon}
            />
            <Text
              style={[
                styles.menuTextAcao,
                { color: "#EF4444", fontWeight: "bold" },
              ]}
            >
              Excluir Conta
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BARRA INFERIOR PADRONIZADA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] })
          }
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
          onPress={() => navigation.replace("Carteira")}
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

      {/* NOVO: MODAL CUSTOMIZADO (BOTTOM SHEET) PARA FOTO */}
      <Modal
        visible={modalFotoVisivel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalFotoVisivel(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalFotoVisivel(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <Text style={styles.modalTitle}>Foto de Perfil</Text>
            <Text style={styles.modalSubtitle}>
              Escolha de onde deseja adicionar sua foto
            </Text>

            <View style={styles.modalOptionsRow}>
              <TouchableOpacity
                style={styles.modalOptionBtn}
                onPress={abrirCamera}
              >
                <View
                  style={[
                    styles.modalIconContainer,
                    { backgroundColor: "#EEF2FF" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={32}
                    color="#2563EB"
                  />
                </View>
                <Text style={styles.modalOptionText}>Câmera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOptionBtn}
                onPress={abrirGaleria}
              >
                <View
                  style={[
                    styles.modalIconContainer,
                    { backgroundColor: "#EEF2FF" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="image-outline"
                    size={32}
                    color="#2563EB"
                  />
                </View>
                <Text style={styles.modalOptionText}>Galeria</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setModalFotoVisivel(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  iconButton: {
    width: 45,
    height: 45,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 15,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#2563EB",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 3,
  },
  nameText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    justifyContent: "space-evenly",
    alignItems: "center",
    marginBottom: 30,
    elevation: 5,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statColumn: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    color: "#E0E7FF",
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  menuContainer: {
    paddingHorizontal: 10,
  },
  menuItemAcao: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    marginBottom: 5,
  },
  menuItemBiometria: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: 5,
  },
  biometriaEsquerda: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: 20,
    width: 30,
    textAlign: "center",
  },
  menuTextAcao: {
    fontSize: 16,
    color: "#4B5563",
    fontWeight: "500",
  },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom: 5,
    elevation: 15,
  },
  menuItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  menuTextAtivo: {
    fontSize: 12,
    color: "#0056b3",
    marginTop: 2,
    fontWeight: "bold",
  },

  // ESTILOS DO NOVO MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  modalOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 30,
  },
  modalOptionBtn: {
    alignItems: "center",
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modalOptionText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600",
  },
  modalCancelBtn: {
    width: "100%",
    paddingVertical: 15,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#4B5563",
    fontWeight: "bold",
  },
});

export default PerfilScreen;
