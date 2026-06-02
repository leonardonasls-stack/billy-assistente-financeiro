import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import CadastroScreen from "./src/screens/CadastroScreen";
import CarteiraScreen from "./src/screens/CarteiraScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import DetalhesScreen from "./src/screens/DetalhesScreen";
import EditarScreen from "./src/screens/EditarScreen";
import LoginScreen from "./src/screens/LoginScreen";
import PerfilScreen from "./src/screens/PerfilScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="Detalhes" component={DetalhesScreen} />
        <Stack.Screen name="Carteira" component={CarteiraScreen} />
        <Stack.Screen name="Editar" component={EditarScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
