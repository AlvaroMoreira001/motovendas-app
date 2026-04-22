import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { colors } from '../constants'
import { MotoIcon, AlertIcon } from '../components/Icons'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Preencha email e senha.'); return }
    setError(''); setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (err) {
      const apiMsg = err.response?.data?.error
      if (apiMsg) setError(apiMsg)
      else if (err.code === 'ECONNABORTED' || err.message?.includes('Network Error'))
        setError('Sem conexão com o servidor. Confira o IP em constants.js (API_URL), Wi‑Fi e se o backend escuta em 0.0.0.0.')
      else if (err.request && !err.response)
        setError('Servidor não respondeu. Verifique API_URL e firewall (porta 3000).')
      else setError(err.message || 'Credenciais inválidas. Tente novamente.')
    }
    finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <MotoIcon size={38} color="#fff" strokeWidth={1.6} />
            </View>
            <Text style={styles.appName}>MOTOVENDAS</Text>
            <Text style={styles.subtitle}>App do Vendedor</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Entrar</Text>
            <Text style={styles.formSubtitle}>Use as credenciais fornecidas pelo administrador</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor={colors.textMuted}
                value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" returnKeyType="next"/>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={{position:'relative'}}>
                <TextInput style={[styles.input,{paddingRight:50}]} placeholder="••••••••" placeholderTextColor={colors.textMuted}
                  value={password} onChangeText={setPassword} secureTextEntry={!showPass}
                  returnKeyType="done" onSubmitEditing={handleLogin}/>
                {/* Apenas ícone de olho, sem emoji */}
                <TouchableOpacity style={styles.eyeBtn} onPress={()=>setShowPass(v=>!v)}>
                  {showPass ? (
                    // Olho fechado
                    <View style={styles.eyeIcon}>
                      <View style={styles.eyeOuter}/>
                      <View style={styles.eyeLine}/>
                    </View>
                  ) : (
                    // Olho aberto
                    <View style={styles.eyeIcon}>
                      <View style={styles.eyeOuter}/>
                      <View style={styles.eyeInner}/>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <View style={styles.errorRow}>
                  <AlertIcon size={18} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </View>
            ) : null}

            <TouchableOpacity style={[styles.loginBtn,loading&&{opacity:0.6}]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
              <Text style={styles.loginBtnText}>{loading?'Entrando...':'Entrar'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Problemas para acessar? Fale com o administrador.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.bg},
  scroll:{flexGrow:1,padding:24,justifyContent:'center'},
  header:{alignItems:'center',marginBottom:40},
  logoBox:{width:80,height:80,backgroundColor:colors.brand,borderRadius:20,alignItems:'center',justifyContent:'center',marginBottom:16,shadowColor:colors.brand,shadowOffset:{width:0,height:8},shadowOpacity:0.4,shadowRadius:16,elevation:10},
  errorRow:{flexDirection:'row',alignItems:'center',gap:8},
  appName:{color:colors.textPrimary,fontSize:32,fontWeight:'900',letterSpacing:4,marginBottom:4},
  subtitle:{color:colors.textMuted,fontSize:13,letterSpacing:2,textTransform:'uppercase'},
  form:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:20,padding:24,gap:16},
  formTitle:{color:colors.textPrimary,fontSize:22,fontWeight:'800',letterSpacing:1},
  formSubtitle:{color:colors.textMuted,fontSize:13,lineHeight:18,marginTop:-8},
  fieldGroup:{gap:6},
  label:{color:colors.textMuted,fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:1},
  input:{backgroundColor:colors.surface2,borderWidth:1,borderColor:colors.border2,borderRadius:10,paddingHorizontal:16,paddingVertical:14,color:colors.textPrimary,fontSize:15},
  eyeBtn:{position:'absolute',right:14,top:0,bottom:0,justifyContent:'center',alignItems:'center',width:40},
  // Ícone de olho desenhado via View (sem emoji)
  eyeIcon:{width:22,height:16,alignItems:'center',justifyContent:'center'},
  eyeOuter:{width:22,height:14,borderRadius:11,borderWidth:1.8,borderColor:colors.textMuted,position:'absolute'},
  eyeInner:{width:7,height:7,borderRadius:4,backgroundColor:colors.textMuted},
  eyeLine:{width:24,height:2,backgroundColor:colors.textMuted,borderRadius:1,transform:[{rotate:'45deg'}],position:'absolute'},
  errorBox:{backgroundColor:colors.errorBg,borderWidth:1,borderColor:colors.errorBorder,borderRadius:10,padding:12},
  errorText:{color:colors.error,fontSize:13},
  loginBtn:{backgroundColor:colors.brand,borderRadius:12,paddingVertical:16,alignItems:'center',marginTop:4,shadowColor:colors.brand,shadowOffset:{width:0,height:4},shadowOpacity:0.35,shadowRadius:10,elevation:6},
  loginBtnText:{color:'#fff',fontSize:16,fontWeight:'800',letterSpacing:0.5},
  footer:{color:colors.textMuted,fontSize:12,textAlign:'center',marginTop:32},
})
