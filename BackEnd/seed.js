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
 * Gera NIFs matematicamente válidos (fallback).
 * @param {boolean} isCompany - Se true, começa por 5. Se false, 1, 2 ou 3.
 */
const generateValidNIF = (isCompany = false) => {
  const prefix = isCompany ? "5" : ["1", "2", "3"][Math.floor(Math.random() * 3)];
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

/**
 * Helper para criar um utilizador completo e coerente com o UserSchema.
 * Garante que isVerified está sempre definido (required: true no schema).
 */
const buildUser = (overrides = {}) => ({
  name: "Sem Nome",
  email: "",
  password: "",
  city: "Tomar",
  role: "cidadao",
  Points: 0,
  NIF: null,
  Avatar: "",
  acceptedInvoiceTerms: true,
  codigoValidar: "",
  isVerified: true,
  ...overrides,
});

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

    const processCaeCSV = async () => {
      const filePath = path.join(process.cwd(), "csvFiles", "caes.csv");

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
        console.warn(`⚠️ Nenhum CAE mapeado. A usar fallback...`);
        await Cae.insertMany(fallbackCaes);
        console.log(`✅ ${fallbackCaes.length} CAEs de fallback inseridos.`);
      }
    };

    const processCitiesCSV = async () => {
      const filePath = path.join(process.cwd(), "csvFiles", "cities.csv");
      if (!fs.existsSync(filePath)) return console.warn(`⚠️ cities.csv não encontrado.`);

      const results = [];
      console.log(`⏳ A ler e filtrar cities.csv...`);

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => {
            if (data.name && data.state_name && data.country_name) {
              results.push({
                name: data.name,
                state_name: data.state_name,
                country_name: data.country_name,
              });
            }
          })
          .on("end", resolve)
          .on("error", reject);
      });

      if (results.length > 0) {
        const batchSize = 5000;
        let insertedCount = 0;

        for (let i = 0; i < results.length; i += batchSize) {
          const batch = results.slice(i, i + batchSize);
          try {
            await CitiesAndCountries.insertMany(batch, { ordered: false });
            insertedCount += batch.length;
          } catch (err) {
            if (err.insertedCount) insertedCount += err.insertedCount;
          }
        }
        console.log(`✅ ${insertedCount} Cidades inseridas.`);
      } else {
        console.warn(`⚠️ Nenhuma cidade válida encontrada no CSV.`);
      }
    };

    await processCaeCSV();
    await processCitiesCSV();

    // ==========================================
    // 2. CRIAR UTILIZADORES
    // ==========================================
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("123456", saltRounds);

    // ------------------------------------------
    // 🔑 CONTAS DEMO — fáceis de escrever
    // Password universal: 123456
    // ------------------------------------------
    const demoUsers = [
      buildUser({
        name: "Câmara Municipal de Tomar",
        email: "camara@tomar.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "camara",
        NIF: 506415082,
      }),
      buildUser({
        name: "Admin Demo",
        email: "admin@tomar.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "camara",
        NIF: generateValidNIF(true),
      }),
      buildUser({
        name: "Cidadão Demo",
        email: "cidadao@tomar.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "cidadao",
        Points: 850,
        NIF: generateValidNIF(false),
      }),
      buildUser({
        name: "Comerciante Demo",
        email: "comerciante@tomar.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "comerciante",
        NIF: generateValidNIF(false),
      }),
      buildUser({
        name: "Turista Demo",
        email: "turista@tomar.pt",
        password: hashedPassword,
        city: "Madrid",
        role: "cidadao",
        Points: 120,
        NIF: generateValidNIF(false),
      }),
    ];

    // Cidades portuguesas
    const portugueseCities = [
      "Lisboa", "Porto", "Coimbra", "Braga", "Aveiro", "Faro", "Viseu", "Leiria",
      "Setúbal", "Évora", "Guarda", "Castelo Branco", "Portalegre", "Santarém",
      "Vila Real", "Bragança", "Viana do Castelo", "Ponta Delgada", "Funchal",
      "Almada", "Amadora", "Queluz", "Odivelas", "Loures", "Oeiras", "Cascais",
      "Sintra", "Albufeira", "Portimão", "Lagos", "Olhão", "Tavira", "Silves",
      "Loulé", "Vila do Conde", "Póvoa de Varzim", "Guimarães", "Vizela", "Fafe",
      "Barcelos", "Esposende", "Paredes", "Penafiel", "Lamego", "Mirandela",
      "Chaves", "Valença", "Monção",
    ];

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
      { city: "São Paulo", country: "Brasil" },
      { city: "Rio de Janeiro", country: "Brasil" },
      { city: "Salvador", country: "Brasil" },
      { city: "Brasília", country: "Brasil" },
      { city: "Belo Horizonte", country: "Brasil" },
      { city: "Curitiba", country: "Brasil" },
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

    const portugueseFirstNames = [
      "João", "Maria", "António", "Ana", "Carlos", "Sofia", "Miguel", "Mariana",
      "Pedro", "Rita", "Rui", "Inês", "Tiago", "Catarina", "Bruno", "Francisco",
      "Beatriz", "Duarte", "Margarida", "Gonçalo", "Leonor", "Martim", "Matilde",
      "Afonso", "Carolina", "Tomás", "Francisca", "Rodrigo", "Sara", "Diogo",
      "Laura", "Gabriel", "Alice", "Vicente", "Salvador", "Camila", "Bernardo",
      "Clara", "Lourenço", "Marta", "Simão", "Nuno", "Júlia", "Rafael", "David",
      "Lara", "André", "Cristiana", "Luís", "Patrícia",
    ];

    const portugueseLastNames = [
      "Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues",
      "Martins", "Sousa", "Fernandes", "Gonçalves", "Gomes", "Lopes", "Marques",
      "Alves", "Pinto", "Carvalho", "Ribeiro", "Moreira", "Mendes", "Soares",
      "Nunes", "Dias", "Correia", "Machado", "Antunes", "Coelho", "Vieira",
      "Teixeira", "Monteiro", "Ramos", "Henriques", "Cardoso", "Campos", "Vaz",
      "Freitas", "Araújo", "Neves", "Pires", "Cunha", "Moura", "Fonseca",
      "Tavares", "Baptista", "Barbosa", "Miranda", "Azevedo", "Mota",
    ];

    const internationalNames = [
      { first: "James", last: "Smith" }, { first: "Emma", last: "Johnson" },
      { first: "Lucas", last: "Garcia" }, { first: "Sophie", last: "Martin" },
      { first: "Luca", last: "Rossi" }, { first: "Anna", last: "Muller" },
      { first: "Pedro", last: "Silva" }, { first: "Yuki", last: "Tanaka" },
      { first: "Minjun", last: "Kim" }, { first: "Liam", last: "OBrien" },
      { first: "Olivia", last: "Brown" }, { first: "Noah", last: "Wilson" },
      { first: "Amelia", last: "Taylor" }, { first: "Hugo", last: "Dubois" },
      { first: "Eva", last: "vanDijk" }, { first: "Erik", last: "Andersson" },
      { first: "Sofia", last: "Nielsen" }, { first: "Mateo", last: "Lopez" },
      { first: "Valentina", last: "Rodriguez" },
    ];

    // Cidadãos portugueses (150)
    const portugueseCitizens = [];
    for (let i = 0; i < 150; i++) {
      const firstName = portugueseFirstNames[Math.floor(Math.random() * portugueseFirstNames.length)];
      const lastName = portugueseLastNames[Math.floor(Math.random() * portugueseLastNames.length)];
      const city = portugueseCities[Math.floor(Math.random() * portugueseCities.length)];

      const cleanFirst = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cleanLast = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      portugueseCitizens.push(
        buildUser({
          name: `${firstName} ${lastName}`,
          email: `${cleanFirst}.${cleanLast}${i}@mail.pt`,
          password: hashedPassword,
          city,
          role: "cidadao",
          Points: Math.floor(Math.random() * 1200),
          NIF: generateValidNIF(false),
        })
      );
    }

    // Cidadãos internacionais (100)
    const internationalCitizens = [];
    for (let i = 0; i < 100; i++) {
      const nameData = internationalNames[Math.floor(Math.random() * internationalNames.length)];
      const location = internationalCities[Math.floor(Math.random() * internationalCities.length)];

      internationalCitizens.push(
        buildUser({
          name: `${nameData.first} ${nameData.last}`,
          email: `${nameData.first.toLowerCase()}.${nameData.last.toLowerCase()}${i}@globalmail.com`,
          password: hashedPassword,
          city: location.city,
          role: "cidadao",
          Points: Math.floor(Math.random() * 1200),
          NIF: generateValidNIF(false),
        })
      );
    }

    // Comerciantes de outras cidades (20)
    const merchantsOtherCities = [];
    const merchantCities = ["Lisboa", "Porto", "Coimbra", "Braga", "Aveiro", "Faro", "Leiria", "Viseu"];
    for (let i = 0; i < 20; i++) {
      const firstName = portugueseFirstNames[Math.floor(Math.random() * portugueseFirstNames.length)];
      const lastName = portugueseLastNames[Math.floor(Math.random() * portugueseLastNames.length)];
      const city = merchantCities[Math.floor(Math.random() * merchantCities.length)];

      const cleanCity = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cleanFirst = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cleanLast = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      merchantsOtherCities.push(
        buildUser({
          name: `${firstName} ${lastName}`,
          email: `${cleanFirst}.${cleanLast}${i}@comercio-${cleanCity}.pt`,
          password: hashedPassword,
          city,
          role: "comerciante",
          NIF: generateValidNIF(false),
        })
      );
    }

    // Comerciantes de Tomar
    const merchantNamesTomar = [
      "João Silva", "Maria Fernandes", "António Costa", "Ana Pereira", "Carlos Santos",
      "Sofia Rodrigues", "Miguel Oliveira", "Mariana Gomes", "Pedro Martins", "Rita Ferreira",
      "Rui Almeida", "Inês Carvalho", "Tiago Mendes", "Catarina Lopes", "Bruno Pinto",
      "Francisco Nunes", "Beatriz Leal", "Duarte Marques", "Margarida Pinto", "Gonçalo Silva",
    ];

    const merchantsTomar = merchantNamesTomar.map((name, i) => {
      const cleanEmail = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ /g, ".");

      return buildUser({
        name,
        email: `${cleanEmail}${i}@comercio-tomar.pt`,
        password: hashedPassword,
        city: "Tomar",
        role: "comerciante",
        NIF: generateValidNIF(false),
      });
    });

    const allUsers = [
      ...demoUsers,
      ...merchantsTomar,
      ...merchantsOtherCities,
      ...portugueseCitizens,
      ...internationalCitizens,
    ];

    const users = await User.insertMany(allUsers);
    console.log(`✅ Criados ${users.length} utilizadores.`);
    console.log(`   🔑 ${demoUsers.length} contas demo (admin@tomar.pt, cidadao@tomar.pt, comerciante@tomar.pt, turista@tomar.pt, camara@tomar.pt — password: 123456)`);
    console.log(`   🇵🇹 ${portugueseCitizens.length} cidadãos PT | 🌍 ${internationalCitizens.length} internacionais | 🏪 ${merchantsTomar.length + merchantsOtherCities.length} comerciantes`);

    const getU = (email) => users.find((u) => u.email === email);
    const getCitizens = () => users.filter((u) => u.role === "cidadao" || u.role === "camara");
    const getMerchants = () => users.filter((u) => u.role === "comerciante");

    // ==========================================
    // 3. CRIAR CAMPANHAS
    // ==========================================
    const campaignsData = [
      {
        createdBy: getU("camara@tomar.pt")._id,
        titulo: "Comércio Local Vivo",
        slogan: "Apoie os pequenos negócios do centro histórico.",
        descricao: "Compre nas lojas locais de Tomar e ganhe pontos.",
        listaCAES: ["56101", "56102", "56301", "56302", "47111", "47730", "10712"],
        estado: "ativa",
        DataInicio: new Date("2026-03-01"),
        DataExpiracao: new Date("2026-09-30"),
        logo: "https://exemplo.com/comercio-local.jpg",
        panfleto: "https://exemplo.com/panfleto.pdf",
        normas: "Válido para compras superiores a 1€.",
        packs: [
          { pointsCost: 100, rewardDescription: "Voucher 10€ no Comércio", stock: 50, currentStock: 50, maxPerUser: 2 },
          { pointsCost: 250, rewardDescription: "Jantar para 2 pessoas", stock: 20, currentStock: 20, maxPerUser: 1 },
        ],
      },
      {
        createdBy: getU("camara@tomar.pt")._id,
        titulo: "Tomar Sustentável",
        slogan: "Reduza a pegada ecológica e seja recompensado.",
        descricao: "Incentivo à utilização de transportes suaves e compras em mercados locais.",
        listaCAES: ["47111", "10711", "10712"],
        estado: "ativa",
        DataInicio: new Date("2026-05-01"),
        DataExpiracao: new Date("2026-12-31"),
        logo: "https://exemplo.com/tomar-sustentavel.jpg",
        panfleto: "https://exemplo.com/panfleto_sust.pdf",
        normas: "Acumulação de pontos em mercados municipais.",
        packs: [
          { pointsCost: 50, rewardDescription: "Saco reutilizável Tomar", stock: 100, currentStock: 100, maxPerUser: 3 },
          { pointsCost: 500, rewardDescription: "Bicicleta elétrica por 1 dia", stock: 10, currentStock: 10, maxPerUser: 1 },
        ],
      },
    ];

    const insertedCampaigns = await Campaign.insertMany(campaignsData);
    console.log(`✅ ${insertedCampaigns.length} Campanhas criadas.`);

    // ==========================================
    // 4. CRIAR NEGÓCIOS REAIS EM TOMAR
    // ==========================================
    
    // ==========================================
    // 4. CRIAR NEGÓCIOS REAIS EM TOMAR
    // ==========================================
    
    const realTomarBusinesses = [
      {
        name: "Café Paraíso",
        description: "Um dos cafés mais emblemáticos e históricos de Tomar, fundado em 1911. (Corredoura)",
        category: "Cafés & Pastelarias",
        listaCAES: ["56302"],
        location: { long: -8.413900, lat: 39.604000 }, // Corrigido
        status: "aprovado",
      },
      {
        name: "Taverna Antiqua",
        description: "Restaurante temático medieval localizado na Praça da República.",
        category: "Restauração",
        listaCAES: ["56101"],
        location: { long: -8.415400, lat: 39.603800 }, // Corrigido
        status: "aprovado",
      },
      {
        name: "Pastelaria Templária",
        description: "Famosa pelos doces conventuais, especialmente as Fatias de Tomar e os Beija-me Depressa.",
        category: "Cafés & Pastelarias",
        listaCAES: ["10712"],
        location: { long: -8.413200, lat: 39.605100 }, // Rua 10 de Agosto
        status: "aprovado",
      },
      {
        name: "Hotel dos Templários",
        description: "O maior e mais prestigiado hotel da cidade, localizado junto à margem do rio e ao Parque do Mouchão.",
        category: "Alojamento",
        listaCAES: ["55101"],
        location: { long: -8.413600, lat: 39.607000 }, // Corrigido (Largo Cândido dos Reis)
        status: "aprovado",
      },
      {
        name: "Restaurante Chico Elias",
        description: "Gastronomia tradicional portuguesa e ribatejana de excelência. (Localizado em Algarvias)",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.423985, lat: 39.610996 }, // Correto para Algarvias
        status: "aprovado",
      },
      {
        name: "Tasca O Perdigoto", // Nome Corrigido
        description: "Tasca típica famosa pelos petiscos, choco frito e ambiente tradicional. Fica na Rua Sacadura Cabral.",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.413800, lat: 39.603800 }, // Corrigido
        status: "aprovado",
      },
      {
        name: "Restaurante O Tabuleiro",
        description: "Restaurante clássico na Rua Serpa Pinto (Corredoura).",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.414400, lat: 39.603400 },
        status: "aprovado",
      },
      {
        name: "Restaurante A Brasinha",
        description: "Especialistas em carnes grelhadas e pratos tradicionais.",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.415200, lat: 39.601800 }, // Corrigido
        status: "aprovado",
      },
      {
        name: "Tasquinha da Mitas",
        description: "Ambiente acolhedor e familiar no centro de Tomar.",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.414800, lat: 39.603800 }, // Corrigido
        status: "aprovado",
      },
      {
        name: "Restaurante Jardim",
        description: "Comida deliciosa e esplanada agradável na Rua Silva Magalhães.",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.414900, lat: 39.603900 },
        status: "aprovado",
      },
      {
        name: "Restaurante Nabão",
        description: "Pratos tradicionais portugueses num espaço acolhedor, junto à Ponte Velha.",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.410500, lat: 39.604800 },
        status: "aprovado",
      },
      {
        name: "Moinho dos Nabões", // Substituiu Restaurante Bela Vista
        description: "Instalado num antigo moinho de água sobre o rio Nabão, oferece uma das melhores vistas de Tomar.",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.413500, lat: 39.607800 }, 
        status: "aprovado",
      },
      {
        name: "Casa das Ratas",
        description: "Adega e restaurante rústico centenário, famoso pelas especialidades no forno.",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.414800, lat: 39.602500 }, // Corrigido
        status: "aprovado",
      },
      {
        name: "Restaurante Lombo", // Substituiu a Cervejaria Ermida
        description: "Restaurante com grande tradição e pratos muito bem servidos, excelente para famílias.",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.412100, lat: 39.603100 }, 
        status: "aprovado",
      },
      {
        name: "Farmácia Silva Magalhães",
        description: "Farmácia histórica com fachada e interior preservados do séc. XIX.",
        category: "Serviços",
        listaCAES: ["47730"],
        location: { long: -8.415000, lat: 39.603200 },
        status: "aprovado",
      },
      {
        name: "Pingo Doce Tomar - Coimbra", // Corrigido o nome
        description: "Supermercado localizado na Rua de Coimbra, a norte do centro histórico.", // Descrição Corrigida
        category: "Comércio Local",
        listaCAES: ["47111"],
        location: { long: -8.407000, lat: 39.611200 }, // Corrigido
        status: "aprovado",
      },
      {
        name: "Continente Modelo Tomar",
        description: "Grande superfície comercial localizada na Avenida Dr. Aurélio Ribeiro.",
        category: "Comércio Local",
        listaCAES: ["47111"],
        location: { long: -8.403200, lat: 39.610900 }, // Corrigido
        status: "aprovado",
      },
      {
        name: "McDonald's Tomar",
        description: "Restaurante de fast-food na zona de Santa Iria.",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.405500, lat: 39.608100 },
        status: "aprovado",
      },
      {
        name: "Burger King Tomar",
        description: "Restaurante de fast-food com Drive-Thru junto à zona comercial (Av. Dr. Aurélio Ribeiro).", // Descrição Corrigida
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.403200, lat: 39.610900 }, // Corrigido
        status: "aprovado",
      },
      {
        name: "Thomar Boutique Hotel",
        description: "Alojamento com decoração inspirada na história da cidade, localizado na Rua de Santa Iria.",
        category: "Alojamento",
        listaCAES: ["55102"],
        location: { long: -8.411500, lat: 39.604100 }, // Corrigido
        status: "aprovado",
      },
      {
        name: "Restaurante Marisqueira de Tomar",
        description: "A melhor seleção de mariscos frescos e peixe na região.",
        category: "Restauração",
        listaCAES: ["56102"],
        location: { long: -8.413100, lat: 39.606100 },
        status: "aprovado",
      },
      {
        name: "Livraria Nova",
        description: "Comércio independente de livros e materiais de papelaria localizado na Corredoura.",
        category: "Comércio Local", 
        listaCAES: ["47111"],
        location: { long: -8.414300, lat: 39.603600 },
        status: "aprovado",
      }
    ];

    // Mapear os comerciantes gerados acima aos negócios de Tomar
    const merchantsInTomar = getMerchants().filter(u => u.email.includes("comercio-tomar"));
    
    const finalBusinesses = realTomarBusinesses.map((biz, index) => {
      // Atribui os negócios aos primeiros comerciantes criados. 
      // Se houver mais negócios que comerciantes, recomeça (modulo).
      const owner = merchantsInTomar[index % merchantsInTomar.length];
      
      return {
        ...biz,
        owner: owner._id,
        campaigns: [
          {
            campaign: insertedCampaigns[0]._id, // Adere automaticamente à primeira campanha
            status: "aprovado",
            joinedAt: new Date()
          }
        ],
        NIF: owner.NIF || generateValidNIF(true),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await Business.insertMany(finalBusinesses);
    console.log(`✅ ${finalBusinesses.length} Negócios reais criados no mapa de Tomar.`);

    // ==========================================
    // FIM DO SEED
    // ==========================================
    console.log("🌳 Base de dados semeada com sucesso! Podes iniciar a API.");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Erro fatal no seeding:", error);
    process.exit(1);
  }
};

seedDatabase();