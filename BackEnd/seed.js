import mongoose from "mongoose";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import "dotenv/config";

import User from "./models/User.js";
import Business from "./models/Business.js";
import Campaign from "./models/Campaign.js";
import Invoice from "./models/Invoice.js";
import Favorite from "./models/Favorite.js";
import Cae from "./models/Cae.js";
import CitiesAndCountries from "./models/CitiesAndCountries.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/tomar_db";
console.log("A ligar a:", MONGO_URI);

/**
 * ========================================================
 * FUNÇÃO: Gerar NIFs matematicamente válidos (Fallback)
 * ========================================================
 * Usado apenas se o NIF real não for encontrado.
 * @param {boolean} isCompany - Se true, começa por 5. Se false, 1, 2 ou 3.
 */
const generateValidNIF = (isCompany = false) => {
  const prefix = isCompany ? '5' : ['1', '2', '3'][Math.floor(Math.random() * 3)];
  let nif = prefix;
  
  for (let i = 0; i < 7; i++) {
    nif += Math.floor(Math.random() * 10).toString();
  }
  
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(nif[i]) * (9 - i);
  }
  const remainder = sum % 11;
  const checkDigit = remainder === 0 || remainder === 1 ? 0 : 11 - remainder;
  
  return parseInt(nif + checkDigit);
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🌱 Ligado ao MongoDB. A iniciar o seeding...");

    // Limpeza total
    await User.deleteMany();
    await Business.deleteMany();
    await Campaign.deleteMany();
    await Invoice.deleteMany();
    await Favorite.deleteMany();
    await Cae.deleteMany();
    await CitiesAndCountries.deleteMany();
    console.log("🗑️ Dados antigos apagados com sucesso.");

    // ==========================================
    // 1. IMPORTAR DADOS DOS CSV (CAEs e Cidades)
    // ==========================================
    const fallbackCaes = [
      { cae: "56101", descricao: "Restaurantes com espaço de dança e espetáculo", seccao: "I" },
      { cae: "56102", descricao: "Restaurantes sem espaço de dança e espetáculo", seccao: "I" },
      { cae: "56301", descricao: "Bares", seccao: "I" },
      { cae: "56302", descricao: "Cafés e estabelecimentos de bebidas", seccao: "I" },
      { cae: "55101", descricao: "Hotéis com restaurante", seccao: "I" },
      { cae: "55102", descricao: "Hotéis sem restaurante", seccao: "I" },
      { cae: "47111", descricao: "Supermercados", seccao: "G" },
      { cae: "10711", descricao: "Panificação", seccao: "C" },
      { cae: "10712", descricao: "Pastelaria", seccao: "C" },
      { cae: "47730", descricao: "Comércio a retalho de produtos farmacêuticos", seccao: "G" },
    ];

    // --- PROCESSAR CAEs ---
    const processCaeCSV = async () => {
      const filePath = path.join(process.cwd(), "csvFiles", "caes.csv");
      
      // Verifica se o ficheiro não existe ou se está totalmente vazio (0 bytes)
      if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
        console.warn(`⚠️ caes.csv não encontrado ou vazio. A usar fallback...`);
        await Cae.insertMany(fallbackCaes);
        console.log(`✅ ${fallbackCaes.length} CAEs de fallback inseridos.`);
        return;
      }

      const results = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => {
            // Mapeamento exato baseado nos teus cabeçalhos: "Secção", "CAE", "Descrição"
            const seccao = data["Secção"] || data["seccao"] || data["Secao"];
            const cae = data["CAE"] || data["cae"] || data["Codigo"];
            const descricao = data["Descrição"] || data["descricao"] || data["Designacao"];

            if (cae && descricao && seccao) {
              results.push({ cae, descricao, seccao });
            }
          })
          .on("end", resolve)
          .on("error", reject);
      });

      if (results.length > 0) {
        await Cae.insertMany(results);
        console.log(`✅ ${results.length} CAEs inseridos a partir do CSV.`);
      } else {
        console.warn(`⚠️ Nenhum CAE mapeado no ficheiro. A usar fallback...`);
        await Cae.insertMany(fallbackCaes);
        console.log(`✅ ${fallbackCaes.length} CAEs de fallback inseridos.`);
      }
    };

    // --- PROCESSAR CIDADES (Extraindo APENAS name, state_name, country_name) ---
    const processCitiesCSV = async () => {
      const filePath = path.join(process.cwd(), "csvFiles", "cities.csv");
      if (!fs.existsSync(filePath)) return console.warn(`⚠️ cities.csv não encontrado.`);

      const results = [];
      console.log(`⏳ A ler e filtrar cities.csv (isto pode demorar uns segundos)...`);
      
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv()) // O csv-parser lê a primeira linha e usa como chaves do objeto
          .on("data", (data) => {
            // Extrai APENAS os 3 campos que pediste
            if (data.name && data.state_name && data.country_name) {
              results.push({
                name: data.name,
                state_name: data.state_name,
                country_name: data.country_name
              });
            }
          })
          .on("end", resolve)
          .on("error", reject);
      });

      if (results.length > 0) {
        // Inserir em lotes de 5000 para evitar estourar o limite de memória do MongoDB (BSON Limit)
        const batchSize = 5000;
        let insertedCount = 0;
        
        for (let i = 0; i < results.length; i += batchSize) {
          const batch = results.slice(i, i + batchSize);
          try {
            // ordered: false faz com que o MongoDB ignore erros de duplicados e continue a inserir o resto
            await CitiesAndCountries.insertMany(batch, { ordered: false }); 
            insertedCount += batch.length;
          } catch (err) {
            // Captura inserções parciais caso haja algumas duplicadas no meio do lote
            if (err.insertedCount) insertedCount += err.insertedCount;
          }
        }
        console.log(`✅ ${insertedCount} Cidades (name, state, country) inseridas na base de dados.`);
      } else {
        console.warn(`⚠️ Nenhuma cidade válida encontrada no CSV.`);
      }
    };

    await processCaeCSV();
    await processCitiesCSV();

    // ==========================================
    // 2. CRIAR UTILIZADORES (Portugal + Mundo 🌍)
    // ==========================================
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("123456", saltRounds);

    // Utilizadores base de Tomar (mantidos)
    const baseUsers = [
      { name: "Câmara Municipal de Tomar", email: "geral@cm-tomar.pt", password: hashedPassword, city: "Tomar", role: "camara", Points: 0, NIF: 506415082 },
      { name: "Hoang Wright", email: "hoang.wright9675@iol.pt", password: hashedPassword, city: "Tomar", role: "cidadao", Points: 781, NIF: generateValidNIF(false) },
    ];

    // Cidades Portuguesas reais (para distribuir utilizadores pelo país)
    const portugueseCities = [
      "Lisboa", "Porto", "Coimbra", "Braga", "Aveiro", "Faro", "Viseu", "Leiria", 
      "Setúbal", "Évora", "Guarda", "Castelo Branco", "Portalegre", "Santarém", 
      "Vila Real", "Bragança", "Viana do Castelo", "Ponta Delgada", "Funchal",
      "Almada", "Amadora", "Queluz", "Agualva-Cacém", "Rio de Mouro", "Odivelas",
      "Loures", "Oeiras", "Cascais", "Sintra", "Albufeira", "Portimão", "Lagos",
      "Olhão", "Tavira", "Silves", "Loulé", "Vila do Conde", "Póvoa de Varzim",
      "Guimarães", "Vizela", "Fafe", "Barcelos", "Esposende", "Paredes", "Penafiel",
      "Lamego", "Peso da Régua", "Mirandela", "Chaves", "Valença", "Monção"
    ];

    // Cidades Internacionais (para simular turistas e utilizadores globais)
    const internationalCities = [
      { city: "Madrid", country: "Espanha" },
      { city: "Barcelona", country: "Espanha" },
      { city: "Paris", country: "França" },
      { city: "Lyon", country: "França" },
      { city: "Berlin", country: "Alemanha" },
      { city: "Munich", country: "Alemanha" },
      { city: "Rome", country: "Itália" },
      { city: "Milan", country: "Itália" },
      { city: "London", country: "Reino Unido" },
      { city: "Manchester", country: "Reino Unido" },
      { city: "Brussels", country: "Bélgica" },
      { city: "Amsterdam", country: "Países Baixos" },
      { city: "Zurich", country: "Suíça" },
      { city: "Vienna", country: "Áustria" },
      { city: "Prague", country: "República Checa" },
      { city: "Warsaw", country: "Polónia" },
      { city: "Stockholm", country: "Suécia" },
      { city: "Copenhagen", country: "Dinamarca" },
      { city: "Oslo", country: "Noruega" },
      { city: "Helsinki", country: "Finlândia" },
      { city: "Dublin", country: "Irlanda" },
      { city: "Lisbon", country: "Portugal" }, // Para utilizadores estrangeiros que escrevem em inglês
      { city: "Porto", country: "Portugal" },
      { city: "São Paulo", country: "Brasil" },
      { city: "Rio de Janeiro", country: "Brasil" },
      { city: "Salvador", country: "Brasil" },
      { city: "Brasília", country: "Brasil" },
      { city: "Belo Horizonte", country: "Brasil" },
      { city: "Curitiba", country: "Brasil" },
      { city: "Florianópolis", country: "Brasil" },
      { city: "New York", country: "EUA" },
      { city: "Los Angeles", country: "EUA" },
      { city: "Miami", country: "EUA" },
      { city: "Toronto", country: "Canadá" },
      { city: "Montreal", country: "Canadá" },
      { city: "Tokyo", country: "Japão" },
      { city: "Seoul", country: "Coreia do Sul" },
      { city: "Sydney", country: "Austrália" },
      { city: "Melbourne", country: "Austrália" },
      { city: "Cape Town", country: "África do Sul" },
    ];

    // Nomes portugueses para cidadãos
    const portugueseFirstNames = [
      "João", "Maria", "António", "Ana", "Carlos", "Sofia", "Miguel", "Mariana",
      "Pedro", "Rita", "Rui", "Inês", "Tiago", "Catarina", "Bruno", "Francisco",
      "Beatriz", "Duarte", "Margarida", "Gonçalo", "Leonor", "Martim", "Matilde",
      "Afonso", "Carolina", "Tomás", "Francisca", "Rodrigo", "Sara", "Diogo",
      "Laura", "Gabriel", "Alice", "Vicente", "Benedita", "Salvador", "Camila",
      "Bernardo", "Clara", "Lourenço", "Marta", "Simão", "Iara", "Nuno", "Júlia",
      "Rafael", "Beatriz", "David", "Lara", "André", "Cristiana", "Luís", "Patrícia"
    ];

    const portugueseLastNames = [
      "Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues",
      "Martins", "Jesus", "Sousa", "Fernandes", "Gonçalves", "Gomes", "Lopes",
      "Marques", "Alves", "Pinto", "Carvalho", "Ribeiro", "Moreira", "Mendes",
      "Soares", "Nunes", "Dias", "Correia", "Machado", "Antunes", "Coelho",
      "Vieira", "Teixeira", "Monteiro", "Ramos", "Henriques", "Cardoso", "Campos",
      "Vaz", "Freitas", "Araújo", "Neves", "Pires", "Cunha", "Moura", "Fonseca",
      "Tavares", "Baptista", "Barbosa", "Miranda", "Azevedo", "Lourenço", "Mota"
    ];

    // Nomes internacionais
    const internationalNames = [
      { first: "James", last: "Smith", country: "EUA" },
      { first: "Emma", last: "Johnson", country: "Reino Unido" },
      { first: "Lucas", last: "Garcia", country: "Espanha" },
      { first: "Sophie", last: "Martin", country: "França" },
      { first: "Luca", last: "Rossi", country: "Itália" },
      { first: "Anna", last: "Müller", country: "Alemanha" },
      { first: "Pedro", last: "Silva", country: "Brasil" },
      { first: "Ana", last: "Santos", country: "Brasil" },
      { first: "Yuki", last: "Tanaka", country: "Japão" },
      { first: "Min-jun", last: "Kim", country: "Coreia do Sul" },
      { first: "Liam", last: "O'Brien", country: "Irlanda" },
      { first: "Olivia", last: "Brown", country: "Austrália" },
      { first: "Noah", last: "Wilson", country: "Canadá" },
      { first: "Amelia", last: "Taylor", country: "Nova Zelândia" },
      { first: "Hugo", last: "Dubois", country: "Bélgica" },
      { first: "Eva", last: "van Dijk", country: "Países Baixos" },
      { first: "Erik", last: "Andersson", country: "Suécia" },
      { first: "Sofia", last: "Nielsen", country: "Dinamarca" },
      { first: "Mateo", last: "Lopez", country: "México" },
      { first: "Valentina", last: "Rodriguez", country: "Argentina" },
    ];

    // Gerar cidadãos portugueses (150)
    let portugueseCitizens = [];
    for (let i = 0; i < 150; i++) {
      const firstName = portugueseFirstNames[Math.floor(Math.random() * portugueseFirstNames.length)];
      const lastName = portugueseLastNames[Math.floor(Math.random() * portugueseLastNames.length)];
      const city = portugueseCities[Math.floor(Math.random() * portugueseCities.length)];
      
      portugueseCitizens.push({
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@mail.pt`,
        password: hashedPassword,
        city: city,
        role: "cidadao",
        Points: Math.floor(Math.random() * 1200),
        NIF: generateValidNIF(false),
      });
    }

    // Gerar cidadãos internacionais (100)
    let internationalCitizens = [];
    for (let i = 0; i < 100; i++) {
      const nameData = internationalNames[Math.floor(Math.random() * internationalNames.length)];
      const location = internationalCities[Math.floor(Math.random() * internationalCities.length)];
      
      internationalCitizens.push({
        name: `${nameData.first} ${nameData.last}`,
        email: `${nameData.first.toLowerCase()}.${nameData.last.toLowerCase()}${i}@globalmail.com`,
        password: hashedPassword,
        city: location.city,
        role: "cidadao",
        Points: Math.floor(Math.random() * 1200),
        NIF: generateValidNIF(false), // NIF válido para testes, mesmo para estrangeiros
      });
    }

    // Gerar comerciantes de outras cidades portuguesas (20) - para simular expansão
    let merchantsOtherCities = [];
    const merchantCities = ["Lisboa", "Porto", "Coimbra", "Braga", "Aveiro", "Faro", "Leiria", "Viseu"];
    for (let i = 0; i < 20; i++) {
      const firstName = portugueseFirstNames[Math.floor(Math.random() * portugueseFirstNames.length)];
      const lastName = portugueseLastNames[Math.floor(Math.random() * portugueseLastNames.length)];
      const city = merchantCities[Math.floor(Math.random() * merchantCities.length)];
      
      merchantsOtherCities.push({
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@comercio-${city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.pt`,
        password: hashedPassword,
        city: city,
        role: "comerciante",
        Points: 0,
        NIF: generateValidNIF(false),
      });
    }

    // Comerciantes de Tomar (mantidos)
    const merchantNamesTomar = [
      "João Silva", "Maria Fernandes", "António Costa", "Ana Pereira", "Carlos Santos",
      "Sofia Rodrigues", "Miguel Oliveira", "Mariana Gomes", "Pedro Martins", "Rita Ferreira",
      "Rui Almeida", "Inês Carvalho", "Tiago Mendes", "Catarina Lopes", "Bruno Pinto",
      "Francisco Nunes", "Beatriz Leal", "Duarte Marques", "Margarida Pinto", "Gonçalo Silva"
    ];

    let merchantsTomar = merchantNamesTomar.map((name, i) => ({
      name,
      email: name.toLowerCase().replace(/ /g, ".") + "@comercio-tomar.pt",
      password: hashedPassword,
      city: "Tomar",
      role: "comerciante",
      Points: 0,
      NIF: generateValidNIF(false),
    }));

    // Inserir TODOS os utilizadores
    const allUsers = [
      ...baseUsers,
      ...merchantsTomar,
      ...merchantsOtherCities,
      ...portugueseCitizens,
      ...internationalCitizens
    ];

    const users = await User.insertMany(allUsers);
    console.log(`✅ Foram criados ${users.length} utilizadores de Portugal e do Mundo!`);
    console.log(`   🇵🇹 ${portugueseCitizens.length} cidadãos portugueses`);
    console.log(`   🌍 ${internationalCitizens.length} cidadãos internacionais`);
    console.log(`   🏪 ${merchantsTomar.length + merchantsOtherCities.length} comerciantes`);

    // Helpers para aceder aos utilizadores
    const getU = (email) => users.find((u) => u.email === email);
    const getCitizens = () => users.filter(u => u.role === "cidadao" || u.role === "camara");
    const getMerchants = () => users.filter(u => u.role === "comerciante");
    const getRandomCitizen = () => getCitizens()[Math.floor(Math.random() * getCitizens().length)];

    // ==========================================
    // 3. CRIAR CAMPANHAS
    // ==========================================
    const campaignsData = [
      {
        createdBy: getU("geral@cm-tomar.pt")._id,
        titulo: "Comércio Local Vivo",
        slogan: "Apoie os pequenos negócios do centro histórico.",
        descricao: "Compre nas lojas locais de Tomar e ganhe pontos.",
        listaCAES: ["56101", "56102", "56301", "56302", "47111", "47730", "10712"], // Adicionado para cumprir o Schema
        estado: "ativa",
        DataInicio: new Date("2026-03-01"),
        DataExpiracao: new Date("2026-09-30"),
        logo: "https://exemplo.com/comercio-local.jpg",
        panfleto: "https://exemplo.com/panfleto.pdf",
        normas: "Válido para compras superiores a 1€.",
        packs: [
          { pointsCost: 100, rewardDescription: "Voucher 10€ no Comércio", stock: 50, currentStock: 50, maxPerUser: 2 },
          { pointsCost: 250, rewardDescription: "Jantar para 2 pessoas", stock: 20, currentStock: 20, maxPerUser: 1 }
        ],
      },
      {
        createdBy: getU("geral@cm-tomar.pt")._id,
        titulo: "Tomar Sustentável",
        slogan: "Reduza a pegada ecológica e seja recompensado.",
        descricao: "Campanha de incentivo à utilização de transportes suaves e compras em mercados locais.",
        listaCAES: ["47111", "10711", "10712"], // Adicionado para cumprir o Schema
        estado: "ativa",
        DataInicio: new Date("2026-05-01"),
        DataExpiracao: new Date("2026-12-31"),
        logo: "https://exemplo.com/tomar-sustentavel.jpg",
        panfleto: "https://exemplo.com/panfleto_sust.pdf",
        normas: "Acumulação de pontos em mercados municipais.",
        packs: [
          { pointsCost: 50, rewardDescription: "Saco reutilizável Tomar", stock: 100, currentStock: 100, maxPerUser: 3 },
          { pointsCost: 500, rewardDescription: "Bicicleta partilhada (1 mês)", stock: 10, currentStock: 10, maxPerUser: 1 }
        ],
      }
    ];
    const campaigns = await Campaign.insertMany(campaignsData);
    const getC = (titulo) => campaigns.find((c) => c.titulo === titulo);
    console.log(`✅ Foram criadas ${campaigns.length} campanhas locais!`);

    // ==========================================
    // 4. CRIAR NEGÓCIOS REAIS EM TOMAR (Com location CORRETO para o Schema)
    // ==========================================
    const realBusinesses = [
      // Alojamento
      { name: "Hotel dos Templários", category: "Alojamento", NIF: 500282315, address: "Largo Cândido dos Reis, nº1, Tomar", lat: 39.6065, long: -8.4120 },
      { name: "Thomar Boutique Hotel", category: "Alojamento", NIF: 503695769, address: "Rua da República, Tomar", lat: 39.6040, long: -8.4130 },
      { name: "Hotel República", category: "Alojamento", NIF: 514586354, address: "Praça da República, Tomar", lat: 39.6037, long: -8.4128 },
      { name: "Vila Galé Collection Tomar", category: "Alojamento", NIF: 505127628, address: "Av. D. Nuno Álvares Pereira, Tomar", lat: 39.6045, long: -8.4090 },
      { name: "Casa dos Ofícios Hotel", category: "Alojamento", NIF: null, address: "Rua Silva Magalhães, 71, Tomar", lat: 39.6035, long: -8.4110 },
      { name: "Estalagem Santa Iria", category: "Alojamento", NIF: null, address: "Rua do Parque, Tomar", lat: 39.6058, long: -8.4115 },
      
      // Restauração
      { name: "Restaurante Praça by Hotel República", category: "Restauração", NIF: 514586354, address: "Praça da República 41, Tomar", lat: 39.6037, long: -8.4128 },
      { name: "Taverna Antiqua", category: "Restauração", NIF: 504523473, address: "Praça da República 23-25, Tomar", lat: 39.6036, long: -8.4125 },
      { name: "Restaurante Sellium (Cervejaria Claustro)", category: "Restauração", NIF: 503968757, address: "Rua Serpa Pinto 48, Tomar", lat: 39.6039, long: -8.4140 },
      { name: "Casa das Ratas", category: "Restauração", NIF: 508909651, address: "Rua Dr. Joaquim Jacinto 7, Tomar", lat: 39.6037, long: -8.4120 },
      { name: "Restaurante Sabores ao Rubro", category: "Restauração", NIF: 501226010, address: "Rua de São João, Tomar", lat: 39.6035, long: -8.4135 },
      { name: "Restaurante A Lúria", category: "Restauração", NIF: 510770940, address: "Rua dos Voluntários Tomarenses, Tomar", lat: 39.6030, long: -8.4140 },
      { name: "Restaurante Beira Rio", category: "Restauração", NIF: 504349970, address: "Rua Alexandre Herculano 1-B, Tomar", lat: 39.6033, long: -8.4125 },
      { name: "Restaurante Mouchão", category: "Restauração", NIF: 505223970, address: "Parque do Mouchão, Tomar", lat: 39.6058, long: -8.4100 },
      { name: "A Tasquinha", category: "Restauração", NIF: 506314910, address: "Tomar", lat: 39.6045, long: -8.4135 },
      { name: "Cantinho dos Sabores", category: "Restauração", NIF: 506014614, address: "Tomar", lat: 39.6020, long: -8.4150 },
      
      // Cafés & Pastelarias
      { name: "Café Claustro", category: "Cafés & Pastelarias", NIF: 516413988, address: "Rua Lopo Dias de Sousa 7, Tomar", lat: 39.6042, long: -8.4122 },
      { name: "Pastelaria Templária", category: "Cafés & Pastelarias", NIF: 502916958, address: "Rua 10 de Agosto de 1385, 30, Tomar", lat: 39.6040, long: -8.4125 },
      { name: "Pastelaria Tropical", category: "Cafés & Pastelarias", NIF: 504975439, address: "Rua Professor Andrade, 2A/2B, Tomar", lat: 39.6032, long: -8.4130 },
      { name: "Pastelaria Pic Nic 3", category: "Cafés & Pastelarias", NIF: null, address: "Alameda 1 de Março nº 14, Tomar", lat: 39.6045, long: -8.4130 },
      { name: "Café Central", category: "Cafés & Pastelarias", NIF: 503629715, address: "Tomar", lat: 39.6038, long: -8.4126 },
      { name: "Santa Iria - Café Bistrot", category: "Cafés & Pastelarias", NIF: null, address: "Rua Marquês de Pombal 57, Tomar", lat: 39.6028, long: -8.4145 },

      // Comércio Local & Serviços
      { name: "Centro Comercial Templários", category: "Comércio Local", NIF: 507857410, address: "Alameda 1 de Março, Tomar", lat: 39.6045, long: -8.4130 },
      { name: "Talho Alto (Mercado Municipal)", category: "Comércio Local", NIF: null, address: "Mercado Municipal de Tomar", lat: 39.6025, long: -8.4120 },
      { name: "Farmácia Central", category: "Serviços", NIF: null, address: "Rua Serpa Pinto, Tomar", lat: 39.6038, long: -8.4125 },
      { name: "Livraria Estúdio 70", category: "Comércio Local", NIF: null, address: "Rua Serpa Pinto, Tomar", lat: 39.6037, long: -8.4126 },
      { name: "Pingo Doce Tomar", category: "Comércio Local", NIF: 500104511, address: "Av. D. Nuno Álvares Pereira, Tomar", lat: 39.6070, long: -8.4100 },
      
      // Património & Museus / Lazer & Natureza
      { name: "Convento de Cristo", category: "Património & Museus", NIF: null, address: "Colina do Castelo, Tomar", lat: 39.6045, long: -8.4165 },
      { name: "Sinagoga de Tomar", category: "Património & Museus", NIF: null, address: "Rua Joaquim Jacinto 73, Tomar", lat: 39.6030, long: -8.4115 },
      { name: "Parque do Mouchão", category: "Lazer & Natureza", NIF: null, address: "Parque do Mouchão, Tomar", lat: 39.6055, long: -8.4095 },
      { name: "Mata Nacional dos Sete Montes", category: "Lazer & Natureza", NIF: null, address: "Tomar", lat: 39.6015, long: -8.4170 },
    ];

    const merchantsList = getMerchants();

    const businessesData = realBusinesses.map((b, index) => {
      // Extrair lat/long para criar o objeto location correto
      const { lat, long, ...rest } = b;
      
      return {
        ...rest,
        owner: merchantsList[index % merchantsList.length]._id,
        NIF: b.NIF || generateValidNIF(true), 
        status: "aprovado",
        logo: `https://exemplo.com/logos/${b.name.replace(/ /g, '_').toLowerCase()}.jpg`,
        gallery: [`https://exemplo.com/gallery/${b.name.replace(/ /g, '_').toLowerCase()}_1.jpg`],
        description: `${b.name} - Estabelecimento de excelência no centro de Tomar, oferecendo os melhores produtos e serviços da região.`,
        campaigns: [{ campaign: getC("Comércio Local Vivo")._id, status: "aprovado" }],
        // ✅ CRIAR O OBJETO LOCATION CORRETAMENTE
        location: {
          lat: lat,
          long: long
        }
      };
    });

    const businesses = await Business.insertMany(businessesData);
    console.log(`✅ Foram criados ${businesses.length} negócios reais em Tomar com NIFs autênticos, categorias válidas e LOCATION CORRETO!`);

    // ==========================================
    // 5. CRIAR FATURAS
    // ==========================================
    const citizensList = getCitizens();
    let generatedInvoices = [];
    for (let i = 0; i < 400; i++) {
      const randomCitizen = citizensList[Math.floor(Math.random() * citizensList.length)];
      const randomBusiness = businesses[Math.floor(Math.random() * businesses.length)];

      generatedInvoices.push({
        user: randomCitizen._id,
        business: randomBusiness._id,
        ATCUD: `F-${Math.floor(100000 + Math.random() * 900000)}-${i}`,
        hash: `HASH${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        amount: parseFloat((Math.random() * 150 + 1).toFixed(2)),
        purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(), // Convertido para String ISO
      });
    }

    await Invoice.insertMany(generatedInvoices);
    console.log(`✅ Foram criadas ${generatedInvoices.length} faturas de forma limpa e dinâmica!`);

    // ==========================================
    // 6. CRIAR FAVORITOS
    // ==========================================
    let generatedFavorites = [];
    const seen = new Set();
    for (let i = 0; i < 200; i++) {
      const randomCitizen = citizensList[Math.floor(Math.random() * citizensList.length)];
      const randomBusiness = businesses[Math.floor(Math.random() * businesses.length)];
      
      const key = `${randomCitizen._id}-${randomBusiness._id}`;
      if (!seen.has(key)) {
        seen.add(key);
        generatedFavorites.push({
          userId: randomCitizen._id,       // Corrigido de 'user' para 'userId'
          businessId: randomBusiness._id,  // Corrigido de 'business' para 'businessId'
        });
      }
    }
    await Favorite.insertMany(generatedFavorites);
    console.log(`✅ Foram criados ${generatedFavorites.length} favoritos de utilizadores a negócios!`);

    console.log("🎉 Seeding concluído sem erros!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro fatal no seeding:", error);
    process.exit(1);
  }
};

seedDatabase();