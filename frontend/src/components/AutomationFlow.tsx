import { useCallback, useState } from 'react';
import MenuSidebar from './MenuSidebar';
import { Toast, ToastContainer } from 'react-bootstrap';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from 'react-bootstrap';

// Tipos básicos de blocos para automação (declarado fora do componente para evitar warning do React Flow)
const nodeTypes: Record<string, { label: string; color: string }> = {
  message: {
    label: 'Mensagem',
    color: '#6366f1',
  },
  decision: {
    label: 'Decisão',
    color: '#f59e42',
  },
  action: {
    label: 'Ação',
    color: '#10b981',
  },
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Início' },
    position: { x: 100, y: 50 },
    style: { background: '#e0e7ff', border: '1px solid #6366f1' },
  },
];

const initialEdges: Edge[] = [];

export default function AutomationFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedType, setSelectedType] = useState('message');
  const [showToast, setShowToast] = useState(false);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Adiciona novo bloco ao fluxo
  const addNode = () => {
    const id = (nodes.length + 1).toString();
    const type = selectedType;
    setNodes((nds) => [
      ...nds,
      {
        id,
        data: { label: nodeTypes[type].label },
        position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
        style: { background: nodeTypes[type].color + '22', border: '1.5px solid ' + nodeTypes[type].color },
      },
    ]);
  };

  // Salva fluxo como JSON
  const saveFlow = () => {
    const flow = { nodes, edges };
    localStorage.setItem('automationFlow', JSON.stringify(flow));
  setShowToast(true);
  };

  // Carrega fluxo salvo
  const loadFlow = () => {
    const flow = localStorage.getItem('automationFlow');
    if (flow) {
      const { nodes, edges } = JSON.parse(flow);
      setNodes(nodes);
      setEdges(edges);
    }
  };

  // Buscar nome do usuário do localStorage (ou simulado)
  let userName = '';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.name) {
        userName = user.name.split(' ')[0];
      }
    }
  } catch {}
  if (!userName) userName = 'Usuário';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <MenuSidebar userName={userName} />
      <div style={{ flex: 1, height: '100vh', padding: 32, background: '#f8fafc', borderRadius: 8, overflow: 'auto' }}>
        <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            {Object.entries(nodeTypes).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <Button size="sm" onClick={addNode} variant="primary">Adicionar Bloco</Button>
          <Button size="sm" onClick={saveFlow} variant="success">Salvar Fluxo</Button>
          <Button size="sm" onClick={loadFlow} variant="secondary">Carregar Fluxo</Button>
        </div>
        <div style={{ height: 600 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background gap={16} size={1} />
          </ReactFlow>
        </div>
      </div>
      <ToastContainer position="bottom-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={2500} autohide>
          <Toast.Body>Fluxo salvo localmente!</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
