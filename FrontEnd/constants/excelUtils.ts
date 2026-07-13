import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

interface ExcelData {
  summary: { totalUsers: number; totalBusinesses: number };
  categories: any[];
  cities: any[];
  countries: any[];
  campaigns?: any[];
  gamification?: {
    totalInvoices: number;
    totalRedemptions: number;
    totalPointsInCirculation: number;
  };
}

export const exportDashboardToExcel = async ({
  summary,
  categories,
  cities,
  countries,
  campaigns,
  gamification,
}: ExcelData) => {
  try {
    // --- Sheet 1: Resumo (Summary) ---
    const wsResumo = XLSX.utils.json_to_sheet([
      {
        'Total de Cidadãos': summary.totalUsers,
        'Total de Negócios': summary.totalBusinesses,
        'Total de Faturas Processadas': gamification?.totalInvoices || 0,
        'Total de Pacotes Comprados': gamification?.totalRedemptions || 0,
        'Pontos em Circulação': gamification?.totalPointsInCirculation || 0,
      },
    ]);

    // --- Sheet 2: Categorias ---
    const wsCategorias = XLSX.utils.json_to_sheet(
      categories.map(c => ({ Categoria: c._id, 'Total de Negócios': c.total })),
    );

    // --- Sheet 3: Cidades (PT) ---
    const wsCidades = XLSX.utils.json_to_sheet(
      cities.map(c => ({ Cidade: c._id, 'Total de Cidadãos': c.total })),
    );

    // --- Sheet 4: Resto do Mundo ---
    const wsPaises = XLSX.utils.json_to_sheet(
      countries.map(c => ({ País: c._id, 'Total de Cidadãos': c.total })),
    );

    // --- Sheet 5: Campanhas (NEW) ---
    let wsCampanhas = null;
    if (campaigns && campaigns.length > 0) {
      wsCampanhas = XLSX.utils.json_to_sheet(
        campaigns.map(c => ({
          'Campanha': c.titulo,
          'Estado': c.status,
          'Negócios Aderentes': c.totalBusinessesAdhered,
          'Dinheiro Gasto (€)': c.totalMoneySpent,
          'Faturas Processadas': c.totalInvoicesProcessed,
          'Pacotes Vendidos': c.totalPacksSold,
          'Pontos Gastos': c.totalPointsSpent,
          'Vouchers Entregues': c.totalVouchersDelivered,
          'Vouchers Ativos': c.totalVouchersActive,
          'Vouchers Expirados': c.totalVouchersExpired,
          'Início': c.DataInicio ? new Date(c.DataInicio).toLocaleDateString('pt-PT') : '',
          'Expira': c.DataExpiracao ? new Date(c.DataExpiracao).toLocaleDateString('pt-PT') : '',
        })),
      );
    }

    // --- Sheet 6: Detalhe de Pacotes por Campanha (NEW) ---
    let wsPacks = null;
    if (campaigns && campaigns.length > 0) {
      const packsRows = [];
      campaigns.forEach(c => {
        if (c.packs && c.packs.length > 0) {
          c.packs.forEach(p => {
            packsRows.push({
              'Campanha': c.titulo,
              'Recompensa': p.rewardDescription,
              'Custo (pontos)': p.pointsCost,
              'Stock Inicial': p.stock,
              'Stock Atual': p.currentStock,
              'Vendidos': p.sold,
            });
          });
        }
      });
      if (packsRows.length > 0) {
        wsPacks = XLSX.utils.json_to_sheet(packsRows);
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorias');
    XLSX.utils.book_append_sheet(wb, wsCidades, 'Cidades (PT)');
    XLSX.utils.book_append_sheet(wb, wsPaises, 'Resto do Mundo');
    if (wsCampanhas) XLSX.utils.book_append_sheet(wb, wsCampanhas, 'Campanhas');
    if (wsPacks) XLSX.utils.book_append_sheet(wb, wsPacks, 'Pacotes');

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const excelFile = new File(Paths.document, 'Relatorio_TomarDigital.xlsx');

    excelFile.write(wbout, { encoding: 'base64' });

    await Sharing.shareAsync(excelFile.uri, {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Exportar Relatório Excel',
      UTI: 'com.microsoft.excel.xlsx',
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao gerar Excel:', error);
    return { success: false, error };
  }
};
