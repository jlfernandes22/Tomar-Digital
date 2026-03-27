import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User.js";
import Business from "./models/Business.js";
import Campaign from "./models/Campaign.js";
import Invoice from "./models/Invoice.js";
import Favorite from "./models/Favorite.js";

const MONGO_URI = "mongodb://localhost:27017/tomar_db";

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🌱 Ligado ao MongoDB. A iniciar o seeding massivo...");

    // Limpeza
    await User.deleteMany();
    await Business.deleteMany();
    await Campaign.deleteMany();
    await Invoice.deleteMany();
    await Favorite.deleteMany();
    console.log("🗑️ Dados antigos apagados.");

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("123456", saltRounds);

    // ==========================================
    // 1. CRIAR UTILIZADORES
    // ==========================================
    const usersData = [
      // --- Entidades e Comerciantes ---
      {
        name: "Câmara Municipal",
        email: "geral@cm-tomar.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "camara",
        Points: 0,
        NIF: 501140042,
      },
      {
        name: "Dona Maria Pastelaria",
        email: "estrelas@comercio.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "comerciante",
        Points: 0,
        NIF: 501234567,
      },
      {
        name: "João Templário",
        email: "taverna@comercio.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "comerciante",
        Points: 0,
        NIF: 509876543,
      },
      {
        name: "Direção Convento",
        email: "convento@patrimonio.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "comerciante",
        Points: 0,
        NIF: 505555555,
      },
      {
        name: "Rui Farmacêutico",
        email: "farmacia@comercio.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "comerciante",
        Points: 0,
        NIF: 502222222,
      },
      {
        name: "Sofia Artesã",
        email: "artesanato@comercio.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "comerciante",
        Points: 0,
        NIF: 503333333,
      },

      // --- Cidadãos (Com pontos baseados no histórico de compras abaixo) ---
      // Nuno gastou: 45.50 + 8.20 = 53 pontos
      {
        name: "Nuno Cidadão",
        email: "nuno@cidadao.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "cidadao",
        Points: 53,
        NIF: 234567890,
      },
      // Ana gastou: 12.00 + 10.50 = 22 pontos
      {
        name: "Ana Nabão",
        email: "ana@cidadao.pt",
        password: hashedPassword,
        city: "Tomar",
        role: "cidadao",
        Points: 22,
        NIF: 298765432,
      },
      // Carlos gastou: 105.00 = 105 pontos
      {
        name: "Carlos Visitante",
        email: "carlos@cidadao.pt",
        password: hashedPassword,
        city: "Entroncamento",
        role: "cidadao",
        Points: 105,
        NIF: 211111111,
      },
      // Beatriz gastou: 5.50 = 5 pontos
      {
        name: "Beatriz Turista",
        email: "beatriz@cidadao.pt",
        password: hashedPassword,
        city: "Ourém",
        role: "cidadao",
        Points: 5,
        NIF: 222222222,
      },
      // Diogo gastou: 50.00 = 50 pontos
      {
        name: "Diogo Estudante",
        email: "diogo@cidadao.pt",
        password: hashedPassword,
        city: "Ferreira do Zêzere",
        role: "cidadao",
        Points: 50,
        NIF: 233333333,
      },
      // Rui gastou: 15.20 = 15 pontos
      {
        name: "Rui Norte",
        email: "rui@cidadao.pt",
        password: hashedPassword,
        city: "Porto",
        role: "cidadao",
        Points: 15,
        NIF: 244444444,
      },
      // Marta não tem compras
      {
        name: "Marta Capital",
        email: "marta@cidadao.pt",
        password: hashedPassword,
        city: "Lisboa",
        role: "cidadao",
        Points: 0,
        NIF: 255555555,
      },
    ];

    const users = await User.insertMany(usersData);

    // Facilitadores para não nos perdermos nos IDs
    const getU = (email) => users.find((u) => u.email === email);
    const camaraUser = getU("geral@cm-tomar.pt");

    // ==========================================
    // 2. CRIAR CAMPANHAS
    // ==========================================
    const campaignsData = [
      {
        createdBy: camaraUser._id,
        title: "Rota Templária 2026",
        description:
          "Explore o património de Tomar e ganhe recompensas únicas.",
        expirationDate: new Date("2026-12-31"),
        image: "https://exemplo.com/castelo.jpg",
        packs: [
          {
            pointsCost: 50,
            rewardDescription: "Entrada Grátis no Convento",
            stock: 100,
          },
          { pointsCost: 20, rewardDescription: "Pin Oficial", stock: 500 },
        ],
      },
      {
        createdBy: camaraUser._id,
        title: "Comércio Local Vivo",
        description: "Apoie os pequenos negócios do centro histórico.",
        expirationDate: new Date("2026-09-30"),
        image: "https://exemplo.com/comercio.jpg",
        packs: [
          {
            pointsCost: 30,
            rewardDescription: "Saco Reutilizável de Tomar",
            stock: 200,
          },
          { pointsCost: 100, rewardDescription: "Voucher 10€", stock: 50 },
        ],
      },
    ];

    const campaigns = await Campaign.insertMany(campaignsData);
    const cRota = campaigns[0]._id;
    const cComercio = campaigns[1]._id;

    // ==========================================
    // 3. CRIAR NEGÓCIOS
    // ==========================================
    const businessesData = [
      {
        owner: getU("convento@patrimonio.pt")._id,
        name: "Convento de Cristo",
        category: "Património & Museus",
        location: { lat: 39.6039, long: -8.4194 },
        status: "aprovado",
        NIF: 505555555,
        campaigns: [{ campaign: cRota, status: "aprovado" }],
      },
      {
        owner: getU("taverna@comercio.pt")._id,
        name: "Taverna Antiqua",
        category: "Restauração",
        location: { lat: 39.6032, long: -8.4145 },
        status: "aprovado",
        NIF: 509876543,
        campaigns: [
          { campaign: cRota, status: "aprovado" },
          { campaign: cComercio, status: "aprovado" },
        ],
      },
      {
        owner: getU("estrelas@comercio.pt")._id,
        name: "Pastelaria Estrelas",
        category: "Cafés & Pastelarias",
        location: { lat: 39.6025, long: -8.415 },
        status: "aprovado",
        NIF: 501234567,
        campaigns: [{ campaign: cComercio, status: "aprovado" }],
      },
      {
        owner: getU("farmacia@comercio.pt")._id,
        name: "Farmácia Central",
        category: "Serviços",
        location: { lat: 39.6028, long: -8.4148 },
        status: "aprovado",
        NIF: 502222222,
        campaigns: [{ campaign: cComercio, status: "aprovado" }],
      },
      {
        owner: getU("artesanato@comercio.pt")._id,
        name: "Artesanato Templário",
        category: "Comércio Local",
        location: { lat: 39.6035, long: -8.4142 },
        status: "aprovado",
        NIF: 503333333,
        campaigns: [{ campaign: cComercio, status: "aprovado" }],
      },
      {
        owner: getU("taverna@comercio.pt")._id,
        name: "Restaurante Lúria",
        category: "Restauração",
        location: { lat: 39.61, long: -8.41 },
        status: "aprovado",
        NIF: 509876543,
        campaigns: [{ campaign: cComercio, status: "aprovado" }],
      },
      {
        owner: camaraUser._id,
        name: "Sinagoga de Tomar",
        category: "Património & Museus",
        location: { lat: 39.603, long: -8.414 },
        status: "aprovado",
        NIF: 501140042,
        campaigns: [{ campaign: cRota, status: "aprovado" }],
      },
      // Pendente para a Dashboard
      {
        owner: getU("estrelas@comercio.pt")._id,
        name: "Alojamento Estrelas",
        category: "Alojamento",
        location: { lat: 39.605, long: -8.412 },
        status: "pendente",
        NIF: 501234567,
        campaigns: [],
      },
    ];

    const businesses = await Business.insertMany(businessesData);
    const getB = (name) => businesses.find((b) => b.name === name);

    // ==========================================
    // 4. CRIAR FATURAS E LIGAR AOS PONTOS
    // ==========================================
    const invoicesData = [
      // Nuno (Ganhou 53 pontos no total)
      {
        user: getU("nuno@cidadao.pt")._id,
        business: getB("Taverna Antiqua")._id,
        ATCUD: "TAV-111",
        hash: "HASH111",
        amount: 45.5,
        purchaseDate: "2026-05-10",
      },
      {
        user: getU("nuno@cidadao.pt")._id,
        business: getB("Pastelaria Estrelas")._id,
        ATCUD: "PAS-222",
        hash: "HASH222",
        amount: 8.2,
        purchaseDate: "2026-05-11",
      },

      // Ana (Ganhou 22 pontos)
      {
        user: getU("ana@cidadao.pt")._id,
        business: getB("Convento de Cristo")._id,
        ATCUD: "CON-333",
        hash: "HASH333",
        amount: 12.0,
        purchaseDate: "2026-05-12",
      },
      {
        user: getU("ana@cidadao.pt")._id,
        business: getB("Farmácia Central")._id,
        ATCUD: "FAR-444",
        hash: "HASH444",
        amount: 10.5,
        purchaseDate: "2026-05-13",
      },

      // Carlos (Ganhou 105 pontos num jantar de grupo)
      {
        user: getU("carlos@cidadao.pt")._id,
        business: getB("Restaurante Lúria")._id,
        ATCUD: "LUR-555",
        hash: "HASH555",
        amount: 105.0,
        purchaseDate: "2026-05-14",
      },

      // Beatriz (Ganhou 5 pontos)
      {
        user: getU("beatriz@cidadao.pt")._id,
        business: getB("Pastelaria Estrelas")._id,
        ATCUD: "PAS-666",
        hash: "HASH666",
        amount: 5.5,
        purchaseDate: "2026-05-15",
      },

      // Diogo (Ganhou 50 pontos)
      {
        user: getU("diogo@cidadao.pt")._id,
        business: getB("Taverna Antiqua")._id,
        ATCUD: "TAV-777",
        hash: "HASH777",
        amount: 50.0,
        purchaseDate: "2026-05-16",
      },

      // Rui (Ganhou 15 pontos)
      {
        user: getU("rui@cidadao.pt")._id,
        business: getB("Artesanato Templário")._id,
        ATCUD: "ART-888",
        hash: "HASH888",
        amount: 15.2,
        purchaseDate: "2026-05-17",
      },
    ];

    await Invoice.insertMany(invoicesData);

    // ==========================================
    // 5. AUDITORIA NO TERMINAL
    // ==========================================
    console.log("\n📊 RESUMO DE ATRIBUIÇÃO DE PONTOS POR UTILIZADOR:");
    const relatorio = usersData
      .filter((u) => u.role === "cidadao")
      .map((u) => {
        // Encontra todas as faturas deste utilizador simulado
        const faturasUser = invoicesData.filter(
          (inv) => inv.user.toString() === getU(u.email)._id.toString(),
        );
        const lojasVisitadas = faturasUser
          .map(
            (inv) =>
              businesses.find(
                (b) => b._id.toString() === inv.business.toString(),
              ).name,
          )
          .join(", ");
        const totalGasto = faturasUser.reduce(
          (acc, curr) => acc + curr.amount,
          0,
        );

        return {
          Nome: u.name,
          Cidade: u.city,
          "Lojas Visitadas": lojasVisitadas || "Nenhuma",
          "Total Gasto (€)": totalGasto.toFixed(2),
          "Pontos na App": u.Points,
        };
      });

    console.table(relatorio);
    console.log(
      "\n✅ SEEDING CONCLUÍDO COM SUCESSO! A economia está cheia de dados.",
    );
    process.exit();
  } catch (error) {
    console.error("❌ Erro durante o seeding:", error);
    process.exit(1);
  }
};

seedDatabase();
