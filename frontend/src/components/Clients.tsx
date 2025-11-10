// React hooks
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Ensure the phone formatter addon for Brazil is bundled so Cleave can format phone numbers
import 'cleave.js/dist/addons/cleave-phone.br.js';
import Cleave from 'cleave.js/react';
import { Card, Row, Col, Button, Form as BsForm, ListGroup, InputGroup, Modal, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import './Clients.css';
import { deleteConversation, getClients, deleteClient, createClient, updateClient } from '../services/api';
import { canonicalizeId } from '../utils/normalizeConversation';
import MenuSidebar from './MenuSidebar';

interface Client {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  orders?: Array<{ id: string; title?: string; desc?: string; value?: number; date?: string }>
}

interface FieldDef {
  key: string;
  label: string;
  type: 'text'|'number'|'currency'|'quantity';
}

const SAMPLE_CLIENTS: Client[] = [
  {
    id: '5511999999999',
    name: 'João da Silva',
    phone: '5511999999999',
    email: 'joao@example.com',
    address: 'Rua das Flores, 123',
    notes: 'Cliente VIP, costuma comprar aos finais de semana',
    orders: [
      { id: 'o1', title: 'Orçamento #123', desc: 'Orçamento para 10 unidades de produto X', value: 250.0 },
      { id: 'o2', title: 'Pedido #456', desc: 'Pedido confirmado - 2x Produto Y', value: 120.5 }
    ]
  },
  {
    id: '5511988887777',
    name: 'Maria Oliveira',
    phone: '5511988887777',
    email: 'maria@example.com',
    address: 'Av. Central, 45',
    notes: 'Prefere contato por WhatsApp',
    orders: [ { id: 'o3', title: 'Pedido #789', desc: 'Compra de Produto Z', value: 75.0 } ]
  }
];

export default function Clients() {
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const raw = localStorage.getItem('clients');
      if (raw) return JSON.parse(raw) as Client[];
    } catch (e) {
      console.warn('failed to read clients from localStorage', e);
    }
    return SAMPLE_CLIENTS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  // (orders title state removed: tabs replace the old single title feature)
  // Per-client tabs (array of tab names) and active tab index per client
  const [ordersTabs, setOrdersTabs] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem('ordersTabs');
      if (raw) return JSON.parse(raw) as Record<string, string[]>;
    } catch (e) { /* ignore */ }
    return {};
  });
  const [activeTabIndex, setActiveTabIndex] = useState<Record<string, number>>(() => ({}));
  const [editingTabFor, setEditingTabFor] = useState<string | null>(null);
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
  const [tabNameDraft, setTabNameDraft] = useState('');
  const [showManageTabsModal, setShowManageTabsModal] = useState(false);
  // drag & drop state for tabs
  const [draggingTabIdx, setDraggingTabIdx] = useState<number | null>(null);
  const [dragOverTabIdx, setDragOverTabIdx] = useState<number | null>(null);

  // Order inline editing state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  // allow arbitrary keyed draft values (custom fields will be placed here)
  const [orderDraft, setOrderDraft] = useState<Record<string, any>>({});

  // per-client per-tab field schemas (persisted to localStorage)
  const [ordersTabSchemas, setOrdersTabSchemas] = useState<Record<string, Record<number, FieldDef[]>>>(() => {
    try {
      const raw = localStorage.getItem('ordersTabSchemas');
      if (raw) return JSON.parse(raw) as Record<string, Record<number, FieldDef[]>>;
    } catch (e) { /* ignore */ }
    return {};
  });
  const [showConfigureFieldsModal, setShowConfigureFieldsModal] = useState(false);
  const [configuringTabIndex, setConfiguringTabIndex] = useState<number | null>(null);

  // helpers to avoid nullable selectedClient usage in JSX handlers
  const configuringClientId = selectedClient?.id || '';
  const configuringSchema: FieldDef[] = (selectedClient && configuringTabIndex != null)
    ? (ordersTabSchemas[configuringClientId]?.[configuringTabIndex] || [])
    : [];

  // helper to format date/time for display
  const formatDateTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return iso;
    }
  };

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyMessages] = useState<Array<any>>([]);
  const [loadingHistory] = useState(false);

  // Delete client state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // toast (discreet notification)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success'|'danger'|'info'|'warning'>('info');
  // Client modal (create / edit)
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const navigate = useNavigate();

  // Filter clients live as user types (case-insensitive, matches any field)
  const filtered = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();

    // load user's own session ids and canonicalize them for comparison
    let myOwnCanonical: string[] = [];
    try {
      const raw = localStorage.getItem('myWhatsappConnections');
      const arr = raw ? JSON.parse(raw) : [];
      myOwnCanonical = (Array.isArray(arr) ? arr : []).map((x: any) => String(x)).map(s => canonicalizeId(s) || s).filter(Boolean);
    } catch (e) {
      myOwnCanonical = [];
    }

    const matchesQuery = (c: Client) => {
      if (!q) return true;
      const parts = [c.id, c.name, c.phone, c.email, c.address, c.notes].filter(Boolean).map(s => String(s).toLowerCase());
      return parts.some(p => p.includes(q));
    };

    // filter out any client that corresponds to one of the user's own sessions
    const visible = clients.filter(c => {
      const canon = canonicalizeId(c.id || c.phone || '') || '';
      if (canon && myOwnCanonical.includes(canon)) return false; // hide own number
      return matchesQuery(c);
    });

    return visible;
  }, [clients, searchQuery]);

  // Auto-select first filtered client for quick navigation
  useEffect(() => {
    if (filtered.length > 0) setSelectedClient(filtered[0]);
  }, [filtered]);

  // initialize default tabs for existing clients
  useEffect(() => {
    setOrdersTabs(prev => {
      const copy = { ...prev };
      clients.forEach(c => {
        if (!Array.isArray(copy[c.id]) || copy[c.id].length === 0) copy[c.id] = ['Pedidos / Orçamentos'];
      });
      try { localStorage.setItem('ordersTabs', JSON.stringify(copy)); } catch (e) { /* ignore */ }
      return copy;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep ordersTabs in localStorage when changed
  useEffect(() => {
    try { localStorage.setItem('ordersTabs', JSON.stringify(ordersTabs)); } catch (e) { /* ignore */ }
  }, [ordersTabs]);

  // persist schemas
  useEffect(() => {
    try { localStorage.setItem('ordersTabSchemas', JSON.stringify(ordersTabSchemas)); } catch (e) { /* ignore */ }
  }, [ordersTabSchemas]);

  // keep reference to setter to avoid unused-local errors and ensure API is present
  useEffect(() => { void setClients; }, [setClients]);

  // persist clients to localStorage so deletes/edits survive navigation/reload
  useEffect(() => {
    try {
      localStorage.setItem('clients', JSON.stringify(clients));
    } catch (e) {
      console.warn('failed to write clients to localStorage', e);
    }
  }, [clients]);

  // Try loading clients from backend on mount; fallback to current state if backend not available
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = await getClients();
        if (!mounted) return;
        if (Array.isArray(remote) && remote.length > 0) {
          // merge orders (local-only) into remote if ids match
          const localMap = new Map(clients.map(c => [c.id, c]));
          const merged = remote.map((r: any) => ({ ...(localMap.get(r.id) || {}), ...r }));
          setClients(merged);
        }
      } catch (e) {
        console.warn('Não foi possível carregar clients do backend, usando localStorage/sample', e);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="clients-root">
      <MenuSidebar />
      <div className="clients-main">
        <h3 style={{ marginBottom: 12 }}>Clientes</h3>

        <Row>
          <Col md={4} lg={3} className="clients-sidebar">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <InputGroup className="mb-3" style={{ flex: 1 }}>
                <BsForm.Control placeholder="Buscar cliente (nome, número, e-mail)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </InputGroup>
              <Button size="sm" variant="primary" title="Novo cliente" aria-label="Novo cliente" onClick={() => { setEditingClient(null); setShowClientModal(true); }}>
                {/* person + icon: clearer call-to-action */}
                <svg width="18" height="18" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#fff" />
                  <path d="M14 13.5V15H6v-1.5C6 12.333 9.333 11.5 10 11.5s4 .833 4 2z" fill="#fff" />
                  <path d="M13 4v2h2v1h-2v2h-1V7h-2V6h2V4h1z" fill="#fff" />
                </svg>
              </Button>
            </div>

            <Card className="mb-3 client-list-card">
              <ListGroup variant="flush">
                {filtered.map(c => (
                  <ListGroup.Item
                    key={c.id}
                    action
                    onClick={() => setSelectedClient(c)}
                    className={`client-item ${selectedClient?.id === c.id ? 'selected' : ''}`}>
                    <div className="avatar">{c.name ? c.name.split(' ').map(p => p[0]).slice(0,2).join('') : c.id.slice(-2)}</div>
                    <div className="client-details">
                      <div className="client-name">{c.name}</div>
                      <div className="client-phone">{c.phone}</div>
                    </div>
                  </ListGroup.Item>
                ))}
                {filtered.length === 0 && <ListGroup.Item className="text-muted">Nenhum cliente encontrado</ListGroup.Item>}
              </ListGroup>
            </Card>
          </Col>

          <Col md={8} lg={9}>
            {selectedClient ? (
              <>
                <Card className="mb-3">
                  <Card.Body>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div className="header-avatar">{selectedClient.name ? selectedClient.name.split(' ').map(p => p[0]).slice(0,2).join('') : selectedClient.id.slice(-2)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedClient.name}</div>
                        <div style={{ color: '#6c757d' }}>{selectedClient.phone} • {selectedClient.email}</div>
                        <div style={{ marginTop: 8, color: '#495057' }}>{selectedClient.address}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {/* profile button removed to declutter header */}

                        {/* Histórico: abre no WhatsApp web */}
                        <Button variant="link" title="Histórico (abrir conversas)" aria-label="Histórico" style={{ padding: 6 }} onClick={() => {
                          if (!selectedClient) return;
                          // prefer phone if available, otherwise use client id
                          const clientId = String(selectedClient.phone || selectedClient.id || '');
                          if (!clientId) {
                            setToastMessage('ID do cliente não disponível para abrir conversas');
                            setToastVariant('warning');
                            setShowToast(true);
                            return;
                          }
                          // navigate to the conversations route so Kanban is mounted and can open the modal
                          navigate(`/conversas?openClient=${encodeURIComponent(clientId)}`);
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.52 3.48A11.88 11.88 0 0 0 12 0C5.373 0 .001 5.373.001 12c0 2.1.549 4.127 1.593 5.919L0 24l6.338-1.655A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12 0-3.196-1.246-6.202-3.48-8.52z" fill="#25D366" />
                          </svg>
                        </Button>

                        {/* Edit (pen) */}
                        <Button variant="link" title="Editar" aria-label="Editar" style={{ padding: 6 }} onClick={() => { setEditingClient(selectedClient); setShowClientModal(true); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#0d6efd"/>
                            <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.41l-2.34-2.34a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#0d6efd"/>
                          </svg>
                        </Button>

                        {/* Delete (trash) */}
                        <Button variant="link" title="Excluir" aria-label="Excluir" style={{ padding: 6 }} onClick={() => setShowDeleteConfirm(true)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z" fill="#dc3545"/>
                            <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#dc3545"/>
                          </svg>
                        </Button>
                        {/* Gear moved next to the tabs plus button (see orders header) */}
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="orders-card">
                  <Card.Header className="orders-header" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Left: Tabs */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, paddingRight: 160 }}>
                        <div className="orders-tabs" style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto' }}>
                        {(selectedClient ? (ordersTabs[selectedClient.id] || ['Pedidos / Orçamentos']) : ['Pedidos / Orçamentos']).map((t, idx) => (
                          <button
                            key={idx}
                            draggable={!!selectedClient}
                            onDragStart={(e) => {
                              if (!selectedClient) return;
                              setDraggingTabIdx(idx);
                              e.dataTransfer?.setData('text/plain', String(idx));
                              e.dataTransfer!.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (!selectedClient) return;
                              if (dragOverTabIdx !== idx) setDragOverTabIdx(idx);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (!selectedClient) return;
                              const from = draggingTabIdx != null ? draggingTabIdx : parseInt(e.dataTransfer?.getData('text/plain') || '', 10);
                              const to = idx;
                              if (isNaN(from) || from === to) { setDraggingTabIdx(null); setDragOverTabIdx(null); return; }
                              setOrdersTabs(prev => {
                                const copy = { ...prev };
                                const arr = [ ...(copy[selectedClient.id] || []) ];
                                // bounds check
                                const f = Math.max(0, Math.min(from, arr.length - 1));
                                const tIdx = Math.max(0, Math.min(to, arr.length - (from < to ? 1 : 0)));
                                const [moved] = arr.splice(f, 1);
                                arr.splice(tIdx, 0, moved);
                                copy[selectedClient.id] = arr;
                                try { localStorage.setItem('ordersTabs', JSON.stringify(copy)); } catch (e) { /* ignore */ }
                                return copy;
                              });
                              // also remap orders' tab indices so orders follow their tab when reordered
                              setClients(prev => prev.map(c => {
                                if (c.id !== selectedClient.id) return c;
                                const orders = (c.orders || []).map(o => {
                                  const tab = (o as any).tab ?? 0;
                                  // moving right
                                  if (from < to) {
                                    if (tab === from) return { ...o, tab: to } as any;
                                    if (tab > from && tab <= to) return { ...o, tab: tab - 1 } as any;
                                    return o;
                                  }
                                  // moving left (from > to)
                                  if (from > to) {
                                    if (tab === from) return { ...o, tab: to } as any;
                                    if (tab >= to && tab < from) return { ...o, tab: tab + 1 } as any;
                                    return o;
                                  }
                                  return o;
                                });
                                return { ...c, orders };
                              }));
                              // update active index accordingly
                              setActiveTabIndex(prev => {
                                const cur = prev[selectedClient.id] || 0;
                                let next = cur;
                                if (cur === from) next = to;
                                else if (from < to && cur > from && cur <= to) next = cur - 1;
                                else if (from > to && cur >= to && cur < from) next = cur + 1;
                                return { ...prev, [selectedClient.id]: Math.max(0, next) };
                              });
                              setDraggingTabIdx(null);
                              setDragOverTabIdx(null);
                            }}
                            onDragEnd={() => { setDraggingTabIdx(null); setDragOverTabIdx(null); }}
                            className={`orders-tab ${((activeTabIndex[selectedClient?.id || ''] || 0) === idx) ? 'active' : 'outline'}`}
                            onClick={() => {
                              if (!selectedClient) return;
                              setActiveTabIndex(prev => ({ ...prev, [selectedClient.id]: idx }));
                            }}
                            style={dragOverTabIdx === idx ? { outline: '2px dashed #0d6efd' } : undefined}
                          >{t}</button>
                        ))}
                        {/* add new tab now handled inside Manage Tabs modal (removed inline "Nova aba" button) */}
                      </div>
                      {/* Right: fixed controls (plus + gear) positioned to the far right */}
                      <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 8, alignItems: 'center' }}>
                        {selectedClient && (
                          <Button size="sm" variant="outline-success" title="Novo pedido" style={{ padding: '6px 8px' }} onClick={() => {
                            // create a new order and prefill custom fields from active tab schema
                            const newOrder = { id: `n_${Date.now()}`, title: 'Novo pedido', desc: '', value: 0, date: new Date().toISOString() } as any;
                            // determine active tab schema
                            const tabIdx = (activeTabIndex[selectedClient.id] || 0);
                            // tag the order with the active tab so each tab has its own orders
                            newOrder.tab = tabIdx;
                            const schema = ordersTabSchemas[selectedClient.id]?.[tabIdx] || [];
                            const custom: Record<string, any> = {};
                            schema.forEach(f => { custom[f.key] = f.type === 'number' || f.type === 'quantity' ? 0 : (f.type === 'currency' ? 0.0 : ''); });
                            newOrder.fields = custom;
                            setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, orders: [ ...(c.orders || []), newOrder ] } : c));
                            setEditingOrderId(newOrder.id);
                            setOrderDraft({ title: newOrder.title, desc: newOrder.desc, value: String(newOrder.value), ...newOrder.fields });
                            setSelectedClient(prev => prev ? { ...prev, orders: [ ...(prev.orders || []), newOrder ] } : prev);
                          }}>
                            <svg width="18" height="18" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                              <path fill="#198754" d="M8 1a.5.5 0 0 1 .5.5V7.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z" />
                            </svg>
                          </Button>
                        )}
                        {/* gear: manage tabs */}
                        <Button size="sm" variant="link" title="Gerenciar abas" aria-label="Gerenciar abas" style={{ padding: 6 }} onClick={() => setShowManageTabsModal(true)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
                            <path d="M19.4 12.9c.03-.3.05-.6.05-.9s-.02-.6-.05-.9l2.11-1.65a.5.5 0 0 0 .12-.63l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.028 7.028 0 0 0-1.56-.9l-.38-2.65A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.5.42l-.38 2.65c-.55.22-1.07.5-1.56.9l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.63L4.6 11.1c-.03.3-.05.6-.05.9s.02.6.05.9L2.49 14.55a.5.5 0 0 0-.12.63l2 3.46c.14.24.43.34.68.22l2.49-1c.49.4 1.01.73 1.56.95l.38 2.65c.05.28.28.48.5.48h3.8c.22 0 .45-.2.5-.48l.38-2.65c.55-.22 1.07-.55 1.56-.95l2.49 1c.25.12.54.02.68-.22l2-3.46a.5.5 0 0 0-.12-.63L19.4 12.9z" fill="none" stroke="#0d6efd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" fill="none" stroke="#0d6efd" strokeWidth="1.5" />
                          </svg>
                        </Button>
                      </div>
                      </div>
                      {/* tab name editing moved to modal */}
                    </div>
                    
                  </Card.Header>

                  <Card.Body style={{ minHeight: 180 }}>
                    {selectedClient && selectedClient.orders && selectedClient.orders.length > 0 ? (
                      // only show orders that belong to the active tab
                      (selectedClient.orders || []).filter(o => {
                        const tabIdx = (activeTabIndex[selectedClient.id] || 0);
                        // default to tab 0 for older orders without a tab property
                        return (o as any).tab == null ? tabIdx === 0 : (o as any).tab === tabIdx;
                      }).map(o => (
                        <div key={o.id} style={{ border: '1px solid #e9ecef', padding: 12, borderRadius: 8, marginBottom: 10 }}>
                          {editingOrderId === o.id ? (
                            <div>
                              <BsForm.Group className="mb-2">
                                <BsForm.Label>Título</BsForm.Label>
                                <BsForm.Control value={orderDraft.title || ''} onChange={e => setOrderDraft(d => ({ ...d, title: e.target.value }))} />
                              </BsForm.Group>
                              <BsForm.Group className="mb-2">
                                <BsForm.Label>Descrição</BsForm.Label>
                                <BsForm.Control value={orderDraft.desc || ''} onChange={e => setOrderDraft(d => ({ ...d, desc: e.target.value }))} />
                              </BsForm.Group>
                              <BsForm.Group className="mb-2">
                                <BsForm.Label>Valor (R$)</BsForm.Label>
                                <BsForm.Control value={orderDraft.value || ''} onChange={e => setOrderDraft(d => ({ ...d, value: e.target.value }))} />
                              </BsForm.Group>
                              {/* render configured fields for this tab */}
                              {selectedClient && (() => {
                                const tabIdx = (activeTabIndex[selectedClient.id] || 0);
                                const schema = ordersTabSchemas[selectedClient.id]?.[tabIdx] || [];
                                return schema.map((f) => (
                                  <BsForm.Group className="mb-2" key={f.key}>
                                    <BsForm.Label>{f.label}</BsForm.Label>
                                    <BsForm.Control value={orderDraft[f.key] ?? ''} onChange={e => setOrderDraft(d => ({ ...d, [f.key]: f.type === 'number' || f.type === 'quantity' || f.type === 'currency' ? e.target.value.replace(/[^0-9.,]/g,'') : e.target.value }))} />
                                  </BsForm.Group>
                                ));
                              })()}
                              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                <Button size="sm" variant="primary" onClick={() => {
                                  // save order
                                  if (!selectedClient) return;
                                  setClients(prev => prev.map(c => {
                                    if (c.id !== selectedClient.id) return c;
                                    const orders = (c.orders || []).map(ord => {
                                      if (ord.id !== o.id) return ord;
                                      const saved = { ...ord, title: orderDraft.title || ord.title, desc: orderDraft.desc || ord.desc, value: orderDraft.value ? parseFloat(orderDraft.value) : ord.value } as any;
                                      // copy custom fields
                                      const tabIdx = (activeTabIndex[selectedClient.id] || 0);
                                      const schema = ordersTabSchemas[selectedClient.id]?.[tabIdx] || [];
                                      const fields: Record<string, any> = {};
                                      schema.forEach(f => { fields[f.key] = orderDraft[f.key]; });
                                      saved.fields = fields;
                                      return saved;
                                    });
                                    return { ...c, orders };
                                  }));
                                  // update selectedClient reference
                                  setSelectedClient(prev => prev ? { ...prev, orders: (prev.orders || []).map(ord => {
                                    if (ord.id !== o.id) return ord;
                                    const saved = { ...ord, title: orderDraft.title || ord.title, desc: orderDraft.desc || ord.desc, value: orderDraft.value ? parseFloat(orderDraft.value) : ord.value } as any;
                                    const tabIdx = (activeTabIndex[selectedClient.id] || 0);
                                    const schema = ordersTabSchemas[selectedClient.id]?.[tabIdx] || [];
                                    const fields: Record<string, any> = {};
                                    schema.forEach(f => { fields[f.key] = orderDraft[f.key]; });
                                    saved.fields = fields;
                                    return saved;
                                  }) } : prev);
                                  setEditingOrderId(null);
                                  setOrderDraft({});
                                }}>Salvar</Button>
                                <Button size="sm" variant="secondary" onClick={() => { setEditingOrderId(null); setOrderDraft({}); }}>Cancelar</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 600 }}>{o.title}</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#6c757d' }}>{o.value ? `R$ ${Number(o.value).toFixed(2)}` : ''}</div>
                                    <div style={{ fontSize: 11, color: '#8a8f98' }}>{formatDateTime(o.date)}</div>
                                  </div>
                                  <Button size="sm" variant="outline-primary" title="Editar" aria-label="Editar pedido" onClick={() => { setEditingOrderId(o.id); setOrderDraft({ title: o.title, desc: o.desc, value: o.value != null ? String(o.value) : '' }); }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#0d6efd"/>
                                      <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.41l-2.34-2.34a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#0d6efd"/>
                                    </svg>
                                  </Button>
                                  <Button size="sm" variant="outline-danger" title="Excluir" aria-label="Excluir pedido" onClick={() => {
                                    if (!selectedClient) return;
                                    setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, orders: (c.orders || []).filter(ord => ord.id !== o.id) } : c));
                                    setSelectedClient(prev => prev ? { ...prev, orders: (prev.orders || []).filter(ord => ord.id !== o.id) } : prev);
                                    // if we were editing this order, cancel
                                    if (editingOrderId === o.id) { setEditingOrderId(null); setOrderDraft({}); }
                                  }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z" fill="#dc3545"/>
                                      <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#dc3545"/>
                                    </svg>
                                  </Button>
                                </div>
                              </div>
                              <div style={{ color: '#495057', marginTop: 6 }}>{o.desc}</div>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-muted">Nenhum pedido ou orçamento registrado.</div>
                    )}
                  </Card.Body>
                </Card>
              </>
            ) : (
              <div className="text-muted">Selecione um cliente à esquerda para ver os detalhes.</div>
            )}
          </Col>
        </Row>
      </div>
      {/* History Modal */}
          <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Histórico: {selectedClient?.name || selectedClient?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loadingHistory ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner animation="border" /></div>
          ) : (
            <div>
              {historyMessages.length === 0 && <div className="text-muted">Nenhuma mensagem encontrada.</div>}
              {historyMessages.map((m: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 10, padding: 8, borderRadius: 6, background: m.from === 'user' ? '#f1f3f5' : '#e9f7ef' }}>
                  <div style={{ fontSize: 12, color: '#6c757d' }}>{m.from} • {m.timestamp || m.date || ''}</div>
                  <div style={{ marginTop: 6 }}>{m.content || m.text || JSON.stringify(m)}</div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete client confirmation */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Excluir cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>Tem certeza que deseja excluir o cliente {selectedClient?.name || selectedClient?.id}? Isso removerá os pedidos exibidos na tela (não afeta o banco até que integração seja feita).</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
          <Button variant="danger" onClick={async () => {
            if (!selectedClient) return;
            setDeleting(true);
            try {
              // prefer deleting from clients table; fallback to deleteConversation if clients table not synced
              try {
                await deleteClient(selectedClient.id);
                setClients(prev => prev.filter(c => c.id !== selectedClient.id));
              } catch (clientErr: any) {
                console.warn('deleteClient failed, trying deleteConversation fallback', clientErr?.message || clientErr);
                // fallback to existing conversation deletion
                try {
                  await deleteConversation(selectedClient.id);
                  setClients(prev => prev.filter(c => c.id !== selectedClient.id));
                } catch (convErr: any) {
                  console.warn('deleteConversation fallback failed', convErr?.message || convErr);
                  if (convErr && convErr.response && convErr.response.status === 404) {
                    setClients(prev => prev.filter(c => c.id !== selectedClient.id));
                  } else {
                    setToastMessage('Erro ao excluir o cliente no servidor. Verifique o log.');
                    setToastVariant('danger');
                    setShowToast(true);
                    setDeleting(false);
                    return;
                  }
                }
              }
            } catch (err) {
              console.error('Erro inesperado ao excluir client:', err);
              setToastMessage('Erro inesperado ao excluir. Veja o log.');
              setToastVariant('danger');
              setShowToast(true);
              setDeleting(false);
              return;
            }
            setSelectedClient(null);
            setShowDeleteConfirm(false);
            setDeleting(false);
          }}>{deleting ? 'Excluindo...' : 'Excluir'}</Button>
        </Modal.Footer>
      </Modal>
      {/* Toast container for discreet notifications */}
      {/* Client create/edit modal */}
      <ClientFormModal show={showClientModal} onHide={() => setShowClientModal(false)} client={editingClient} onSaved={(c: Client) => {
        // if exists, update; otherwise add
        setClients(prev => {
          const idx = prev.findIndex(p => p.id === c.id);
          if (idx >= 0) {
            const copy = [...prev]; copy[idx] = { ...copy[idx], ...c }; return copy;
          }
          return [ { ...c, orders: [] }, ...prev ];
        });
        setToastMessage('Cliente salvo com sucesso'); setToastVariant('success'); setShowToast(true);
      }} />
      {/* Tab name edit modal (replaces inline edit) */}
      <Modal show={editingTabFor != null && editingTabIndex != null} onHide={() => { setEditingTabFor(null); setEditingTabIndex(null); setTabNameDraft(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar nome da aba</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BsForm>
            <BsForm.Group>
              <BsForm.Label>Nome da aba</BsForm.Label>
              <BsForm.Control value={tabNameDraft} onChange={e => setTabNameDraft(e.target.value)} />
            </BsForm.Group>
          </BsForm>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setEditingTabFor(null); setEditingTabIndex(null); setTabNameDraft(''); }}>Cancelar</Button>
          <Button variant="primary" onClick={() => {
            const cid = editingTabFor || selectedClient?.id;
            const idx = editingTabIndex as number | null;
            if (!cid || idx == null) { setEditingTabFor(null); setEditingTabIndex(null); setTabNameDraft(''); return; }
            setOrdersTabs(prev => {
              const copy = { ...prev };
              const arr = [ ...(copy[cid] || []) ];
              const name = tabNameDraft || `Aba ${arr.length + (idx >= arr.length ? 1 : 0)}`;
              if (idx >= arr.length) arr.push(name); else arr[idx] = name;
              copy[cid] = arr;
              try { localStorage.setItem('ordersTabs', JSON.stringify(copy)); } catch (e) { /* ignore */ }
              return copy;
            });
            // activate the newly created/edited tab
            setActiveTabIndex(prev => ({ ...prev, [cid]: idx }));
            setEditingTabFor(null); setEditingTabIndex(null); setTabNameDraft('');
          }}>Salvar</Button>
        </Modal.Footer>
      </Modal>

      {/* Manage Tabs modal (accessible via gear icon) */}
      <Modal show={showManageTabsModal} onHide={() => setShowManageTabsModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Gerenciar abas</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ paddingTop: 8, paddingBottom: 8 }}>
          <p className="text-muted small">Renomeie, adicione ou remova abas deste cliente. As alterações são salvas localmente.</p>
          <div>
            {(selectedClient ? (ordersTabs[selectedClient.id] || ['Pedidos / Orçamentos']) : ['Pedidos / Orçamentos']).map((t, idx) => (
              <div key={idx} className="d-flex align-items-center mb-1" style={{ gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#6c757d"><path d="M2 2h12v2H2V2zm0 4h12v8H2V6z"/></svg>
                </div>
                <input className="form-control form-control-sm" value={t} onChange={(e) => {
                  const name = e.target.value;
                  if (!selectedClient) return;
                  setOrdersTabs(prev => {
                    const copy = { ...prev };
                    const arr = [ ...(copy[selectedClient.id] || []) ];
                    arr[idx] = name;
                    copy[selectedClient.id] = arr;
                    try { localStorage.setItem('ordersTabs', JSON.stringify(copy)); } catch (e) { /* ignore */ }
                    return copy;
                  });
                }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="outline-primary" title="Ativar" onClick={() => {
                    if (!selectedClient) return;
                    setActiveTabIndex(prev => ({ ...prev, [selectedClient.id]: idx }));
                    setShowManageTabsModal(false);
                  }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#0d6efd"><path d="M13.485 1.929L6 9.414 2.515 5.93l-1.06 1.06L6 11.536l9.545-9.546-1.06-1.06z"/></svg>
                  </Button>
                  <Button size="sm" variant="outline-secondary" title="Configurar campos" onClick={() => {
                    if (!selectedClient) return;
                    setConfiguringTabIndex(idx);
                    setShowConfigureFieldsModal(true);
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#6c757d" strokeWidth="1.5"><path d="M19.4 12.9c.03-.3.05-.6.05-.9s-.02-.6-.05-.9l2.11-1.65a.5.5 0 0 0 .12-.63l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.028 7.028 0 0 0-1.56-.9l-.38-2.65A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.5.42l-.38 2.65c-.55.22-1.07.5-1.56.9l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.63L4.6 11.1c-.03.3-.05.6-.05.9s.02.6.05.9L2.49 14.55a.5.5 0 0 0-.12.63l2 3.46c.14.24.43.34.68.22l2.49-1c.49.4 1.01.73 1.56.95l.38 2.65c.05.28.28.48.5.48h3.8c.22 0 .45-.2.5-.48l.38-2.65c.55-.22 1.07-.55 1.56-.95l2.49 1c.25.12.54.02.68-.22l2-3.46a.5.5 0 0 0-.12-.63L19.4 12.9z"/></svg>
                  </Button>
                  <Button size="sm" variant="outline-danger" title="Remover" onClick={() => {
                    if (!selectedClient) return;
                    // update tabs
                    setOrdersTabs(prev => {
                      const copy = { ...prev };
                      const arr = [ ...(copy[selectedClient.id] || []) ];
                      arr.splice(idx, 1);
                      copy[selectedClient.id] = arr.length ? arr : ['Pedidos / Orçamentos'];
                      try { localStorage.setItem('ordersTabs', JSON.stringify(copy)); } catch (e) { /* ignore */ }
                      return copy;
                    });
                    // shift orders' tab indices for this client
                    setClients(prev => prev.map(c => {
                      if (c.id !== selectedClient.id) return c;
                      const orders = (c.orders || []).map(o => {
                        const tab = (o as any).tab;
                        if (tab == null) return o; // leave older orders with implicit tab 0
                        if (tab > idx) { return { ...o, tab: tab - 1 }; }
                        if (tab === idx) { return { ...o, tab: 0 }; }
                        return o;
                      });
                      return { ...c, orders };
                    }));
                    setActiveTabIndex(prev => {
                      const cur = prev[selectedClient.id] || 0;
                      const next = Math.max(0, Math.min(cur, ((ordersTabs[selectedClient.id] || []).length - 2)));
                      return { ...prev, [selectedClient.id]: next };
                    });
                  }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#dc3545"><path d="M5.5 5.5l5 5m0-5l-5 5" stroke="#dc3545" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <Button size="sm" variant="outline-primary" onClick={() => {
              if (!selectedClient) return;
              setOrdersTabs(prev => {
                const copy = { ...prev };
                const arr = [ ...(copy[selectedClient.id] || []) ];
                arr.push(`Aba ${arr.length + 1}`);
                copy[selectedClient.id] = arr;
                try { localStorage.setItem('ordersTabs', JSON.stringify(copy)); } catch (e) { /* ignore */ }
                return copy;
              });
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#0d6efd"><path d="M8 1a.5.5 0 0 1 .5.5V7.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z"/></svg>
              <span className="small">Adicionar aba</span>
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowManageTabsModal(false)}>Fechar</Button>
        </Modal.Footer>
      </Modal>
      {/* Configure Fields Modal: allows setting simple fields for a specific client's tab */}
  <Modal show={showConfigureFieldsModal} onHide={() => { setShowConfigureFieldsModal(false); setConfiguringTabIndex(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Configurar campos da aba</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-muted small mb-2">Adicione campos que estarão disponíveis ao criar/editar pedidos nesta aba. Tipos: texto, número, moeda ou quantidade.</div>
          {selectedClient && configuringTabIndex != null ? (
            <div>
              {configuringSchema.map((f: FieldDef, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="form-control" value={f.label} onChange={e => {
                    const label = e.target.value;
                    setOrdersTabSchemas(prev => {
                      const cid = configuringClientId;
                      if (!cid || configuringTabIndex == null) return prev;
                      const copy = { ...prev };
                      copy[cid] = { ...(copy[cid] || {}) };
                      const arr = [ ...(copy[cid][configuringTabIndex] || []) ];
                      arr[idx] = { ...arr[idx], label };
                      copy[cid][configuringTabIndex] = arr;
                      return copy;
                    });
                  }} />
                  <select className="form-select" value={f.type} onChange={e => {
                    const type = e.target.value as FieldDef['type'];
                    setOrdersTabSchemas(prev => {
                      const cid = configuringClientId;
                      if (!cid || configuringTabIndex == null) return prev;
                      const copy = { ...prev };
                      copy[cid] = { ...(copy[cid] || {}) };
                      const arr = [ ...(copy[cid][configuringTabIndex] || []) ];
                      arr[idx] = { ...arr[idx], type };
                      copy[cid][configuringTabIndex] = arr;
                      return copy;
                    });
                  }} style={{ width: 140 }}>
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="currency">Moeda (R$)</option>
                    <option value="quantity">Quantidade</option>
                  </select>
                  <Button size="sm" variant="outline-danger" onClick={() => {
                    setOrdersTabSchemas(prev => {
                      const cid = configuringClientId;
                      if (!cid || configuringTabIndex == null) return prev;
                      const copy = { ...prev };
                      copy[cid] = { ...(copy[cid] || {}) };
                      const arr = [ ...(copy[cid][configuringTabIndex] || []) ];
                      arr.splice(idx, 1);
                      copy[cid][configuringTabIndex] = arr;
                      return copy;
                    });
                  }}>Remover</Button>
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                <Button size="sm" onClick={() => {
                  const cid = configuringClientId;
                  if (!cid || configuringTabIndex == null) return;
                  setOrdersTabSchemas(prev => {
                    const copy = { ...prev };
                    copy[cid] = { ...(copy[cid] || {}) };
                    const arr = [ ...(copy[cid][configuringTabIndex] || []) ];
                    const key = `f_${Date.now()}`;
                    arr.push({ key, label: `Campo ${arr.length + 1}`, type: 'text' } as FieldDef);
                    copy[cid][configuringTabIndex] = arr;
                    return copy;
                  });
                }}><i className="bi bi-plus-circle me-1" />Adicionar campo</Button>
              </div>
            </div>
          ) : (
            <div className="text-muted">Selecione uma aba para configurar</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowConfigureFieldsModal(false); setConfiguringTabIndex(null); }}>Fechar</Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer position="bottom-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} bg={toastVariant} delay={3500} autohide>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}

// Note: modal components are added below the component for simplicity; they are rendered by the component through state.

// Client form modal (create / edit)
function ClientFormModal(props: { show: boolean; onHide: () => void; client?: Client | null; onSaved: (c: Client) => void }) {
  const { show, onHide, client, onSaved } = props;
  const [id, setId] = useState(client?.id || '');
  const [name, setName] = useState(client?.name || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [address, setAddress] = useState(client?.address || '');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [notes, setNotes] = useState(client?.notes || '');
  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [autoFilledFromCep, setAutoFilledFromCep] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // viaCepResult removed — lookup still fills street/neighborhood/city/uf directly

  // sync when client prop changes
  useEffect(() => {
    setId(client?.id || ''); setName(client?.name || ''); setPhone(client?.phone || ''); setEmail(client?.email || ''); setAddress(client?.address || ''); setNotes(client?.notes || ''); setCep(''); setError('');
  setAutoFilledFromCep(false);
    // try to split existing address into components (best-effort)
    if (client?.address) {
      const parts = String(client.address).split(',').map(p => p.trim());
      setStreet(parts[0] || '');
      // try parse number from second part
      if (parts[1] && /\d/.test(parts[1])) {
        const m = parts[1].match(/(\d+\w?)/);
        setNumber(m ? m[0] : '');
      } else setNumber('');
      setNeighborhood(parts[2] || '');
      if (parts[3]) {
        const cityUf = parts[3].split('/').map(p => p.trim());
        setCity(cityUf[0] || '');
        setUf(cityUf[1] || '');
      } else { setCity(''); setUf(''); }
    } else {
      setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setUf('');
    }
  }, [client, show]);

  // parseAndSetAddress removed — address parsing is handled on client sync and on ViaCEP lookup

  // (removed unused formatPhoneForDisplay to satisfy TS no-unused warnings)

  const onPhoneChange = (val: string) => { setPhone(val); };

  // auto-fill id with normalized phone digits for new clients (don't overwrite when editing)
  useEffect(() => {
    // only run when creating a new client (client prop is falsy) and id empty
    if (!client?.id && (!id || String(id).trim() === '')) {
      const d = String(phone || '').replace(/\D/g, '');
      if (d) setId(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  // Live/debounced CEP lookup: when user types and reaches 8 digits, auto-lookup
  useEffect(() => {
    let t: any = null;
    const digits = String(cep || '').replace(/\D/g, '');
    if (digits.length === 8) {
      // debounce a bit so rapid typing doesn't trigger many requests
      t = setTimeout(() => { lookupCep(digits); }, 450);
    } else {
      // when CEP is cleared or incomplete, allow manual edits again
      setAutoFilledFromCep(false);
    }
    return () => { if (t) clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep]);

  // local suggestion logic removed to keep code light — ViaCEP remains for full CEPs

  const lookupCep = async (rawCep?: string) => {
    const candidate = (rawCep || cep || '').replace(/\D/g, '');
    if (!candidate || candidate.length < 8) {
      setError('CEP inválido (Informe 8 dígitos)');
      return;
    }
    setLoadingCep(true); setError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${candidate}/json/`);
      const data = await res.json();
      if (data && !data.erro) {
        // compose address: logradouro, complemento, bairro, localidade/uf
  setStreet(data.logradouro || '');
  setNeighborhood(data.bairro || '');
  setCity(data.localidade || '');
  setUf(data.uf || '');
  setNumber('');
  const addr = [data.logradouro, data.complemento, data.bairro, `${data.localidade || ''}${data.uf ? '/' + data.uf : ''}`].filter(Boolean).join(', ');
  setAddress(addr);
        setCep(candidate);
        setAutoFilledFromCep(true);
      } else {
        setError('CEP não encontrado');
        setAutoFilledFromCep(false);
      }
    } catch (e: any) {
      console.error('CEP lookup error', e);
      setError('Erro ao consultar CEP');
      setAutoFilledFromCep(false);
    } finally {
      setLoadingCep(false);
    }
  };

  const onSave = async () => {
  if (!id || String(id).trim() === '') { setError('ID é obrigatório'); return; }
  // require name with at least two words
  if (!name || name.trim().split(/\s+/).length < 2) { setError('Informe nome e sobrenome'); return; }
  // basic phone digits check (optional)
  const phoneDigits = String(phone || '').replace(/\D/g, '');
  if (phoneDigits && phoneDigits.length < 10) { setError('Telefone incompleto'); return; }
    setSaving(true); setError('');
  // compose address from separated fields
  const composedAddress = [street, number, neighborhood, `${city || ''}${uf ? '/' + uf : ''}`].filter(Boolean).join(', ');
  const payload = { id: String(id).trim(), name, phone: phoneDigits || null, email, address: composedAddress || address, notes };
    try {
      if (client && client.id) {
        await updateClient(client.id, payload);
        onSaved(payload as Client);
      } else {
        await createClient(payload);
        onSaved(payload as Client);
      }
      onHide();
    } catch (e: any) {
      console.error('Erro ao salvar client', e);
      setError(e?.response?.data?.error || e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{client ? 'Editar cliente' : 'Cadastrar cliente'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <BsForm>
          <BsForm.Group className="mb-2">
            <BsForm.Label>ID (telefone ou identificador) *</BsForm.Label>
            <BsForm.Control value={id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setId(e.target.value)} disabled={!!client?.id} />
          </BsForm.Group>
          <BsForm.Group className="mb-2">
            <BsForm.Label>Nome</BsForm.Label>
            <BsForm.Control value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
          </BsForm.Group>
          <BsForm.Group className="mb-2">
            <BsForm.Label>Telefone</BsForm.Label>
            <Cleave
              options={{ phone: true, phoneRegionCode: 'BR' }}
              className="form-control"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPhoneChange((e.target as HTMLInputElement).value)}
              placeholder="(11) 9XXXX-XXXX"
            />
          </BsForm.Group>
          <BsForm.Group className="mb-2">
            <BsForm.Label>CEP</BsForm.Label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Cleave
                options={{ delimiter: '-', blocks: [5,3], numericOnly: true }}
                className="form-control"
                value={cep}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCep((e.target as HTMLInputElement).value)}
                placeholder="00000-000"
              />
            </div>
            <div style={{ marginTop: 6 }}>
              {loadingCep && <small className="text-muted">Buscando endereço aguarde...</small>}
              {error && <div className="text-danger small">{error}</div>}
              {/* ViaCEP result display intentionally removed to keep UI minimal; lookup still fills fields when available */}
            </div>
          </BsForm.Group>
          <Row style={{ display: 'flex', gap: 8 }}>
            <BsForm.Group className="mb-2" style={{ flex: 3 }}>
              <BsForm.Label>Rua</BsForm.Label>
              <BsForm.Control value={street} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStreet(e.target.value)} disabled={autoFilledFromCep} />
            </BsForm.Group>
            <BsForm.Group className="mb-2" style={{ flex: 1 }}>
              <BsForm.Label>Número</BsForm.Label>
              <BsForm.Control value={number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumber(e.target.value)} />
            </BsForm.Group>
          </Row>
          <BsForm.Group className="mb-2">
            <BsForm.Label>E-mail</BsForm.Label>
            <BsForm.Control value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
          </BsForm.Group>
          <Row style={{ display: 'flex', gap: 8 }}>
            <BsForm.Group className="mb-2" style={{ flex: 2 }}>
              <BsForm.Label>Bairro</BsForm.Label>
        <BsForm.Control value={neighborhood} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNeighborhood(e.target.value)} disabled={autoFilledFromCep} />
            </BsForm.Group>
            <BsForm.Group className="mb-2" style={{ flex: 2 }}>
              <BsForm.Label>Cidade</BsForm.Label>
        <BsForm.Control value={city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)} disabled={autoFilledFromCep} />
            </BsForm.Group>
            <BsForm.Group className="mb-2" style={{ flex: 1 }}>
              <BsForm.Label>UF</BsForm.Label>
        <BsForm.Control value={uf} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUf(e.target.value)} disabled={autoFilledFromCep} />
            </BsForm.Group>
          </Row>
      {autoFilledFromCep && <div className="text-muted small" style={{ marginTop: 6 }}>Endereço preenchido automaticamente pelo CEP; altere apenas o número se necessário.</div>}
          <BsForm.Group className="mb-2">
            <BsForm.Label>Notas</BsForm.Label>
            <BsForm.Control as="textarea" rows={3} value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} />
          </BsForm.Group>
          {error && <div className="text-danger small mt-2">{error}</div>}
        </BsForm>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>Cancelar</Button>
        <Button variant="primary" onClick={onSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </Modal.Footer>
    </Modal>
  );
}

// Export default remains the same (component is in the same file)
