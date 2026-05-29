import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Business from "./models/Business.js";
import Favorite from "./models/Favorite.js";
import { authorize } from "./middleware/auth.js";
import Campaign from "./models/Campaign.js";
import Cae from "./models/Cae.js";
import "dotenv/config";
import Invoice from "./models/Invoice.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import sharp from "sharp";
import PedidosComerciante from "./models/PedidosComerciante.js";
import Tesseract from 'tesseract.js';
import CitiesAndCountries from "./models/CitiesAndCountries.js"
import CitiesAncCountries from "./models/CitiesAndCountries.js";
import { DocumentAnalysisClient, AzureKeyCredential } from "@azure/ai-form-recognizer";

// ============================================================================
// 1. CONFIGURAÇÃO BASE DO SERVIDOR E MIDDLEWARES
// ============================================================================
const SECRET_KEY = process.env.JWT_SECRET;
const app = express();
import nodemailer from "nodemailer";

const SECRET_KEY = process.env.JWT_SECRET;
const app = express();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tomardigitalsuporte@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD, // The 16-character App Password
  },
});

// Vai procurar a variável MONGO_URI. Se não a encontrar (por exemplo, se te esqueceres do .env), tenta o localhost como plano B
const dbURI = process.env.MONGO_URI || "mongodb://localhost:27017/tomar_db";

app.use(cors());
// Limite de 20mb estabelecido para suportar uploads de PDFs e panfletos de alta resolução
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Torna a pasta 'uploads' pública para que o Front-End possa consumir as imagens e PDFs via URL
app.use('/uploads', express.static('uploads'));

// ============================================================================
// 2. CONFIGURAÇÃO DO MULTER (SISTEMA DE UPLOADS TEMPORÁRIOS)
// ============================================================================
/**
 * O Multer é utilizado aqui apenas como "Ponto de Entrada" (Staging). 
 * Ele guarda os ficheiros originais no disco para que, posteriormente, 
 * o Sharp (imagens) ou os controladores (PDFs) os possam processar e mover.
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let targetFolder = 'uploads/';

    // Encaminhamento dinâmico consoante o MimeType
    if (file.mimetype === 'application/pdf') {
      targetFolder = 'uploads/pdfs/';
    } else if (file.mimetype.startsWith('image/')) {
      targetFolder = 'uploads/imagens/';
    }

    // Garante que a estrutura de pastas existe no servidor antes de gravar
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    cb(null, targetFolder);
  },
  filename: function (req, file, cb) {
    // Prevenção de colisões: Timestamp + Randomização para nomes únicos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
const uploadParaMemoria = multer({ storage: multer.memoryStorage() });

// ============================================================================
// 3. CONEXÃO À BASE DE DADOS
// ============================================================================
mongoose
  .connect(dbURI)
  .then(() => console.log("Conectado a Base de Dados com sucesso!"))
  .catch((err) => console.error("Erro na Base de Dados: ", err));

// ============================================================================
// 4. ROTAS DE AUTENTICAÇÃO E GESTÃO DE UTILIZADORES
// ============================================================================



//////////////////////////////////////////////////
//Registar utilizador teste para usar no postman//
//////////////////////////////////////////////////
//app.post("/registar-teste", async (req, res) => {
//  console.log("Recebido pedido do Postman para registo de teste:", req.body);
//
//  // Retiramos o confirmPassword para ser mais rápido escrever o JSON no Postman
//  const { name, email, password, city, role } = req.body;
//
//  try {
//    // Verificar se já existe
//    const user = await User.findOne({ email: email });
//    if (user) {
//      return res
//        .status(400)
//        .json({ message: "Este utilizador de teste já existe" });
//    }
//
//    const salt = 10;
//    const hashedPassword = await bcrypt.hash(password, salt);
//
//    // Definir utilizador com password em hash
//    const newUser = new User({
//      name: name || "Utilizador de Teste", // Se não enviares nome, ele assume este
//      email: email,
//      password: hashedPassword,
//      role: role,
//      city: city || "Tomar", // Se não enviares cidade, ele assume Tomar
//    });
//
//    await newUser.save();
//    res.status(201).json({
//      message: "Utilizador de teste criado com sucesso via Postman!",
//      dados: { email: newUser.email, name: newUser.name },
//    });
//  } catch (err) {
//    console.error("Erro na criação via Postman:", err);
//    res.status(500).json({ message: "Erro ao criar conta de teste" });
//  }
//});

////////////////////////
//Upload de Imagem

app.post('/uploadImage', uploadParaMemoria.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }

    if (!req.file.buffer) {
      console.error("Erro: O Multer recebeu o ficheiro mas o buffer está vazio. Verifica a configuração do memoryStorage.");
      return res.status(500).json({ error: 'Erro interno ao ler os dados da imagem.' });
    }

    const webpBuffer = await sharp(req.file.buffer)
      .resize({ width: 800 }) 
      .toFormat('webp')
      .webp({ quality: 80 })  
      .toBuffer();

    const novaImagem = new Image({
      nomeOriginal: req.file.originalname,
      dados: webpBuffer,         
      contentType: 'image/webp'  
    });


    await novaImagem.save();

    res.status(201).json({ 
      message: 'Imagem guardada com sucesso!', 
      id: novaImagem._id 
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao processar imagem.' });
  }
});

////////////////////////
// Mostrar Imagem
app.get('/mostrarImagem/:id', async (req, res) => {
  try {
    let imagem = await Image.findById(req.params.id);

    
    if (!imagem) {
      return res.status(404).json({ error: 'Imagem não encontrada .' });
    }

    res.set('Content-Type', imagem.contentType);
    res.send(imagem.dados);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao procurar imagem.' });
  }
});


//////////////////////
//Registar utilizador
app.post("/registar", async (req, res) => {
  try {
    const { email, password, city ,name} = req.body;

    // 1. Crie o código AQUI, antes de tentar enviar o e-mail
    const code = Math.floor(100000 + Math.random() * 900000).toString(); 

    // 2. Guarde o código no objeto do novo utilizador (certifique-se que o seu Model User tem este campo)
    const newUser = new User({ 
      name,  
      email, 
        password: await bcrypt.hash(password, 10), 
        city,
        codigoValidar: code, 
        isVerified: false 
    });
    
    await newUser.save();

    // 3. Agora a variável 'code' existe e pode ser usada
    await transporter.sendMail({
        from: '"Suporte Tomar+Digital" <tomardigitalsuporte@gmail.com>',
        to: email,
        subject: 'Confirme a sua conta',
        html: `<p>O seu código de validação é: <strong>${code}</strong></p>`
    });

    // 4. Resposta única e final
    return res.status(201).json({ message: "Utilizador criado! Verifique o e-mail." });

  } catch (error) {
    console.error("Erro no registo:", error);
    
    // Proteção contra o erro ERR_HTTP_HEADERS_SENT
    if (!res.headersSent) {
        return res.status(500).json({ message: "Erro ao registar utilizador" });
    }
  }
});

    // 4. Verificação de Intenção do Utilizador
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Palavra-passe não coincide" });
    }

    // 5. Cifragem (Hashing) com custo algorítmico 10 (Equilíbrio entre segurança e performance)
    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: email, // Por omissão, o nome assume o email até o utilizador editar o perfil
      email: email,
      password: hashedPassword,
      city: city,
    });

    await newUser.save();
    res.status(201).json({ message: "Utilizador criado com sucesso" });
  } catch (err) {
    console.error("Erro no registo: ", err);
    res.status(400).json({ message: "Erro ao criar conta" });
app.post("/verificar-codigo", async (req, res) => {
 

  const { email, code } = req.body;
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(400).json({ message: "Utilizador não encontrado." });
  }

  if (user.codigoValidar !== code) {
    return res.status(400).json({ message: "Código inválido." });
  }

  user.isVerified = true;
  user.codigoValidar = null;
  await user.save();

  return res.status(200).json({ message: "Conta validada com sucesso!" });
});


/**
 * @swagger
 * /iniciarSessao:
 *   post:
 *     summary: Iniciar sessão
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem sucedido
 *       400:
 *         description: Credenciais inválidas
 */
app.post("/iniciarSessao", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: "Conta não existe" });
    }

    // Comparação do Hash guardado com a password em plain-text inserida
    const rightPassword = await bcrypt.compare(password, user.password);
    if (!rightPassword) {
      return res.status(400).json({ message: "Palavra-passe errada" });
    }

    // Geração do JsonWebToken (JWT) com os dados não-sensíveis do utilizador no Payload
    const token = jwt.sign(
      { id: user._id, role: user.role, acceptedInvoiceTerms: user.acceptedInvoiceTerms },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      token,
      userId: user._id,
      user: {
        name: user.name,
        email: user.email,
        Points: user.Points,
        role: user.role,
        city: user.city,
        NIF: user.NIF,
        acceptedInvoiceTerms: user.acceptedInvoiceTerms,
        Avatar: user.Avatar,
      },
    });
  } catch (err) {
    console.error("Erro ao iniciar sessão: ", err);
    res.status(400).json({ message: "Erro ao iniciar sessão" });
  }
});

/**
 * Endpoint para aceitar ou revogar os termos e condições da fatura.
 */
app.post("/aceitarTermosFatura", authorize(["cidadao", "comerciante", "camara"]), async (req, res) => {
  try {
    const { acceptedInvoiceTerms } = req.body;
    const valueToSet = acceptedInvoiceTerms !== undefined ? acceptedInvoiceTerms : true;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { acceptedInvoiceTerms: valueToSet },
      { returnDocument: 'after' }
    );
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    res.status(200).json({
      message: valueToSet ? "Termos aceites com sucesso." : "Consentimento revogado com sucesso.",
      acceptedInvoiceTerms: valueToSet
    });
  } catch (error) {
    console.error("Erro ao atualizar termos:", error);
    res.status(500).json({ message: "Erro ao atualizar os termos." });
  }
});

/**
 * @swagger
 * /utilizadores:
 *   get:
 *     summary: Obter lista de todos os utilizadores
 *     tags: [Utilizadores]
 *     responses:
 *       200:
 *         description: Lista de utilizadores
 */
app.get("/utilizadores", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ============================================================================
// 5. ROTAS DE GESTÃO DE NEGÓCIOS (B2B / B2C)
// ============================================================================

/**
 * @swagger
 * /utilizador/{id}:
 *   get:
 *     summary: Obter donos de negócios com status pendente
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de donos encontrados
 *       403:
 *         description: Não autorizado
 */
app.get("/utilizador/:id", authorize(["camara"]), async (req, res) => {
  try {
    // 1. Procura negócios não aprovados
    const pendentes = await Business.find({ status: "pendente" });
    const ownerIds = pendentes.map((negocio) => negocio.owner);

    // 2. Mapeia e devolve os utilizadores responsáveis por esses negócios
    const owners = await User.find({ _id: { $in: ownerIds } });
    res.json(owners);
  } catch (error) {
    console.error("Erro ao procurar donos:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

/**
 * @swagger
 * /registarNegocio:
 *   post:
 *     summary: Registar um novo negócio
 *     tags: [Negócios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeNegocio:
 *                 type: string
 *               NIFnegocio:
 *                 type: string
 *               categoriaNegocio:
 *                 type: string
 *               logotipoNegocio:
 *                 type: string
 *               moradaNegocio:
 *                 type: string
 *               freguesiaNegocio:
 *                 type: string
 *               localizacao:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               telefoneDono:
 *                 type: string
 *               emailDono:
 *                 type: string
 *               descricaoNegocio:
 *                 type: string
 *               galeriaFotos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Negócio registado
 */
app.post(
  "/registarNegocio",
  authorize(["comerciante", "camara"]),
  async (req, res) => {
    try {
      const {
        nomeNegocio, NIFnegocio, categoriaNegocio, logotipoNegocio,
        moradaNegocio, freguesiaNegocio, localizacao, telefoneDono,
        emailDono, descricaoNegocio, galeriaFotos, owner
      } = req.body;

      // 1. Validação de campos obrigatórios críticos para a regra de negócio
      if (!nomeNegocio || !categoriaNegocio || !localizacao || !telefoneDono || !emailDono || galeriaFotos.length === 0) {
        return res.status(400).json({
          message: "Dados incompletos (Nome, Categoria, Localização, Telefone e E-mail são obrigatórios).",
        });
      }

      // Determinação de Propriedade: Se for a Câmara a registar em nome de outrem, usa o 'owner' enviado no body.
      const ownerId = req.user.role === "camara" ? owner || req.user.id : req.user.id;

      const existe = await Business.findOne({ nomeNegocio, owner: ownerId });
      if (existe) {
        return res.status(400).json({ message: "Já tens um negócio registado com este nome." });
      }

      const novoNegocio = new Business({
        name: nomeNegocio,
        category: categoriaNegocio,
        NIF: NIFnegocio,
        logo: logotipoNegocio,
        address: moradaNegocio,
        parish: freguesiaNegocio,
        location: {
          lat: Number(localizacao.latitude),
          long: Number(localizacao.longitude),
        },
        phone: telefoneDono,
        email: emailDono,
        description: descricaoNegocio,
        gallery: galeriaFotos,
        owner: ownerId,
        // Bypass de aprovação para ações feitas diretamente por administradores (Câmara)
        status: req.user.role === "camara" ? "aprovado" : "pendente",
        createdAt: new Date(),
      });

      await novoNegocio.save();
      res.status(201).json({ message: "Negocio registado com sucesso!", business: novoNegocio });
    } catch (error) {
      console.error("Erro no registo de negócio:", error);
      res.status(500).json({ message: "Erro interno ao guardar o negócio." });
    }
  }
);

// ============================================================================
// 6. GESTÃO DE PEDIDOS DE COMERCIANTES (PROCESSO DE ONBOARDING)
// ============================================================================

/**
 * Criação de um pedido de estatuto de comerciante, incluindo o upload do documento comprovativo (PDF).
 */
app.post("/pedidoComerciante", authorize(["cidadao"]), upload.single('documentoPDF'), async (req, res) => {
  try {
    const { tituloComercio, donoComercio, emailDono, telefoneDono } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "O documento PDF é obrigatório." });
    }

    const newPedidoComerciante = new PedidosComerciante({
      tituloComercio: tituloComercio,
      donoComercio: donoComercio,
      emailDono: emailDono,
      telefoneDono: telefoneDono,
      documentoPdfUrl: `/uploads/pdfs/${req.file.filename}`
    });

    await newPedidoComerciante.save();
    res.status(200).json({ message: "Sucesso!", id: newPedidoComerciante._id });
  } catch (err) {
    console.error("Erro no servidor (pedidoComerciante):", err);
    res.status(500).json({ message: "Erro ao guardar o pedido.", details: err.message });
  }
});

/**
 * Elimina fisicamente o PDF do disco e rejeita o pedido na Base de Dados.
 */
app.delete("/apagar/PedidoComerciante/:id", authorize(["camara"]), async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await PedidosComerciante.findById(id);

    if (!pedido) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    // 1. Limpeza do sistema de ficheiros (Impede a acumulação de PDFs rejeitados no disco)
    if (pedido.documentoPdfUrl) {
      // Uso do replace(/^\//, '') garante que o pathing funciona perfeitamente em Windows e Linux
      const relativePath = pedido.documentoPdfUrl.replace(/^\//, '');
      const filePath = path.join(process.cwd(), relativePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Ficheiro PDF eliminado do disco: ${filePath}`);
      }
    }

    // 2. Remoção do Documento no MongoDB
    await pedido.deleteOne();
    res.status(200).json({ message: "Pedido rejeitado e eliminado com sucesso!" });

  } catch (err) {
    console.error("Erro ao eliminar o pedido:", err);
    res.status(500).json({ message: "Erro interno ao eliminar o pedido", details: err.message });
  }
});

/**
 * Aprova o pedido, promovendo o Cidadão a Comerciante, e apaga o comprovativo por questões de RGPD.
 */
app.post("/aprovar/PedidoComerciante/:id", authorize(["camara"]), async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await PedidosComerciante.findById(id);
    if (!pedido) return res.status(404).json({ message: "Pedido não encontrado." });

    const utilizador = await User.findOne({ email: pedido.emailDono });
    if (!utilizador) return res.status(404).json({ message: "Utilizador associado ao pedido não encontrado." });

    // 1. Alteração de Privilégios (Role Based Access Control)
    utilizador.role = "comerciante";
    await utilizador.save();

    // 2. Limpeza de Dados Sensíveis (Privacidade / RGPD)
    if (pedido.documentoPdfUrl) {
      const relativePath = pedido.documentoPdfUrl.replace(/^\//, '');
      const filePath = path.join(process.cwd(), relativePath);

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // 3. Conclusão do Processo
    await pedido.deleteOne();
    res.status(200).json({
      message: "Pedido aprovado com sucesso! O utilizador agora é comerciante.",
      user: { id: utilizador._id, name: utilizador.name, role: utilizador.role }
    });

  } catch (err) {
    console.error("Erro ao aprovar o pedido:", err);
    res.status(500).json({ message: "Erro interno ao aprovar o pedido", details: err.message });
  }
});

app.get("/obter/PedidosComerciante", authorize(["camara"]), async (req, res) => {
  try {
    const pedidosComerciante = await PedidosComerciante.find().lean();
    res.json(pedidosComerciante);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar pedidos." });
  }
});

// ============================================================================
// 7. LISTAGEM E OPERAÇÕES BÁSICAS DE NEGÓCIOS / FAVORITOS
// ============================================================================

/**
 * @swagger
 * /negocios:
 *   get:
 *     summary: Obter lista de negócios aprovados
 *     tags: [Negócios]
 *     responses:
 *       200:
 *         description: Lista de negócios
 */
app.get("/negocios", async (req, res) => {
  try {
    const negocios = await Business.find({ status: "aprovado" });
    res.json(negocios);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar lojas." });
  }
});

/**
 * @swagger
 * /negocios/{id}:
 *   get:
 *     summary: Obter detalhes de um negócio por ID
 *     tags: [Negócios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do negócio
 */
app.get("/negocios/:id", async (req, res) => {
  try {
    const negocio = await Business.findById(req.params.id);
    res.json(negocio);
  } catch (error) {
    res.status(500).json({ message: "Erro ao encontrar id." });
  }
});

/**
 * @swagger
 * /apagarNegocio/{id}:
 *   delete:
 *     summary: Apagar um negócio por ID
 *     tags: [Negócios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Negócio apagado
 */
app.delete("/apagarNegocio/:id", authorize(["camara"]), async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ erro: "Negócio não encontrado." });

    await business.deleteOne();
    res.status(200).json({ sucesso: "Negócio apagado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Falha ao apagar o negócio." });
  }
});

app.put("/editarNegocio", authorize(["camara"]), async (req, res) => {
  // TODO: Implementar lógica de atualização de negócio
});

/**
 * @swagger
 * /meusNegocios:
 *   get:
 *     summary: Listar negócios de um comerciante logado
 *     tags: [Negócios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de negócios
 */
app.get("/meusNegocios", authorize(["comerciante"]), async (req, res) => {
  try {
    const negocios = await Business.find({ owner: req.user.id });
    if (!negocios || negocios.length === 0) return res.status(200).json([]);
    res.status(200).json(negocios);
  } catch (error) {
    console.error("Erro na rota /meusNegocios:", error);
    res.status(500).json({ message: "Erro ao procurar lojas." });
  }
});

/**
 * @swagger
 * /guardarFavorito:
 *   post:
 *     summary: Adicionar um negócio aos favoritos
 *     tags: [Favoritos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               businessId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Guardado com sucesso
 */
app.post("/guardarFavorito", async (req, res) => {
  const { userId, businessId } = req.body;
  try {
    const existe = await Favorite.findOne({ userId, businessId });
    if (existe) return res.status(400).json({ message: "Já está na lista" });

    const novoFavorito = new Favorite({ userId, businessId });
    await novoFavorito.save();
    res.status(200).json({ message: "Guardado com sucesso!" });
  } catch (err) {
    res.status(500).json(err);
  }
});

/**
 * @swagger
 * /retirarFavorito:
 *   post:
 *     summary: Remover um negócio dos favoritos
 *     tags: [Favoritos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               businessId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Removido com sucesso
 */
app.post("/retirarFavorito", async (req, res) => {
  const { userId, businessId } = req.body;
  try {
    const resultado = await Favorite.findOneAndDelete({ userId, businessId });
    if (!resultado) return res.status(404).json({ message: "Favorito não encontrado." });
    res.status(200).json({ message: "Removido dos favoritos com sucesso!" });
  } catch (err) {
    res.status(500).json({ message: "Erro interno ao remover.", error: err });
  }
});

/**
 * @swagger
 * /meusFavoritos/{userId}:
 *   get:
 *     summary: Obter lista de favoritos de um utilizador
 *     tags: [Favoritos]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de favoritos
 */
app.get("/meusFavoritos/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const favoritos = await Favorite.find({ userId: userId }).populate("businessId");
    res.status(200).json(Array.isArray(favoritos) ? favoritos : []);
  } catch (err) {
    res.status(500).json([]);
  }
});

// Operações de Câmara sobre os negócios pendentes
/**
 * @swagger
 * /business/aprovar/{id}:
 *   post:
 *     summary: Aprovar um negócio pendente
 *     tags: [Negócios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Negócio aprovado
 */
app.post("/business/aprovar/:id", authorize(["camara"]), async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id, { status: "aprovado" }, { returnDocument: 'after' }
    );
    if (!business) return res.status(404).json({ message: "Negócio não encontrado." });
    res.json({ message: "Loja aprovada com sucesso!", business });
  } catch (error) {
    res.status(500).json({ message: "Erro ao aprovar loja." });
  }
});

/**
 * @swagger
 * /business/rejeitar/{id}:
 *   delete:
 *     summary: Rejeitar um negócio pendente
 *     tags: [Negócios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Negócio rejeitado
 */
app.delete("/business/rejeitar/:id", authorize(["camara"]), async (req, res) => {
  try {
    await Business.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Negócio descartado com sucesso." });
  } catch (error) {
    res.status(500).json({ message: "Erro ao descartar." });
  }
});

/**
 * @swagger
 * /business/pendentes:
 *   get:
 *     summary: Listar todos os negócios pendentes de aprovação
 *     tags: [Negócios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de negócios pendentes
 */
app.get("/business/pendentes", authorize(["camara"]), async (req, res) => {
  try {
    const lista = await Business.find({ status: "pendente" });
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar lista da Câmara." });
  }
});

// ============================================================================
// 8. MOTOR DE GAMIFICAÇÃO E PROCESSAMENTO DE FATURAS (OCR/QRCODE)
// ============================================================================

/**
 * @swagger
 * /lerFatura:
 *   post:
 *     summary: Ler QR Code de uma fatura e atribuir pontos
 *     tags: [Campanhas e Faturas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               QRCodeData:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fatura lida com sucesso
 *       400:
 *         description: Erro na validação da fatura
 */
app.post("/lerFatura", authorize(["cidadao", "comerciante", "camara"]), upload.single('ReceiptImage'), async (req, res) => {
  // A lógica permanece inalterada pois já contém um excelente rigor de verificação (RFC/ATCUD).
  try {
    const { QRCodeData } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "É obrigatório enviar a fotografia da fatura." });
    }

    if (!QRCodeData || String(QRCodeData).trim() === "") {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "O QR Code da fatura nao foi detetado. Por favor, certifique-se de que o QR Code esta focado antes de tirar a fotografia." });
    }

    const parseQRCodeFields = (data) => {
      const parts = data.split("*");
      const fields = {};
      parts.forEach((part) => {
        const [code, ...valueParts] = part.split(":");
        const value = valueParts.join(":");
        if (code) fields[code] = value;
      });
      return fields;
    };

    const QRCodeFields = parseQRCodeFields(QRCodeData);
    // Mapeamento dos campos segundo as especificações técnicas da Autoridade Tributária
    const NIFStore = QRCodeFields["A"]; // NIF do comerciante/emitente
    const NIFClient = QRCodeFields["B"]; // NIF do adquirente (cliente)
    const CountryClient = QRCodeFields["C"]; // País do adquirente
    const TypeDocument = QRCodeFields["D"]; // Tipo de documento (FT: Fatura, FS: Fatura Simplificada, etc.)
    const StateDocument = QRCodeFields["E"]; // Estado do documento (N: Normal, etc.)
    const BoughtDate = QRCodeFields["F"]; // Data do documento (Formato: YYYYMMDD)
    const SerialNumber = QRCodeFields["G"]; // Identificação única do documento pela loja
    const CodeATCUD = QRCodeFields["H"]; // ATCUD - Código Único do Documento (Validação central da AT)
    const hash = QRCodeFields["Q"]; // Assinatura digital do documento (Hash de 4 caracteres)
    const SoftCertNumber = QRCodeFields["R"]; // Número do certificado do software de faturação

    // Campos Fiscais e Financeiros
    const RegionTax = QRCodeFields["11"]; // Espaço fiscal (ex: PT, PT-MA, PT-AC)
    const NoIVAValue = QRCodeFields["L"]; // Valor total não sujeito a IVA / isento
    const AllTaxValue = QRCodeFields["N"]; // Valor total de todos os impostos cobrados (IVA + Selo)
    const BoughtValue = QRCodeFields["O"]; // Valor TOTAL do documento com impostos (o valor pago pelo cliente)
    const AditionalInfo = QRCodeFields["S"]; // Outras informações (Ex: Referências multibanco)

    /////////////////////////////////////////////////////////////////////////////////////////////
    /// Usando Document Intelisence Azure Tools -> resultados perfeitos em 10 testes consecutivos 
    /////////////////////////////////////////////////////////////////////////////////////////////

    // 1. Em vez de ler o ficheiro diretamente, usamos o 'sharp' para o comprimir em memória
    // Importa o sharp no topo do index.js se o tiveres apagado: import sharp from "sharp";
    
    console.log("A comprimir a imagem para respeitar os limites do Azure...");
    
    const compressedImageBuffer = await sharp(req.file.path)
      .resize({ width: 2500, withoutEnlargement: true }) // Reduz imagens gigantes (ex: 4000px) para máx 2500px
      .jpeg({ quality: 80 }) // Guarda em JPEG com 80% de qualidade (perfeito para OCR e reduz 70% do peso)
      .toBuffer(); // Guarda o resultado diretamente na RAM (Buffer) sem criar novos ficheiros

    const azureEndpoint = process.env.AZURE_VISION_ENDPOINT; 
    const azureKey = process.env.AZURE_VISION_KEY;
    
    console.log("A enviar fatura comprimida para o Azure Document Intelligence...");
    const client = new DocumentAnalysisClient(azureEndpoint, new AzureKeyCredential(azureKey));
    
    // 2. Enviamos o BUFFER COMPRIMIDO para o Azure, e não o ficheiro original
    const poller = await client.beginAnalyzeDocument("prebuilt-layout", compressedImageBuffer);
    const { pages } = await poller.pollUntilDone();

    let extractedText = "";

    if (pages && pages.length > 0) {
      pages.forEach(page => {
        page.lines.forEach(line => {
          extractedText += line.content + "\n";
        });
      });
    }

    console.log("Texto extraído:\n", extractedText);

    // 1. Apagar a imagem original do servidor (fazemos isto logo para garantir que não acumula lixo)
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    // 2. Criar a variável 'ocrDigits' que faltava
    // Isto pega no texto gigante do Azure e remove TUDO o que não seja número.
    const ocrDigits = extractedText.replace(/\D/g, '');
    
    // Opcional: Debug para veres os números que o Azure encontrou
    // console.log("Dígitos puros do documento:", ocrDigits);

    // 3. Validação do NIF do Cliente (OCR-Resilient)
    // Em vez de procurar em linhas específicas, verificamos se o NIF do QR Code 
    // existe no meio de todos os números lidos na fatura.
    if (!ocrDigits.includes(NIFClient)) {
      return res.status(400).json({ message: "O NIF do cliente não foi detetado corretamente na fotografia do documento." });
    }

    // 4. Validação do ATCUD (OCR-Resilient)
    // O ATCUD tem formato "ABCD-1234". Limpamos as letras/hífens do QR Code e verificamos 
    // se essa sequência exata de números também foi lida pelo Azure.
    const atcudDigits = CodeATCUD.replace(/\D/g, '');
    if (!ocrDigits.includes(atcudDigits)) {
      return res.status(400).json({ message: "O código ATCUD não foi detetado corretamente na fotografia do documento." });
    }

    /**
     * VERIFICAÇÃO DE SEGURANÇA 1: Prevenção de Duplicados
     * Bloqueia a operação se a mesma combinação de ATCUD e Hash já existir na base de dados.
     * Isto impede que o mesmo talão seja lido várias vezes por pessoas diferentes.
     */
    const faturaRepetida = await Invoice.findOne({
      ATCUD: CodeATCUD,
      hash: hash,
    });
    
    if (faturaRepetida) {
      return res.status(400).json({ message: "Esta fatura já foi lida e os pontos já foram atribuídos anteriormente." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilizador não encontrado." });

    // Algoritmo Matemático de Validação de NIF Português
    const validarNIF = (nif) => {
      const sNif = String(nif);
      if (!/^\d{9}$/.test(sNif)) return false;
      const prefixosValidos = ["1", "2", "3", "5", "6", "8", "9"];
      if (!prefixosValidos.includes(sNif[0])) return false;

      let soma = 0;
      for (let i = 0; i < 8; i++) soma += parseInt(sNif[i]) * (9 - i);
      const resto = soma % 11;
      const digitoControloCalculado = resto === 0 || resto === 1 ? 0 : 11 - resto;
      return digitoControloCalculado === parseInt(sNif[8]);
    };

    if (!validarNIF(NIFClient) || !validarNIF(NIFStore)) {
      return res.status(400).json({ message: "O QR Code contém um NIF matematicamente inválido." });
    }

    if (NIFClient === "999999990") {
      return res.status(400).json({ message: "A fatura foi emitida a 'Consumidor Final' e não pode acumular pontos." });
    }

    const numberNif = Number(NIFClient)
    if (user.NIF !== numberNif) {
      console.log(user.NIF, NIFClient)
      return res.status(400).json({ message: "O NIF nesta fatura não pertence à sua conta." });
    }

    // Validações do Formato ATCUD da Autoridade Tributária
    if (!CodeATCUD || typeof CodeATCUD !== "string") return res.status(400).json({ message: "Código ATCUD ausente ou inválido." });
    const atcudRegex = /^[A-Z0-9]+-[0-9]+$/;
    if (!atcudRegex.test(CodeATCUD)) return res.status(400).json({ message: "O formato do código ATCUD é inválido." });
    if (CodeATCUD.length < 10) return res.status(400).json({ message: "Código ATCUD demasiado curto para ser autêntico." });

    const documentosElegiveis = ["FT", "FS", "FR"];
    if (!TypeDocument || !documentosElegiveis.includes(TypeDocument.toUpperCase())) {
      return res.status(400).json({ message: "Este tipo de documento não é válido para ganhar pontos." });
    }

    if (!StateDocument || StateDocument.toUpperCase() !== "N") {
      return res.status(400).json({ message: "Apenas faturas em estado 'Normal' podem acumular pontos." });
    }

    if (BoughtValue < 1) {
      return res.status(400).json({ message: "O valor gasto é inferior a 1€." });
    }

    // Validação de Elegibilidade da Campanha
    const store = await Business.findOne({ NIF: Number(NIFStore) }).populate("campaigns.campaign");
    if (!store) return res.status(404).json({ message: "Esta loja não está registada na aplicação." })
    const activeCampaignEntry = store.campaigns.find((entry) => {
      if (entry.status !== "aprovado") return false;
      const camp = entry.campaign;
      if (!camp || camp.status !== "ativa") return false;
      const hoje = new Date();
      if (hoje > camp.expirationDate) return false;
      return true;
    });
    
    if (!activeCampaignEntry) {
      return res.status(400).json({ message: "Esta loja não tem nenhuma campanha de pontos ativa no momento." });
    }

    // Aplicação de Limites de Gamificação (Rate Limiting)
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);
    const faturasLidasHoje = await Invoice.countDocuments({ user: user._id, createdAt: { $gte: inicioDoDia } });

    if (faturasLidasHoje >= 20) {
      return res.status(429).json({ message: "Limite diário atingido. Só pode registar 20 faturas por dia." });
    }

    const invoiceYear = parseInt(BoughtDate.substring(0, 4));
    const invoiceMonth = parseInt(BoughtDate.substring(4, 6)) - 1;
    const invoiceDay = parseInt(BoughtDate.substring(6, 8));
    const dataDaFatura = new Date(invoiceYear, invoiceMonth, invoiceDay);

    if (dataDaFatura > new Date()) {
      return res.status(400).json({ message: "A data da fatura não pode ser futura." });
    }

    // Processamento e Persistência
    const pointsDeserved = Math.trunc(BoughtValue);
    user.Points += pointsDeserved;
    await user.save();

    await Invoice.create({
      user: user._id,
      business: store._id,
      ATCUD: CodeATCUD,
      hash: hash,
      amount: BoughtValue,
      purchaseDate: BoughtDate,
    });

    return res.status(200).json({
      sucesso: "Fatura lida com sucesso!",
      pontosGanhos: pointsDeserved,
      saldoAtual: user.Points,
    });
  } catch (error) {
    console.error("Erro no processamento da fatura:", error);
    return res.status(500).json({ erro: "Ocorreu um erro interno no servidor ao processar a fatura." });
  }
});

// ============================================================================
// 9. GESTÃO DE CAMPANHAS E PROCESSAMENTO AVANÇADO DE IMAGENS (SHARP)
// ============================================================================

const uploadCampanha = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'panfleto', maxCount: 1 }
]);

/**
 * Criação de uma campanha promocional.
 * Utiliza o módulo Sharp para otimizar imediatamente as imagens geradas, garantindo
 * performance (formato WebP) e poupança de armazenamento no servidor.
 */
app.post("/criarCampanha", authorize(["camara"]), uploadCampanha, async (req, res) => {
  try {
    const { titulo, slogan, descricao, listaCAES, dataInicio, dataExpiracao, normas, packs } = req.body;

    let parsedPacks = [];
    if (packs) {
      try {
        parsedPacks = JSON.parse(packs);
      } catch (parseError) {
        return res.status(400).json({ message: "O formato dos pacotes/packs é inválido." });
      }
    }

    let logoUrl = "";
    let panfletoUrl = "";

    /**
     * Função Auxiliar de Processamento Gráfico
     * Lê a imagem do staging (multer), redimensiona, aplica compressão WebP e apaga a original.
     */
    const processarImagem = async (file) => {
      const nomeSemExtensao = path.parse(file.filename).name;
      const webpFilename = `${nomeSemExtensao}.webp`;
      const targetPath = path.join('uploads/imagens/', webpFilename);

      try {
        await sharp(file.path)
          .resize({ width: 800 })
          .toFormat('webp')
          .webp({ quality: 80 })
          .toFile(targetPath);
      } finally {
        // Bloco Finally garante a limpeza do disco mesmo se o Sharp lançar uma excepção (Ficheiro corrompido)
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }

      return `/uploads/imagens/${webpFilename}`; // URL relativo pronto a consumir pelo Front-End
    };

    // Aplicação da otimização aos ficheiros recebidos
    if (req.files && req.files['logo']) {
      logoUrl = await processarImagem(req.files['logo'][0]);
    }
    if (req.files && req.files['panfleto']) {
      panfletoUrl = await processarImagem(req.files['panfleto'][0]);
    }

    const newCampaign = new Campaign({
      createdBy: req.user.id,
      titulo: titulo,
      slogan: slogan,
      descricao: descricao,
      listaCAES: listaCAES,
      dataInicio: dataInicio,
      DataExpiracao: dataExpiracao,
      normas: normas,
      packs: parsedPacks,
      logo: logoUrl,
      panfleto: panfletoUrl
    });

    await newCampaign.save();
    res.status(200).json({ message: "Sucesso!", id: newCampaign._id });

  } catch (err) {
    console.error("Erro na criação da campanha: ", err);
    res.status(500).json({ message: "Erro ao gravar", details: err.message });
  }
});

/**
 * @swagger
 * /listaCampanhas:
 *   get:
 *     summary: Listar todas as campanhas
 *     tags: [Campanhas e Faturas]
 *     responses:
 *       200:
 *         description: Lista de campanhas
 */
app.get("/listaCampanhas", async (req, res) => {
  try {
    const campanhas = await Campaign.find().lean();
    const formatadas = campanhas.map((c) => ({
      ...c,
      _id: c._id.toString(),
      createdBy: typeof c.createdBy === "object" ? c.createdBy.username || "Admin" : c.createdBy,
    }));
    res.status(200).json(formatadas);
  } catch (err) {
    res.status(500).json("Erro ao listar as campanhas");
  }
});

// ============================================================================
// 10. ESTATÍSTICAS (DASHBOARD CÂMARA)
// ============================================================================

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Obter estatísticas para o dashboard (Câmara)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados estatísticos
 */
app.get("/dashboard", authorize(["camara"]), async (req, res) => {
  try {
    const usersByCity = await User.aggregate([
      {
        $lookup: {
          from: CitiesAndCountries.collection.name,
          localField: "city",
          foreignField: "name",
          as: "locationData"
        }
      },
      { $unwind: { path: "$locationData", preserveNullAndEmptyArrays: false } },
      { $match: { "locationData.country_name": "Portugal" } },
      { $group: { _id: "$city", total: { $sum: 1 } } }
    ]);

    const businessByCategory = await Business.aggregate([{ $group: { _id: "$category", total: { $sum: 1 } } }]);

    const usersByCountry = await User.aggregate([
      {
        $lookup: {
          from: CitiesAndCountries.collection.name,
          localField: "city",
          foreignField: "name",
          as: "locationData"
        }
      },
      {
        $unwind: {
          path: "$locationData",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $group: {
          _id: "$locationData.country_name",
          total: { $sum: 1 }
        }
      }
    ]);

    const totalUsersCount = await User.countDocuments();
    const totalBusinessesCount = await Business.countDocuments();

    res.status(200).json({
      cities: usersByCity,
      countries: usersByCountry,
      categories: businessByCategory,
      totalUsers: totalUsersCount,
      totalBusinesses: totalBusinessesCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao obter as informações" });
  }
});

// ============================================================================
// 11. GESTÃO DE PERFIL E ATUALIZAÇÃO DE DADOS 
// ============================================================================

/**
 * Atualização do Perfil do Utilizador.
 * Processa a atualização de dados em texto e a substituição do avatar, mantendo o disco limpo.
 */
app.post(
  "/editarUser/:id",
  authorize(["camara", "comerciante", "cidadao"]),
  upload.single("avatar"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "Utilizador não encontrado." });

      const { name: receivedName, city: receivedCity, NIF: receivedNIF } = req.body;

      // Mutação Condicional: Apenas atualiza propriedades que efetivamente sofreram alterações
      if (user.name !== receivedName) user.name = receivedName;
      if (user.city !== receivedCity) user.city = receivedCity;
      if (receivedNIF != null) user.NIF = receivedNIF;
      console.log(receivedNIF)
      // Tratamento Exclusivo da Imagem de Perfil (Avatar)
      if (req.file) {
        const nomeSemExtensao = path.parse(req.file.filename).name;
        const webpFilename = `${nomeSemExtensao}_avatar.webp`;
        const targetPath = path.join('uploads/imagens/', webpFilename);

        try {
          // Crop inteligente automático focado na cara para quadrados 400x400
          await sharp(req.file.path)
            .resize({ width: 400, height: 400, fit: 'cover' })
            .toFormat('webp')
            .webp({ quality: 80 })
            .toFile(targetPath);
        } finally {
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }

      if (!user) {
        return res.status(404).json({ message: "Utilizador não encontrado." });
      }

      const { name, city, NIF, avatarId } = req.body;

      if (name !== undefined) user.name = name;
      if (city !== undefined) user.city = city;
      if (NIF !== undefined) user.NIF = NIF;

      // Associar o ID da imagem guardada no MongoDB ao perfil do utilizador
      if (avatarId !== undefined) {
        if (user.Avatar && user.Avatar !== avatarId) {
          await Image.findByIdAndDelete(user.avatar).catch(err => 
            console.error("Erro ao apagar imagem antiga:", err)
          );
        }
        
        user.Avatar = avatarId; 
      }

      await user.save();

      res.status(200).json({ 
        message: "Alterações guardadas com sucesso!",
        user: {
          name: user.name,
          city: user.city,
          NIF: user.NIF,
          avatar: user.Avatar
        }
      });
      
    } catch (error) {
      console.error("Erro ao alterar informações:", error);
      res.status(500).json({ message: "Erro ao alterar as informações" });
    }
  },
);

// ============================================================================
// 12. DOCUMENTAÇÃO SWAGGER & ARRANQUE DA APLICAÇÃO
// ============================================================================

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API de Tomar",
      version: "1.0.0",
      description: "Documentação oficial dos endpoints da aplicação de Gamificação local.",
    },
    servers: [
      { url: "https://tomar-rg-b0bvd9e7fkdhatbh.westeurope-01.azurewebsites.net", description: "Produção (Azure)" },
      { url: "http://localhost:3000", description: "Servidor Local (Dev)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./index.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Servidor ligado com sucesso na porta ${PORT}`),
);
