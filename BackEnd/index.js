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
import Image from "./models/Image.js"
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
app.use(express.json({ limit: '20mb' })); // Aumentei para 20mb para garantir segurança com panfletos
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use('/uploads', express.static('uploads'));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let targetFolder = 'uploads/';

    // Separa os ficheiros com base no tipo
    if (file.mimetype === 'application/pdf') {
      targetFolder = 'uploads/pdfs/';
    } else if (file.mimetype.startsWith('image/')) {
      targetFolder = 'uploads/imagens/';
    }

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    cb(null, targetFolder);
  },
  filename: function (req, file, cb) {
    // Gera um nome único mantendo a extensão original (.jpg, .png, .pdf)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
const uploadParaMemoria = multer({ storage: multer.memoryStorage() });


//////////////////////////////
//Conectar à mongoDb no docker
mongoose
  .connect(dbURI)
  .then(() => console.log("Conectado à Base de Dados com sucesso!"))
  .catch((err) => console.error("Erro na Base de Dados: ", err));




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
    //procurar o utilizador pelo email
    const user = await User.findOne({ email: email });

    //se não existir utilizador
    if (!user) {
      return res.status(400).json({ message: "Conta não existe" });
    }

    const rightPassword = await bcrypt.compare(password, user.password);
    //se não fizer match de password
    if (!rightPassword) {
      return res.status(400).json({ message: "Palavra-passe errada" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    //gerar token
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
        Avatar: user.Avatar,
      },
    });
  } catch (err) {
    console.error("Erro ao iniciar sessão: ", err);
    res.status(400).json({
      message: "Erro ao iniciar sessão",
    });
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
    const pendentes = await Business.find({ status: "pendente" });

    const ownerIds = pendentes.map((negocio) => negocio.owner);

    const owners = await User.find({ _id: { $in: ownerIds } });

    console.log("Donos encontrados:", owners.length);

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
        nomeNegocio,
        NIFnegocio,
        categoriaNegocio,
        logotipoNegocio,
        moradaNegocio,
        freguesiaNegocio,
        localizacao,
        telefoneDono,
        emailDono,
        descricaoNegocio,
        galeriaFotos,
        owner, // Caso a câmara esteja a registar por outro
      } = req.body;

      console.log(req.body);

      if (
        !nomeNegocio ||
        !categoriaNegocio ||
        !localizacao ||
        !telefoneDono ||
        !emailDono ||
        galeriaFotos.length === 0
      ) {
        return res.status(400).json({
          message:
            "Erro:\nDados incompletos (Nome, Categoria, Localização, Telefone e E-mail são obrigatórios).",
        });
      }

      const ownerId =
        req.user.role === "camara" ? owner || req.user.id : req.user.id;
      //Verificar se já existe um negócio com o mesmo nome para este dono
      const existe = await Business.findOne({ nomeNegocio, owner: ownerId });
      if (existe) {
        return res.status(400).json({
          message: "Já tens um negócio registado com este nome.",
        });
      }

      // Se for o comerciante a criar, o status deve ser 'pendente'
      // Se for a camara, definir logo como 'aprovado'
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
        status: req.user.role === "camara" ? "aprovado" : "pendente",
        createdAt: new Date(),
      });

      await novoNegocio.save();

      res.status(201).json({
        message: "Negocio registado com sucesso!",
        business: novoNegocio,
      });
    } catch (error) {
      console.error("Erro no registo:", error);
      res.status(500).json({ message: "Erro interno ao guardar o negócio." });
    }
  },
);


app.post("/pedidoComerciante", authorize(["cidadao"]), upload.single('documentoPDF'), async (req, res) => {
  try {
    const { 
      tituloComercio, 
      donoComercio, 
      emailDono,
      telefoneDono,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "O documento PDF é obrigatório." });
    }

    // 🌟 Corrigido aqui para PedidosComerciante (com 's') conforme o teu import no topo
    const newPedidoComerciante = new PedidosComerciante({
      tituloComercio: tituloComercio,
      donoComercio: donoComercio,
      emailDono: emailDono,
      telefoneDono: telefoneDono,
      documentoPdfUrl: `/uploads/pdfs/${req.file.filename}` 
    });
    
    await newPedidoComerciante.save();
    
    console.log("Pedido guardado com sucesso:", newPedidoComerciante);
    res.status(200).json({ message: "Sucesso!", id: newPedidoComerciante._id });
    
  } catch (err) {
    console.error("❌ Erro no servidor:", err);
    res.status(500).json({ message: "Erro ao guardar", details: err.message });
  }
});


app.delete("/apagar/PedidoComerciante/:id", authorize(["camara"]), async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Procurar o pedido na Base de Dados
    const pedido = await PedidosComerciante.findById(id);

    if (!pedido) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    // 2. Tentar apagar o ficheiro PDF físico do servidor se ele existir
    if (pedido.documentoPdfUrl) {
      // Usamos o path.join para mapear o caminho real no disco do servidor
      const filePath = path.join(process.cwd(), pedido.documentoPdfUrl);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); 
        console.log(`Ficheiro PDF eliminado do disco: ${filePath}`);
      } else {
        console.log(` Ficheiro PDF não encontrado no disco para apagar: ${filePath}`);
      }
    }

    // 3. Eliminar o registo do MongoDB
    await pedido.deleteOne();

    console.log(` Pedido ${id} eliminado com sucesso.`);
    res.status(200).json({ message: "Pedido rejeitado e eliminado com sucesso!" });

  } catch (err) {
    console.error(" Erro ao eliminar o pedido:", err);
    res.status(500).json({ message: "Erro interno ao eliminar o pedido", details: err.message });
  }
});


app.post("/aprovar/PedidoComerciante/:id", authorize(["camara"]), async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await PedidosComerciante.findById(id);
    if (!pedido) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    const utilizador = await User.findOne({ email: pedido.emailDono });
    if (!utilizador) {
      return res.status(404).json({ message: "Utilizador que é dono do pedido não foi encontrado no sistema." });
    }

    // Atualizar o role do utilizador para comerciante
    utilizador.role = "comerciante";
    await utilizador.save();
    console.log(` Utilizador ${utilizador.email} promovido a comerciante!`);

    if (pedido.documentoPdfUrl) {
      const filePath = path.join(process.cwd(), pedido.documentoPdfUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`PDF do pedido aprovado foi removido do disco.`);
      }
    }

    await pedido.deleteOne();

    res.status(200).json({ 
      message: "Pedido aprovado com sucesso! O utilizador agora é comerciante.",
      user: { id: utilizador._id, name: utilizador.name, role: utilizador.role }
    });

  } catch (err) {
    console.error(" Erro ao aprovar o pedido:", err);
    res.status(500).json({ message: "Erro interno no servidor ao aprovar o pedido", details: err.message });
  }
});

app.get("/obter/PedidosComerciante", authorize(["camara"]) , async (req, res) => {
    try {
const pedidosComerciante = await PedidosComerciante.find().lean();
    res.json(pedidosComerciante);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar pedidos." });
  }
});
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
    console.log(req.params.id);
    const negocio = await Business.findById(req.params.id);
    console.log(negocio);
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

    if (!business) {
      return res.status(404).json({ erro: "Negócio não encontrado." });
    }

    await business.deleteOne();

    res.status(200).json({ sucesso: "Negócio apagado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Falha ao apagar o negócio." });
  }
});

//TODO: editar negócio
app.put("/editarNegocio", authorize(["camara"]), async (req, res) => {
  try {
    const dados = req.body;
    console.log(dados);
  } catch (err) {}
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
    console.log("A procurar lojas para o dono:", req.user.id);

    const negocios = await Business.find({
      owner: req.user.id,
    });

    console.log("Lojas encontradas:", negocios.length);

    if (!negocios || negocios.length === 0) {
      return res.status(200).json([]); // Devolve array vazio se não houver lojas
    }

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
    // 1. Verifica se já existe para não duplicar
    const existe = await Favorite.findOne({ userId, businessId });
    if (existe) return res.status(400).json({ message: "Já está na lista" });

    // 2. Grava no banco
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
    // Procura e remove o favorito que coincida com o par utilizador/negócio
    const resultado = await Favorite.findOneAndDelete({ userId, businessId });

    if (!resultado) {
      return res.status(404).json({ message: "Favorito não encontrado." });
    }

    res.status(200).json({ message: "Removido dos favoritos com sucesso!" });
  } catch (err) {
    console.error("Erro ao remover favorito:", err);
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

    // Procura todos os favoritos deste user
    const favoritos = await Favorite.find({ userId: userId }).populate(
      "businessId",
    );

    // Forçamos o envio de um ARRAY, mesmo que esteja vazio []
    res.status(200).json(Array.isArray(favoritos) ? favoritos : []);
  } catch (err) {
    res.status(500).json([]); // Envia array vazio em caso de erro para não quebrar o app
  }
});

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
      req.params.id,
      { status: "aprovado" },
      { new: true }, // Retorna o documento já atualizado
    );

    if (!business) {
      return res.status(404).json({ message: "Negócio não encontrado." });
    }

    res.json({
      message: "Loja aprovada com sucesso!",
      business,
    });
  } catch (error) {
    console.error(error);
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
app.delete(
  "/business/rejeitar/:id",
  authorize(["camara"]),
  async (req, res) => {
    try {
      await Business.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Negócio descartado com sucesso." });
    } catch (error) {
      res.status(500).json({ message: "Erro ao descartar." });
    }
  },
);

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
    console.error("Erro ao buscar pendentes:", error);
    res.status(500).json({ message: "Erro ao carregar lista da Câmara." });
  }
});

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
app.post("/lerFatura", authorize(["cidadao"]), async (req, res) => {
  try {
    const { token } = req.body;
    const { QRCodeData } = req.body;
    console.log(QRCodeData);

    //função para pegar nos campos de forma dinâmica pois existe a possibilidade de existir campos opcionais
    const parseQRCodeFields = (data) => {
      const parts = data.split("*");
      const fields = {};
      parts.forEach((part) => {
        const [code, ...valueParts] = part.split(":");
        const value = valueParts.join(":");

        if (code) {
          fields[code] = value;
        }
      });
      return fields;
    };

    // Extração dinâmica de todos os campos da fatura lida
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
      return res.status(400).json({
        message:
          "Esta fatura já foi lida e os pontos já foram atribuídos anteriormente.",
      });
    }

    /**
     * VERIFICAÇÃO DE SEGURANÇA 2: Autenticação do Utilizador
     * Garante que quem está a fazer o pedido é um utilizador válido no sistema.
     */
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    /**
     * VERIFICAÇÃO DE SEGURANÇA 3: Propriedade da Fatura (Anti-Fraude)
     * Regra 1: Validar integridade matemática dos NIF
     * Regra 2: Rejeitar faturas de "Consumidor Final" (NIF: 999999990)
     * Regra 3: O NIF do QR Code tem de coincidir obrigatoriamente com o NIF registado no perfil do utilizador.
     */

    const validarNIF = (nif) => {
      const sNif = String(nif);
      //tamanho do NIF
      if (!/^\d{9}$/.test(sNif)) return false;
      //prefixos válidos no NIF na posiçãp 0
      const prefixosValidos = ["1", "2", "3", "5", "6", "8", "9"];
      if (!prefixosValidos.includes(sNif[0])) return false;

      //cálculo do módulo 11 para a integridade matemática
      let soma = 0;
      for (let i = 0; i < 8; i++) {
        soma += parseInt(sNif[i]) * (9 - i);
      }

      const resto = soma % 11;
      const digitoControloCalculado =
        resto === 0 || resto === 1 ? 0 : 11 - resto;

      return digitoControloCalculado === parseInt(sNif[8]);
    };

    // 1. Validar integridade matemática do NIF do Cliente e da Loja
    if (!validarNIF(NIFClient) || !validarNIF(NIFStore)) {
      return res.status(400).json({
        message: "O QR Code contém um NIF matematicamente inválido.",
      });
    }

    // 2. Rejeitar faturas de "Consumidor Final" (NIF: 999999990)
    if (NIFClient === "999999990") {
      return res.status(400).json({
        message:
          "A fatura foi emitida a 'Consumidor Final' e não pode acumular pontos.",
      });
    }

    // 3. O NIF do QR Code tem de coincidir com o NIF do perfil do utilizador
    if (user.NIF !== NIFClient) {
      return res.status(400).json({
        message: "O NIF nesta fatura não pertence à sua conta.",
      });
    }

    /**
     * VERIFICAÇÃO DE SEGURANÇA 4: Validar o ATCUD campo H
     * O campo CodeATCUD (campo H) é o Código Único do Documento.
     * Ele tem um formato específico: CodValidacao-NumSequencial.
     */
    // 1. Verificar se o campo existe
    if (!CodeATCUD || typeof CodeATCUD !== "string") {
      return res.status(400).json({
        message: "Código ATCUD ausente ou inválido.",
      });
    }

    // 2. Expressão Regular para validar o formato:
    // ^[A-Z0-9]+  -> Começa com caracteres alfanuméricos (Código de Validação)
    // -           -> Tem obrigatoriamente um hífen
    // [0-9]+$     -> Termina com números (Número Sequencial do documento na série)
    const atcudRegex = /^[A-Z0-9]+-[0-9]+$/;

    if (!atcudRegex.test(CodeATCUD)) {
      return res.status(400).json({
        message: "O formato do código ATCUD é inválido.",
      });
    }

    // 3. Verificação de tamanho mínimo razoável
    // O código de validação da AT tem no mínimo 8 caracteres
    if (CodeATCUD.length < 10) {
      return res.status(400).json({
        message: "Código ATCUD demasiado curto para ser autêntico.",
      });
    }

    /**
     * VERIFICAÇÃO DE SEGURANÇA 5: Validar o tipo de documento
     * Nem todos os documentos num QR Code são faturas que dão direito a pontos.
     * Aceitar apenas FT (Fatura), FS (Fatura Simplificada) e FR (Fatura-Recibo).
     *
     */

    const documentosElegiveis = ["FT", "FS", "FR"];

    //  Verificação do campo TypeDocument (extraído do campo 'D' do QR Code)
    if (
      !TypeDocument ||
      !documentosElegiveis.includes(TypeDocument.toUpperCase())
    ) {
      if (TypeDocument === "OR")
        mensagemErro = "Orçamentos não são válidos para pontos.";
      if (TypeDocument === "GT")
        mensagemErro = "Guias de transporte não são válidas para pontos.";
      if (TypeDocument === "NE")
        mensagemErro = "Notas de encomenda não são válidas para pontos.";

      return res.status(400).json({
        message: "Este tipo de documento não é válido para ganhar pontos.",
      });
    }

    /**
     * VERIFICAÇÃO DE SEGURANÇA 6: Validar o estado do documento
     * Regra: Aceitar apenas documentos no estado "N" (Normal).
     * Bloquear: Documentos no estado "A" (Anulado)     */

    // 1. O campo 'StateDocument' vem do campo 'E' do QR Code
    if (!StateDocument || StateDocument.toUpperCase() !== "N") {
      if (StateDocument.toUpperCase() === "A") {
        mensagemEstado = "Esta fatura foi anulada e não é válida para pontos.";
      } else if (StateDocument.toUpperCase() === "S") {
        mensagemEstado =
          "Esta fatura foi substituída por outra e não pode ser utilizada.";
      }
      return res.status(400).json({
        message: "Apenas faturas em estado 'Normal' podem acumular pontos.",
      });
    }

    //Adicionar verificação dos valores da fatura, pegando em todos e somando para verificar se dá igual ao valor total
    /**
     * VERIFICAÇÃO DE REGRA DE NEGÓCIO: Valor Mínimo
     * Apenas faturas com um valor elegível (ex: superior a 1 euro) dão direito a pontos.
     * Usa-se Number() para garantir a correta comparação matemática de strings.
     */
    if (BoughtValue < 1) {
      return res
        .status(400)
        .json({ message: "O valor gasto é inferior a 1€." });
    }

    /**
     * VALIDAÇÃO DO COMERCIANTE E CAMPANHA
     * Localiza o comerciante na base de dados e faz o "populate" das campanhas para avaliar a elegibilidade.
     */
    const store = await Business.findOne({ NIF: Number(NIFStore) }).populate(
      "campaigns.campaign",
    );
    if (!store) {
      return res
        .status(404)
        .json({ message: "Esta loja não está registada na aplicação." });
    }

    // Procura na lista de campanhas da loja se existe alguma que cumpra todos os requisitos
    const activeCampaignEntry = store.campaigns.find((entry) => {
      // 1. O comerciante foi formalmente aprovado para participar nesta campanha?
      if (entry.status !== "aprovado") return false;

      // 2. A campanha subjacente existe e está globalmente marcada como "ativa"?
      const camp = entry.campaign;
      if (!camp || camp.status !== "ativa") return false;

      // 3. A campanha ainda está dentro da validade temporal?
      const hoje = new Date();
      if (hoje > camp.expirationDate) return false;

      // Se passou todos os filtros, esta é a campanha elegível
      return true;
    });

    // Se nenhuma campanha válida foi encontrada, interrompe o processo
    if (!activeCampaignEntry) {
      return res.status(400).json({
        message:
          "Esta loja não tem nenhuma campanha de pontos ativa no momento.",
      });
    }

    /**
     * VERIFICAÇÃO DE SEGURANÇA: Limite de 20 faturas por dia
     * Esta verificação olha para o momento da leitura (hoje).
     */
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    const faturasLidasHoje = await Invoice.countDocuments({
      user: user._id,
      createdAt: { $gte: inicioDoDia },
    });

    if (faturasLidasHoje >= 20) {
      return res.status(429).json({
        message: "Limite diário atingido. Só pode registar 20 faturas por dia.",
      });
    }

    /**
     * PROCESSAMENTO DA DATA DA FATURA (Extraída do QR Code)
     */
    const invoiceYear = parseInt(BoughtDate.substring(0, 4));
    const invoiceMonth = parseInt(BoughtDate.substring(4, 6)) - 1;
    const invoiceDay = parseInt(BoughtDate.substring(6, 8));
    const dataDaFatura = new Date(invoiceYear, invoiceMonth, invoiceDay);

    // Verificação: A fatura não pode ser do futuro
    const agora = new Date();
    if (dataDaFatura > agora) {
      return res
        .status(400)
        .json({ message: "A data da fatura não pode ser futura." });
    }

    // Pode verificar se a fatura é anterior à data de início da campanha (se a campanha tiver startDate)
    //BoughtDate
    /**
     * ATRIBUIÇÃO DE PONTOS E PERSISTÊNCIA DE DADOS
     * Regra de conversão atual: 1 euro gasto = 1 ponto.
     * Math.trunc() corta as casas decimais (ex: 10.99€ -> 10 pontos).
     */
    const pointsDeserved = Math.trunc(BoughtValue);
    // Atualiza o saldo do utilizador e guarda na base de dados
    user.Points += pointsDeserved;
    await user.save();

    // Regista a fatura no histórico para auditoria e prevenção de futuros bloqueios de duplicados
    await Invoice.create({
      user: user._id,
      business: store._id,
      ATCUD: CodeATCUD,
      hash: hash,
      amount: BoughtValue,
      purchaseDate: BoughtDate,
    });

    /**
     * RESPOSTA DE SUCESSO
     * Retorna os detalhes da transação para que o front-end possa apresentar a notificação (Snackbar/Modal).
     */
    return res.status(200).json({
      sucesso: "Fatura lida com sucesso!",
      pontosGanhos: pointsDeserved,
      saldoAtual: user.Points,
    });
  } catch (error) {
    // Interceta falhas de servidor, base de dados ou parse mal formatado
    console.error("Erro no processamento da fatura:", error);
    return res.status(500).json({
      erro: "Ocorreu um erro interno no servidor ao processar a fatura.",
    });
  }
});

////////////////////////
//Criar Campanha

const uploadCampanha = upload.fields([
  { name: 'logo', maxCount: 1 }, 
  { name: 'panfleto', maxCount: 1 }
]);

app.post("/criarCampanha", authorize(["camara"]), uploadCampanha, async (req, res) => {
  try {
    const { 
      titulo, 
      slogan, 
      descricao, 
      listaCAES, 
      dataInicio, 
      dataExpiracao, 
      normas, 
      packs 
    } = req.body;

    let parsedPacks = [];
    if (packs) {
      try {
        parsedPacks = typeof packs === 'string' ? JSON.parse(packs) : packs;
      } catch (parseError) {
        console.error("Erro ao converter os packs:", parseError);
        return res.status(400).json({ message: "O formato dos pacotes/packs é inválido." });
      }
    }

    let parsedCAES = [];
    if (listaCAES) {
      try {
        parsedCAES = typeof listaCAES === 'string' ? JSON.parse(listaCAES) : listaCAES;
      } catch (parseError) {
        parsedCAES = typeof listaCAES === 'string' ? listaCAES.split(',') : listaCAES;
      }
    }

    let logoIdDefinitivo = null;
    let panfletoIdDefinitivo = null;

    // --- PROCESSAMENTO DO LOGÓTIPO ---
    if (req.files && req.files['logo'] && req.files['logo'][0]) {
      const logoFile = req.files['logo'][0];
      
      const logoBuffer = await sharp(logoFile.path)
        .resize({ width: 800 })
        .toFormat('webp')
        .webp({ quality: 80 })
        .toBuffer();

      const novaImagemLogo = new Image({
        nomeOriginal: logoFile.originalname,
        dados: logoBuffer,
        contentType: 'image/webp'
      });
      await novaImagemLogo.save();
      logoIdDefinitivo = novaImagemLogo._id;
      
      try { fs.unlinkSync(logoFile.path); } catch (e) { console.log("Erro ao apagar logo temp:", e); }
    } 

    // --- PROCESSAMENTO DO PANFLETO ---
    if (req.files && req.files['panfleto'] && req.files['panfleto'][0]) {
      const panfletoFile = req.files['panfleto'][0];
      
      const panfletoBuffer = await sharp(panfletoFile.path)
        .resize({ width: 800 })
        .toFormat('webp')
        .webp({ quality: 80 })
        .toBuffer();

      const novaImagemPanfleto = new Image({
        nomeOriginal: panfletoFile.originalname,
        dados: panfletoBuffer,
        contentType: 'image/webp'
      });
      await novaImagemPanfleto.save();
      panfletoIdDefinitivo = novaImagemPanfleto._id;
      
      try { fs.unlinkSync(panfletoFile.path); } catch (e) { console.log("Erro ao apagar panfleto temp:", e); }
    }

    // --- CRIAR A CAMPANHA ---
    const newCampaign = new Campaign({
      createdBy: req.user.id,
      titulo: titulo,            
      slogan: slogan,
      descricao: descricao,
      listaCAES: parsedCAES, 
      DataInicio: dataInicio ? new Date(dataInicio) : undefined, 
      DataExpiracao: dataExpiracao ? new Date(dataExpiracao) : undefined,
      normas: normas,
      packs: parsedPacks,           
      logo: logoIdDefinitivo,       
      panfleto: panfletoIdDefinitivo 
    });
    
    await newCampaign.save();
    
    return res.status(200).json({ message: "Sucesso!", id: newCampaign._id });
    
  } catch (err) {
    console.error("Erro no catch principal:", err);
    return res.status(500).json({ message: "Erro ao gravar", details: err.message });
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
      // Se createdBy for um objeto, enviamos apenas o nome ou string
      createdBy:
        typeof c.createdBy === "object"
          ? c.createdBy.username || "Admin"
          : c.createdBy,
    }));
    console.log(campanhas);
    res.status(200).json(formatadas);
  } catch (err) {
    console.error(err);
    res.status(500).json("Erro ao listar as campanhas");
  }
});

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
    // 1. Agregação para contar utilizadores por Cidade
    // O $group agrupa documentos que tenham o mesmo valor em "$city"
    const usersByCity = await User.aggregate([
      {
        $group: {
          _id: "$city",
          total: { $sum: 1 },
        },
      },
    ]);

    // 2. Agregação para contar negócios por Categoria
    const businessByCategory = await Business.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
        },
      },
    ]);

    const totalUsersCount = await User.countDocuments();
    const totalBusinessesCount = await Business.countDocuments();

    res.status(200).json({
      cities: usersByCity,
      categories: businessByCategory,
      totalUsers: totalUsersCount, // Variável injetada pela API
      totalBusinesses: totalBusinessesCount, // Variável injetada pela API
    });
  } catch (error) {
    console.error("Erro ao obter as informações", error);
    res.status(500).json({ message: "Erro ao obter as informações" });
  }
});



///////////////
//Editar perfil
///////////////
// Editar perfil
app.post(
  "/editarUser/:id",
  authorize(["camara", "comerciante", "cidadao"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

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

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API de Tomar",
      version: "1.0.0",
      description: "Documentação dos endpoints da aplicação",
    },
    servers: [
      {
        url: "https://tomar-rg-b0bvd9e7fkdhatbh.westeurope-01.azurewebsites.net",
        description: "Servidor de Produção (Azure)",
      },
      {
        url: "http://localhost:3000",
        description: "Servidor Local (Testes)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./index.js"], // Onde estão os teus ficheiros com as rotas
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Servidor ligado na porta ${PORT}`),
);
