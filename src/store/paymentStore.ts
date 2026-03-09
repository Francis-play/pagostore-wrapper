import {create} from 'zustand';

export type QueueItem = {
  playerId: string;
  item: number;
  channel: number;
  region: string;
  promo?: string;
};

type Store = {
  queue: QueueItem[];

  add: (item: QueueItem) => void;
  next: () => QueueItem | null;
  clear: () => void;
};

export const usePaymentStore = create<Store>((set, get) => ({
  queue: [],

  add: item => set(state => ({queue: [...state.queue, item]})),

  next: () => {
    const q = get().queue;
    if (!q.length) return null;
    const first = q[0];

    set({queue: q.slice(1)});
    return first;
  },

  clear: () => set({queue: []}),
}));
