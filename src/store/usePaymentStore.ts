// src/store/usePaymentStore.ts
import create from "zustand";

export type QueueItem = {
  playerId: string;
  itemId: number;
  channel: number;
  region: string;
  promo?: string | null;
  qty?: number;
};

type State = {
  queue: QueueItem[];
  processing: boolean;
  region: string;
  ultraFast: boolean;
  add: (q: QueueItem) => void;
  pop: () => QueueItem | undefined;
  clear: () => void;
  setRegion: (r: string) => void;
  setUltraFast: (v: boolean) => void;
};

export const usePaymentStore = create<State>((set, get) => ({
  queue: [],
  processing: false,
  region: "DO",
  ultraFast: true,

  add: (q) => set(s => ({ queue: [...s.queue, q] })),
  pop: () => {
    const q = get().queue;
    const first = q[0];
    set(s => ({ queue: q.slice(1) }));
    return first;
  },
  clear: () => set({ queue: [] }),
  setRegion: (r) => set({ region: r }),
  setUltraFast: (v) => set({ ultraFast: v }),
}));