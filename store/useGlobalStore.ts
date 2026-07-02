import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalState {
  locale: 'en' | 'zh';
  mobileDrawerOpened: boolean;
  scrollY: number;
  setLocale: (locale: 'en' | 'zh') => void;
  toggleMobileDrawer: () => void;
  setMobileDrawerOpened: (opened: boolean) => void;
  setScrollY: (y: number) => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      locale: 'en',
      mobileDrawerOpened: false,
      scrollY: 0,
      setLocale: (locale) => set({ locale }),
      toggleMobileDrawer: () =>
        set((state) => ({ mobileDrawerOpened: !state.mobileDrawerOpened })),
      setMobileDrawerOpened: (opened) => set({ mobileDrawerOpened: opened }),
      setScrollY: (y) => set({ scrollY: y }),
    }),
    {
      name: 'global-storage',
      partialize: (state) => ({ locale: state.locale }), // Only persist locale
    }
  )
);
