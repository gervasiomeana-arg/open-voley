import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ArrowUpRight, 
  Plus, 
  ShieldCheck, 
  Lock, 
  Unlock,
  Download,
  Receipt,
  Building2,
  Phone
} from 'lucide-react';
import { ClientUser } from '../types';

interface PaymentTransaction {
  id: string;
  clientEmail: string;
  clientName: string;
  planName: string;
  amountARS: number;
  amountUSD: number;
  paymentMethod: 'MERCADO_PAGO' | 'TRANSFERENCIA_BANCARIA' | 'EFECTIVO' | 'CORTE_MANUAL';
  date: string;
  status: 'APPROVED' | 'PENDING' | 'REFUNDED';
  durationDays: number;
  referenceId: string;
}

export const CuentaCorrienteSection: React.FC = () => {
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<'ALL' | 'ACTIVE' | 'WARNING' | 'EXPIRED'>('ALL');
  const [selectedClientForPay, setSelectedClientForPay] = useState<ClientUser | null>(null);
  const [payDays, setPayDays] = useState<number>(30);
  const [payAmount, setPayAmount] = useState<string>('35000');
  const [payMethod, setPayMethod] = useState<'MERCADO_PAGO' | 'TRANSFERENCIA_BANCARIA' | 'EFECTIVO'>('MERCADO_PAGO');
  const [payPlanName, setPayPlanName] = useState<string>('Plan Club Pro Mensual');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Sample transactions ledger (simulated persistence)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([
    {
      id: 'tx-101',
      clientEmail: 'dt.carlossanchez.voley@gmail.com',
      clientName: 'Carlos Sánchez (DT)',
      planName: 'Plan Club Pro Mensual',
      amountARS: 35000,
      amountUSD: 35,
      paymentMethod: 'MERCADO_PAGO',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'APPROVED',
      durationDays: 30,
      referenceId: 'MP-849204819'
    },
    {
      id: 'tx-102',
      clientEmail: 'reservasnuevohorizonte@gmail.com',
      clientName: 'Nuevo Horizonte Vóley Club',
      planName: 'Plan Club Pro Anual (20% OFF)',
      amountARS: 320000,
      amountUSD: 320,
      paymentMethod: 'TRANSFERENCIA_BANCARIA',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'APPROVED',
      durationDays: 365,
      referenceId: 'TRF-BANCO-7729'
    },
    {
      id: 'tx-103',
      clientEmail: 'analista.estadio@gmail.com',
      clientName: 'Mariana Gómez (Estadígrafa)',
      planName: 'Plan Entrenador DT',
      amountARS: 18000,
      amountUSD: 18,
      paymentMethod: 'MERCADO_PAGO',
      date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'APPROVED',
      durationDays: 30,
      referenceId: 'MP-194820194'
    }
  ]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error('Error fetching clients for Cuenta Corriente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const getClientStatus = (c: ClientUser) => {
    const firstLoginMs = new Date(c.firstLoginDate).getTime();
    const totalAllowedDays = (c.trialDurationDays || 7) + (c.customGrantedDays || 0);
    const totalAllowedMs = totalAllowedDays * 24 * 60 * 60 * 1000;
    const elapsedMs = Date.now() - firstLoginMs;
    const remainingMs = totalAllowedMs - elapsedMs;
    const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    const isExpired = remainingMs <= 0 || !!c.isBlocked;

    return {
      daysRemaining,
      isExpired,
      totalAllowedDays,
      elapsedDays: Math.floor(elapsedMs / (1000 * 60 * 60 * 24)),
    };
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPay) return;

    try {
      // 1. Extend user days on server
      const res = await fetch('/api/clients/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedClientForPay.email,
          addDays: payDays,
          isBlocked: false,
        }),
      });

      if (res.ok) {
        // 2. Add transaction to ledger
        const newTx: PaymentTransaction = {
          id: `tx-${Date.now()}`,
          clientEmail: selectedClientForPay.email,
          clientName: selectedClientForPay.name,
          planName: payPlanName,
          amountARS: Number(payAmount) || 0,
          amountUSD: Math.round((Number(payAmount) || 0) / 1000),
          paymentMethod: payMethod,
          date: new Date().toISOString(),
          status: 'APPROVED',
          durationDays: payDays,
          referenceId: `REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        };

        setTransactions([newTx, ...transactions]);
        setFeedbackMsg(`✓ Pago registrado: +${payDays} días agregados a ${selectedClientForPay.name}`);
        setSelectedClientForPay(null);
        fetchClients();
        setTimeout(() => setFeedbackMsg(''), 5000);
      }
    } catch (err) {
      console.error('Error registering payment:', err);
    }
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const status = getClientStatus(c);
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterPlan === 'ACTIVE') return !status.isExpired && status.daysRemaining > 5;
    if (filterPlan === 'WARNING') return !status.isExpired && status.daysRemaining <= 5;
    if (filterPlan === 'EXPIRED') return status.isExpired;
    return true;
  });

  // Calculate Metrics
  const totalRevenueARS = transactions.reduce((acc, tx) => acc + tx.amountARS, 0);
  const activePaidClients = clients.filter(c => !getClientStatus(c).isExpired).length;
  const expiredClients = clients.filter(c => getClientStatus(c).isExpired).length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* 1. Header Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sky-400 font-extrabold text-xs tracking-wider uppercase">
              <Receipt className="w-4 h-4" />
              <span>Módulo Financiero & Gestión de Suscripciones</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Cuenta Corriente de Clientes & Control de 30 Días
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Supervisa el estado de cobro, los días restantes de cada club, el historial de facturación y registra pagos manuales o acreditaciones de Mercado Pago.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchClients}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar Estado</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold uppercase">Facturación Total Registrada</div>
            <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono mt-1">
              ${totalRevenueARS.toLocaleString('es-AR')} <span className="text-xs text-emerald-500">ARS</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cobros de suscripciones</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold uppercase">Clientes Activos</div>
            <div className="text-lg sm:text-2xl font-black text-sky-400 font-mono mt-1">
              {activePaidClients} <span className="text-xs text-slate-400">usuarios</span>
            </div>
            <div className="text-[10px] text-sky-500/80 mt-0.5">Con licencia vigente</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold uppercase">Licencias Vencidas / Bloqueadas</div>
            <div className="text-lg sm:text-2xl font-black text-rose-400 font-mono mt-1">
              {expiredClients} <span className="text-xs text-slate-400">para renovar</span>
            </div>
            <div className="text-[10px] text-rose-400/80 mt-0.5">Requieren pago para continuar</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] text-slate-400 font-bold uppercase">Ciclo Estándar</div>
            <div className="text-lg sm:text-2xl font-black text-amber-400 font-mono mt-1">
              30 Días <span className="text-xs text-slate-400">/ mes</span>
            </div>
            <div className="text-[10px] text-amber-500/80 mt-0.5">Control automático de bloqueo</div>
          </div>
        </div>
      </div>

      {/* Success Notification Feedback */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 2. Main Tabular Section: Clientes & Control de Días */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por club, DT o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterPlan('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterPlan === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos ({clients.length})
            </button>
            <button
              onClick={() => setFilterPlan('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterPlan === 'ACTIVE'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              Al Día ({clients.filter(c => !getClientStatus(c).isExpired && getClientStatus(c).daysRemaining > 5).length})
            </button>
            <button
              onClick={() => setFilterPlan('WARNING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterPlan === 'WARNING'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              Por Vencer (≤5d)
            </button>
            <button
              onClick={() => setFilterPlan('EXPIRED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterPlan === 'EXPIRED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-slate-200'
              }`}
            >
              Vencidos ({expiredClients})
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-600">
                <th className="p-3.5 font-extrabold text-slate-900">Cliente / Club</th>
                <th className="p-3.5 font-bold">Primer Ingreso</th>
                <th className="p-3.5 font-bold text-center">Días Asignados</th>
                <th className="p-3.5 font-bold text-center">Días Restantes</th>
                <th className="p-3.5 font-bold text-center">Estado de Licencia</th>
                <th className="p-3.5 font-bold text-right">Acción de Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No se encontraron clientes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const status = getClientStatus(client);
                  return (
                    <tr key={client.id} className="hover:bg-slate-50 transition">
                      {/* Name & Email */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {client.picture ? (
                              <img src={client.picture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              client.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">{client.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{client.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* First Login Date */}
                      <td className="p-3.5 text-slate-600">
                        {new Date(client.firstLoginDate).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Total Days */}
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                        {status.totalAllowedDays} días
                      </td>

                      {/* Days Remaining */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                          status.isExpired
                            ? 'bg-rose-100 text-rose-800'
                            : status.daysRemaining <= 5
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {status.isExpired ? '0 Días' : `${status.daysRemaining} Días`}
                        </span>
                      </td>

                      {/* License Status Badge */}
                      <td className="p-3.5 text-center">
                        {status.isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            BLOQUEADO (VENCIDO)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ACTIVO (AL DÍA)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedClientForPay(client);
                            setPayAmount('35000');
                            setPayDays(30);
                            setPayPlanName('Plan Club Pro Mensual');
                          }}
                          className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Registrar Pago / +30d</span>
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

      {/* 3. Transaction History Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-950 font-black text-base">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span>Historial de Pagos & Comprobantes Acreditados</span>
          </div>
          <span className="text-xs text-slate-500">Últimos movimientos registrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="p-3 font-bold">Fecha</th>
                <th className="p-3 font-bold">Cliente</th>
                <th className="p-3 font-bold">Concepto / Plan</th>
                <th className="p-3 font-bold">Método</th>
                <th className="p-3 font-bold text-right">Monto (ARS)</th>
                <th className="p-3 font-bold text-center">Extensión</th>
                <th className="p-3 font-bold text-center">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500 font-mono">
                    {new Date(tx.date).toLocaleDateString('es-AR')}
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    {tx.clientName}
                  </td>
                  <td className="p-3 text-indigo-900 font-medium">
                    {tx.planName}
                  </td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3 text-right font-black font-mono text-emerald-700 text-sm">
                    ${tx.amountARS.toLocaleString('es-AR')}
                  </td>
                  <td className="p-3 text-center font-bold text-sky-700">
                    +{tx.durationDays} Días
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border border-emerald-200">
                      ✓ {tx.referenceId}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Pago Manual & Renovar +30 Días */}
      {selectedClientForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-5 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-sm">
                  $
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Registrar Pago & Extender</h3>
                  <p className="text-xs text-slate-500">{selectedClientForPay.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientForPay(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Concepto / Plan:</label>
                <select
                  value={payPlanName}
                  onChange={(e) => setPayPlanName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Plan Club Pro Mensual">Plan Club Pro Mensual ($35.000 ARS)</option>
                  <option value="Plan Entrenador DT">Plan Entrenador DT ($18.000 ARS)</option>
                  <option value="Plan Club Pro Anual (20% OFF)">Plan Club Pro Anual ($320.000 ARS)</option>
                  <option value="Plan Torneos & Federaciones">Plan Torneos & Federaciones ($95.000 ARS)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monto Cobrado (ARS):</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Días a Agregar:</label>
                  <select
                    value={payDays}
                    onChange={(e) => setPayDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={30}>+30 Días (1 Mes)</option>
                    <option value={60}>+60 Días (2 Meses)</option>
                    <option value={90}>+90 Días (3 Meses)</option>
                    <option value={365}>+365 Días (1 Año)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medio de Pago:</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="MERCADO_PAGO">Mercado Pago (Tarjeta / Dinero en cuenta)</option>
                  <option value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria (CBU / Alias)</option>
                  <option value="EFECTIVO">Efectivo / Cobro Directo en Cancha</option>
                </select>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl text-xs text-sky-900 border border-sky-200">
                Al confirmar, el sistema acreditará automáticamente <strong>+{payDays} días</strong> a la cuenta <code>{selectedClientForPay.email}</code> y desbloqueará su acceso si estaba vencido.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClientForPay(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Acreditar Pago</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
