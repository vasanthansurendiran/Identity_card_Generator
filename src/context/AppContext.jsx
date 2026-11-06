import React, { createContext, useContext, useMemo, useReducer } from 'react';

const base = import.meta.env.BASE_URL;

export const DEFAULT_SETTINGS = {
  schoolName: 'KSVM',
  addressLine1: 'KSV Nagar, Thulasikodumbu, Jegadhabi-Po,',
  addressLine2: 'Karur-Dt - 639118',
  schoolPhone: 'Cell : 94899 27664',
  title: 'IDENTITY CARD',
  academicYear: '2026-2027',
  designation: 'Principal',
  footerText: '',
  headerColor: '#ff0dff',
  accentColor: '#ff0dff',
  logo: `${base}assets/logo.png`,
  signature: `${base}assets/signature.png`,
  cardWidthMm: 54,
};

const initial = {
  students: [],
  photos: {}, // lowercase filename -> { url, name }
  overrides: {}, // student id -> object URL (manual assignment)
  settings: DEFAULT_SETTINGS,
  generated: [], // student ids with a generated card this session
  selected: [],
};

export const photoKey = (name) => String(name || '').split(/[\\/]/).pop().trim().toLowerCase();

function revoke(urls) {
  urls.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* ignore */ } });
}

function reducer(state, a) {
  switch (a.type) {
    case 'SET_STUDENTS': {
      return { ...state, students: a.students, generated: [], selected: [] };
    }
    case 'APPEND_STUDENTS':
      return { ...state, students: [...state.students, ...a.students] };
    case 'ADD_STUDENT':
      return { ...state, students: [...state.students, a.student] };
    case 'UPDATE_STUDENT':
      return {
        ...state,
        students: state.students.map((s) => (s.id === a.student.id ? { ...s, ...a.student } : s)),
        generated: state.generated.filter((id) => id !== a.student.id), // edited -> needs regeneration
      };
    case 'DELETE_STUDENT': {
      if (state.overrides[a.id]) revoke([state.overrides[a.id]]);
      const { [a.id]: _o, ...overrides } = state.overrides;
      return {
        ...state,
        overrides,
        students: state.students.filter((s) => s.id !== a.id),
        generated: state.generated.filter((i) => i !== a.id),
        selected: state.selected.filter((i) => i !== a.id),
      };
    }
    case 'ADD_PHOTOS': {
      const photos = { ...state.photos };
      for (const f of a.files) {
        const k = photoKey(f.name);
        if (photos[k]) revoke([photos[k].url]);
        photos[k] = { url: URL.createObjectURL(f), name: f.name };
      }
      return { ...state, photos };
    }
    case 'ASSIGN_PHOTO': {
      if (state.overrides[a.id]) revoke([state.overrides[a.id]]);
      return {
        ...state,
        overrides: { ...state.overrides, [a.id]: URL.createObjectURL(a.file) },
        generated: state.generated.filter((i) => i !== a.id),
      };
    }
    case 'CLEAR_PHOTOS':
      revoke([...Object.values(state.photos).map((p) => p.url), ...Object.values(state.overrides)]);
      return { ...state, photos: {}, overrides: {} };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...a.patch }, generated: [] };
    case 'MARK_GENERATED':
      return { ...state, generated: [...new Set([...state.generated, ...a.ids])] };
    case 'TOGGLE_SELECT':
      return {
        ...state,
        selected: state.selected.includes(a.id) ? state.selected.filter((i) => i !== a.id) : [...state.selected, a.id],
      };
    case 'SET_SELECTED':
      return { ...state, selected: a.ids };
    case 'RESET_ALL':
      revoke([...Object.values(state.photos).map((p) => p.url), ...Object.values(state.overrides)]);
      return { ...initial, settings: state.settings };
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const api = useMemo(() => {
    const getPhoto = (s) => state.overrides[s.id] || state.photos[photoKey(s.photo)]?.url || '';
    return { ...state, dispatch, getPhoto };
  }, [state]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
