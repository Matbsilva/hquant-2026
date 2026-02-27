import { create } from 'zustand';

export const useStore = create((set) => ({
    projetos: [],
    composicoes: [],
    vw: 'home',
    pid: null,
    cid: null,
    q: '',

    setProjetos: (update) => set((state) => ({ projetos: typeof update === 'function' ? update(state.projetos) : update })),
    setComposicoes: (update) => set((state) => ({ composicoes: typeof update === 'function' ? update(state.composicoes) : update })),
    setVw: (update) => set((state) => ({ vw: typeof update === 'function' ? update(state.vw) : update })),
    setPid: (update) => set((state) => ({ pid: typeof update === 'function' ? update(state.pid) : update })),
    setCid: (update) => set((state) => ({ cid: typeof update === 'function' ? update(state.cid) : update })),
    setQ: (update) => set((state) => ({ q: typeof update === 'function' ? update(state.q) : update })),
}));
