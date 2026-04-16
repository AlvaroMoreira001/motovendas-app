import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer'
import { useAuth } from '../context/AuthContext'
import { colors } from '../constants'
import { LoadingScreen } from '../components/ui'

import LoginScreen      from '../screens/LoginScreen'
import HomeScreen       from '../screens/HomeScreen'
import NewSaleScreen    from '../screens/NewSaleScreen'
import SaleDetailScreen from '../screens/SaleDetailScreen'
import MySalesScreen    from '../screens/MySalesScreen'
import StockScreen      from '../screens/StockScreen'

const Stack  = createNativeStackNavigator()
const Drawer = createDrawerNavigator()

const screenOptions = { headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }

// Conteúdo customizado do menu lateral (drawer)
function DrawerContent({ navigation, state }) {
  const { user, logout } = useAuth()
  const currentRoute = state?.routeNames?.[state?.index] || ''

  const menuItems = [
    { name: 'Home',     label: 'Início',          emoji: '🏠' },
    { name: 'Stock',    label: 'Estoque',          emoji: '📦' },
    { name: 'MySales',  label: 'Minhas Vendas',    emoji: '🛒' },
  ]

  return (
    <DrawerContentScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={{ flex: 1 }}>
      {/* Header do drawer */}
      <View style={drawerStyles.header}>
        <View style={drawerStyles.avatarBox}>
          <Text style={drawerStyles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={drawerStyles.userName}>{user?.name}</Text>
          <Text style={drawerStyles.userRole}>Vendedor</Text>
        </View>
      </View>

      {/* Itens do menu */}
      <View style={drawerStyles.menuList}>
        {menuItems.map(item => {
          const isActive = currentRoute === item.name
          return (
            <TouchableOpacity key={item.name}
              onPress={() => { navigation.navigate(item.name); navigation.closeDrawer() }}
              style={[drawerStyles.menuItem, isActive && drawerStyles.menuItemActive]}
              activeOpacity={0.7}>
              <Text style={drawerStyles.menuEmoji}>{item.emoji}</Text>
              <Text style={[drawerStyles.menuLabel, isActive && { color: colors.brand }]}>{item.label}</Text>
              {isActive && <View style={drawerStyles.activeIndicator} />}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Logout */}
      <TouchableOpacity style={drawerStyles.logoutBtn} onPress={logout} activeOpacity={0.7}>
        <Text style={drawerStyles.logoutText}>↩ Sair da conta</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  )
}

// Stack para fluxo de Home → Nova Venda → Detalhe
function HomeStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="HomeMain" component={(props) => <HomeScreen {...props} drawerNav={navigation} />} />
      <Stack.Screen name="NewSale"    component={NewSaleScreen} />
      <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
    </Stack.Navigator>
  )
}

// Stack para minhas vendas
function MySalesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MySalesMain" component={MySalesScreen} />
      <Stack.Screen name="SaleDetail"  component={SaleDetailScreen} />
    </Stack.Navigator>
  )
}

// Drawer principal (menu lateral)
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors.surface, width: 280 },
        drawerType: 'slide',
        overlayColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <Drawer.Screen name="Home"     component={HomeStack} />
      <Drawer.Screen name="Stock"    component={StockScreen} />
      <Drawer.Screen name="MySales"  component={MySalesStack} />
    </Drawer.Navigator>
  )
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen message="Iniciando MotoVendas..." />

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!isAuthenticated
          ? <Stack.Screen name="Login" component={LoginScreen} />
          : <Stack.Screen name="Main"  component={DrawerNavigator} />
        }
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const drawerStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatarBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brandBg, borderWidth: 2, borderColor: colors.brandBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.brand, fontSize: 20, fontWeight: '900' },
  userName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  userRole: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  menuList: { paddingHorizontal: 12, paddingTop: 16, gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12 },
  menuItemActive: { backgroundColor: colors.brandBg },
  menuEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  activeIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand },
  logoutBtn: { margin: 20, marginTop: 'auto', padding: 14, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
})
