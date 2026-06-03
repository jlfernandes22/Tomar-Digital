// pdfTemplate.js (ou .ts)

export const DashboardPdf = ({
  theme,
  dataAtual,
  summary,
  allInfo,
  maxCat,
  maxCity,
  paisesEstrangeiros,
}) => {
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

          /* Cartões de Resumo */
          .summary-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .card {
            width: 48%;
            padding: 20px;
            border-radius: 16px;
            text-align: center;
          }
          .card-citizens {
            background-color: ${theme.colors.primaryContainer};
            color: ${theme.colors.onPrimaryContainer};
          }
          .card-business {
            background-color: ${theme.colors.secondaryContainer};
            color: ${theme.colors.onSecondaryContainer};
          }
          .card h3 { margin: 0 0 10px 0; font-size: 18px; opacity: 0.9; }
          .card .number { margin: 0; font-size: 38px; font-weight: bold; }

          /* Secções e Tabelas */
          h2 {
            color: ${theme.colors.primary};
            font-size: 22px;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
          }
          th {
            background-color: ${theme.colors.surfaceVariant};
            color: ${theme.colors.onSurfaceVariant};
            font-weight: bold;
          }

          /* Barras de Gráfico em CSS */
          .bar-container {
            width: 100%;
            background-color: #f0f0f0;
            border-radius: 8px;
            overflow: hidden;
            height: 12px;
            margin-top: 4px;
          }
          .bar-fill {
            height: 100%;
            border-radius: 8px;
          }
          .col-value { width: 80px; text-align: right; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Estatísticas Tomar+Digital</h1>
          <p>Relatório oficial gerado a ${dataAtual}</p>
        </div>

        <div class="summary-container">
          <div class="card card-citizens">
            <h3>Total de Cidadãos</h3>
            <p class="number">${summary.totalUsers}</p>
          </div>
          <div class="card card-business">
            <h3>Total de Negócios</h3>
            <p class="number">${summary.totalBusinesses}</p>
          </div>
        </div>

        <h2>Tipologia de Negócios</h2>
        <table>
          <tr>
            <th>Categoria</th>
            <th>Proporção</th>
            <th class="col-value">Total</th>
          </tr>
          ${
            allInfo.categories.length > 0
              ? allInfo.categories
                  .map(
                    cat => `
          <tr>
            <td style="width: 35%">${cat._id}</td>
            <td>
              <div class="bar-container">
                <div
                  class="bar-fill"
                  style="width: ${(cat.total / maxCat) * 100}%; background-color: ${theme.colors.primary};"
                ></div>
              </div>
            </td>
            <td class="col-value">${cat.total}</td>
          </tr>
          `,
                  )
                  .join('')
              : '<tr><td colspan="3" style="text-align: center">Sem dados disponíveis</td></tr>'
          }
        </table>

        <h2>Distribuição Geográfica (Portugal)</h2>
        <table>
          <tr>
            <th>Cidade</th>
            <th>Proporção</th>
            <th class="col-value">Total</th>
          </tr>
          ${
            allInfo.cities.length > 0
              ? allInfo.cities
                  .map(
                    city => `
          <tr>
            <td style="width: 35%">${city._id}</td>
            <td>
              <div class="bar-container">
                <div
                  class="bar-fill"
                  style="width: ${(city.total / maxCity) * 100}%; background-color: ${theme.colors.tertiary};"
                ></div>
              </div>
            </td>
            <td class="col-value">${city.total}</td>
          </tr>
          `,
                  )
                  .join('')
              : '<tr><td colspan="3" style="text-align: center">Sem dados disponíveis</td></tr>'
          }
        </table>

        <h2>Resto do Mundo</h2>
        <table>
          <tr>
            <th>País</th>
            <th class="col-value">Total de Utilizadores</th>
          </tr>
          ${
            paisesEstrangeiros.length > 0
              ? paisesEstrangeiros
                  .map(
                    country => `
          <tr>
            <td>${country._id}</td>
            <td class="col-value">${country.total}</td>
          </tr>
          `,
                  )
                  .join('')
              : '<tr><td colspan="2" style="text-align: center">Nenhum utilizador registado fora de Portugal</td></tr>'
          }
        </table>
      </body>
    </html>
  `;
};
