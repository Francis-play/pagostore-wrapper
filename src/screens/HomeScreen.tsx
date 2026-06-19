import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, TouchableHighlight,
  StyleSheet, TextInput, Modal, Alert, Pressable, ScrollView,
  useWindowDimensions, ActivityIndicator,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation }    from '@react-navigation/native'
import { loadItems }         from '../services/itemService'
import { mapItems, formatPrice, StoreItem } from '../services/mapItems'
import { REGIONS }           from '../config/regions'
import { usePaymentStore, PlayerInfo } from '../store/usePaymentStore'
import { useWebView }        from '../context/WebViewContext'
import { NavProp }           from '../navigation/RootNavigator'
import { Icon } from '../components/Icon'
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../theme/tokens'

const APP_ID = 100067

export default function HomeScreen() {
  const navigation = useNavigation<NavProp<'Home'>>()
  const { width }  = useWindowDimensions()
  const isTablet   = width >= 768

  const { mountWebView, unmountWebView, sendCommand, setMessageHandler } = useWebView()

  const { region, setRegion, catalog, setCatalog, player, setPlayer, activeRegions: enabledRegions } = usePaymentStore()

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

  // Recent players (last 3)
  const RECENT_KEY = 'ph_recent_players'
  const [recentPlayers, setRecentPlayers] = useState<PlayerInfo[]>([])
  const [showRecentDD, setShowRecentDD]   = useState(false)

  // Load recent players on mount
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then(raw => {
      if (raw) setRecentPlayers(JSON.parse(raw))
    }).catch(() => {})
  }, [])

  const saveRecentPlayer = useCallback(async (info: PlayerInfo) => {
    const updated = [info, ...recentPlayers.filter(p => p.loginId !== info.loginId)].slice(0, 3)
    setRecentPlayers(updated)
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  }, [recentPlayers])

  // Visible items for active region
  const visibleItems = useMemo(() => catalog.filter(i => i.region === region && i.enabled), [catalog, region])

  // Regions that are enabled by user AND have at least one enabled item
  const regionsWithItems = useMemo(() => REGIONS.filter(r =>
    enabledRegions.includes(r.code) && catalog.some(i => i.region === r.code && i.enabled)
  ), [catalog, enabledRegions])
  // If catalog is empty, show at least the active region tab
  const tabs = regionsWithItems.length > 0
    ? regionsWithItems
    : REGIONS.filter(r => r.code === region && enabledRegions.includes(r.code))

  const CATALOG_KEY = 'ph_catalog_v1'

  // Load catalog from AsyncStorage on boot
  useEffect(() => {
    AsyncStorage.getItem(CATALOG_KEY).then(raw => {
      if (raw) {
        const stored: StoreItem[] = JSON.parse(raw)
        if (stored.length > 0 && catalog.length === 0) setCatalog(stored)
      }
    }).catch(() => {})
  }, [])

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

  // ── Login flow ────────────────────────────────────────────
  const doLogin = () => {
    if (!pidInput.trim()) { Alert.alert('Ingresa tu Player ID'); return }
    setLoggingIn(true)
    mountWebView()
  }

  const quickLogin = (pid: string) => {
    setShowRecentDD(false)
    setLoggingIn(true)
    mountWebView()
    setPidInput(pid)
  }

  // Register message handler for login
  useEffect(() => {
    if (!loggingIn) return
    const pid = pidInput.trim()
    if (!pid) return

    setMessageHandler((msg) => {
      // NAV = page loaded, send DO_LOGIN
      if (msg.type === 'NAV') {
        sendCommand({ type: 'DO_LOGIN', playerId: pid })
      }
      // Login succeeded or already logged in → fetch player info from inside WebView
      if (msg.type === 'LOGIN_CLICKED' || msg.type === 'LOGIN_INPUT_NOT_FOUND') {
        sendCommand({ type: 'FETCH_USER_INFO' })
      }
      // Got player info from WebView session
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
          saveRecentPlayer(info)
          Alert.alert('Conectado', `Bienvenido, ${info.nickname}`)
        } else {
          Alert.alert('Error', 'No se pudo obtener info del jugador.')
        }
        setLoggingIn(false)
        setShowLogin(false)
        unmountWebView()
      }
      if (msg.type === 'USER_INFO_ERROR') {
        setLoggingIn(false)
        Alert.alert('Error', 'No se pudo obtener info del jugador.')
        unmountWebView()
      }
    })

    return () => setMessageHandler(null)
  }, [loggingIn, pidInput])

  const doLogout = () => {
    setPlayer(null)
    mountWebView()
    setTimeout(() => {
      sendCommand({ type: 'CLEAR_SESSION' })
      setTimeout(() => unmountWebView(), 500)
    }, 800)
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
        underlayColor={colors.primaryBg}
        onPress={() => setSelected(isSel ? null : item)}
        style={[styles.row, isSel && styles.rowSelected]}
      >
        <View style={styles.rowInner}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="diamond" size={16} color={colors.gray900} />
              <Text style={styles.diamonds}>
                {item.diamonds}
                {item.bonusDiamonds > 0 && (
                  <Text style={styles.bonus}> (+{item.bonusDiamonds})</Text>
                )}
              </Text>
            </View>
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
          <Icon name={showRegionDD ? 'arrow-up' : 'arrow-down'} size={10} color={colors.gray500} />
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
  const nickLabel = useMemo(() => player
    ? (player.nickname.length > 14 ? player.nickname.slice(0, 13) + '…' : player.nickname)
    : 'Entrar'
  , [player])

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50 }}>

      {/* Header player button — positioned via headerRight in navigator;
          here we use a top bar since nativeStack headerRight needs props drilling */}
      <View style={styles.topBar}>
        {/* Recent players icon — only when not logged in */}
        {!player && recentPlayers.length > 0 && (
          <View>
            <TouchableOpacity
              style={styles.recentBtn}
              onPress={() => setShowRecentDD(v => !v)}
            >
              <Icon name="clock" size={18} color={colors.primary} />
            </TouchableOpacity>
            {showRecentDD && (
              <View style={styles.recentDD}>
                <Text style={styles.recentDDTitle}>Iniciar rápido</Text>
                {recentPlayers.map(p => (
                  <TouchableOpacity
                    key={p.loginId}
                    style={styles.recentDDItem}
                    onPress={() => quickLogin(p.loginId)}
                  >
                    <Text style={styles.recentDDName} numberOfLines={1}>{p.nickname}</Text>
                    <Text style={styles.recentDDId}>{p.loginId}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        <View style={{ flex: 1 }}>
          <RegionSelector />
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="settings" size={18} color={colors.gray500} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.playerBtn}
          onPress={() => player ? Alert.alert(player.nickname, `ID: ${player.loginId}`, [
            { text: 'Cerrar sesión', style: 'destructive', onPress: doLogout },
            { text: 'Cancelar' },
          ]) : setShowLogin(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.playerBtnText, !player && styles.playerBtnGray]} numberOfLines={1}>
              {nickLabel}
            </Text>
            <Icon name="chevron-right" size={10} color={colors.gray500} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Item list */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
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
          <Icon name="plus" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* FAB bottom sheet */}
      <Modal visible={showFAB} transparent animationType="slide" onRequestClose={() => setShowFAB(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFAB(false)} />
        <View style={styles.sheet}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 18 }}>
            <Icon name="diamond" size={18} color={colors.gray900} />
            <Text style={styles.sheetTitle}>
              {selected?.diamonds}
              {(selected?.bonusDiamonds ?? 0) > 0 && ` (+${selected?.bonusDiamonds})`}
              {'  ·  '}
              {selected ? formatPrice(selected.price, selected.currencySymbol) : ''}
            </Text>
          </View>

          {/* Qty */}
          <View style={styles.qtyRow}>
            <Text style={styles.sheetLabel}>Cantidad</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                <Icon name="minus" size={20} color={colors.gray700} />
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => q + 1)}>
                <Icon name="plus" size={20} color={colors.gray700} />
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
                placeholderTextColor={colors.gray400}
                style={styles.promoTextInput}
                autoCapitalize="characters"
              />
              {promoInput.length > 0 && (
                <TouchableOpacity onPress={() => setPromoInput('')}>
                  <Icon name="close" size={14} color={colors.error} />
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="check" size={14} color={colors.success} />
                <Text style={styles.promoActiveText}>{promo}</Text>
              </View>
              <TouchableOpacity onPress={() => { setPromo(''); setPromoInput('') }} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Icon name="close" size={12} color={colors.error} />
                <Text style={styles.promoClear}>quitar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity style={styles.btnDelete} onPress={() => { setSelected(null); setShowFAB(false) }}>
            <Text style={styles.btnDeleteText}>Eliminar selección</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnConfirm} onPress={onFABConfirm}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.btnConfirmText}>Continuar</Text>
              <Icon name="forward" size={16} color={colors.white} />
            </View>
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
            placeholderTextColor={colors.gray400}
          />
          {loggingIn
            ?             <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
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
  topBar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.gray200, paddingRight: spacing.sm },
  recentBtn:       { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.sm },
  recentDD:        { position: 'absolute', top: '100%', left: 0, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.sm, zIndex: 200, ...shadow.md, width: 200, marginTop: spacing.xs },
  recentDDTitle:   { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: spacing.md, paddingTop: spacing.sm + 2, paddingBottom: spacing.xs + 2 },
  recentDDItem:    { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderTopWidth: 1, borderColor: colors.gray100 },
  recentDDName:    { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.gray900 },
  recentDDId:      { fontSize: fontSize.sm, color: colors.gray400, marginTop: spacing.xs },
  settingsBtn:     { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.sm },
  tabScroll:       { flex: 1 },
  tabContent:      { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.xs },
  tab:             { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radii.full, borderWidth: 1, borderColor: colors.gray300, marginRight: spacing.xs },
  tabActive:       { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText:         { fontSize: fontSize.sm, color: colors.gray700 },
  tabTextActive:   { color: colors.white, fontWeight: fontWeight.semibold },
  dropdownWrap:    { flex: 1 },
  dropdownBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.sm + 2, paddingHorizontal: spacing.md + 2 },
  dropdownBtnText: { fontSize: fontSize.base, color: colors.gray700, fontWeight: fontWeight.medium },
  dropdownList:    { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.sm, zIndex: 100, ...shadow.sm },
  dropdownItem:    { padding: spacing.md, paddingHorizontal: spacing.md + 2, borderBottomWidth: 1, borderColor: colors.gray100 },
  dropdownItemActive: { backgroundColor: colors.primaryBg },
  dropdownItemText: { fontSize: fontSize.base, color: colors.gray700 },
  playerBtn:       { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.gray100, borderRadius: radii.full, maxWidth: 160 },
  playerBtnText:   { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray900 },
  playerBtnGray:   { color: colors.gray500 },
  row:             { backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, borderBottomWidth: 1, borderColor: colors.gray100 },
  rowSelected:     { backgroundColor: colors.primaryBg },
  rowInner:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diamonds:        { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, color: colors.gray900 },
  bonus:           { fontSize: fontSize.base, color: colors.success, fontWeight: fontWeight.normal },
  priceCol:        { alignItems: 'flex-end' },
  originalPrice:   { fontSize: fontSize.xs, color: colors.gray400, textDecorationLine: 'line-through' },
  price:           { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.primary },
  empty:           { textAlign: 'center', color: colors.gray400, marginTop: 60, lineHeight: 24, fontSize: fontSize.md },
  fab:             { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.lg },
  overlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl, paddingBottom: 36 },
  sheetTitle:      { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.gray900 },
  sheetLabel:      { fontSize: fontSize.base, color: colors.gray500, width: 70 },
  qtyRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  qtyControls:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qtyBtn:          { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:      { fontSize: 20, color: colors.gray700, lineHeight: 24 },
  qtyVal:          { fontSize: 18, fontWeight: fontWeight.bold, color: colors.gray900, minWidth: 30, textAlign: 'center' },
  promoRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  promoInput:      { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.sm, paddingHorizontal: spacing.sm + 2, backgroundColor: colors.gray50 },
  promoTextInput:  { flex: 1, height: 38, fontSize: fontSize.base, color: colors.gray900 },
  promoClear:      { fontSize: fontSize.sm, color: colors.error, paddingHorizontal: spacing.xs + 2 },
  promoApply:      { backgroundColor: colors.primary, borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  promoApplyText:  { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  promoActive:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.successBg, borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md },
  promoActiveText: { fontSize: fontSize.base, color: colors.success, fontWeight: fontWeight.semibold },
  btnDelete:       { alignItems: 'center', paddingVertical: spacing.md, marginBottom: spacing.sm },
  btnDeleteText:   { fontSize: fontSize.md, color: colors.error },
  btnConfirm:      { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md + 2, alignItems: 'center' },
  btnConfirmText:  { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.white },
  loginSheet:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xxl, paddingBottom: 40 },
  loginTitle:      { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.gray900, marginBottom: spacing.lg, textAlign: 'center' },
  loginInput:      { borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.sm, padding: spacing.md, fontSize: fontSize.xl, color: colors.gray900, textAlign: 'center', letterSpacing: 2 },
  loginBtn:        { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md + 1, alignItems: 'center', marginTop: spacing.md + 2 },
  loginBtnText:    { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.white },
  loginHint:       { fontSize: fontSize.sm, color: colors.gray400, textAlign: 'center', marginTop: spacing.md },
})
