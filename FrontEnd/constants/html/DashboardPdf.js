// DashboardPdf.js — PDF template generator for Tomar+Digital dashboard export.
// Now includes campaign analytics (money spent, businesses adhered, packs sold, etc.)

export const DashboardPdf = ({
  theme,
  dataAtual,
  summary,
  allInfo,
  maxCat,
  maxCity,
  paisesEstrangeiros,
  campaigns,
  gamification,
}) => {
  // Build campaign table rows
  const campaignRows = campaigns && campaigns.length > 0
    ? campaigns.map(c => `
      <tr>
        <td>${c.titulo}</td>
        <td style="text-align:center">${c.status}</td>
        <td style="text-align:center">${c.totalBusinessesAdhered}</td>
        <td style="text-align:right">${(c.totalMoneySpent || 0).toFixed(2)} €</td>
        <td style="text-align:center">${c.totalInvoicesProcessed}</td>
        <td style="text-align:center">${c.totalPacksSold}</td>
        <td style="text-align:center">${c.totalPointsSpent}</td>
        <td style="text-align:center">${c.totalVouchersDelivered}</td>
        <td style="text-align:center">${c.totalVouchersActive}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="9" style="text-align:center">Sem campanhas registadas</td></tr>';

  // Build pack detail rows
  let packRows = '';
  if (campaigns && campaigns.length > 0) {
    campaigns.forEach(c => {
      if (c.packs && c.packs.length > 0) {
        c.packs.forEach(p => {
          packRows += `
            <tr>
              <td>${c.titulo}</td>
              <td>${p.rewardDescription}</td>
              <td style="text-align:center">${p.pointsCost}</td>
              <td style="text-align:center">${p.stock}</td>
              <td style="text-align:center">${p.currentStock}</td>
              <td style="text-align:center">${p.sold}</td>
            </tr>
          `;
        });
      }
    });
  }
  if (!packRows) {
    packRows = '<tr><td colspan="6" style="text-align:center">Sem pacotes registados</td></tr>';
  }

  return `
    <!doctype html>
    <html lang="pt">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page { margin: 20px; }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            background-color: #ffffff;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid ${theme.colors.primary};
            margin-bottom: 30px;
          }
          .header h1 {
            color: ${theme.colors.primary};
            margin: 0;
            font-size: 32px;
          }
          .header p {
            color: #666;
            margin-top: 5px;
            font-size: 14px;
          }
          .summary-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 10px;
          }
          .card {
            width: 18%;
            min-width: 140px;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
          }
          .card-citizens { background-color: ${theme.colors.primaryContainer}; color: ${theme.colors.onPrimaryContainer}; }
          .card-business { background-color: ${theme.colors.secondaryContainer}; color: ${theme.colors.onSecondaryContainer}; }
          .card-invoices { background-color: ${theme.colors.tertiaryContainer}; color: ${theme.colors.onTertiaryContainer}; }
          .card-packs { background-color: ${theme.colors.surfaceVariant}; color: ${theme.colors.onSurfaceVariant}; }
          .card-points { background-color: ${theme.colors.errorContainer}; color: ${theme.colors.onErrorContainer}; }
          .card h3 { margin: 0 0 8px 0; font-size: 14px; opacity: 0.9; }
          .card .number { margin: 0; font-size: 28px; font-weight: bold; }
          h2 {
            color: ${theme.colors.primary};
            font-size: 20px;
            margin-bottom: 12px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            margin-top: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
          }
          th {
            background-color: ${theme.colors.surfaceVariant};
            color: ${theme.colors.onSurfaceVariant};
            font-weight: bold;
          }
          .bar-container {
            width: 100%;
            background-color: #f0f0f0;
            border-radius: 8px;
            overflow: hidden;
            height: 12px;
            margin-top: 4px;
          }
          .bar-fill { height: 100%; border-radius: 8px; }
          .col-value { width: 80px; text-align: right; font-weight: bold; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Estatísticas Tomar+Digital</h1>
          <p>Relatório oficial gerado a ${dataAtual}</p>
        </div>

        <!-- Summary cards -->
        <div class="summary-container">
          <div class="card card-citizens">
            <h3>Cidadãos</h3>
            <p class="number">${summary.totalUsers}</p>
          </div>
          <div class="card card-business">
            <h3>Negócios</h3>
            <p class="number">${summary.totalBusinesses}</p>
          </div>
          <div class="card card-invoices">
            <h3>Faturas</h3>
            <p class="number">${gamification?.totalInvoices || 0}</p>
          </div>
          <div class="card card-packs">
            <h3>Pacotes Vendidos</h3>
            <p class="number">${gamification?.totalRedemptions || 0}</p>
          </div>
          <div class="card card-points">
            <h3>Pontos em Circulação</h3>
            <p class="number">${gamification?.totalPointsInCirculation || 0}</p>
          </div>
        </div>

        <h2>Tipologia de Negócios</h2>
        <table>
          <tr><th>Categoria</th><th>Proporção</th><th class="col-value">Total</th></tr>
          ${allInfo.categories.length > 0
            ? allInfo.categories.map(cat => `
              <tr>
                <td style="width: 35%">${cat._id}</td>
                <td><div class="bar-container"><div class="bar-fill" style="width: ${(cat.total / maxCat) * 100}%; background-color: ${theme.colors.primary};"></div></div></td>
                <td class="col-value">${cat.total}</td>
              </tr>`).join('')
            : '<tr><td colspan="3" style="text-align: center">Sem dados</td></tr>'}
        </table>

        <h2>Distribuição Geográfica (Portugal)</h2>
        <table>
          <tr><th>Cidade</th><th>Proporção</th><th class="col-value">Total</th></tr>
          ${allInfo.cities.length > 0
            ? allInfo.cities.map(city => `
              <tr>
                <td style="width: 35%">${city._id}</td>
                <td><div class="bar-container"><div class="bar-fill" style="width: ${(city.total / maxCity) * 100}%; background-color: ${theme.colors.tertiary};"></div></div></td>
                <td class="col-value">${city.total}</td>
              </tr>`).join('')
            : '<tr><td colspan="3" style="text-align: center">Sem dados</td></tr>'}
        </table>

        <h2>Resto do Mundo</h2>
        <table>
          <tr><th>País</th><th class="col-value">Total</th></tr>
          ${paisesEstrangeiros.length > 0
            ? paisesEstrangeiros.map(country => `
              <tr><td>${country._id}</td><td class="col-value">${country.total}</td></tr>`).join('')
            : '<tr><td colspan="2" style="text-align: center">Nenhum utilizador fora de Portugal</td></tr>'}
        </table>

        <!-- NEW: Campaign Analytics -->
        <div class="page-break"></div>
        <h2>Análise de Campanhas</h2>
        <table>
          <tr>
            <th>Campanha</th>
            <th>Estado</th>
            <th>Negócios Aderentes</th>
            <th>Dinheiro Gasto</th>
            <th>Faturas</th>
            <th>Pacotes Vendidos</th>
            <th>Pontos Gastos</th>
            <th>Vouchers Entregues</th>
            <th>Vouchers Ativos</th>
          </tr>
          ${campaignRows}
        </table>

        <!-- NEW: Pack Details -->
        <h2>Detalhe de Pacotes por Campanha</h2>
        <table>
          <tr>
            <th>Campanha</th>
            <th>Recompensa</th>
            <th>Custo (pts)</th>
            <th>Stock Inicial</th>
            <th>Stock Atual</th>
            <th>Vendidos</th>
          </tr>
          ${packRows}
        </table>
      </body>
    </html>
  `;
};
