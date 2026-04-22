/**
 * Botão do menu (drawer). Fica em arquivo separado para evitar
 * require cycle: AppNavigator → telas → AppNavigator.
 */
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { DrawerActions } from '@react-navigation/native'
import { colors } from '../constants'

export function HamburgerButton({ navigation }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={styles.hamburger}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.hLine} />
      <View style={[styles.hLine, { width: 14 }]} />
      <View style={styles.hLine} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  hamburger: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  hLine: {
    height: 2,
    width: 20,
    backgroundColor: colors.textSecondary,
    borderRadius: 1,
  },
})
