import React, { useState, useEffect, useRef } from 'react';
import {
  api,
  NfcTagItem,
  PatientHospitalization,
  QuickRecordResponse,
  FullRecordResponse,
  TemporalSummaryResponse,
  PaginatedTimelineResponse,
  BedsidePendingTask,
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
  Copy,
  Check,
  Activity,
  Heart,
  Clock,
  Pill,
  Calendar,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  FileText,
  BarChart3,
  Search,
} from 'lucide-react';

type Tab = 'consultation' | 'link' | 'timeline' | 'summary' | 'tools';

export default function App() {
  // Estado de conexão e auth
  const [apiUrl, setApiUrlState] = useState<string>(getApiUrl());
  const [isEditingApi, setIsEditingApi] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setTokenState] = useState<string | null>(getToken());

  // Aba ativa
  const [activeTab, setActiveTab] = useState<Tab>('consultation');

  // Estado do Web NFC
  const [nfcSupported] = useState<boolean>(isWebNfcSupported());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [nfcMessage, setNfcMessage] = useState<string>('');
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dados globais carregados
  const [tags, setTags] = useState<NfcTagItem[]>([]);
  const [hospitalizations, setHospitalizations] = useState<PatientHospitalization[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // ==========================================
  // ESTADOS ESPECÍFICOS DE CADA FEATURE
  // ==========================================

  // 1. MODO CONSULTA (Prontuário Breve / Completo)
  const [consultIdentifier, setConsultIdentifier] = useState<string>('');
  const [quickRecord, setQuickRecord] = useState<QuickRecordResponse | null>(null);
  const [fullRecord, setFullRecord] = useState<FullRecordResponse | null>(null);
  const [isFullRecordOpen, setIsFullRecordOpen] = useState<boolean>(false);
  const [consultLoading, setConsultLoading] = useState<boolean>(false);

  // Modal para aplicação de medicamento
  const [applyingItem, setApplyingItem] = useState<BedsidePendingTask | null>(null);
  const [applyNotes, setApplyNotes] = useState<string>('');

  // 2. MODO VÍNCULO (Escanear coleira -> armazenar -> selecionar paciente)
  const [stagedCollarUid, setStagedCollarUid] = useState<string>('');

  // 3. LINHA DO TEMPO (Timeline)
  const [timelineHospId, setTimelineHospId] = useState<string>('');
  const [timelineData, setTimelineData] = useState<PaginatedTimelineResponse | null>(null);
  const [timelinePage, setTimelinePage] = useState<number>(1);
  const [timelineEventType, setTimelineEventType] = useState<string>('');
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);

  // 4. RESUMO TEMPORAL (Dashboard)
  const [summaryData, setSummaryData] = useState<TemporalSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  // 5. FERRAMENTAS NFC (Inventário & Gravação de URL)
  const [inputInventoryUid, setInputInventoryUid] = useState<string>('');
  const [writeSelectedTag, setWriteSelectedTag] = useState<string>('');
  const [writeCustomUrl, setWriteCustomUrl] = useState<string>('');

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

  // Carregar dados gerais
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [tagsData, hospData] = await Promise.all([
        api.listNfcTags().catch(() => [] as NfcTagItem[]),
        api.listActiveHospitalizations().catch(() => [] as PatientHospitalization[]),
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

  // Auth rápido
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
      notify(`Conectado como ${res.user.name} (${res.user.role})!`, 'success');
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
    setQuickRecord(null);
    setFullRecord(null);
    setSummaryData(null);
    setTimelineData(null);
    notify('Sessão encerrada.', 'info');
  };

  // Scanner Web NFC
  const stopScanning = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsScanning(false);
    setIsWriting(false);
    setNfcMessage('');
  };

  const handleStartScanning = async (purpose: 'consult' | 'stage-collar' | 'inventory') => {
    if (!nfcSupported) {
      notify('Web NFC não suportado neste navegador. Digite o UID manualmente.', 'error');
      return;
    }

    stopScanning();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsScanning(true);
    setNfcMessage('Aproxime a coleira NFC na traseira do celular...');

    try {
      await startNfcScan(
        (result: NfcScanResult) => {
          stopScanning();
          notify(`Tag lida com sucesso! UID: ${result.formattedUid}`, 'success');

          if (purpose === 'consult') {
            setConsultIdentifier(result.formattedUid);
            executeConsult(result.formattedUid);
          } else if (purpose === 'stage-collar') {
            setStagedCollarUid(result.formattedUid);
          } else if (purpose === 'inventory') {
            setInputInventoryUid(result.formattedUid);
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

  // ==========================================
  // ACTIONS: MODO CONSULTA (PRONTUÁRIO)
  // ==========================================
  const executeConsult = async (identifierToUse?: string) => {
    const id = (identifierToUse || consultIdentifier).trim();
    if (!id) {
      notify('Informe ou aproxime uma coleira NFC primeiro.', 'error');
      return;
    }

    setConsultLoading(true);
    setQuickRecord(null);
    setFullRecord(null);
    setIsFullRecordOpen(false);

    try {
      const data = await api.getQuickRecord(id);
      setQuickRecord(data);
      notify(`Prontuário breve de ${data.patient.name} carregado!`, 'success');
    } catch (err: any) {
      notify(`Não foi possível carregar o prontuário: ${err.message}`, 'error');
    } finally {
      setConsultLoading(false);
    }
  };

  const handleFetchFullRecord = async () => {
    if (!quickRecord) return;
    const identifier = quickRecord.nfcTag?.tagUid || quickRecord.nfcTag?.publicCode || consultIdentifier;
    if (!identifier) return;

    setConsultLoading(true);
    try {
      const full = await api.getFullRecord(identifier);
      setFullRecord(full);
      setIsFullRecordOpen(true);
      notify('Prontuário completo detalhado carregado com sucesso!', 'success');
    } catch (err: any) {
      notify(`Erro ao buscar prontuário completo: ${err.message}`, 'error');
    } finally {
      setConsultLoading(false);
    }
  };

  const handleApplyMedication = async () => {
    if (!applyingItem) return;
    setLoading(true);
    try {
      await api.applyBedsideItem(applyingItem.id, applyNotes || undefined);
      notify(`Item "${applyingItem.title}" aplicado e registrado!`, 'success');
      setApplyingItem(null);
      setApplyNotes('');
      // Recarrega o prontuário atual
      if (consultIdentifier) {
        await executeConsult(consultIdentifier);
      }
    } catch (err: any) {
      notify(`Falha ao aplicar item: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ACTIONS: MODO VÍNCULO (COLEIRA)
  // ==========================================
  const handleLinkStagedCollarToPatient = async (patientId: string, patientName: string) => {
    if (!stagedCollarUid.trim()) {
      notify('Escanear ou digitar uma tag de coleira primeiro.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.linkTagToPatient(patientId, cleanTagUid(stagedCollarUid));
      notify(`Coleira [${stagedCollarUid}] vinculada ao paciente ${patientName}!`, 'success');
      setStagedCollarUid('');
      await loadData();
    } catch (err: any) {
      notify(`Erro ao vincular coleira: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkPatientCollar = async (patientId: string, patientName: string) => {
    if (!confirm(`Deseja desvincular a coleira NFC do paciente ${patientName}?`)) return;
    setLoading(true);
    try {
      await api.unlinkTagFromPatient(patientId, 'Desvinculação via Modo Vínculo do frontend teste');
      notify(`Coleira de ${patientName} desvinculada e liberada no inventário!`, 'success');
      await loadData();
    } catch (err: any) {
      notify(`Erro ao desvincular: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ACTIONS: LINHA DO TEMPO (TIMELINE)
  // ==========================================
  const loadTimeline = async (hospId: string, page = 1, eventType?: string) => {
    if (!hospId) return;
    setTimelineLoading(true);
    try {
      const data = await api.getTimeline(hospId, page, 8, eventType || undefined);
      setTimelineData(data);
      setTimelinePage(page);
    } catch (err: any) {
      notify(`Erro ao carregar linha do tempo: ${err.message}`, 'error');
    } finally {
      setTimelineLoading(false);
    }
  };

  const openTimelineForHospitalization = (hospId: string) => {
    setTimelineHospId(hospId);
    setActiveTab('timeline');
    loadTimeline(hospId, 1, timelineEventType);
  };

  // ==========================================
  // ACTIONS: RESUMO TEMPORAL (DASHBOARD)
  // ==========================================
  const loadSummaryStats = async () => {
    setSummaryLoading(true);
    try {
      const data = await api.getTemporalSummary();
      setSummaryData(data);
    } catch (err: any) {
      notify(`Erro ao obter resumo temporal: ${err.message}`, 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Recarregar aba ao trocar
  useEffect(() => {
    if (activeTab === 'summary' && token) {
      loadSummaryStats();
    }
  }, [activeTab, token]);

  // ==========================================
  // ACTIONS: FERRAMENTAS NFC (INVENTÁRIO & GRAVAÇÃO)
  // ==========================================
  const handleRegisterInventoryTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputInventoryUid.trim()) {
      notify('Informe ou leia o UID da tag primeiro.', 'error');
      return;
    }

    const cleanUid = cleanTagUid(inputInventoryUid);
    setLoading(true);
    try {
      const created = await api.createNfcTag(cleanUid);
      notify(`Tag [${created.tagUid}] cadastrada no inventário com sucesso!`, 'success');
      setInputInventoryUid('');
      await loadData();
      setWriteSelectedTag(created.id);
      setWriteCustomUrl(created.targetUrl);
    } catch (err: any) {
      notify(`Falha ao cadastrar tag: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSimulatedUid = (target: 'inventory' | 'collar' | 'consult') => {
    const hexChars = '0123456789ABCDEF';
    let uid = '04';
    for (let i = 0; i < 12; i++) {
      uid += hexChars[Math.floor(Math.random() * 16)];
    }
    if (target === 'inventory') setInputInventoryUid(uid);
    if (target === 'collar') setStagedCollarUid(uid);
    if (target === 'consult') {
      setConsultIdentifier(uid);
      executeConsult(uid);
    }
    notify(`UID simulado gerado: ${uid}`, 'info');
  };

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
      notify(`URL gravada com sucesso na tag NFC!`, 'success');
    } catch (err: any) {
      stopScanning();
      notify(`Erro ao gravar na tag: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
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
                width: '38px',
                height: '38px',
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
              <p style={{ fontSize: '11px', opacity: 0.9 }}>Painel de Teste Mobile & Beira de Leito</p>
            </div>
          </div>

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
              {apiOnline ? 'Online' : 'Offline'}
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
              <strong>{nfcSupported ? 'Disponível (Chrome Android)' : 'Emulado / Leitura Manual'}</strong>
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
              Ajuda NFC
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
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>📱 Como testar no Celular</h3>
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

          {/* Configuração da URL da API */}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
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
            }}
          >
            <Radio size={32} color="#059669" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#065f46', marginBottom: '6px' }}>
            {isWriting ? 'Gravando URL na Tag NFC' : 'Aguardando Coleira NFC'}
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
            Cancelar Leitura
          </button>
        </div>
      )}

      {/* Banner de Login quando não autenticado */}
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
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>Autenticação Veterinária</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Conecte-se para acessar prontuários à beira do leito e vincular coleiras.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => handleQuickLogin('vet')}
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
              <UserCheck size={18} />
              Entrar como Dra. Madalena (VET)
            </button>

            <button
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
              style={{
                background: '#0f172a',
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
              Entrar como Administrador (ADMIN)
            </button>
          </div>
        </div>
      ) : (
        /* Barra de Usuário */
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
              <strong>{currentUser?.name}</strong> ({currentUser?.role})
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

      {/* Conteúdo Principal */}
      {token && (
        <main style={{ flex: 1, padding: '16px' }}>
          {/* Navegação por Abas (Tabs) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              background: '#e2e8f0',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '16px',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setActiveTab('consultation')}
              style={{
                padding: '8px 4px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'consultation' ? '#ffffff' : 'transparent',
                color: activeTab === 'consultation' ? '#065f46' : '#64748b',
                fontWeight: activeTab === 'consultation' ? 700 : 500,
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                cursor: 'pointer',
              }}
            >
              <Activity size={16} />
              Consulta
            </button>

            <button
              onClick={() => setActiveTab('link')}
              style={{
                padding: '8px 4px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'link' ? '#ffffff' : 'transparent',
                color: activeTab === 'link' ? '#065f46' : '#64748b',
                fontWeight: activeTab === 'link' ? 700 : 500,
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                cursor: 'pointer',
              }}
            >
              <UserCheck size={16} />
              Vínculo
            </button>

            <button
              onClick={() => {
                setActiveTab('timeline');
                if (hospitalizations.length > 0 && !timelineHospId) {
                  setTimelineHospId(hospitalizations[0].id);
                  loadTimeline(hospitalizations[0].id, 1);
                }
              }}
              style={{
                padding: '8px 4px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'timeline' ? '#ffffff' : 'transparent',
                color: activeTab === 'timeline' ? '#065f46' : '#64748b',
                fontWeight: activeTab === 'timeline' ? 700 : 500,
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                cursor: 'pointer',
              }}
            >
              <Clock size={16} />
              Timeline
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              style={{
                padding: '8px 4px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'summary' ? '#ffffff' : 'transparent',
                color: activeTab === 'summary' ? '#065f46' : '#64748b',
                fontWeight: activeTab === 'summary' ? 700 : 500,
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                cursor: 'pointer',
              }}
            >
              <BarChart3 size={16} />
              Resumo
            </button>

            <button
              onClick={() => setActiveTab('tools')}
              style={{
                padding: '8px 4px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'tools' ? '#ffffff' : 'transparent',
                color: activeTab === 'tools' ? '#065f46' : '#64748b',
                fontWeight: activeTab === 'tools' ? 700 : 500,
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                cursor: 'pointer',
              }}
            >
              <Tag size={16} />
              NFC Tools
            </button>
          </div>

          {/* ========================================================== */}
          {/* TAB 1: MODO CONSULTA (PRONTUÁRIO RÁPIDO & COMPLETO) */}
          {/* ========================================================== */}
          {activeTab === 'consultation' && (
            <div>
              {/* Leitor da Coleira */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    🩺 Modo Consulta: Ler Coleira do Paciente
                  </h2>
                  <button
                    onClick={loadData}
                    style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={13} /> Atualizar
                  </button>
                </div>

                {/* Botão de Leitura NFC */}
                <button
                  onClick={() => handleStartScanning('consult')}
                  disabled={consultLoading}
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
                    marginBottom: '12px',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  <Smartphone size={18} />
                  Aproximar Coleira NFC para Consultar
                </button>

                {/* Campo de Busca Manual / Seletor */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ou digite UID / Código Público..."
                    value={consultIdentifier}
                    onChange={(e) => setConsultIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeConsult()}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    onClick={() => executeConsult()}
                    disabled={consultLoading || !consultIdentifier.trim()}
                    style={{
                      background: '#0f172a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: consultIdentifier.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Search size={15} /> Consultar
                  </button>
                </div>

                {/* Sugestões de pacientes internados para teste rápido */}
                {hospitalizations.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>Teste rápido:</span>
                    {hospitalizations.filter((h) => h.nfcTag).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => {
                          const tag = h.nfcTag?.tagUid || '';
                          setConsultIdentifier(tag);
                          executeConsult(tag);
                        }}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          color: '#0f172a',
                        }}
                      >
                        🐾 {h.patient.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Loading da Consulta */}
              {consultLoading && (
                <div style={{ textAlign: 'center', padding: '24px', color: '#059669', fontSize: '14px', fontWeight: 600 }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s infinite linear', margin: '0 auto 8px' }} />
                  Carregando prontuário à beira do leito...
                </div>
              )}

              {/* CARD: PRONTUÁRIO RÁPIDO (BREVE) */}
              {quickRecord && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Cabeçalho do Paciente & Baia */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                            🐾 {quickRecord.patient.name}
                          </h2>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#dcfce7',
                              color: '#15803d',
                              padding: '2px 8px',
                              borderRadius: '999px',
                            }}
                          >
                            INTERNADO
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                          {quickRecord.patient.species} • {quickRecord.patient.breed || 'SRD'}
                        </p>
                      </div>

                      {/* Identificação da Baia */}
                      <div
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          textAlign: 'right',
                        }}
                      >
                        <span style={{ fontSize: '10px', color: '#1e40af', fontWeight: 600, display: 'block' }}>
                          LOCALIZAÇÃO
                        </span>
                        <strong style={{ fontSize: '13px', color: '#1e3a8a' }}>
                          📍 {quickRecord.kennel.name}
                        </strong>
                      </div>
                    </div>

                    {/* Dados Básicos (Idade, Peso, Tutor) */}
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Idade</span>
                        <strong style={{ color: '#0f172a' }}>{quickRecord.patient.ageDisplay || 'Não informada'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Peso</span>
                        <strong style={{ color: '#0f172a' }}>{quickRecord.patient.weightKg ? `${quickRecord.patient.weightKg} kg` : '-'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Tutor</span>
                        <strong style={{ color: '#0f172a' }}>{quickRecord.patient.guardian.name.split(' ')[0]}</strong>
                        <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>{quickRecord.patient.guardian.phone}</span>
                      </div>
                    </div>

                    {/* Alertas Clínicos Rápidos (Badges) */}
                    <div style={{ marginTop: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                        ⚠️ ALERTAS CLÍNICOS:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {quickRecord.clinicalAlerts && quickRecord.clinicalAlerts.length > 0 ? (
                          quickRecord.clinicalAlerts.map((alert, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: alert.includes('JEJUM')
                                  ? '#fee2e2'
                                  : alert.includes('ALERGIA')
                                  ? '#fef3c7'
                                  : alert.includes('TIPO SANGUÍNEO')
                                  ? '#e0e7ff'
                                  : '#f1f5f9',
                                color: alert.includes('JEJUM')
                                  ? '#991b1b'
                                  : alert.includes('ALERGIA')
                                  ? '#92400e'
                                  : alert.includes('TIPO SANGUÍNEO')
                                  ? '#3730a3'
                                  : '#334155',
                                border: '1px solid rgba(0,0,0,0.06)',
                              }}
                            >
                              {alert}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '12px', color: '#16a34a' }}>✓ Nenhum alerta restritivo ativo</span>
                        )}
                      </div>
                    </div>

                    {/* Tag da Coleira do Animal */}
                    {quickRecord.nfcTag && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '6px 10px',
                          background: '#ecfdf5',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#065f46',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>Coleira NFC Vinculada: <strong>{quickRecord.nfcTag.tagUid}</strong></span>
                        <span style={{ fontFamily: 'monospace', color: '#047857' }}>{quickRecord.nfcTag.publicCode}</span>
                      </div>
                    )}
                  </div>

                  {/* Card: Últimos Sinais Vitais */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Heart size={16} color="#dc2626" />
                        Últimos Sinais Vitais Aferidos
                      </h3>
                      <button
                        onClick={() => openTimelineForHospitalization(quickRecord.hospitalizationId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0284c7',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        Ver Histórico <ChevronRight size={13} />
                      </button>
                    </div>

                    {quickRecord.latestVitalSigns ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {quickRecord.latestVitalSigns.heartRate && (
                          <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Freq. Cardíaca</span>
                            <strong style={{ fontSize: '14px', color: '#dc2626' }}>{quickRecord.latestVitalSigns.heartRate} bpm</strong>
                          </div>
                        )}
                        {quickRecord.latestVitalSigns.respiratoryRate && (
                          <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Freq. Respiratória</span>
                            <strong style={{ fontSize: '14px', color: '#0284c7' }}>{quickRecord.latestVitalSigns.respiratoryRate} mpm</strong>
                          </div>
                        )}
                        {quickRecord.latestVitalSigns.temperature && (
                          <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Temperatura</span>
                            <strong style={{ fontSize: '14px', color: '#d97706' }}>{quickRecord.latestVitalSigns.temperature} °C</strong>
                          </div>
                        )}
                        {quickRecord.latestVitalSigns.systolicBP && (
                          <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Pressão PAS</span>
                            <strong style={{ fontSize: '14px', color: '#475569' }}>{quickRecord.latestVitalSigns.systolicBP} mmHg</strong>
                          </div>
                        )}
                        {quickRecord.latestVitalSigns.bloodGlucose && (
                          <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Glicemia</span>
                            <strong style={{ fontSize: '14px', color: '#7c3aed' }}>{quickRecord.latestVitalSigns.bloodGlucose} mg/dL</strong>
                          </div>
                        )}
                        {quickRecord.latestVitalSigns.capillaryRefillTime && (
                          <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>TPC</span>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>{quickRecord.latestVitalSigns.capillaryRefillTime}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>
                        Nenhuma aferição de sinais vitais registrada para esta internação ainda.
                      </p>
                    )}
                  </div>

                  {/* Card: Tarefas e Medicações Pendentes */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Pill size={16} color="#059669" />
                        Tarefas & Medicações Pendentes ({quickRecord.pendingTasks.length})
                      </h3>
                    </div>

                    {quickRecord.pendingTasks.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#16a34a', textAlign: 'center', padding: '12px 0' }}>
                        ✓ Todas as medicações e procedimentos deste horário foram realizados!
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {quickRecord.pendingTasks.map((task) => (
                          <div
                            key={task.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: task.isOverdue ? '#fef2f2' : '#f8fafc',
                              border: `1px solid ${task.isOverdue ? '#fca5a5' : '#e2e8f0'}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{task.title}</strong>
                                {task.isOverdue && (
                                  <span style={{ fontSize: '10px', background: '#dc2626', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                    ATRASADA
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                {task.dosage ? `Dose: ${task.dosage}` : ''} {task.route ? `• Via: ${task.route}` : ''}
                                {task.instructions ? ` • Obs: ${task.instructions}` : ''}
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setApplyingItem(task);
                                setApplyNotes('');
                              }}
                              style={{
                                background: '#059669',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ✓ Aplicar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botão de Prontuário Completo */}
                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    {!isFullRecordOpen ? (
                      <button
                        onClick={handleFetchFullRecord}
                        disabled={consultLoading}
                        style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px 20px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        }}
                      >
                        <FileText size={16} /> Ver Prontuário Completo (Prescrições & Histórico)
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsFullRecordOpen(false)}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Ocultar Prontuário Completo
                      </button>
                    )}
                  </div>

                  {/* SEÇÃO EXPANSÍVEL: PRONTUÁRIO COMPLETO */}
                  {isFullRecordOpen && fullRecord && (
                    <div
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '2px solid #0f172a',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      }}
                    >
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={18} color="#0f172a" />
                        Prontuário Completo: Protocolos de Prescrição & Histórico
                      </h3>

                      {/* Lista de Prescrições */}
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                          Prescrições Médicas Ativas ({fullRecord.prescriptions?.length || 0})
                        </h4>
                        {fullRecord.prescriptions && fullRecord.prescriptions.length > 0 ? (
                          fullRecord.prescriptions.map((presc: any) => (
                            <div
                              key={presc.id}
                              style={{
                                padding: '10px',
                                background: '#f8fafc',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '8px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <strong>Prescrição #{presc.id.substring(0, 8)}</strong>
                                <span style={{ color: '#059669', fontWeight: 600 }}>{presc.status}</span>
                              </div>
                              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                Veterinário: {presc.veterinarian?.name || 'Não identificado'}
                              </p>
                              {presc.items && presc.items.length > 0 && (
                                <ul style={{ margin: '6px 0 0 16px', fontSize: '11px', color: '#334155' }}>
                                  {presc.items.map((it: any) => (
                                    <li key={it.id}>
                                      {it.name || it.title} {it.dose ? `(${it.dose})` : ''} - Status: <strong>{it.status}</strong>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: '12px', color: '#94a3b8' }}>Nenhuma prescrição cadastrada.</p>
                        )}
                      </div>

                      {/* Eventos Clínicos Recentes */}
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                          Histórico Clínico Detalhado ({fullRecord.clinicalEvents?.length || 0} eventos)
                        </h4>
                        {fullRecord.clinicalEvents && fullRecord.clinicalEvents.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {fullRecord.clinicalEvents.slice(0, 5).map((evt: any) => (
                              <div
                                key={evt.id}
                                style={{
                                  padding: '8px 10px',
                                  background: '#f8fafc',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  fontSize: '11px',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <strong>{evt.title}</strong>
                                  <span style={{ color: '#64748b' }}>
                                    {new Date(evt.recordedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {evt.description && <p style={{ color: '#475569', marginTop: '2px' }}>{evt.description}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '12px', color: '#94a3b8' }}>Nenhum evento clínico recente registrado.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODAL / DIALOG: APLICAR ITEM DE PRESCRIÇÃO */}
              {applyingItem && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    zIndex: 1000,
                  }}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '20px',
                      maxWidth: '420px',
                      width: '100%',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                    }}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Confirmar Aplicação de Medicamento
                    </h3>
                    <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                      Item: <strong>{applyingItem.title}</strong>
                      {applyingItem.dosage ? ` (${applyingItem.dosage})` : ''}
                    </p>

                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Observações Clínicas da Administração (Opcional):
                    </label>
                    <textarea
                      value={applyNotes}
                      onChange={(e) => setApplyNotes(e.target.value)}
                      placeholder="Ex: Administrado sem intercorrências, paciente aceitou bem via sachê..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        marginBottom: '16px',
                      }}
                    />

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setApplyingItem(null)}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '8px 14px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleApplyMedication}
                        disabled={loading}
                        style={{
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Confirmar e Gravar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: MODO VÍNCULO (COLEIRA) */}
          {/* ========================================================== */}
          {activeTab === 'link' && (
            <div>
              {/* Etapa 1: Escanear / Armazenar Tag da Coleira */}
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
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  🔗 Modo Vínculo: Coleira do Animal
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                  <strong>Passo 1:</strong> Aproxime a tag NFC da coleira física para armazenar o chip.
                  <br />
                  <strong>Passo 2:</strong> Selecione o paciente internado abaixo para concluir o vínculo.
                </p>

                {/* Botão de Leitura NFC da Coleira */}
                <button
                  onClick={() => handleStartScanning('stage-collar')}
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
                    marginBottom: '12px',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  <Smartphone size={18} />
                  1. Ler Coleira NFC com o Celular
                </button>

                {/* Digitação / Simulação manual */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Ou digite o UID da coleira..."
                    value={stagedCollarUid}
                    onChange={(e) => setStagedCollarUid(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    onClick={() => handleGenerateSimulatedUid('collar')}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '0 10px',
                      fontSize: '11px',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    🎲 Simular
                  </button>
                </div>

                {/* Banner de Coleira Armazenada em Mãos */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: stagedCollarUid ? '#ecfdf5' : '#f8fafc',
                    border: `1px solid ${stagedCollarUid ? '#a7f3d0' : '#e2e8f0'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Coleira em mãos para vincular:</span>
                    <strong style={{ fontSize: '13px', color: stagedCollarUid ? '#065f46' : '#94a3b8', fontFamily: 'monospace' }}>
                      {stagedCollarUid || 'Nenhuma tag lida ainda'}
                    </strong>
                  </div>
                  {stagedCollarUid && (
                    <button
                      onClick={() => setStagedCollarUid('')}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Etapa 2: Lista de Pacientes Internados para Vincular */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '18px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    2. Selecione o Paciente Internado ({hospitalizations.length})
                  </h3>
                  <button
                    onClick={loadData}
                    style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontSize: '12px' }}
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>

                {hospitalizations.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                    Nenhum paciente internado encontrado.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {hospitalizations.map((hosp) => (
                      <div
                        key={hosp.id}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: hosp.nfcTag ? '#f0fdf4' : '#fff7ed',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>🐾 {hosp.patient.name}</strong>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>({hosp.patient.species})</span>
                            </div>
                            <p style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                              📍 Baia: <strong>{hosp.kennel.name}</strong> • Tutor: {hosp.guardian?.name || 'Não informado'}
                            </p>
                          </div>

                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              background: hosp.nfcTag ? '#dcfce7' : '#ffedd5',
                              color: hosp.nfcTag ? '#15803d' : '#c2410c',
                            }}
                          >
                            {hosp.nfcTag ? 'COM COLEIRA' : 'SEM COLEIRA'}
                          </span>
                        </div>

                        {/* Status da Coleira Atual */}
                        <div
                          style={{
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px dashed #cbd5e1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '11px',
                          }}
                        >
                          <div>
                            {hosp.nfcTag ? (
                              <span style={{ color: '#166534' }}>
                                Coleira atual: <strong style={{ fontFamily: 'monospace' }}>{hosp.nfcTag.tagUid}</strong>
                              </span>
                            ) : (
                              <span style={{ color: '#9a3412' }}>Aguardando vínculo de coleira</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            {/* Botão de Vincular a Coleira em Mãos */}
                            <button
                              onClick={() => handleLinkStagedCollarToPatient(hosp.patient.id, hosp.patient.name)}
                              disabled={loading || !stagedCollarUid}
                              style={{
                                background: stagedCollarUid ? '#059669' : '#cbd5e1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: stagedCollarUid ? 'pointer' : 'not-allowed',
                              }}
                            >
                              Vincular Coleira Lida
                            </button>

                            {/* Desvincular se já tem tag */}
                            {hosp.nfcTag && (
                              <button
                                onClick={() => handleUnlinkPatientCollar(hosp.patient.id, hosp.patient.name)}
                                disabled={loading}
                                style={{
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                <Unlink size={11} /> Desvincular
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

          {/* ========================================================== */}
          {/* TAB 3: LINHA DO TEMPO (TIMELINE) */}
          {/* ========================================================== */}
          {activeTab === 'timeline' && (
            <div>
              <div
                style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    ⏱️ Linha do Tempo Clínica (Timeline)
                  </h2>
                </div>

                {/* Seletor de Internação */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Paciente Internado:
                  </label>
                  <select
                    value={timelineHospId}
                    onChange={(e) => {
                      setTimelineHospId(e.target.value);
                      loadTimeline(e.target.value, 1, timelineEventType);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: '#ffffff',
                    }}
                  >
                    <option value="">-- Escolha um Paciente --</option>
                    {hospitalizations.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.patient.name} ({h.kennel.name}) - {h.admissionReason}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por tipo de evento */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {[
                    { label: 'Todos', val: '' },
                    { label: 'Sinais Vitais', val: 'VITAL_SIGNS' },
                    { label: 'Medicação', val: 'MEDICATION_APPLICATION' },
                    { label: 'Alimentação', val: 'FEEDING' },
                    { label: 'Procedimento', val: 'PROCEDURE' },
                  ].map((filter) => (
                    <button
                      key={filter.val}
                      onClick={() => {
                        setTimelineEventType(filter.val);
                        if (timelineHospId) loadTimeline(timelineHospId, 1, filter.val);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        fontSize: '11px',
                        background: timelineEventType === filter.val ? '#059669' : '#f8fafc',
                        color: timelineEventType === filter.val ? 'white' : '#475569',
                        fontWeight: timelineEventType === filter.val ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Eventos Cronológicos */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '18px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #e2e8f0',
                }}
              >
                {timelineLoading ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#059669', fontSize: '13px' }}>
                    Carregando eventos clínicos...
                  </p>
                ) : !timelineData || timelineData.items.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                    Nenhum evento registrado nesta linha do tempo.
                  </p>
                ) : (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {timelineData.items.map((event) => (
                        <div
                          key={event.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            borderLeft: '4px solid #059669',
                            borderTop: '1px solid #e2e8f0',
                            borderRight: '1px solid #e2e8f0',
                            borderBottom: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>{event.title}</strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {new Date(event.recordedAt).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {event.description && (
                            <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                              {event.description}
                            </p>
                          )}

                          {/* Métricas aferidas */}
                          {event.metrics && Object.keys(event.metrics).length > 0 && (
                            <div
                              style={{
                                marginTop: '6px',
                                padding: '6px 8px',
                                background: '#ffffff',
                                borderRadius: '4px',
                                border: '1px dashed #cbd5e1',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                fontSize: '11px',
                              }}
                            >
                              {Object.entries(event.metrics).map(([key, val]) => (
                                <span key={key} style={{ color: '#065f46' }}>
                                  <strong>{key}:</strong> {String(val)}
                                </span>
                              ))}
                            </div>
                          )}

                          <div style={{ marginTop: '6px', fontSize: '10px', color: '#94a3b8', textAlign: 'right' }}>
                            Registrado por: <strong>{event.executor.name}</strong> ({event.executor.role})
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Paginação da Timeline */}
                    {timelineData.meta.totalPages > 1 && (
                      <div
                        style={{
                          marginTop: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12px',
                        }}
                      >
                        <button
                          onClick={() => loadTimeline(timelineHospId, timelinePage - 1, timelineEventType)}
                          disabled={!timelineData.meta.hasPreviousPage}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: timelineData.meta.hasPreviousPage ? 'pointer' : 'not-allowed',
                            opacity: timelineData.meta.hasPreviousPage ? 1 : 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <ChevronLeft size={14} /> Anterior
                        </button>

                        <span style={{ color: '#64748b' }}>
                          Página {timelineData.meta.page} de {timelineData.meta.totalPages} ({timelineData.meta.total} eventos)
                        </span>

                        <button
                          onClick={() => loadTimeline(timelineHospId, timelinePage + 1, timelineEventType)}
                          disabled={!timelineData.meta.hasNextPage}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: timelineData.meta.hasNextPage ? 'pointer' : 'not-allowed',
                            opacity: timelineData.meta.hasNextPage ? 1 : 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          Próxima <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: RESUMO TEMPORAL (DASHBOARD) */}
          {/* ========================================================== */}
          {activeTab === 'summary' && (
            <div>
              <div
                style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    📊 Resumo Temporal & Indicadores Hospitalares
                  </h2>
                  <button
                    onClick={loadSummaryStats}
                    style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={13} /> Atualizar
                  </button>
                </div>
              </div>

              {summaryLoading ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#059669', fontSize: '13px' }}>
                  Carregando resumo temporal...
                </p>
              ) : summaryData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Card: Taxa de Ocupação */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '18px',
                      boxShadow: '0 4px 12px rgba(6, 95, 70, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '11px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Ocupação Hospitalar em Tempo Real
                        </span>
                        <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}>
                          {summaryData.occupancyRatePercentage}%
                        </h3>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '12px', opacity: 0.95 }}>
                        <strong>{summaryData.currentlyActive}</strong> de <strong>{summaryData.totalKennels}</strong> baias ocupadas
                      </div>
                    </div>

                    {/* Barra de Progresso de Ocupação */}
                    <div style={{ marginTop: '14px', background: 'rgba(255,255,255,0.25)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(summaryData.occupancyRatePercentage, 100)}%`,
                          background: '#34d399',
                          height: '100%',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Grid de Períodos: Hoje, Esta Semana, Este Mês */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {/* Hoje */}
                    <div
                      style={{
                        background: '#ffffff',
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                        📅 Hoje
                      </span>
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#059669' }}>
                          Admissões: <strong>+{summaryData.today.admittedCount}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px' }}>
                          Altas: <strong>{summaryData.today.dischargedCount}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          Ativos no dia: {summaryData.today.activeCount}
                        </div>
                      </div>
                    </div>

                    {/* Esta Semana */}
                    <div
                      style={{
                        background: '#ffffff',
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                        🗓️ 7 Dias
                      </span>
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#059669' }}>
                          Admissões: <strong>+{summaryData.thisWeek.admittedCount}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px' }}>
                          Altas: <strong>{summaryData.thisWeek.dischargedCount}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Este Mês */}
                    <div
                      style={{
                        background: '#ffffff',
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                        📆 Mês Atual
                      </span>
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#059669' }}>
                          Admissões: <strong>+{summaryData.thisMonth.admittedCount}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px' }}>
                          Altas: <strong>{summaryData.thisMonth.dischargedCount}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 5: FERRAMENTAS NFC (INVENTÁRIO & GRAVAÇÃO DE URL) */}
          {/* ========================================================== */}
          {activeTab === 'tools' && (
            <div>
              {/* Cadastrar Tag no Inventário */}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    Cadastrar Chip no Inventário de Tags
                  </h2>
                </div>

                <button
                  onClick={() => handleStartScanning('inventory')}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '12px',
                  }}
                >
                  <Smartphone size={16} /> Aproximar Tag para Ler UID
                </button>

                <form onSubmit={handleRegisterInventoryTag}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="UID Físico (Hexadecimal)"
                      value={inputInventoryUid}
                      onChange={(e) => setInputInventoryUid(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleGenerateSimulatedUid('inventory')}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 10px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}
                    >
                      🎲 Simular
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !inputInventoryUid.trim()}
                    style={{
                      width: '100%',
                      background: inputInventoryUid.trim() ? '#0f172a' : '#cbd5e1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: inputInventoryUid.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={15} /> Salvar no Inventário
                  </button>
                </form>
              </div>

              {/* Gravar URL NDEF na Tag NFC */}
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
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Gravar URL na Tag NFC (Web NFC Writer)
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  Escreva a URL de prontuário direto no chip. Qualquer smartphone abrirá a página ao aproximar.
                </p>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Selecionar Tag do Inventário:
                  </label>
                  <select
                    value={writeSelectedTag}
                    onChange={(e) => {
                      setWriteSelectedTag(e.target.value);
                      const tag = tags.find((t) => t.id === e.target.value);
                      if (tag) setWriteCustomUrl(tag.targetUrl);
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="">-- Escolha uma tag --</option>
                    {tags.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tagUid} ({t.publicCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    URL para Gravação NDEF:
                  </label>
                  <input
                    type="url"
                    value={writeCustomUrl}
                    onChange={(e) => setWriteCustomUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                <button
                  onClick={handleWriteUrl}
                  disabled={loading || isWriting || !writeCustomUrl.trim()}
                  style={{
                    width: '100%',
                    background: writeCustomUrl.trim() ? '#059669' : '#cbd5e1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: writeCustomUrl.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Radio size={16} /> Aproximar Tag para Gravar URL
                </button>
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
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#0f172a' }}>
                  Tags Cadastradas no Inventário ({tags.length})
                </h3>
                {tags.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>
                    Nenhuma tag cadastrada no inventário.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tags.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <strong style={{ fontFamily: 'monospace' }}>{t.tagUid}</strong>
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>({t.publicCode})</span>
                        </div>
                        <button
                          onClick={() => {
                            setConsultIdentifier(t.tagUid);
                            setActiveTab('consultation');
                            executeConsult(t.tagUid);
                          }}
                          style={{
                            background: '#0284c7',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Consultar
                        </button>
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
        NFCareVet • Frontend de Teste Beira de Leito & Web NFC
      </footer>
    </div>
  );
}
