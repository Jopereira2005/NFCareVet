import React, { useState, useEffect, useRef } from 'react';
import {
  api,
  NfcTagItem,
  PatientHospitalization,
  getApiUrl,
  setApiUrl,
  getToken,
  getStoredUser,
  AuthUser,
} from './services/api';
import {
  isWebNfcSupported,
  startNfcScan,
  writeUrlToNfcTag,
  cleanTagUid,
  NfcScanResult,
} from './services/webNfc';
import {
  Radio,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Tag,
  UserCheck,
  Unlink,
  ExternalLink,
  Wifi,
  WifiOff,
  Key,
  LogOut,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';

type Tab = 'inventory' | 'writer' | 'patient';

export default function App() {
  // Estado de conexão e auth
  const [apiUrl, setApiUrlState] = useState<string>(getApiUrl());
  const [isEditingApi, setIsEditingApi] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setTokenState] = useState<string | null>(getToken());

  // Aba ativa
  const [activeTab, setActiveTab] = useState<Tab>('inventory');

  // Estado do Web NFC
  const [nfcSupported] = useState<boolean>(isWebNfcSupported());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [nfcMessage, setNfcMessage] = useState<string>('');
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dados carregados do backend
  const [tags, setTags] = useState<NfcTagItem[]>([]);
  const [hospitalizations, setHospitalizations] = useState<PatientHospitalization[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Estados dos formulários
  // 1. Inserir Tag
  const [inputUid, setInputUid] = useState<string>('');
  // 2. Gravar URL
  const [writeSelectedTag, setWriteSelectedTag] = useState<string>('');
  const [writeCustomUrl, setWriteCustomUrl] = useState<string>('');
  // 3. Vincular Paciente
  const [selectedHospId, setSelectedHospId] = useState<string>('');
  const [selectedTagForLink, setSelectedTagForLink] = useState<string>('');

  // Info card
  const [showNetworkInfo, setShowNetworkInfo] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const notify = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ text, type });
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
      if (type === 'success') window.navigator.vibrate([80, 50, 80]);
      if (type === 'error') window.navigator.vibrate([150, 50, 150]);
    }
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  // Checar saúde da API
  const checkBackend = async () => {
    const ok = await api.checkHealth();
    setApiOnline(ok);
  };

  // Carregar dados
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [tagsData, hospData] = await Promise.all([
        api.listNfcTags().catch((err) => {
          console.warn('Erro ao carregar tags:', err);
          return [] as NfcTagItem[];
        }),
        api.listActiveHospitalizations().catch((err) => {
          console.warn('Erro ao carregar internações:', err);
          return [] as PatientHospitalization[];
        }),
      ]);
      setTags(tagsData);
      setHospitalizations(hospData);
    } catch (err: any) {
      notify(`Erro ao carregar dados: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Login rápido padrão (Admin)
  const handleQuickLogin = async (role: 'admin' | 'vet') => {
    setLoading(true);
    try {
      const credentials =
        role === 'admin'
          ? { email: 'admin@nfcarevet.com', pass: 'admin123' }
          : { email: 'madalena@nfcarevet.com', pass: 'vet12345' };

      const res = await api.login(credentials.email, credentials.pass);
      setTokenState(res.accessToken);
      setCurrentUser(res.user);
      notify(`Conectado com sucesso como ${res.user.name} (${res.user.role})!`, 'success');
    } catch (err: any) {
      notify(`Falha ao conectar: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setTokenState(null);
    setCurrentUser(null);
    setTags([]);
    setHospitalizations([]);
    notify('Sessão encerrada.', 'info');
  };

  // Controle do Scanner Web NFC
  const stopScanning = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsScanning(false);
    setIsWriting(false);
    setNfcMessage('');
  };

  const handleStartScanning = async (purpose: 'read-to-input' | 'read-for-link') => {
    if (!nfcSupported) {
      notify('Web NFC não suportado neste navegador. Digite o UID manualmente.', 'error');
      return;
    }

    stopScanning();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsScanning(true);
    setNfcMessage('Aproxime a tag NFC na traseira do celular...');

    try {
      await startNfcScan(
        (result: NfcScanResult) => {
          stopScanning();
          notify(`Tag lida com sucesso! UID: ${result.formattedUid}`, 'success');
          if (purpose === 'read-to-input') {
            setInputUid(result.formattedUid);
          } else if (purpose === 'read-for-link') {
            setSelectedTagForLink(result.formattedUid);
          }
        },
        (error: Error) => {
          notify(error.message, 'error');
        },
        controller.signal
      );
    } catch (err: any) {
      stopScanning();
      notify(`Erro ao iniciar scanner NFC: ${err.message}`, 'error');
    }
  };

  // 1. Cadastrar Tag no Inventário
  const handleRegisterTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUid.trim()) {
      notify('Informe ou leia o UID da tag primeiro.', 'error');
      return;
    }

    const cleanUid = cleanTagUid(inputUid);
    setLoading(true);
    try {
      const created = await api.createNfcTag(cleanUid);
      notify(`Tag [${created.tagUid}] cadastrada no inventário com sucesso!`, 'success');
      setInputUid('');
      await loadData();
      // Sugere gravar url nessa tag
      setWriteSelectedTag(created.id);
      setWriteCustomUrl(created.targetUrl);
    } catch (err: any) {
      notify(`Falha ao cadastrar tag: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Gerar UID aleatório para testes rápidos em desktop
  const handleGenerateSimulatedUid = () => {
    const hexChars = '0123456789ABCDEF';
    let uid = '04';
    for (let i = 0; i < 12; i++) {
      uid += hexChars[Math.floor(Math.random() * 16)];
    }
    setInputUid(uid);
    notify(`UID de teste gerado: ${uid}`, 'info');
  };

  // 2. Gravar URL na Tag NFC
  const handleWriteUrl = async () => {
    const urlToWrite = writeCustomUrl.trim();
    if (!urlToWrite) {
      notify('Informe ou selecione uma URL para gravar na tag.', 'error');
      return;
    }

    if (!nfcSupported) {
      notify('Web NFC não suportado neste aparelho. Teste em um Chrome Android com HTTPS.', 'error');
      return;
    }

    stopScanning();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsWriting(true);
    setNfcMessage('Aproxime a tag NFC na traseira do celular para gravar a URL...');

    try {
      await writeUrlToNfcTag(urlToWrite, controller.signal);
      stopScanning();
      notify(`URL [${urlToWrite}] gravada com sucesso na tag NFC!`, 'success');
    } catch (err: any) {
      stopScanning();
      notify(`Erro ao gravar na tag: ${err.message}`, 'error');
    }
  };

  // 3. Alterar Paciente Vinculado à Tag
  const handleLinkTagToPatient = async () => {
    if (!selectedHospId) {
      notify('Selecione uma internação / paciente da lista.', 'error');
      return;
    }
    if (!selectedTagForLink) {
      notify('Selecione ou aproxime a tag NFC para vincular.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Se a tag já estiver vinculada a outra internação, desvincula primeiro
      const tagItem = tags.find(
        (t) => t.id === selectedTagForLink || t.tagUid === selectedTagForLink || t.publicCode === selectedTagForLink
      );

      const currentHolder = hospitalizations.find((h) => h.nfcTag?.tagUid === tagItem?.tagUid);

      if (currentHolder && currentHolder.id !== selectedHospId) {
        // Desvincular da internação anterior
        await api.unlinkTag(
          currentHolder.id,
          `Transferência de tag para o paciente selecionado`
        );
      }

      await api.linkTag(selectedHospId, selectedTagForLink);
      notify('Paciente vinculado à tag NFC com sucesso!', 'success');
      await loadData();
      setSelectedTagForLink('');
    } catch (err: any) {
      notify(`Erro ao vincular tag: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkTag = async (hospId: string) => {
    if (!confirm('Deseja realmente desvincular a tag NFC deste paciente?')) return;
    setLoading(true);
    try {
      await api.unlinkTag(hospId, 'Desvinculação manual via aplicativo móvel');
      notify('Tag desvinculada com sucesso!', 'success');
      await loadData();
    } catch (err: any) {
      notify(`Erro ao desvincular: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quando escolhe uma tag no formulário de gravação
  const handleSelectTagForWrite = (tagId: string) => {
    setWriteSelectedTag(tagId);
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      setWriteCustomUrl(tag.targetUrl);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
          color: '#ffffff',
          padding: '16px 20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Radio size={22} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.2 }}>NFCareVet</h1>
              <p style={{ fontSize: '12px', opacity: 0.9 }}>Painel de Gestão NFC Mobile</p>
            </div>
          </div>

          {/* Status Backend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '999px',
                background: apiOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.3)',
                border: `1px solid ${apiOnline ? '#34d399' : '#f87171'}`,
              }}
            >
              {apiOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {apiOnline ? 'API Conectada' : 'API Offline'}
            </span>

            <button
              onClick={() => setShowNetworkInfo(!showNetworkInfo)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              title="Informações de Acesso Mobile"
            >
              <Info size={16} />
            </button>
          </div>
        </div>

        {/* Status Web NFC */}
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: '6px',
            background: nfcSupported ? 'rgba(255,255,255,0.15)' : 'rgba(254, 240, 138, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smartphone size={15} />
            <span>
              Web NFC:{' '}
              <strong>{nfcSupported ? 'Disponível (Chrome Android)' : 'Não detectado neste navegador'}</strong>
            </span>
          </div>
          {!nfcSupported && (
            <button
              onClick={() => setShowNetworkInfo(true)}
              style={{
                background: '#fef08a',
                color: '#854d0e',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Ver Como Ativar
            </button>
          )}
        </div>
      </header>

      {/* Network Info Modal / Dropdown */}
      {showNetworkInfo && (
        <div
          style={{
            background: '#ffffff',
            borderBottom: '2px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 6px 12px rgba(0,0,0,0.06)',
            fontSize: '13px',
            color: '#334155',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>📱 Como acessar no Celular</h3>
            <button
              onClick={() => setShowNetworkInfo(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              ✕
            </button>
          </div>

          <p style={{ marginBottom: '8px' }}>
            1. Certifique-se de que o computador e o celular estão conectados na <strong>mesma rede Wi-Fi</strong>.
          </p>
          <p style={{ marginBottom: '8px' }}>
            2. No Chrome do celular, acesse o endereço desta aplicação:
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              marginBottom: '10px',
            }}
          >
            <code style={{ fontSize: '13px', color: '#047857', fontWeight: 600, flex: 1 }}>
              {window.location.origin}
            </code>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.origin);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
              {copiedUrl ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div
            style={{
              background: '#eff6ff',
              borderLeft: '4px solid #3b82f6',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              lineHeight: 1.4,
            }}
          >
            <strong>Requisito do Chrome para Web NFC:</strong> O Chrome no Android exige <strong>HTTPS</strong> ou que a
            origem seja declarada segura.
            <br />
            • Opção recomendada: execute <code>npm run dev:https</code> (com certificado SSL).
            <br />
            • Alternativa: No Chrome do Android, acesse <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>, adicione{' '}
            <code>{window.location.origin}</code> e reinicie o Chrome.
          </div>

          {/* Configuração da URL da API */}
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>URL do Backend: <strong>{apiUrl}</strong></span>
              <button
                onClick={() => setIsEditingApi(!isEditingApi)}
                style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontSize: '12px' }}
              >
                {isEditingApi ? 'Cancelar' : 'Alterar'}
              </button>
            </div>
            {isEditingApi && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrlState(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <button
                  onClick={() => {
                    setApiUrl(apiUrl);
                    setIsEditingApi(false);
                    checkBackend();
                    notify('URL do Backend atualizada!', 'info');
                  }}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notificação Toast */}
      {notification && (
        <div
          style={{
            margin: '12px 16px 0',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 500,
            background:
              notification.type === 'success'
                ? '#ecfdf5'
                : notification.type === 'error'
                ? '#fef2f2'
                : '#f0f9ff',
            border: `1px solid ${
              notification.type === 'success'
                ? '#a7f3d0'
                : notification.type === 'error'
                ? '#fecaca'
                : '#bae6fd'
            }`,
            color:
              notification.type === 'success'
                ? '#065f46'
                : notification.type === 'error'
                ? '#991b1b'
                : '#0369a1',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          {notification.type === 'success' && <CheckCircle2 size={18} color="#059669" />}
          {notification.type === 'error' && <AlertCircle size={18} color="#dc2626" />}
          {notification.type === 'info' && <Info size={18} color="#0284c7" />}
          <span style={{ flex: 1 }}>{notification.text}</span>
        </div>
      )}

      {/* Modal / Card de NFC Ativo */}
      {(isScanning || isWriting) && (
        <div
          style={{
            margin: '16px',
            padding: '20px',
            borderRadius: '12px',
            background: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '2px solid #059669',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 12px',
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 1.5s infinite',
            }}
          >
            <Radio size={32} color="#059669" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#065f46', marginBottom: '6px' }}>
            {isWriting ? 'Aguardando Tag para Gravação' : 'Aguardando Leitura NFC'}
          </h3>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>{nfcMessage}</p>
          <button
            onClick={stopScanning}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Banner de Autenticação se não logado */}
      {!token ? (
        <div
          style={{
            margin: '20px 16px',
            padding: '24px 18px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 12px',
              borderRadius: '50%',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Key size={24} color="#0284c7" />
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>Autenticação Necessária</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Conecte-se para vincular tags e gerenciar pacientes com o backend.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <ShieldCheck size={18} />
              Entrar com 1-Clique (Admin)
            </button>

            <button
              onClick={() => handleQuickLogin('vet')}
              disabled={loading}
              style={{
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <UserCheck size={18} />
              Entrar como Veterinária (Dra. Madalena)
            </button>
          </div>
        </div>
      ) : (
        /* Barra de Usuário Conectado */
        <div
          style={{
            margin: '12px 16px 0',
            padding: '10px 14px',
            background: '#ffffff',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            <span>
              Logado como: <strong>{currentUser?.name}</strong> ({currentUser?.role})
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      )}

      {/* Conteúdo Principal (quando autenticado) */}
      {token && (
        <main style={{ flex: 1, padding: '16px' }}>
          {/* Navegação por Abas (Tabs) */}
          <div
            style={{
              display: 'flex',
              background: '#e2e8f0',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '16px',
            }}
          >
            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                flex: 1,
                padding: '10px 6px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'inventory' ? '#ffffff' : 'transparent',
                color: activeTab === 'inventory' ? '#065f46' : '#64748b',
                fontWeight: activeTab === 'inventory' ? 700 : 500,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'inventory' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Tag size={15} />
              1. Inventário
            </button>

            <button
              onClick={() => setActiveTab('writer')}
              style={{
                flex: 1,
                padding: '10px 6px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'writer' ? '#ffffff' : 'transparent',
                color: activeTab === 'writer' ? '#065f46' : '#64748b',
                fontWeight: activeTab === 'writer' ? 700 : 500,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'writer' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Radio size={15} />
              2. Gravar URL
            </button>

            <button
              onClick={() => setActiveTab('patient')}
              style={{
                flex: 1,
                padding: '10px 6px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'patient' ? '#ffffff' : 'transparent',
                color: activeTab === 'patient' ? '#065f46' : '#64748b',
                fontWeight: activeTab === 'patient' ? 700 : 500,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'patient' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <UserCheck size={15} />
              3. Vínculo
            </button>
          </div>

          {/* ========================================================== */}
          {/* TAB 1: INSERIR TAG NO INVENTÁRIO */}
          {/* ========================================================== */}
          {activeTab === 'inventory' && (
            <div>
              <div
                style={{
                  background: '#ffffff',
                  padding: '18px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    Cadastrar Nova Tag no Inventário
                  </h2>
                  <button
                    onClick={loadData}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <RefreshCw size={13} /> Atualizar
                  </button>
                </div>

                {/* Botão de Leitura NFC Física */}
                <button
                  onClick={() => handleStartScanning('read-to-input')}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '14px',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  <Smartphone size={18} />
                  Aproximar Tag NFC para Ler UID
                </button>

                <div style={{ textAlign: 'center', margin: '10px 0', fontSize: '12px', color: '#94a3b8' }}>
                  — ou digite / simule o UID —
                </div>

                {/* Formulário Manual */}
                <form onSubmit={handleRegisterTag}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      UID Físico da Tag (Hexadecimal)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 04A23B89C16080"
                      value={inputUid}
                      onChange={(e) => setInputUid(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleGenerateSimulatedUid}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      🎲 Gerar UID Simulado
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !inputUid.trim()}
                      style={{
                        flex: 1,
                        background: inputUid.trim() ? '#0f172a' : '#cbd5e1',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: inputUid.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={16} /> Salvar no Inventário
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista de Tags no Inventário */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '18px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>
                  Tags Cadastradas no Inventário ({tags.length})
                </h3>

                {tags.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                    Nenhuma tag cadastrada ainda. Aproxime ou digite um UID acima.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tags.map((tag) => {
                      const linkedHosp = hospitalizations.find((h) => h.nfcTag?.tagUid === tag.tagUid);

                      return (
                        <div
                          key={tag.id}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                                  {tag.tagUid}
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: tag.active ? '#dcfce7' : '#fee2e2',
                                    color: tag.active ? '#15803d' : '#b91c1c',
                                    fontWeight: 600,
                                  }}
                                >
                                  {tag.active ? 'ATIVA' : 'INATIVA'}
                                </span>
                              </div>
                              <p style={{ fontSize: '11px', color: '#64748b' }}>
                                Código Público: <strong>{tag.publicCode}</strong>
                              </p>
                            </div>

                            {/* Status de Vínculo */}
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: linkedHosp ? '#e0f2fe' : '#f1f5f9',
                                color: linkedHosp ? '#0369a1' : '#64748b',
                                fontWeight: 500,
                              }}
                            >
                              {linkedHosp ? `🐾 ${linkedHosp.patient.name}` : 'Disponível'}
                            </span>
                          </div>

                          <div
                            style={{
                              marginTop: '8px',
                              padding: '6px 8px',
                              background: '#ffffff',
                              borderRadius: '4px',
                              border: '1px dashed #cbd5e1',
                              fontSize: '11px',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              🔗 {tag.targetUrl}
                            </span>
                            <button
                              onClick={() => {
                                setWriteSelectedTag(tag.id);
                                setWriteCustomUrl(tag.targetUrl);
                                setActiveTab('writer');
                              }}
                              style={{
                                background: '#059669',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Gravar URL
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: CADASTRAR/GRAVAR URL NA TAG (WEB NFC WRITER) */}
          {/* ========================================================== */}
          {activeTab === 'writer' && (
            <div
              style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Gravar URL na Tag NFC (Web NFC)
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Escreva o link de leito na tag física. Ao aproximar qualquer celular compatível da tag gravada, a página
                abrirá automaticamente!
              </p>

              {/* Seleção rápida a partir do inventário */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Preencher URL a partir de uma Tag do Inventário:
                </label>
                <select
                  value={writeSelectedTag}
                  onChange={(e) => handleSelectTagForWrite(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                  }}
                >
                  <option value="">-- Escolha uma tag ou digite a URL abaixo --</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tagUid} ({t.publicCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* URL a gravar */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  URL de Destino para Gravação (Registro NDEF)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={writeCustomUrl}
                  onChange={(e) => setWriteCustomUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                  }}
                />
              </div>

              {/* Prévia da URL */}
              {writeCustomUrl && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <span style={{ color: '#64748b' }}>Prévia do link a ser gravado:</span>
                  <div style={{ color: '#047857', fontWeight: 600, wordBreak: 'break-all', marginTop: '2px' }}>
                    {writeCustomUrl}
                  </div>
                </div>
              )}

              {/* Botão de Gravação */}
              <button
                onClick={handleWriteUrl}
                disabled={loading || isWriting || !writeCustomUrl.trim()}
                style={{
                  width: '100%',
                  background: writeCustomUrl.trim() ? '#059669' : '#cbd5e1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: writeCustomUrl.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: writeCustomUrl.trim() ? '0 4px 12px rgba(5, 150, 105, 0.3)' : 'none',
                }}
              >
                <Radio size={20} />
                Aproximar Tag para Gravar URL
              </button>

              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  fontSize: '12px',
                  color: '#166534',
                  lineHeight: 1.4,
                }}
              >
                💡 <strong>Dica prática:</strong> Ao clicar no botão, mantenha a tag encostada na antena NFC do celular
                (normalmente próxima à câmera traseira) até o aviso de sucesso aparecer.
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: ALTERAR PACIENTE VINCULADO À TAG */}
          {/* ========================================================== */}
          {activeTab === 'patient' && (
            <div>
              {/* Formulário de Vínculo */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '18px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Vincular ou Alterar Paciente da Tag NFC
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                  Selecione o paciente internado e a tag que ficará alocada no leito.
                </p>

                {/* Seleção do Paciente Internado */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    1. Paciente Internado (Leito Ativo)
                  </label>
                  <select
                    value={selectedHospId}
                    onChange={(e) => setSelectedHospId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: '#ffffff',
                    }}
                  >
                    <option value="">-- Selecione o Paciente --</option>
                    {hospitalizations.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.patient.name} ({h.patient.species} - {h.kennel.name})
                        {h.nfcTag ? ` [Tag Atual: ${h.nfcTag.tagUid}]` : ' [Sem Tag]'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seleção da Tag NFC */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    2. Tag NFC a Vincular
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select
                      value={selectedTagForLink}
                      onChange={(e) => setSelectedTagForLink(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        background: '#ffffff',
                      }}
                    >
                      <option value="">-- Escolha uma Tag do Inventário --</option>
                      {tags.map((t) => (
                        <option key={t.id} value={t.tagUid}>
                          {t.tagUid} - {t.publicCode}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleStartScanning('read-for-link')}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Radio size={14} /> Ler no NFC
                    </button>
                  </div>

                  {selectedTagForLink && (
                    <div style={{ fontSize: '12px', color: '#047857' }}>
                      Tag selecionada: <strong>{selectedTagForLink}</strong>
                    </div>
                  )}
                </div>

                {/* Botão de Salvar Vínculo */}
                <button
                  onClick={handleLinkTagToPatient}
                  disabled={loading || !selectedHospId || !selectedTagForLink}
                  style={{
                    width: '100%',
                    background: selectedHospId && selectedTagForLink ? '#059669' : '#cbd5e1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: selectedHospId && selectedTagForLink ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <UserCheck size={18} />
                  Confirmar Vínculo da Tag ao Paciente
                </button>
              </div>

              {/* Lista de Pacientes e Status de Tag */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '18px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>
                  Pacientes Internados Ativos ({hospitalizations.length})
                </h3>

                {hospitalizations.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                    Nenhum paciente internado encontrado.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {hospitalizations.map((hosp) => (
                      <div
                        key={hosp.id}
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: hosp.nfcTag ? '#f0fdf4' : '#fff7ed',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                              🐾 {hosp.patient.name}
                            </h4>
                            <p style={{ fontSize: '12px', color: '#64748b' }}>
                              {hosp.patient.species} • {hosp.patient.breed} • {hosp.patient.weightKg} kg
                            </p>
                            <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                              📍 <strong>{hosp.kennel.name}</strong> • Motivo: {hosp.admissionReason}
                            </p>
                          </div>

                          <span
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: hosp.nfcTag ? '#dcfce7' : '#ffedd5',
                              color: hosp.nfcTag ? '#15803d' : '#c2410c',
                              fontWeight: 600,
                            }}
                          >
                            {hosp.nfcTag ? 'Com Tag NFC' : 'Sem Tag'}
                          </span>
                        </div>

                        {/* Detalhes da Tag Vinculada */}
                        <div
                          style={{
                            marginTop: '10px',
                            paddingTop: '10px',
                            borderTop: '1px dashed #cbd5e1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          {hosp.nfcTag ? (
                            <div style={{ fontSize: '12px', color: '#166534' }}>
                              Tag: <strong style={{ fontFamily: 'monospace' }}>{hosp.nfcTag.tagUid}</strong> (
                              {hosp.nfcTag.publicCode})
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#9a3412' }}>
                              Nenhuma tag vinculada a este leito.
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setSelectedHospId(hosp.id);
                                if (hosp.nfcTag) setSelectedTagForLink(hosp.nfcTag.tagUid);
                              }}
                              style={{
                                background: '#0284c7',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              Alterar
                            </button>

                            {hosp.nfcTag && (
                              <button
                                onClick={() => handleUnlinkTag(hosp.id)}
                                style={{
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                }}
                              >
                                <Unlink size={12} /> Desvincular
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          padding: '16px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#94a3b8',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
        }}
      >
        NFCareVet Mini Frontend • Módulo de Teste Mobile Web NFC • Chrome Android
      </footer>
    </div>
  );
}
