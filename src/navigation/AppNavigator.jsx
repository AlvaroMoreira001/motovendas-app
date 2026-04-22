/**
 * src/navigation/AppNavigator.jsx
 *
 * Correção do hamburguer que sumia:
 * - O botão de menu agora vive DENTRO do Drawer (drawerContent),
 *   recebendo navigation diretamente — sem depender do drawerNav prop.
 * - HomeStack passa navigation do Drawer para HomeScreen via prop.
 * - Todos os headers das telas Stack têm o botão de menu explícito.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer'
import { useAuth } from '../context/AuthContext'
import { colors } from '../constants'
import { LoadingScreen } from '../components/ui'
import {
  HomeIcon, BoxIcon, CartIcon, LogoutIcon, ChevronRight,
  UserIcon, ShieldIcon,
} from '../components/Icons'

import LoginScreen      from '../screens/LoginScreen'
import HomeScreen       from '../screens/HomeScreen'
import NewSaleScreen    from '../screens/NewSaleScreen'
import SaleDetailScreen from '../screens/SaleDetailScreen'
import MySalesScreen    from '../screens/MySalesScreen'
import StockScreen      from '../screens/StockScreen'

const Stack  = createNativeStackNavigator()
const Drawer = createDrawerNavigator()

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
  animation: 'slide_from_right',
}

// ── Conteúdo do menu lateral ─────────────────────────────
function DrawerContent({ navigation, state }) {
  const { user, logout } = useAuth()
  const currentRoute = state?.routeNames?.[state?.index] || ''
  const isAdmin = user?.role === 'admin'

  const menuItems = [
    { name: 'Home',    label: 'Início',        Icon: HomeIcon  },
    { name: 'Stock',   label: 'Estoque',       Icon: BoxIcon   },
    { name: 'MySales', label: 'Minhas Vendas', Icon: CartIcon  },
  ]

  return (
    <DrawerContentScrollView
      style={{ backgroundColor: colors.surface }}
      contentContainerStyle={{ flex: 1 }}
    >
      {/* Header do drawer */}
      <View style={drawerStyles.header}>
        <View style={drawerStyles.avatarBox}>
          <Text style={drawerStyles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={drawerStyles.userName} numberOfLines={1}>{user?.name}</Text>
          <View style={drawerStyles.roleRow}>
            {isAdmin
              ? <ShieldIcon size={11} color={colors.brand} />
              : <UserIcon size={11} color={colors.textMuted} />
            }
            <Text style={drawerStyles.userRole}>{isAdmin ? 'Administrador' : 'Vendedor'}</Text>
          </View>
        </View>
      </View>

      {/* Itens de menu */}
      <View style={drawerStyles.menuList}>
        {menuItems.map(({ name, label, Icon }) => {
          const isActive = currentRoute === name
          return (
            <TouchableOpacity
              key={name}
              onPress={() => { navigation.navigate(name); navigation.closeDrawer() }}
              style={[drawerStyles.menuItem, isActive && drawerStyles.menuItemActive]}
              activeOpacity={0.7}
            >
              <Icon
                size={20}
                color={isActive ? colors.brand : colors.textMuted}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <Text style={[drawerStyles.menuLabel, isActive && { color: colors.brand }]}>
                {label}
              </Text>
              {isActive && (
                <ChevronRight size={14} color={colors.brand} />
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Sair */}
      <TouchableOpacity style={drawerStyles.logoutBtn} onPress={logout} activeOpacity={0.7}>
        <LogoutIcon size={18} color="#ef4444" />
        <Text style={drawerStyles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  )
}

// ── Stacks ────────────────────────────────────────────────
function HomeStack({ navigation: drawerNavigation }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="HomeMain"
        component={(props) => (
          <HomeScreen {...props} drawerNavigation={drawerNavigation} />
        )}
      />
      <Stack.Screen name="NewSale"    component={NewSaleScreen} />
      <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
    </Stack.Navigator>
  )
}

function StockStack({ navigation: drawerNavigation }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="StockMain"
        component={(props) => (
          <StockScreen {...props} drawerNavigation={drawerNavigation} />
        )}
      />
    </Stack.Navigator>
  )
}

function MySalesStack({ navigation: drawerNavigation }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="MySalesMain"
        component={(props) => (
          <MySalesScreen {...props} drawerNavigation={drawerNavigation} />
        )}
      />
      <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
    </Stack.Navigator>
  )
}

// ── Drawer principal ──────────────────────────────────────
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors.surface, width: 280 },
        drawerType: 'slide',
        overlayColor: 'rgba(0,0,0,0.6)',
        swipeEnabled: true,
        swipeEdgeWidth: 60,      // área de deslize da borda esquerda
      }}
    >
      <Drawer.Screen name="Home"    component={HomeStack} />
      <Drawer.Screen name="Stock"   component={StockStack} />
      <Drawer.Screen name="MySales" component={MySalesStack} />
    </Drawer.Navigator>
  )
}

// ── Root ──────────────────────────────────────────────────
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
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatarBox: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.brandBg,
    borderWidth: 1.5, borderColor: colors.brandBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.brand, fontSize: 19, fontWeight: '900' },
  userName:   { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  roleRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  userRole:   { color: colors.textMuted, fontSize: 11 },
  menuList:   { paddingHorizontal: 10, paddingTop: 14, gap: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12,
  },
  menuItemActive: { backgroundColor: colors.brandBg },
  menuLabel: { flex: 1, color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, marginTop: 'auto',
    padding: 14,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)',
    borderRadius: 12,
  },
  logoutText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
})
