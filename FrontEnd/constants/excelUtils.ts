import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

interface ExcelData {
  summary: { totalUsers: number; totalBusinesses: number };
  categories: any[];
  cities: any[];
  countries: any[];
}

export const exportDashboardToExcel = async ({
  summary,
  categories,
  cities,
  countries,
}: ExcelData) => {
  try {
    const wsResumo = XLSX.utils.json_to_sheet([
      {
        'Total de Cidadãos': summary.totalUsers,
        'Total de Negócios': summary.totalBusinesses,
      },
    ]);

    const wsCategorias = XLSX.utils.json_to_sheet(
      categories.map(c => ({ Categoria: c._id, 'Total de Negócios': c.total })),
    );

    const wsCidades = XLSX.utils.json_to_sheet(
      cities.map(c => ({ Cidade: c._id, 'Total de Cidadãos': c.total })),
    );

    const wsPaises = XLSX.utils.json_to_sheet(
      countries.map(c => ({ País: c._id, 'Total de Cidadãos': c.total })),
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorias');
    XLSX.utils.book_append_sheet(wb, wsCidades, 'Cidades (PT)');
    XLSX.utils.book_append_sheet(wb, wsPaises, 'Resto do Mundo');

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
