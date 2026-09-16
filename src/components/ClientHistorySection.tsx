import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  ShieldCheck, 
  Calendar, 
  Search, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Lock, 
  Unlock, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  UserPlus,
  CreditCard,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Smartphone,
  Laptop,
  Activity,
  Filter,
  Phone,
  Building,
  UserCheck
} from 'lucide-react';
import { ClientUser, VisitorLead } from '../types';

export const ClientHistorySection: React.FC = () => {
  const [activeView, setActiveView] = useState<'CLIENTS' | 'VISITORS'>('CLIENTS');
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [visitors, setVisitors] = useState<VisitorLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'WARNING' | 'EXPIRED'>('ALL');
  
  // Manual Registration State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newClub, setNewClub] = useState('');
  const [newRole, setNewRole] = useState('DT Principal');
  const [newPhone, setNewPhone] = useState('');
  const [newTrialDays, setNewTrialDays] = useState(30);
  const [newNotes, setNewNotes] = useState('');

  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Mercado Pago Admin Credentials State
  const [showMPConfig, setShowMPConfig] = useState(false);
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('APP_USR-bb2f9b87-9ef9-44fb-bb03-0e19411853f4');
  const [mpAdminKey, setMpAdminKey] = useState('CAR123');
  const [showTokenText, setShowTokenText] = useState(false);
  const [mpStatus, setMpStatus] = useState<{
    isConfigured: boolean;
    maskedAccessToken?: string;
    publicKey?: string;
    updatedAt?: string;
  } | null>(null);
  const [mpTesting, setMpTesting] = useState(false);
  const [mpSaving, setMpSaving] = useState(false);
  const [mpTestResult, setMpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchMPCredentials = async () => {
    try {
      const res = await fetch('/api/mercadopago/admin-credentials');
      if (res.ok) {
        const data = await res.json();
        setMpStatus(data);
        if (data.publicKey) {
          setMpPublicKey(data.publicKey);
        }
      }
    } catch (err) {
      console.error('Error fetching MP credentials status:', err);
    }
  };

  const fetchClients = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [resClients, resVisitors] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/visitors'),
      ]);

      if (resClients.ok) {
        const data = await resClients.json();
        setClients(data.clients || []);
      }

      if (resVisitors.ok) {
        const dataVis = await resVisitors.json();
        setVisitors(dataVis.visitors || []);
      }
    } catch (err) {
      console.error('Error fetching clients or visitors:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchMPCredentials();
    const interval = setInterval(() => {
      fetchClients(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const calculateClientStatus = (client: ClientUser) => {
    const firstLoginMs = new Date(client.firstLoginDate).getTime();
    const totalAllowedDays = (client.trialDurationDays || 30) + (client.customGrantedDays || 0);
    const totalAllowedMs = totalAllowedDays * 24 * 60 * 60 * 1000;
    const elapsedMs = Math.max(0, Date.now() - firstLoginMs);
    const remainingMs = Math.max(0, totalAllowedMs - elapsedMs);
    const totalRemainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const daysRemaining = Math.floor(totalRemainingHours / 24);
    const hoursRemaining = totalRemainingHours % 24;
    const isExpired = remainingMs <= 0 || !!client.isBlocked;
    const pctUsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalAllowedMs) * 100)));

    let statusType: 'ACTIVE' | 'WARNING' | 'EXPIRED' = 'ACTIVE';
    if (isExpired) {
      statusType = 'EXPIRED';
    } else if (daysRemaining <= 5) {
      statusType = 'WARNING';
    }

    let remainingText = '';
    if (isExpired) {
      remainingText = '0 días restantes';
    } else if (daysRemaining >= 29 && elapsedMs < 1000 * 60 * 60) {
      remainingText = `${totalAllowedDays} días restantes`;
    } else if (daysRemaining === 0) {
      remainingText = `${hoursRemaining} hs restantes`;
    } else {
      remainingText = `${daysRemaining}d ${hoursRemaining}h restantes`;
    }

    return {
      daysRemaining,
      hoursRemaining,
      remainingText,
      isExpired,
      pctUsed,
      statusType,
      totalAllowedDays,
    };
  };

  const handleExtendDays = async (email: string, days: number) => {
    try {
      const res = await fetch('/api/clients/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, addDays: days }),
      });
      if (res.ok) {
        showFeedback(`Se añadieron +${days} días a ${email}`);
        fetchClients(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetClient = async (email: string) => {
    if (!confirm(`¿Restablecer el contador a 30 días completos para ${email}?`)) return;
    try {
      const res = await fetch('/api/clients/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetDate: true }),
      });
      if (res.ok) {
        showFeedback(`Contador reiniciado a 30 días para ${email}`);
        fetchClients(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBlock = async (email: string, currentBlocked?: boolean) => {
    try {
      const res = await fetch('/api/clients/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isBlocked: !currentBlocked }),
      });
      if (res.ok) {
        showFeedback(`${!currentBlocked ? 'Acceso bloqueado' : 'Acceso reactivado'} para ${email}`);
        fetchClients(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClient = async (email: string) => {
    if (!confirm(`¿Eliminar el registro del cliente ${email} del historial?`)) return;
    try {
      const res = await fetch('/api/clients/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        showFeedback(`Registro de ${email} eliminado`);
        fetchClients(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClientManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      alert('Por favor ingresa un correo válido');
      return;
    }
    try {
      const res = await fetch('/api/clients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim(),
          name: newName.trim() || newEmail.split('@')[0],
          club: newClub.trim() || 'Club Deportivo',
          role: newRole,
          phone: newPhone.trim(),
          trialDays: Number(newTrialDays) || 30,
          notes: newNotes.trim(),
        }),
      });
      if (res.ok) {
        showFeedback(`Cliente ${newEmail} registrado con éxito`);
        setNewEmail('');
        setNewName('');
        setNewClub('');
        setNewPhone('');
        setNewNotes('');
        setShowAddModal(false);
        fetchClients(true);
      } else {
        const d = await res.json();
        alert(d.error || 'Error al crear cliente');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearVisitors = async () => {
    if (!confirm('¿Deseas limpiar el historial de visitas registradas?')) return;
    try {
      await fetch('/api/visitors/clear', { method: 'POST' });
      setVisitors([]);
      showFeedback('Historial de visitas restablecido');
    } catch (err) {
      console.error(err);
    }
  };

  const showFeedback = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleExportCSV = () => {
    if (activeView === 'CLIENTS') {
      const headers = ['Nombre', 'Email', 'Club', 'Rol', 'Telefono', 'Fecha Primer Ingreso', 'Ultima Actividad', 'Dias Restantes', 'Dias Totales', 'Estado'];
      const rows = clients.map((c) => {
        const st = calculateClientStatus(c);
        return [
          `"${c.name}"`,
          `"${c.email}"`,
          `"${c.club || '-'}"`,
          `"${c.role || '-'}"`,
          `"${c.phone || '-'}"`,
          `"${new Date(c.firstLoginDate).toLocaleString('es-AR')}"`,
          `"${new Date(c.lastLoginDate).toLocaleString('es-AR')}"`,
          st.daysRemaining,
          st.totalAllowedDays,
          st.isExpired ? 'Expirado' : st.daysRemaining <= 5 ? 'Por Vencer' : 'Activo',
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `historial_clientes_open_voley_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Fecha y Hora', 'Dominio Origen', 'Seccion / Pagina', 'Dispositivo', 'Accion / Evento'];
      const rows = visitors.map((v) => [
        `"${new Date(v.timestamp).toLocaleString('es-AR')}"`,
        `"${v.domain}"`,
        `"${v.page}"`,
        `"${v.deviceType}"`,
        `"${v.action}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `prospectos_visitas_openvoley_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Filtered list of clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.club && c.club.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    const st = calculateClientStatus(c);
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return st.statusType === 'ACTIVE';
    if (filterStatus === 'WARNING') return st.statusType === 'WARNING';
    if (filterStatus === 'EXPIRED') return st.statusType === 'EXPIRED';
    return true;
  });

  // Filtered visitors
  const filteredVisitors = visitors.filter((v) => {
    if (!searchQuery) return true;
    return (
      v.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.deviceType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // KPI calculations
  const totalCount = clients.length;
  const activeCount = clients.filter((c) => calculateClientStatus(c).statusType === 'ACTIVE').length;
  const warningCount = clients.filter((c) => calculateClientStatus(c).statusType === 'WARNING').length;
  const expiredCount = clients.filter((c) => calculateClientStatus(c).statusType === 'EXPIRED').length;

  return (
    <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      
      {/* Top Header & View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xs tracking-wider uppercase">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Panel de Administración & Control de Clientes</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Historial de Clientes & Prospectos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoreo en tiempo real de ingresos por <strong className="text-slate-800">openvoley.com</strong>, licencias activas y control de prueba.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Registrar Cliente
          </button>
          
          <button
            onClick={handleExportCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 border border-slate-300 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" /> Exportar CSV
          </button>

          <button
            onClick={() => fetchClients()}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition cursor-pointer"
            title="Recargar datos ahora"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Selector: Clientes vs Prospectos */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveView('CLIENTS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeView === 'CLIENTS'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-amber-500" />
          <span>Clientes Registrados & Licencias ({clients.length})</span>
        </button>

        <button
          onClick={() => setActiveView('VISITORS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeView === 'VISITORS'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 text-sky-500" />
          <span>Visitas & Prospectos en Vivo ({visitors.length})</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </button>
      </div>

      {/* Feedback Toast */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Clientes</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cuentas con acceso activo</div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Activos (&gt;5 días)
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{activeCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">En período normal de prueba</div>
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <div className="text-xs text-amber-700 font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Por Vencer (≤5 días)
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1">{warningCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Próximos a renovar</div>
        </div>

        <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
          <div className="text-xs text-sky-700 font-bold uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Visitas Registradas
          </div>
          <div className="text-2xl font-black text-sky-900 mt-1">{visitors.length}</div>
          <div className="text-[11px] text-sky-600 mt-0.5">Tráfico a openvoley.com</div>
        </div>
      </div>

      {/* VIEW 1: CLIENTS TABLE */}
      {activeView === 'CLIENTS' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o club..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-slate-500 font-bold mr-1">Filtrar:</span>
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterStatus === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Todos ({clients.length})
              </button>
              <button
                onClick={() => setFilterStatus('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterStatus === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-slate-200 hover:bg-emerald-50'
                }`}
              >
                Activos ({activeCount})
              </button>
              <button
                onClick={() => setFilterStatus('WARNING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterStatus === 'WARNING' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-slate-200 hover:bg-amber-50'
                }`}
              >
                Por Vencer ({warningCount})
              </button>
              <button
                onClick={() => setFilterStatus('EXPIRED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterStatus === 'EXPIRED' ? 'bg-rose-600 text-white' : 'bg-white text-rose-700 border border-slate-200 hover:bg-rose-50'
                }`}
              >
                Expirados ({expiredCount})
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-200 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="p-3.5">Cliente / Entrenador</th>
                  <th className="p-3.5">Club / Rol</th>
                  <th className="p-3.5">Primer Ingreso</th>
                  <th className="p-3.5">Último Acceso</th>
                  <th className="p-3.5">Licencia Restante</th>
                  <th className="p-3.5 text-center">Estado</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No se encontraron registros de clientes coincidentes.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const { daysRemaining, remainingText, isExpired, pctUsed, statusType, totalAllowedDays } =
                      calculateClientStatus(client);

                    return (
                      <tr key={client.id || client.email} className="hover:bg-slate-50/80 transition">
                        {/* Name & Email */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {client.picture ? (
                              <img
                                src={client.picture}
                                alt={client.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-800 font-black flex items-center justify-center text-xs shrink-0 border border-amber-300">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">{client.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{client.email}</div>
                              {client.phone && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3" /> {client.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Club & Role */}
                        <td className="p-3.5">
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{client.club || 'Club Deportivo'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{client.role || 'Entrenador / DT'}</div>
                        </td>

                        {/* First Login Date */}
                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                          {new Date(client.firstLoginDate).toLocaleDateString('es-AR')}
                          <div className="text-[10px] text-slate-400">
                            {new Date(client.firstLoginDate).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Last Login Date */}
                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                          {new Date(client.lastLoginDate).toLocaleDateString('es-AR')}
                          <div className="text-[10px] text-slate-400">
                            {new Date(client.lastLoginDate).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Remaining Days & Progress */}
                        <td className="p-3.5 min-w-[140px]">
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span className={isExpired ? 'text-rose-600' : daysRemaining <= 5 ? 'text-amber-600' : 'text-emerald-700'}>
                              {remainingText}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({totalAllowedDays}d tot)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                isExpired ? 'bg-rose-500' : daysRemaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(5, Math.min(100, 100 - pctUsed))}%` }}
                            />
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="p-3.5 text-center">
                          {isExpired ? (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Expirado
                            </span>
                          ) : statusType === 'WARNING' ? (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Por Vencer
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Activo
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleExtendDays(client.email, 15)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg text-[11px] border border-slate-300 transition"
                            title="Extender +15 días"
                          >
                            +15d
                          </button>
                          <button
                            onClick={() => handleResetClient(client.email)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-2 py-1 rounded-lg text-[11px] border border-amber-300 transition"
                            title="Resetear a 30 días completos"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => handleToggleBlock(client.email, client.isBlocked)}
                            className={`p-1.5 rounded-lg border text-[11px] transition ${
                              client.isBlocked
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                            title={client.isBlocked ? 'Desbloquear acceso' : 'Bloquear acceso'}
                          >
                            {client.isBlocked ? <Unlock className="w-3.5 h-3.5 inline" /> : <Lock className="w-3.5 h-3.5 inline" />}
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.email)}
                            className="p-1.5 rounded-lg border text-[11px] bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 border-slate-300 transition inline-flex items-center"
                            title="Eliminar del historial"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: PROSPECTS & VISITOR TRAFFIC */}
      {activeView === 'VISITORS' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between bg-sky-50 p-3.5 rounded-xl border border-sky-200">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-600" />
              <div>
                <div className="text-xs font-bold text-sky-900">
                  Visitas Registradas en el Servidor (openvoley.com)
                </div>
                <div className="text-[11px] text-sky-700">
                  Captura automática de visitas, origen, tipo de dispositivo y acciones en la landing page.
                </div>
              </div>
            </div>

            <button
              onClick={handleClearVisitors}
              className="text-xs text-slate-600 hover:text-rose-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-300 transition"
            >
              Limpiar Visitas
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-200 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="p-3.5">Fecha y Hora</th>
                  <th className="p-3.5">Dominio / Host</th>
                  <th className="p-3.5">Sección / Ruta</th>
                  <th className="p-3.5">Dispositivo</th>
                  <th className="p-3.5">Acción / Intención</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No hay registros de visitas recientes aún. Las nuevas visitas a openvoley.com aparecerán aquí automáticamente.
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map((vis) => (
                    <tr key={vis.id} className="hover:bg-slate-50 transition font-mono text-[11px]">
                      <td className="p-3.5 text-slate-900 font-bold">
                        {new Date(vis.timestamp).toLocaleString('es-AR')}
                      </td>
                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                          {vis.domain}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{vis.page}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          {vis.deviceType.includes('Móvil') ? (
                            <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-sky-500" />
                          )}
                          <span>{vis.deviceType}</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {vis.action}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" /> Registrar Nuevo Cliente / DT
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClientManual} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico (Google) *</label>
                  <input
                    type="email"
                    placeholder="entrenador@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    placeholder="Prof. Juan Pérez"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Club o Institución</label>
                  <input
                    type="text"
                    placeholder="Club Ciudad de Bs. As."
                    value={newClub}
                    onChange={(e) => setNewClub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol / Cargo</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="DT Principal">DT Principal</option>
                    <option value="Estadístico / Scout">Estadístico / Scout</option>
                    <option value="Asistente Técnico">Asistente Técnico</option>
                    <option value="Preparador Físico">Preparador Físico</option>
                    <option value="Dirigente / Coordinador">Dirigente / Coordinador</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+54 9 11 5555-5555"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Días de Licencia Inicial</label>
                  <select
                    value={newTrialDays}
                    onChange={(e) => setNewTrialDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value={7}>7 Días (Prueba Estándar)</option>
                    <option value={15}>15 Días</option>
                    <option value={30}>30 Días (1 Mes Completo)</option>
                    <option value={60}>60 Días (2 Meses)</option>
                    <option value={365}>365 Días (1 Año Anual)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas Internas</label>
                <textarea
                  rows={2}
                  placeholder="Observaciones de contacto o acuerdos de pago..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  El usuario se registrará en el servidor con <strong>{newTrialDays} días de acceso</strong> activos inmediatamente.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl transition shadow"
                >
                  Guardar y Activar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
