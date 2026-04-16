# 📱 MotoVendas — App Mobile (Vendedor)

App React Native com Expo para os vendedores registrarem vendas em eventos.

---

## 📁 Estrutura

```
motovendas-app/
├── App.jsx                          ← Entry point (providers: Auth, Cart, Query, Navigation)
├── app.json                         ← Configuração do Expo (nome, ícone, package Android)
├── babel.config.js                  ← Configuração do Babel com suporte ao Reanimated
├── eas.json                         ← Perfis de build (APK preview / AAB produção)
├── assets/                          ← Ícones e splash screen (coloque suas imagens aqui)
└── src/
    ├── constants.js                 ← URL da API, cores, categorias, formatações
    ├── services/
    │   └── api.js                   ← Axios configurado + todos os endpoints
    ├── context/
    │   ├── AuthContext.jsx          ← Login/logout persistido no SecureStore
    │   └── CartContext.jsx          ← Carrinho da venda em andamento (memória)
    ├── navigation/
    │   └── AppNavigator.jsx         ← Stack Navigator (Login ↔ Home → Venda → Detalhe)
    ├── components/
    │   └── ui.jsx                   ← Componentes base (Button, Card, Badge, Spinner...)
    └── screens/
        ├── LoginScreen.jsx          ← Tela de login
        ├── HomeScreen.jsx           ← Dashboard do vendedor + últimas vendas do dia
        ├── NewSaleScreen.jsx        ← Seleção de produtos + carrinho + checkout
        ├── SaleDetailScreen.jsx     ← Detalhes de uma venda com itens
        └── MySalesScreen.jsx        ← Histórico completo de vendas do vendedor
```

---

## 🚀 PASSO A PASSO PARA RODAR

### Pré-requisitos
- **Node.js v18+** → baixe em nodejs.org
- **Backend rodando** (local ou Railway)

---

### PASSO 1 — Instalar dependências

```bash
cd motovendas-app
npm install
```

---

### PASSO 2 — Configurar a URL do backend

Você pode configurar a URL da API de 2 formas:

1) **Recomendado (EAS / builds):** variável de ambiente `EXPO_PUBLIC_API_URL`
2) **Fallback local:** editando `src/constants.js`

#### Opção 1 (recomendado) — `EXPO_PUBLIC_API_URL`

- **Dev local (Expo Go):** crie um `.env` e rode o Metro (ou exporte no terminal)
- **EAS Build:** configure em `eas.json` (por perfil) ou no dashboard do Expo (Environment variables)

Exemplo:
```bash
EXPO_PUBLIC_API_URL=https://seu-backend.com
```

#### Opção 2 — editar `src/constants.js`

Abra o arquivo `src/constants.js` e troque o IP/URL:

```js
// Para desenvolvimento local:
// export const API_URL = 'http://SEU_IP_LOCAL:3000'
// Exemplo: 'http://192.168.1.15:3000'

// Para produção (Railway):
// export const API_URL = 'https://motovendas-backend.up.railway.app'
```

**Como descobrir seu IP local:**
```bash
# Windows
ipconfig
# Procure "Endereço IPv4" → algo como 192.168.x.x

# Mac / Linux
ifconfig | grep "inet "
```

> ⚠️ Use o IP da sua máquina, NÃO "localhost".
> O celular/emulador não consegue acessar "localhost" do PC.

> ⚠️ Se você instalar um APK feito no EAS (preview/production), ele **não** vai conseguir acessar um backend que está rodando “só no seu PC” quando o celular estiver fora da sua rede. Para isso, publique o backend (Railway/Render/etc) ou use um túnel (ex: ngrok) e aponte `EXPO_PUBLIC_API_URL` para a URL pública.

---

### PASSO 3 — Iniciar o servidor de desenvolvimento

```bash
npx expo start
```

Vai abrir uma tela assim no terminal:
```
Metro waiting on exp://192.168.1.15:8081
  › Press a │ open Android
  › Press i │ open iOS simulator
  › Press w │ open web

  QR Code aqui...
```

---

### PASSO 4A — Testar com Expo Go no celular (mais rápido)

1. Instale **Expo Go** na Play Store do Android
2. Abra o Expo Go → toque em "Scan QR Code"
3. Escaneie o QR Code do terminal
4. O app abre em segundos ✅

> PC e celular precisam estar na **mesma rede Wi-Fi**

---

### PASSO 4B — Testar no emulador Android (Android Studio)

**Se preferir testar no PC sem o celular físico:**

1. **Instale o Android Studio:**
   → https://developer.android.com/studio

2. **Crie um emulador:**
   - Abra o Android Studio
   - Clique em **More Actions → Virtual Device Manager**
   - **Create Device → Pixel 7 → Next**
   - Selecione **API 34 (Android 14)** → Download → Next → Finish
   - Clique no **▶ Play** para iniciar o emulador

3. **Com o emulador aberto**, rode:
   ```bash
   npx expo start --android
   ```
   O app abre automaticamente no emulador ✅

---

## 📱 Telas do App

| Tela | Descrição |
|---|---|
| **Login** | Vendedor entra com email e senha |
| **Home** | Evento ativo, KPIs do dia, últimas vendas |
| **Nova Venda** | Grid de produtos, busca, filtro por categoria, carrinho, checkout |
| **Detalhe da Venda** | Itens, total, pagamento, status |
| **Minhas Vendas** | Histórico completo com filtros |

---

## 📦 Gerar o APK para instalar nos celulares

Quando estiver satisfeito com o app:

```bash
# 1. Instala a CLI do EAS (uma vez)
npm install -g eas-cli

# 2. Faz login na conta Expo (cria em expo.dev se não tiver)
eas login

# 3. Configura o projeto (gera o projectId)
eas build:configure

# 4. Gera o APK (~5-10 min, compila na nuvem)
eas build -p android --profile preview
```

Ao final, gera um **link para baixar o .apk**.

Para instalar no celular:
1. Baixe o `.apk` pelo link
2. Envie para os celulares (WhatsApp, Drive, cabo USB)
3. No celular: **Configurações → Segurança → Instalar apps de fontes desconhecidas**
4. Abra o arquivo e instale ✅

---

## 🔄 Fluxo de uso do app

```
Vendedor abre o app
        ↓
Faz login (email + senha)
        ↓
Vê o evento ativo na Home
        ↓
Toca em "Nova Venda" 🛒
        ↓
Seleciona os produtos do cliente
(busca por nome, filtra por categoria)
        ↓
Toca + / - para ajustar quantidades
        ↓
Toca no carrinho flutuante
        ↓
Escolhe a forma de pagamento
(Dinheiro / Pix / Cartão / Cortesia)
        ↓
Confirma a venda ✓
        ↓
Estoque debitado automaticamente no backend
Admin vê no portal web em tempo real
```

---

## 🔑 Credenciais de teste (após rodar o seed do backend)

```
Vendedor: joao@motovendas.com  / seller123
Vendedor: maria@motovendas.com / seller123
Vendedor: pedro@motovendas.com / seller123
Admin:    admin@motovendas.com / admin123
```
