import { create } from 'zustand'
import { StoreItem } from '../services/mapItems'

export type PlayerInfo = {
  loginId: string    // "782913224"
  nickname: string   // "ＧＫ悪ＭＡＧＮＥＴＯ"
  imgUrl: string
  platform: number
}

export type QueueItem = {
  playerId: string
  itemId: number
  channel: number
  region: string
  promo?: string | null
  qty: number        // >= 1
  cvc: string        // in-memory only, never persisted
}

type State = {
  // Purchase queue
  queue: QueueItem[]
  processing: boolean

  // Active region shown in HomeScreen
  region: string

  // Full item catalog across all regions (loaded from Settings)
  catalog: StoreItem[]

  // Logged-in player
  player: PlayerInfo | null

  // Actions
  add:          (item: QueueItem) => void
  pop:          () => QueueItem | undefined
  clear:        () => void
  setRegion:    (r: string) => void
  setPlayer:    (p: PlayerInfo | null) => void
  setCatalog:   (items: StoreItem[]) => void
  toggleItem:   (itemId: number, region: string) => void
  setProcessing: (v: boolean) => void
}

export const usePaymentStore = create<State>((set, get) => ({
  queue:      [],
  processing: false,
  region:     'DO',
  catalog:    [],
  player:     null,

  add: (item) =>
    set(s => ({ queue: [...s.queue, item] })),

  pop: () => {
    const q = get().queue
    if (!q.length) return undefined
    const first = q[0]
    set({ queue: q.slice(1) })
    return first
  },

  clear: () => set({ queue: [] }),

  setRegion: (r) => set({ region: r }),

  setPlayer: (p) => set({ player: p }),

  setCatalog: (items) => set({ catalog: items }),

  toggleItem: (itemId, region) =>
    set(s => ({
      catalog: s.catalog.map(i =>
        i.itemId === itemId && i.region === region
          ? { ...i, enabled: !i.enabled }
          : i
      ),
    })),

  setProcessing: (v) => set({ processing: v }),
}))
