// Calcula a distância entre duas coordenadas em metros
export const calcularDistancia = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const RaioTerra = 6371e3; // Raio da Terra em metros

  // Conversão de graus para radianos
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  // Fórmula de Haversine
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanciaEmMetros = RaioTerra * c;

  return distanciaEmMetros; // Devolve os metros exatos!
};
