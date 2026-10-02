export interface NfcTagItem {
  id: string;
  tagUid: string;
  publicCode: string;
  active: boolean;
  targetUrl: string;
  createdAt: string;
  hospitalization?: {
    id: string;
    patient?: {
      id: string;
      name: string;
      species: string;
      breed: string;
    };
  };
}

export interface PatientHospitalization {
  id: string;
  admissionReason: string;
  status: string;
  patient: {
    id: string;
    name: string;
    species: string;
    breed: string;
    weightKg: number;
    allergies?: string;
  };
  kennel: {
    id: string;
    name: string;
  };
  guardian?: {
    name: string;
    phone: string;
  };
  nfcTag?: {
    id: string;
    tagUid: string;
    publicCode: string;
    active: boolean;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const STORAGE_API_KEY = 'nfcarevet_api_url';
const STORAGE_TOKEN_KEY = 'nfcarevet_token';
const STORAGE_USER_KEY = 'nfcarevet_user';

export const getApiUrl = (): string => {
  const saved = localStorage.getItem(STORAGE_API_KEY);
  if (saved) return saved;

  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:3000`;
};

export const setApiUrl = (url: string): void => {
  const cleanUrl = url.trim().replace(/\/$/, '');
  localStorage.setItem(STORAGE_API_KEY, cleanUrl);
};

export const getToken = (): string | null => {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
};

export const setToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  }
};

export const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: AuthUser | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_USER_KEY);
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiUrl();
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Erro HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Autenticação
  async login(email: string, password: string): Promise<{ accessToken: string; user: AuthUser }> {
    const data = await request<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.accessToken);
    setStoredUser(data.user);
    return data;
  },

  async badgeLogin(badgeUid: string): Promise<{ accessToken: string; user: AuthUser }> {
    const data = await request<{ accessToken: string; user: AuthUser }>('/auth/badge-login', {
      method: 'POST',
      body: JSON.stringify({ badgeUid }),
    });
    setToken(data.accessToken);
    setStoredUser(data.user);
    return data;
  },

  logout(): void {
    setToken(null);
    setStoredUser(null);
  },

  // Tags NFC (Inventário)
  async listNfcTags(): Promise<NfcTagItem[]> {
    return request<NfcTagItem[]>('/nfc-tags');
  },

  async createNfcTag(tagUid: string): Promise<NfcTagItem> {
    return request<NfcTagItem>('/nfc-tags', {
      method: 'POST',
      body: JSON.stringify({ tagUid }),
    });
  },

  // Internações & Vínculo com Pacientes
  async listActiveHospitalizations(): Promise<PatientHospitalization[]> {
    return request<PatientHospitalization[]>('/hospitalizations/active');
  },

  async linkTag(hospitalizationId: string, tagIdentifier: string) {
    return request(`/hospitalizations/${hospitalizationId}/link-tag`, {
      method: 'POST',
      body: JSON.stringify({ tagIdentifier }),
    });
  },

  async unlinkTag(hospitalizationId: string, reason = 'Alteração ou desvinculação via mobile') {
    return request(`/hospitalizations/${hospitalizationId}/unlink-tag`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async checkHealth(): Promise<boolean> {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/health/ping`);
      return res.ok;
    } catch {
      return false;
    }
  }
};
