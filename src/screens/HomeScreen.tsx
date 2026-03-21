import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, TouchableHighlight,
  StyleSheet, TextInput, Modal, Alert, Pressable, ScrollView,
  useWindowDimensions, ActivityIndicator,
} from 'react-native'
import { useNavigation }    from '@react-navigation/native'
import { loadItems }         from '../services/itemService'
import { mapItems, formatPrice, StoreItem } from '../services/mapItems'
import { REGIONS }           from '../config/regions'
import { usePaymentStore, PlayerInfo } from '../store/usePaymentStore'
import PersistentWebView     from '../components/PersistentWebView'
import { purchaseQueue }     from '../core/purchaseQueue'
import { NavProp }           from '../navigation/RootNavigator'

const APP_ID = 100067

export default function HomeScreen() {
  const navigation = useNavigation<NavProp<'Home'>>()
  const { width }  = useWindowDimensions()
  const isTablet   = width >= 768

  const webviewRef = useRef<any>(null)

  const { region, setRegion, catalog, setCatalog, player, setPlayer } = usePaymentStore()

  const [loading,      setLoading]      = useState(false)
  const [selected,     setSelected]     = useState<StoreItem | null>(null)
  const [showFAB,      setShowFAB]      = useState(false)   // bottom sheet open
  const [qty,          setQty]          = useState(1)
  const [promo,        setPromo]        = useState('')
  const [promoInput,   setPromoInput]   = useState('')

  // Login modal
  const [showLogin,    setShowLogin]    = useState(false)
  const [pidInput,     setPidInput]     = useState('')
  const [loggingIn,    setLoggingIn]    = useState(false)

  // Region dropdown (mobile only)
  const [showRegionDD, setShowRegionDD] = useState(false)

  // Connect purchaseQueue to WebView
  useEffect(() => {
    if (webviewRef.current) purchaseQueue.attachWebView(webviewRef.current)
    return () => purchaseQueue.detachWebView()
  }, [])

  // Visible items for active region
  const visibleItems = catalog.filter(i => i.region === region && i.enabled)

  // Regions that have at least one enabled item
  const activeRegions = REGIONS.filter(r =>
    catalog.some(i => i.region === r.code && i.enabled)
  )
  // If catalog is empty, show at least the active region tab
  const tabs = activeRegions.length > 0
    ? activeRegions
    : REGIONS.filter(r => r.code === region)

  // Load items for active region if not in catalog yet
  useEffect(() => {
    const alreadyLoaded = catalog.some(i => i.region === region)
    if (alreadyLoaded) return
    setLoading(true)
    loadItems(APP_ID, region)
      .then(raw => {
        const mapped = mapItems(raw, region)
        setCatalog([...catalog, ...mapped])
      })
      .catch(e => console.warn('loadItems error', e))
      .finally(() => setLoading(false))
  }, [region, catalog, setCatalog])

  // ── WebView message handler ───────────────────────────────
  const onWebViewMessage = useCallback((e: any) => {
    let msg: any
    try { msg = JSON.parse(e.nativeEvent.data) } catch { return }

    // Handle user info response from FETCH_USER_INFO command
    if (msg.type === 'USER_INFO') {
      const pd = msg.data?.player_id
      if (pd) {
        const info: PlayerInfo = {
          loginId:  pd.login_id  ?? pd.id ?? '',
          nickname: pd.nickname  ?? '',
          imgUrl:   pd.img_url   ?? '',
          platform: pd.platform  ?? 0,
        }
        setPlayer(info)
        setLoggingIn(false)
        setShowLogin(false)
        Alert.alert('Conectado', `Bienvenido, ${info.nickname}`)
      }
    }
    if (msg.type === 'USER_INFO_ERROR') {
      setLoggingIn(false)
      Alert.alert('Error', 'No se pudo obtener info del jugador.')
    }
    if (msg.type === 'LOGIN_CLICKED') {
      // Now fetch user info from inside the WebView session
      webviewRef.current?.injectJavaScript(
        `window.__ph_handleCommand(JSON.stringify({type:'FETCH_USER_INFO'})); true;`
      )
    }
    if (msg.type === 'LOGIN_INPUT_NOT_FOUND') {
      // Already logged in — fetch info directly
      webviewRef.current?.injectJavaScript(
        `window.__ph_handleCommand(JSON.stringify({type:'FETCH_USER_INFO'})); true;`
      )
    }

    purchaseQueue.onWebViewMessage(e)
  }, [setPlayer])

  // ── Login flow ────────────────────────────────────────────
  const doLogin = () => {
    if (!pidInput.trim()) { Alert.alert('Ingresa tu Player ID'); return }
    setLoggingIn(true)
    webviewRef.current?.injectJavaScript(
      `window.__ph_handleCommand(JSON.stringify({type:'DO_LOGIN', playerId:${JSON.stringify(pidInput.trim())}})); true;`
    )
  }

  // ── FAB helpers ───────────────────────────────────────────
  const openFAB = () => {
    if (!selected) return
    setQty(1)
    setPromo('')
    setPromoInput('')
    setShowFAB(true)
  }

  const onFABConfirm = () => {
    if (!selected) return
    setShowFAB(false)
    navigation.navigate('Items', {
      itemId:        selected.itemId,
      channelId:     selected.channelId,
      diamonds:      selected.diamonds,
      bonusDiamonds: selected.bonusDiamonds,
      price:         selected.price,
      currency:      selected.currency,
      currencySymbol: selected.currencySymbol,
      region:        selected.region,
      qty,
      promo: promo || null,
    })
  }

  // ── Render helpers ────────────────────────────────────────
  const renderItem = ({ item }: { item: StoreItem }) => {
    const isSel = selected?.itemId === item.itemId && selected?.region === item.region
    const priceStr = formatPrice(item.price, item.currencySymbol)
    const hasDiscount = item.originalPrice > item.price
    return (
      <TouchableHighlight
        underlayColor="#e8f0fe"
        onPress={() => setSelected(isSel ? null : item)}
        style={[styles.row, isSel && styles.rowSelected]}
      >
        <View style={styles.rowInner}>
          <View>
            <Text style={styles.diamonds}>
              {item.diamonds} 💎
              {item.bonusDiamonds > 0 && (
                <Text style={styles.bonus}> (+{item.bonusDiamonds})</Text>
              )}
            </Text>
          </View>
          <View style={styles.priceCol}>
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                {formatPrice(item.originalPrice, item.currencySymbol)}
              </Text>
            )}
            <Text style={styles.price}>{priceStr}</Text>
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  const currentRegion = REGIONS.find(r => r.code === region)

  // ── Region tabs / dropdown ───────────────────────────────
  const RegionSelector = () => {
    if (isTablet) {
      // Tablet: horizontal scroll tabs
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContent}
        >
          {tabs.map(r => (
            <TouchableOpacity
              key={r.code}
              style={[styles.tab, region === r.code && styles.tabActive]}
              onPress={() => setRegion(r.code)}
            >
              <Text style={[styles.tabText, region === r.code && styles.tabTextActive]}>
                {r.flag} {r.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )
    }

    // Mobile: dropdown
    return (
      <View style={styles.dropdownWrap}>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowRegionDD(v => !v)}>
          <Text style={styles.dropdownBtnText}>
            {currentRegion?.flag} {currentRegion?.code} {currentRegion?.label}
          </Text>
          <Text style={styles.dropdownArrow}>{showRegionDD ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showRegionDD && (
          <View style={styles.dropdownList}>
            {tabs.map(r => (
              <TouchableOpacity
                key={r.code}
                style={[styles.dropdownItem, region === r.code && styles.dropdownItemActive]}
                onPress={() => { setRegion(r.code); setShowRegionDD(false) }}
              >
                <Text style={styles.dropdownItemText}>{r.flag} {r.label} ({r.code})</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  }

  // ── Nickname truncated ────────────────────────────────────
  const nickLabel = player
    ? (player.nickname.length > 14 ? player.nickname.slice(0, 13) + '…' : player.nickname)
    : 'Entrar'

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>

      {/* WebView oculto */}
      <PersistentWebView
        ref={webviewRef}
        onMessage={onWebViewMessage}
      />

      {/* Header player button — positioned via headerRight in navigator;
          here we use a top bar since nativeStack headerRight needs props drilling */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <RegionSelector />
        </View>
        <TouchableOpacity
          style={styles.playerBtn}
          onPress={() => player ? Alert.alert(player.nickname, `ID: ${player.loginId}`, [
            { text: 'Cerrar sesión', style: 'destructive', onPress: () => setPlayer(null) },
            { text: 'Cancelar' },
          ]) : setShowLogin(true)}
        >
          <Text style={[styles.playerBtnText, !player && styles.playerBtnGray]} numberOfLines={1}>
            {nickLabel} ▸
          </Text>
        </TouchableOpacity>
      </View>

      {/* Item list */}
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={i => `${i.region}_${i.itemId}`}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No hay items para esta región.{'\n'}
              Ve a Ajustes → Catálogo para cargarlos.
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* FAB */}
      {selected && (
        <TouchableOpacity style={styles.fab} onPress={openFAB}>
          <Text style={styles.fabText}>⊕</Text>
        </TouchableOpacity>
      )}

      {/* FAB bottom sheet */}
      <Modal visible={showFAB} transparent animationType="slide" onRequestClose={() => setShowFAB(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFAB(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>
            {selected?.diamonds} 💎
            {(selected?.bonusDiamonds ?? 0) > 0 && ` (+${selected?.bonusDiamonds})`}
            {'  ·  '}
            {selected ? formatPrice(selected.price, selected.currencySymbol) : ''}
          </Text>

          {/* Qty */}
          <View style={styles.qtyRow}>
            <Text style={styles.sheetLabel}>Cantidad</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => q + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Promo */}
          <View style={styles.promoRow}>
            <Text style={styles.sheetLabel}>Promo</Text>
            <View style={styles.promoInput}>
              <TextInput
                value={promoInput}
                onChangeText={setPromoInput}
                placeholder="Código promo (opcional)"
                placeholderTextColor="#9ca3af"
                style={styles.promoTextInput}
                autoCapitalize="characters"
              />
              {promoInput.length > 0 && (
                <TouchableOpacity onPress={() => setPromoInput('')}>
                  <Text style={styles.promoClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {promoInput.trim().length > 0 && (
              <TouchableOpacity
                style={styles.promoApply}
                onPress={() => setPromo(promoInput.trim())}
              >
                <Text style={styles.promoApplyText}>Aplicar</Text>
              </TouchableOpacity>
            )}
          </View>
          {promo.length > 0 && (
            <View style={styles.promoActive}>
              <Text style={styles.promoActiveText}>✓ {promo}</Text>
              <TouchableOpacity onPress={() => { setPromo(''); setPromoInput('') }}>
                <Text style={styles.promoClear}>✕ quitar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity style={styles.btnDelete} onPress={() => { setSelected(null); setShowFAB(false) }}>
            <Text style={styles.btnDeleteText}>Eliminar selección</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnConfirm} onPress={onFABConfirm}>
            <Text style={styles.btnConfirmText}>Continuar →</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Login modal */}
      <Modal visible={showLogin} transparent animationType="fade" onRequestClose={() => setShowLogin(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowLogin(false)} />
        <View style={styles.loginSheet}>
          <Text style={styles.loginTitle}>Ingresa tu Player ID</Text>
          <TextInput
            value={pidInput}
            onChangeText={setPidInput}
            placeholder="ej. 782913224"
            keyboardType="numeric"
            style={styles.loginInput}
            placeholderTextColor="#9ca3af"
          />
          {loggingIn
            ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 12 }} />
            : <TouchableOpacity style={styles.loginBtn} onPress={doLogin}>
                <Text style={styles.loginBtnText}>Confirmar</Text>
              </TouchableOpacity>
          }
          <Text style={styles.loginHint}>Conecta tu cuenta de Garena Free Fire.</Text>
        </View>
      </Modal>

    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  topBar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb', paddingRight: 8 },
  tabScroll:       { flex: 1 },
  tabContent:      { paddingHorizontal: 8, paddingVertical: 8, gap: 4 },
  tab:             { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#d1d5db', marginRight: 4 },
  tabActive:       { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabText:         { fontSize: 12, color: '#374151' },
  tabTextActive:   { color: '#fff', fontWeight: '600' },
  dropdownWrap:    { flex: 1 },
  dropdownBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, paddingHorizontal: 14 },
  dropdownBtnText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  dropdownArrow:   { fontSize: 10, color: '#6b7280', marginLeft: 6 },
  dropdownList:    { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, zIndex: 100, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  dropdownItem:    { padding: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  dropdownItemActive: { backgroundColor: '#eff6ff' },
  dropdownItemText: { fontSize: 13, color: '#374151' },
  playerBtn:       { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 20, maxWidth: 160 },
  playerBtnText:   { fontSize: 12, fontWeight: '600', color: '#111827' },
  playerBtnGray:   { color: '#6b7280' },
  row:             { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  rowSelected:     { backgroundColor: '#eff6ff' },
  rowInner:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diamonds:        { fontSize: 16, fontWeight: '600', color: '#111827' },
  bonus:           { fontSize: 13, color: '#16a34a', fontWeight: '400' },
  priceCol:        { alignItems: 'flex-end' },
  originalPrice:   { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  price:           { fontSize: 15, fontWeight: '600', color: '#3b82f6' },
  empty:           { textAlign: 'center', color: '#9ca3af', marginTop: 60, lineHeight: 24, fontSize: 14 },
  fab:             { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  fabText:         { fontSize: 28, color: '#fff', lineHeight: 32 },
  overlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 36 },
  sheetTitle:      { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 18 },
  sheetLabel:      { fontSize: 13, color: '#6b7280', width: 70 },
  qtyRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qtyControls:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn:          { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:      { fontSize: 20, color: '#374151', lineHeight: 24 },
  qtyVal:          { fontSize: 18, fontWeight: '700', color: '#111827', minWidth: 30, textAlign: 'center' },
  promoRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  promoInput:      { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#f9fafb' },
  promoTextInput:  { flex: 1, height: 38, fontSize: 13, color: '#111827' },
  promoClear:      { fontSize: 12, color: '#ef4444', paddingHorizontal: 6 },
  promoApply:      { backgroundColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  promoApplyText:  { color: '#fff', fontSize: 12, fontWeight: '600' },
  promoActive:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  promoActiveText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  btnDelete:       { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  btnDeleteText:   { fontSize: 14, color: '#ef4444' },
  btnConfirm:      { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnConfirmText:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  loginSheet:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, paddingBottom: 40 },
  loginTitle:      { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16, textAlign: 'center' },
  loginInput:      { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827', textAlign: 'center', letterSpacing: 2 },
  loginBtn:        { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  loginBtnText:    { fontSize: 15, fontWeight: '700', color: '#fff' },
  loginHint:       { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 12 },
})
