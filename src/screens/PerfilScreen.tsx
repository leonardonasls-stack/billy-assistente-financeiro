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
import { auth, db } from "../services/firebaseConfig";
import { UserService } from "../services/UserService";

const PerfilScreen = ({ navigation }: any) => {
  const [perfil, setPerfil] = useState<any>(null);
  const [biometriaAtiva, setBiometriaAtiva] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);

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
      };
      carregarDados();
    }, []),
  );

  const abrirCamera = async () => {
    setModalFotoVisivel(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada", "O Billy precisa de acesso à câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      cameraType: ImagePicker.CameraType.front,
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
      mediaTypes: ["images"],
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

  const handleToggleBiometria = async () => {
    try {
      const novoStatus = !biometriaAtiva;

      if (novoStatus === true) {
        Alert.alert(
          "Segurança Billy",
          "Para ativar o login rápido, precisamos confirmar sua identidade e vincular seus dados a este aparelho.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Confirmar Digital",
              onPress: async () => {
                const sucesso = await AuthService.autenticarBiometria();

                if (sucesso) {
                  const user = auth.currentUser;
                  const perfilAtual =
                    (await UserService.obterPerfilLocal()) || {};

                  if (user) {
                    const perfilConsolidado = {
                      ...perfilAtual,
                      uid: user.uid,
                      email: user.email || perfilAtual.email,
                    };
                    await UserService.salvarPerfilLocal(perfilConsolidado);
                  }

                  setBiometriaAtiva(true);
                  await AuthService.salvarPreferenciaBiometria(true);
                  Alert.alert(
                    "Sucesso!",
                    "Biometria ativada. Você já pode entrar offline de forma rápida.",
                  );
                } else {
                  Alert.alert(
                    "Falha",
                    "Digital não reconhecida. A biometria não foi ativada.",
                  );
                }
              },
            },
          ],
        );
      } else {
        setBiometriaAtiva(false);
        await AuthService.salvarPreferenciaBiometria(false);
      }
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
            onPress={() => setModalFotoVisivel(true)}
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

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("HistoricoMensal")}
        >
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={28}
            color="#9CA3AF"
          />
          <Text style={styles.menuText}>Histórico</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="account" size={28} color="#0056b3" />
          <Text style={styles.menuTextAtivo}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL PARA FOTO */}
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
    paddingBottom: 100, // Espaço para a barra inferior
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
