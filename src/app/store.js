// store.js
import { create } from 'zustand';

export const useStore = create(set => ({
  rotation: [-10, 0, 0],
  setRotation: (newRotation) => set(() => ({ rotation: newRotation })),
}));
