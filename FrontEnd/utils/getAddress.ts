import * as Location from "expo-location";
import type NegocioInterface from "../constants/Interfaces/Negocio";

export default async function getAddress(
  locat?: { latitude: number; longitude: number },
  business?: NegocioInterface,
) {
  let finalLat: number;
  let finalLong: number;

  if (business && business.location) {
    finalLat = business.location.lat;
    finalLong = business.location.long;
  } else if (locat) {
    finalLat = locat.latitude;
    finalLong = locat.longitude;
  } else {
    return "Erro:\nNão foram recebidas nenhumas coordenadas";
  }
if (finalLat === 0 && finalLong === 0) return "";
  try {
    const geocode = await Location.reverseGeocodeAsync({
      latitude: finalLat,
      longitude: finalLong,
    });

    if (geocode && geocode.length > 0) {
      const place = geocode[0];
      console.log("Resposta detalhada do Expo:", place);

      // 🚀 O SEGREDO: Em Portugal, extraímos os componentes um a um
      const rua = place.street || ""; 
      const numero = place.name && place.name !== place.street ? ` ${place.name}` : "";
      const localidade = place.city || place.subregion || "";

      // Juntamos a Rua e o Número de forma limpa
      let moradaMontada = `${rua}${numero}`.trim();

      // Se houver cidade/localidade (ex: Tomar), adicionamos à string
      if (localidade) {
        moradaMontada += moradaMontada ? `, ${localidade}` : localidade;
      }

      // Plano de contingência C: Se a rua vier vazia, usamos o formattedAddress original
      if (!moradaMontada && place.formattedAddress) {
        moradaMontada = place.formattedAddress;
      }
return moradaMontada || "Morada desconhecida neste ponto";
    }
  } catch (err) {
    console.error("Erro ao converter coordenadas em morada:", err);
  }

  return null;
}
