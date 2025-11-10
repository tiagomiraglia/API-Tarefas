import { TransferenciaCartao } from '../services/api';

interface UsuarioRanking {
  nome: string;
  total: number;
}

interface EstatisticasData {
  totalTransferencias: number;
  transferenciasUltimos7Dias: number;
  transferenciasUltimos30Dias: number;
  usuariosMaisTransferem: UsuarioRanking[];
  usuariosMaisRecebem: UsuarioRanking[];
  transferenciasRecentes: TransferenciaCartao[];
}

export interface ExportData {
  estatisticas?: EstatisticasData;
  transferencias?: Array<TransferenciaCartao & { 
    cartao: { titulo: string };
    usuarioOrigem: { nome: string };
    usuarioDestino: { nome: string };
  }>;
}

export class RelatorioExporter {
  /**
   * Exportar relatório em formato CSV
   */
  static exportarCSV(data: ExportData, filename: string = 'relatorio_transferencias.csv'): void {
    const csvContent = this.gerarCSV(data);
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  /**
   * Exportar relatório em formato JSON
   */
  static exportarJSON(data: ExportData, filename: string = 'relatorio_transferencias.json'): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  /**
   * Exportar relatório em formato HTML
   */
  static exportarHTML(data: ExportData, filename: string = 'relatorio_transferencias.html'): void {
    const htmlContent = this.gerarHTML(data);
    this.downloadFile(htmlContent, filename, 'text/html');
  }

  /**
   * Gerar conteúdo CSV
   */
  private static gerarCSV(data: ExportData): string {
    const lines: string[] = [];

    // Cabeçalho
    lines.push('Relatório de Transferências de Cartões Kanban');
    lines.push(`Data de Geração: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('');

    // Estatísticas gerais
    if (data.estatisticas) {
      lines.push('=== ESTATÍSTICAS GERAIS ===');
      lines.push(`Total de Transferências: ${data.estatisticas.totalTransferencias}`);
      lines.push(`Últimos 7 dias: ${data.estatisticas.transferenciasUltimos7Dias}`);
      lines.push(`Últimos 30 dias: ${data.estatisticas.transferenciasUltimos30Dias}`);
      lines.push('');

      // Ranking de usuários que mais transferem
      if (data.estatisticas.usuariosMaisTransferem.length > 0) {
        lines.push('=== USUÁRIOS QUE MAIS TRANSFEREM ===');
        lines.push('Posição,Nome,Total de Transferências');
        data.estatisticas.usuariosMaisTransferem.forEach((usuario: UsuarioRanking, index: number) => {
          lines.push(`${index + 1},${usuario.nome},${usuario.total}`);
        });
        lines.push('');
      }

      // Ranking de usuários que mais recebem
      if (data.estatisticas.usuariosMaisRecebem.length > 0) {
        lines.push('=== USUÁRIOS QUE MAIS RECEBEM ===');
        lines.push('Posição,Nome,Total Recebido');
        data.estatisticas.usuariosMaisRecebem.forEach((usuario: UsuarioRanking, index: number) => {
          lines.push(`${index + 1},${usuario.nome},${usuario.total}`);
        });
        lines.push('');
      }
    }

    // Lista de transferências
    if (data.transferencias && data.transferencias.length > 0) {
      lines.push('=== HISTÓRICO DE TRANSFERÊNCIAS ===');
      lines.push('ID,Data,Cartão,De (Origem),Para (Destino),Observação');
      
      data.transferencias.forEach(transfer => {
        const dataFormatada = new Date(transfer.created_at).toLocaleString('pt-BR');
        const observacao = (transfer.observacao || '').replace(/,/g, ';'); // Escape vírgulas
        
        lines.push([
          transfer.id,
          dataFormatada,
          `"${transfer.cartao.titulo}"`,
          transfer.usuarioOrigem.nome,
          transfer.usuarioDestino.nome,
          `"${observacao}"`,
        ].join(','));
      });
    }

    return lines.join('\n');
  }

  /**
   * Gerar conteúdo HTML
   */
  private static gerarHTML(data: ExportData): string {
    const dataGeracao = new Date().toLocaleString('pt-BR');

    let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Transferências</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
    }
    .section {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section h2 {
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
      margin-top: 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #667eea;
      color: white;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .badge-gold {
      background-color: #ffd700;
      color: #333;
    }
    .badge-silver {
      background-color: #c0c0c0;
      color: #333;
    }
    .badge-bronze {
      background-color: #cd7f32;
      color: white;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
    @media print {
      body {
        background-color: white;
      }
      .section {
        box-shadow: none;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Relatório de Transferências de Cartões Kanban</h1>
    <p>Data de Geração: ${dataGeracao}</p>
  </div>
`;

    // Estatísticas gerais
    if (data.estatisticas) {
      const stats = data.estatisticas;
      
      html += `
  <div class="section">
    <h2>Estatísticas Gerais</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total de Transferências</h3>
        <div class="value">${stats.totalTransferencias}</div>
      </div>
      <div class="stat-card">
        <h3>Últimos 7 Dias</h3>
        <div class="value">${stats.transferenciasUltimos7Dias}</div>
      </div>
      <div class="stat-card">
        <h3>Últimos 30 Dias</h3>
        <div class="value">${stats.transferenciasUltimos30Dias}</div>
      </div>
    </div>
  </div>
`;

      // Ranking de quem mais transfere
      if (stats.usuariosMaisTransferem.length > 0) {
        html += `
  <div class="section">
    <h2>🏆 Usuários que Mais Transferem</h2>
    <table>
      <thead>
        <tr>
          <th>Posição</th>
          <th>Nome</th>
          <th>Total de Transferências</th>
        </tr>
      </thead>
      <tbody>
`;
        stats.usuariosMaisTransferem.forEach((usuario: UsuarioRanking, index: number) => {
          const badge = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
          const badgeHtml = badge ? `<span class="badge badge-${badge}">${index + 1}º</span>` : `${index + 1}º`;
          
          html += `
        <tr>
          <td>${badgeHtml}</td>
          <td>${usuario.nome}</td>
          <td>${usuario.total}</td>
        </tr>
`;
        });
        html += `
      </tbody>
    </table>
  </div>
`;
      }

      // Ranking de quem mais recebe
      if (stats.usuariosMaisRecebem.length > 0) {
        html += `
  <div class="section">
    <h2>🎁 Usuários que Mais Recebem</h2>
    <table>
      <thead>
        <tr>
          <th>Posição</th>
          <th>Nome</th>
          <th>Total Recebido</th>
        </tr>
      </thead>
      <tbody>
`;
        stats.usuariosMaisRecebem.forEach((usuario: UsuarioRanking, index: number) => {
          const badge = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
          const badgeHtml = badge ? `<span class="badge badge-${badge}">${index + 1}º</span>` : `${index + 1}º`;
          
          html += `
        <tr>
          <td>${badgeHtml}</td>
          <td>${usuario.nome}</td>
          <td>${usuario.total}</td>
        </tr>
`;
        });
        html += `
      </tbody>
    </table>
  </div>
`;
      }
    }

    // Histórico de transferências
    if (data.transferencias && data.transferencias.length > 0) {
      html += `
  <div class="section">
    <h2>📋 Histórico de Transferências</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Data</th>
          <th>Cartão</th>
          <th>De (Origem)</th>
          <th>Para (Destino)</th>
          <th>Observação</th>
        </tr>
      </thead>
      <tbody>
`;
      data.transferencias.forEach(transfer => {
        const dataFormatada = new Date(transfer.created_at).toLocaleString('pt-BR');
        const observacao = transfer.observacao || '-';
        
        html += `
        <tr>
          <td>${transfer.id}</td>
          <td>${dataFormatada}</td>
          <td>${transfer.cartao.titulo}</td>
          <td>${transfer.usuarioOrigem.nome}</td>
          <td>${transfer.usuarioDestino.nome}</td>
          <td>${observacao}</td>
        </tr>
`;
      });
      html += `
      </tbody>
    </table>
  </div>
`;
    }

    html += `
  <div class="footer">
    <p>Relatório gerado automaticamente pelo Sistema Kanban</p>
    <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
  </div>
</body>
</html>
`;

    return html;
  }

  /**
   * Download de arquivo
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
