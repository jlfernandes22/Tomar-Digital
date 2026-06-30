// ============================================================================
// Tomar+Digital API
// Description: Backend server handling authentication, business management, 
//              gamification (QR Code/OCR), favorites, and municipal dashboards.
// ============================================================================

// 1. Load environment variables first
import "dotenv/config"; 

// 2. Third-party dependencies
import express from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import sharp from "sharp";
import Tesseract from "tesseract.js"; // Restored import as requested
import { DocumentAnalysisClient, AzureKeyCredential } from "@azure/ai-form-recognizer";
import nodemailer from "nodemailer";

// 3. Local models, middleware and services
import { sendVerificationEmail, sendPasswordRecoveryEmail } from "./utils/emailService.js";
import User from "./models/User.js";
import Business from "./models/Business.js";
import Favorite from "./models/Favorite.js";
import Campaign from "./models/Campaign.js";
import Cae from "./models/Cae.js";
import Invoice from "./models/Invoice.js";
import PedidosComerciante from "./models/PedidosComerciante.js";
import CitiesAndCountries from "./models/CitiesAndCountries.js";
import { authorize } from "./middleware/auth.js";

// ============================================================================
// 1. SERVER CONFIGURATION & MIDDLEWARES
// ============================================================================

const app = express();
const SECRET_KEY = process.env.JWT_SECRET;

// Email Transporter Setup (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tomardigitalsuporte@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

// Database Connection URI
const dbURI = process.env.MONGO_URI || "mongodb://localhost:27017/tomar_db";

// Core Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' })); // 20mb limit to support high-res PDFs/images
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per minute
  message: { message: "Too many attempts. Please wait 1 minute." }
});

// Multer Configuration (File Uploads Staging)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let targetFolder = 'uploads/';
    if (file.mimetype === 'application/pdf') targetFolder = 'uploads/pdfs/';
    else if (file.mimetype.startsWith('image/')) targetFolder = 'uploads/imagens/';

    if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });
    cb(null, targetFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
const uploadMemory = multer({ storage: multer.memoryStorage() });

// Database Connection
mongoose.connect(dbURI)
  .then(() => console.log("Successfully connected to the Database."))
  .catch((err) => console.error("Database Connection Error: ", err));

// ============================================================================
// 2. SWAGGER DOCUMENTATION SETUP
// ============================================================================

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Tomar+Digital API",
      version: "1.0.0",
      description: "Official API documentation for the Tomar+Digital civic-tech platform.",
    },
    // Explicitly define tags here to control grouping and order in the Swagger UI
    tags: [
      { name: "Auth", description: "Authentication and session management" },
      { name: "Users", description: "User profile and account management" },
      { name: "Businesses", description: "Business registration and management" },
      { name: "Favorites", description: "User favorite businesses" },
      { name: "Merchant Applications", description: "Citizen applications to become merchants" },
      { name: "Invoices & Gamification", description: "Invoice processing (QR/OCR) and points system" },
      { name: "Campaigns", description: "Campaign creation and management" },
      { name: "Dashboard", description: "Municipal analytics and statistics" },
    ],
    servers: [
      { url: "https://tomar-rg-b0bvd9e7fkdhatbh.westeurope-01.azurewebsites.net", description: "Production (Azure)" },
      { url: "http://localhost:3000", description: "Local Development Server" },
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

// ============================================================================
// 3. AUTHENTICATION & USER MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /registar:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - city
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               city: { type: string }
 *               name: { type: string }
 *     responses:
 *       200: { description: Registration successful, verification email sent. }
 *       400: { description: Invalid input or user already exists. }
 *       500: { description: Server error. }
 */
app.post("/registar", strictLimiter, async (req, res) => {
  try {
    const { password, city, nif } = req.body;
    const rawEmail = req.body.email;
    let validNIF = null

    if (!rawEmail || !password || !city) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

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

    console.log(validarNIF(nif))

    if (nif != null && validarNIF(nif)){
      
      validNIF = nif
    } 

    const email = rawEmail.toLowerCase().trim();
    const name = req.body.name || email;
    
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const cidadeExiste = await CitiesAndCountries.findOne({ 
      name: { $regex: new RegExp(`^${city}$`, 'i') } 
    }); 
    if (!cidadeExiste) {
      return res.status(400).json({ message: "The selected city is not valid or does not exist in the system." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); 
    const existingUser = await User.findOne({ email });
    const cidadeParaGuardar = cidadeExiste.name; 
    
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "This email is already associated with another account." });
      } else {
        existingUser.name = name;
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.city = cidadeParaGuardar; 
        existingUser.codigoValidar = code;
        await existingUser.save();
      }
    } else {
      if(validNIF!=null){
        const newUser = new User({ 
          name, email, 
          password: await bcrypt.hash(password, 10), 
          city: cidadeParaGuardar, 
          codigoValidar: code, 
          isVerified: false,
          NIF: validNIF
        });
      await newUser.save();
      }else{
      const newUser = new User({ 
        name, email, 
        password: await bcrypt.hash(password, 10), 
        city: cidadeParaGuardar, 
        codigoValidar: code, 
        isVerified: false,
        NIF:null
      });
      await newUser.save();
      }
    }
    
    await sendVerificationEmail(transporter, { to: email, code, name });

    return res.status(200).json({ message: "Registration completed successfully." });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ message: "Internal server error during registration." });
  }
});

/**
 * @swagger
 * /verificar-codigo:
 *   post:
 *     summary: Verify user email with code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *           properties:
 *             email: { type: string }
 *             code: { type: string }
 *   responses:
 *     200: { description: Account validated successfully. }
 *     400: { description: Invalid code or user not found. }
 */
app.post("/verificar-codigo", strictLimiter, async (req, res) => {
  const rawEmail = req.body.email;
  const email = rawEmail.toLowerCase().trim();
  const code = req.body.code;
  const user = await User.findOne({ email: email });

  if (!user) return res.status(400).json({ message: "User not found." });
  if (user.codigoValidar !== code) return res.status(400).json({ message: "Invalid code." });

  user.isVerified = true;
  user.codigoValidar = null;
  await user.save();

  return res.status(200).json({ message: "Account validated successfully!" });
});

/**
 * @swagger
 * /iniciarSessao:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *           properties:
 *             email: { type: string }
 *             password: { type: string }
 *   responses:
 *     200: { description: Login successful, returns JWT token. }
 *     400: { description: Invalid credentials. }
 */
app.post("/iniciarSessao", strictLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) return res.status(400).json({ message: "Account does not exist." });
    if(!user.isVerified) return res.status(400).json({ message: "Please validate your account first." });

    const rightPassword = await bcrypt.compare(password, user.password);
    if (!rightPassword) return res.status(400).json({ message: "Wrong password." });

    const token = jwt.sign(
      { id: user._id, role: user.role, acceptedInvoiceTerms: user.acceptedInvoiceTerms },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      userId: user._id,
      user: {
        name: user.name, email: user.email, Points: user.Points,
        role: user.role, city: user.city, NIF: user.NIF,
        acceptedInvoiceTerms: user.acceptedInvoiceTerms, Avatar: user.Avatar,
      },
    });
  } catch (err) {
    console.error("Login Error: ", err);
    res.status(400).json({ message: "Error during login." });
  }
});

// ============================================================================
// PASSWORD RECOVERY ROUTES
// ============================================================================

/**
 * @swagger
 * /recuperarPassword:
 *   post:
 *     summary: Request a password recovery code
 *   tags: [Auth]
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required:
 *             - email
 *           properties:
 *             email: { type: string }
 *   responses:
 *     200: { description: Recovery code sent successfully. }
 *     404: { description: User not found. }
 *     500: { description: Server error. }
 */
app.post("/recuperarPassword", strictLimiter, async (req, res) => {
  try {
    const rawEmail = req.body.email;
    const email = rawEmail ? rawEmail.toLowerCase().trim() : "";

    const user = await User.findOne({ email });
    if (!user) {
      // SECURITY BEST PRACTICE: Don't reveal if the email exists or not.
      return res.status(200).json({ message: "Se o email existir, um código foi enviado." });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set code and expiration (15 minutes from now)
    user.codigoResetPassword = code;
    user.codigoResetExpira = new Date(Date.now() + 15 * 60 * 1000); 
    await user.save();

    // Send branded recovery email
    await sendPasswordRecoveryEmail(transporter, { to: email, code, name: user.name });

    return res.status(200).json({ message: "Se o email existir, um código foi enviado." });
  } catch (error) {
    console.error("Password Recovery Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

/**
 * @swagger
 * /alterarPassword:
 *   post:
 *     summary: Reset password using the recovery code
 *   tags: [Auth]
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required:
 *             - email
 *             - code
 *             - newPassword
 *           properties:
 *             email: { type: string }
 *             code: { type: string }
 *             newPassword: { type: string }
 *   responses:
 *     200: { description: Password updated successfully. }
 *     400: { description: Invalid or expired code. }
 *     500: { description: Server error. }
 */
app.post("/alterarPassword", strictLimiter, async (req, res) => {
  try {
    const { code, newPassword } = req.body;
    const rawEmail = req.body.email;
    const email = rawEmail ? rawEmail.toLowerCase().trim() : "";

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Utilizador não encontrado." });
    }

    // Check if code exists and matches
    if (!user.codigoResetPassword || user.codigoResetPassword !== code) {
      return res.status(400).json({ message: "Código de recuperação inválido." });
    }

    // Check if code has expired
    if (new Date() > user.codigoResetExpira) {
      return res.status(400).json({ message: "O código de recuperação expirou." });
    }

    // Validate new password strength (same regex as registration)
    const isSecure = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(newPassword);
    if (!isSecure) {
      return res.status(400).json({ message: "A palavra-passe deve ter pelo menos 8 caracteres, uma maiúscula, um número e um caractere especial." });
    }

    // Update password and clear reset fields
    user.password = await bcrypt.hash(newPassword, 10);
    user.codigoResetPassword = null;
    user.codigoResetExpira = null;
    await user.save();

    return res.status(200).json({ message: "Palavra-passe alterada com sucesso!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

/**
 * @swagger
 * /aceitarTermosFatura:
 *   post:
 *     summary: Accept or revoke invoice processing terms
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             acceptedInvoiceTerms: { type: boolean }
 *   responses:
 *     200: { description: Terms updated successfully. }
 *     500: { description: Server error. }
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
    if (!user) return res.status(404).json({ message: "User not found." });
    
    res.status(200).json({
      message: valueToSet ? "Terms accepted successfully." : "Consent revoked successfully.",
      acceptedInvoiceTerms: valueToSet
    });
  } catch (error) {
    console.error("Error updating terms:", error);
    res.status(500).json({ message: "Error updating terms." });
  }
});

/**
 * @swagger
 * /utilizadores:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     responses:
 *       200: { description: List of all users. }
 */
app.get("/utilizadores", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

/**
 * @swagger
 * /utilizador/{id}:
 *   get:
 *     summary: Get owners of pending businesses (City Council only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *   responses:
 *     200: { description: List of pending business owners. }
 *     403: { description: Unauthorized. }
 */
app.get("/utilizador/:id", authorize(["camara"]), async (req, res) => {
  try {
    const pendentes = await Business.find({ status: "pendente" });
    const ownerIds = pendentes.map((negocio) => negocio.owner);
    const owners = await User.find({ _id: { $in: ownerIds } });
    res.json(owners);
  } catch (error) {
    console.error("Error fetching owners:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

/**
 * @swagger
 * /editarUser/{id}:
 *   post:
 *     summary: Update user profile and avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               city: { type: string }
 *               NIF: { type: string }
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200: { description: Profile updated successfully. }
 *       500: { description: Server error. }
 */
app.post("/editarUser/:id", authorize(["camara", "comerciante", "cidadao"]), upload.single("avatar"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const { name: receivedName, city: receivedCity, NIF: receivedNIF } = req.body;

    if (user.name !== receivedName) user.name = receivedName;
    if (user.city !== receivedCity) user.city = receivedCity;
   

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

    if (!validarNIF(receivedNIF) ) {
      return res.status(400).json({ message: "The NIF inserted is not valid" });
    }
    if (receivedNIF === "999999990") {
      return res.status(400).json({ message: "Invoices issued to 'Consumidor Final' cannot earn points." });
    }
    if (receivedNIF != null && validarNIF(receivedNIF)){
     user.NIF = receivedNIF
    } 


    if (req.file) {
      if (user.Avatar && user.Avatar.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), user.Avatar.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const nomeSemExtensao = path.parse(req.file.filename).name;
      const webpFilename = `${nomeSemExtensao}_avatar.webp`;
      const targetPath = path.join('uploads/imagens/', webpFilename);

      try {
        await sharp(req.file.path)
          .resize({ width: 400, height: 400, fit: 'cover' })
          .toFormat('webp')
          .webp({ quality: 80 })
          .toFile(targetPath);
        user.Avatar = `/uploads/imagens/${webpFilename}`;
      } finally {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    }

    await user.save();
    res.status(200).json({ 
      message: "Changes saved successfully!",
      user: { name: user.name, city: user.city, NIF: user.NIF, avatar: user.Avatar }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating information." });
  }
});

// ============================================================================
// 5. BUSINESS MANAGEMENT ROUTES
// ============================================================================

const uploadBusiness = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'galeria', maxCount: 10 }
]);

/**
 * @swagger
 * /registarNegocio:
 *   post:
 *     summary: Register a new business
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nomeNegocio: { type: string }
 *               categoriaNegocio: { type: string }
 *               telefoneDono: { type: string }
 *               emailDono: { type: string }
 *               listaCAES: { type: string } # JSON string array
 *               localizacao: { type: string } # JSON string object
 *               logo: { type: string, format: binary }
 *               galeria: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       201: { description: Business registered successfully. }
 *       400: { description: Missing required data. }
 *       500: { description: Server error. }
 */
app.post("/registarNegocio", authorize(["comerciante", "camara"]), uploadBusiness, async (req, res) => {
  try {
    const { nomeNegocio, NIFnegocio, categoriaNegocio, moradaNegocio, freguesiaNegocio, localizacao, telefoneDono, emailDono, descricaoNegocio, listaCAES, owner } = req.body;

    if (!nomeNegocio || !categoriaNegocio || !localizacao || !telefoneDono || !emailDono) {
      return res.status(400).json({ message: "Essential data is missing." });
    }

    const telefoneLimpo = telefoneDono ? telefoneDono.replace(/\s+/g, '') : '';
    const telefoneRegex = /^(?:(?:\+|00)351)?[29]\d{8}$/;
    if (!telefoneLimpo || !telefoneRegex.test(telefoneLimpo)) {
      return res.status(400).json({ error: "Invalid phone number. Must be a valid Portuguese number." });
    }

    let parsedLocalizacao = localizacao ? (typeof localizacao === 'string' ? JSON.parse(localizacao) : localizacao) : null;
    let parsedCAES = listaCAES ? (typeof listaCAES === 'string' ? JSON.parse(listaCAES) : listaCAES) : [];
    const uniqueCAES = [...new Set(parsedCAES)];

    if (uniqueCAES.length > 0) {
      const caesComoNumeros = uniqueCAES.map(c => Number(c));
      const caesEncontrados = await Cae.find({ $or: [{ cae: { $in: uniqueCAES } }, { cae: { $in: caesComoNumeros } }] });
      if (caesEncontrados.length !== uniqueCAES.length) {
        const codigosEncontrados = caesEncontrados.map(c => c.cae);
        const caesInvalidos = uniqueCAES.filter(c => !codigosEncontrados.includes(c));
        return res.status(400).json({ error: "One or more CAE codes provided do not exist in the system.", invalidCAEs: caesInvalidos });
      }
    } else {
      return res.status(400).json({ error: "The CAE list cannot be empty." });
    }

    let logoUrl = "";
    let galeriaUrls = [];
    
    if (req.files && req.files['logo'] && req.files['logo'][0]) {
      const logoFile = req.files['logo'][0];
      const nomeSemExtensao = path.parse(logoFile.filename).name;
      const webpFilename = `${Date.now()}-${nomeSemExtensao}_logo.webp`;
      const logoTargetPath = path.join('uploads/imagens/', webpFilename);

      try {
        await sharp(logoFile.path).resize({ width: 800 }).toFormat('webp').webp({ quality: 80 }).toFile(logoTargetPath);
        logoUrl = `/uploads/imagens/${webpFilename}`;
      } catch (e) {
        try { fs.unlinkSync(logoFile.path); } catch (err) {}
        return res.status(500).json({ message: "Error processing business logo." });
      }
      try { fs.unlinkSync(logoFile.path); } catch (e) {}
    }

    if (req.files && req.files['galeria'] && req.files['galeria'].length > 0) {
      for (const fotoFile of req.files['galeria']) {
        const nomeSemExtensao = path.parse(fotoFile.filename).name;
        const webpFilename = `${Date.now()}-${nomeSemExtensao}_gallery.webp`;
        const fotoTargetPath = path.join('uploads/imagens/', webpFilename);
        try {
          await sharp(fotoFile.path).resize({ width: 1080 }).toFormat('webp').webp({ quality: 80 }).toFile(fotoTargetPath);
          galeriaUrls.push(`/uploads/imagens/${webpFilename}`);
        } catch (e) {
          console.error("Error processing gallery photo:", e);
        }
        try { fs.unlinkSync(fotoFile.path); } catch (e) {}
      }
    }

    if (galeriaUrls.length === 0) {
       return res.status(400).json({ message: "At least one photo for the business gallery is mandatory." });
    }

    const ownerId = req.user.role === "camara" ? owner || req.user.id : req.user.id;
    const novoNegocio = new Business({
      name: nomeNegocio, category: categoriaNegocio, NIF: NIFnegocio, logo: logoUrl, 
      address: moradaNegocio, parish: freguesiaNegocio,
      location: parsedLocalizacao ? { lat: Number(parsedLocalizacao.latitude), long: Number(parsedLocalizacao.longitude) } : undefined,
      phone: telefoneDono, email: emailDono, listaCAES: uniqueCAES, description: descricaoNegocio, 
      gallery: galeriaUrls, owner: ownerId,
      status: req.user.role === "camara" ? "aprovado" : "pendente"
    });

    await novoNegocio.save();
    res.status(201).json({ message: "Business registered successfully!", business: novoNegocio });
  } catch (error) {
    console.error("Business Registration Error:", error);
    res.status(500).json({ message: "Internal server error registering business." });
  }
});

/**
 * @swagger
 * /negocios:
 *   get:
 *     summary: Get all approved businesses
 *     tags: [Businesses]
 *     responses:
 *       200: { description: List of businesses. }
 */
app.get("/negocios", async (req, res) => {
  try {
    const negocios = await Business.find({ status: "aprovado" });
    res.json(negocios);
  } catch (error) {
    res.status(500).json({ message: "Error fetching businesses." });
  }
});

/**
 * @swagger
 * /negocios/{id}:
 *   get:
 *     summary: Get business details by ID
 *     tags: [Businesses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Business details. }
 *       404: { description: Business not found. }
 */
app.get("/negocios/:id", async (req, res) => {
  try {
    const negocio = await Business.findById(req.params.id).populate({ path: 'campaigns.campaign', model: 'Campaign' });
    if (!negocio) return res.status(404).json({ message: "Business not found." });
    res.json(negocio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error finding business ID." });
  }
});

/**
 * @swagger
 * /apagarNegocio/{id}:
 *   delete:
 *     summary: Delete a business and its associated files (City Council only)
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Business deleted successfully. }
 *       404: { description: Business not found. }
 */
app.delete("/apagarNegocio/:id", authorize(["camara"]), async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ error: "Business not found." });

    // Delete logo from disk
    if (business.logo) {
      const logoPath = path.join(process.cwd(), business.logo.replace(/^\//, ''));
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    }

    // Delete gallery photos from disk
    if (business.gallery && business.gallery.length > 0) {
      business.gallery.forEach(fotoUrl => {
        const fotoPath = path.join(process.cwd(), fotoUrl.replace(/^\//, ''));
        if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
      });
    }

    await business.deleteOne();
    res.status(200).json({ success: "Business deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete business." });
  }
});

/**
 * @swagger
 * /meusNegocios:
 *   get:
 *     summary: Get businesses owned by the logged-in merchant
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of user's businesses. }
 */
app.get("/meusNegocios", authorize(["comerciante"]), async (req, res) => {
  try {
    const negocios = await Business.find({ owner: req.user.id, status: "aprovado" }).populate("owner", "name");
    res.status(200).json(negocios || []);
  } catch (error) {
    console.error("Error in /meusNegocios:", error);
    res.status(500).json({ message: "Error fetching businesses." });
  }
});

/**
 * @swagger
 * /negociosCae:
 *   get:
 *     summary: Get businesses filtered by CAE code
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cae
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of businesses matching the CAE. }
 *       500: { description: Server error. }
 */
app.get("/negociosCae", authorize(["comerciante"]), async (req, res) => {
  let { cae } = req.query;
  if (Array.isArray(cae)) cae = cae[0];
  const caeLimpo = String(cae).replace(/[\[\]"']/g, '').trim();

  try {
    const negocios = await Business.find({ 
      owner: req.user.id,
      listaCAES: caeLimpo 
    });
    res.json(negocios);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ message: "Error searching businesses" });
  }
});

/**
 * @swagger
 * /business/aprovar/{id}:
 *   post:
 *     summary: Approve a pending business (City Council only)
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Business approved. }
 *       404: { description: Business not found. }
 */
app.post("/business/aprovar/:id", authorize(["camara"]), async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(req.params.id, { status: "aprovado" }, { returnDocument: 'after' });
    if (!business) return res.status(404).json({ message: "Business not found." });
    res.json({ message: "Business approved successfully!", business });
  } catch (error) {
    res.status(500).json({ message: "Error approving business." });
  }
});

/**
 * @swagger
 * /business/rejeitar/{id}:
 *   delete:
 *     summary: Reject/Delete a pending business (City Council only)
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Business discarded. }
 */
app.delete("/business/rejeitar/:id", authorize(["camara"]), async (req, res) => {
  try {
    await Business.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Business discarded successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error discarding business." });
  }
});

/**
 * @swagger
 * /business/pendentes:
 *   get:
 *     summary: List all pending businesses (City Council only)
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of pending businesses. }
 */
app.get("/business/pendentes", authorize(["camara"]), async (req, res) => {
  try {
    const lista = await Business.find({ status: "pendente" });
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ message: "Error loading pending list." });
  }
});

// ============================================================================
// 6. FAVORITES ROUTES
// ============================================================================

/**
 * @swagger
 * /guardarFavorito:
 *   post:
 *     summary: Add a business to favorites
 *     tags: [Favorites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - businessId
 *             properties:
 *               userId: { type: string }
 *               businessId: { type: string }
 *     responses:
 *       200: { description: Added to favorites successfully. }
 *       400: { description: Already in favorites. }
 *       500: { description: Server error. }
 */
app.post("/guardarFavorito", async (req, res) => {
  const { userId, businessId } = req.body;
  try {
    const existe = await Favorite.findOne({ userId, businessId });
    if (existe) return res.status(400).json({ message: "Already in favorites list." });

    const novoFavorito = new Favorite({ userId, businessId });
    await novoFavorito.save();
    res.status(200).json({ message: "Added to favorites successfully!" });
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/**
 * @swagger
 * /retirarFavorito:
 *   post:
 *     summary: Remove a business from favorites
 *     tags: [Favorites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - businessId
 *             properties:
 *               userId: { type: string }
 *               businessId: { type: string }
 *     responses:
 *       200: { description: Removed from favorites successfully. }
 *       404: { description: Favorite not found. }
 *       500: { description: Server error. }
 */
app.post("/retirarFavorito", async (req, res) => {
  const { userId, businessId } = req.body;
  try {
    const resultado = await Favorite.findOneAndDelete({ userId, businessId });
    if (!resultado) return res.status(404).json({ message: "Favorite not found." });
    res.status(200).json({ message: "Removed from favorites successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error removing favorite.", error: err });
  }
});

/**
 * @swagger
 * /meusFavoritos/{userId}:
 *   get:
 *     summary: Get a user's favorite businesses
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of favorite businesses. }
 *       500: { description: Server error. }
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

// ============================================================================
// 7. MERCHANT APPLICATION ROUTES
// ============================================================================

/**
 * @swagger
 * /pedidoComerciante:
 *   post:
 *     summary: Citizen applies to become a merchant
 *     tags: [Merchant Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               tituloComercio: { type: string }
 *               donoComercio: { type: string }
 *               emailDono: { type: string }
 *               telefoneDono: { type: string }
 *               documentoPDF: { type: string, format: binary }
 *     responses:
 *       200: { description: Application submitted successfully. }
 *       400: { description: PDF document is mandatory. }
 *       500: { description: Server error. }
 */
app.post("/pedidoComerciante", authorize(["cidadao"]), upload.single('documentoPDF'), async (req, res) => {
  try {
    const { tituloComercio, donoComercio, emailDono, telefoneDono } = req.body;
    if (!req.file) return res.status(400).json({ message: "The PDF document is mandatory." });

    const newPedidoComerciante = new PedidosComerciante({
      tituloComercio, donoComercio, emailDono, telefoneDono,
      documentoPdfUrl: `/uploads/pdfs/${req.file.filename}`
    });

    await newPedidoComerciante.save();
    res.status(200).json({ message: "Success!", id: newPedidoComerciante._id });
  } catch (err) {
    console.error("Error (merchant application):", err);
    res.status(500).json({ message: "Error saving application.", details: err.message });
  }
});

/**
 * @swagger
 * /obter/PedidosComerciante:
 *   get:
 *     summary: List all merchant applications (City Council only)
 *     tags: [Merchant Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of merchant applications. }
 *       500: { description: Server error. }
 */
app.get("/obter/PedidosComerciante", authorize(["camara"]), async (req, res) => {
  try {
    const pedidosComerciante = await PedidosComerciante.find().lean();
    res.json(pedidosComerciante);
  } catch (error) {
    res.status(500).json({ message: "Error fetching applications." });
  }
});

/**
 * @swagger
 * /aprovar/PedidoComerciante/{id}:
 *   post:
 *     summary: Approve merchant application and upgrade user role
 *     tags: [Merchant Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User upgraded to merchant. }
 *       404: { description: Application or User not found. }
 */
app.post("/aprovar/PedidoComerciante/:id", authorize(["camara"]), async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await PedidosComerciante.findById(id);
    if (!pedido) return res.status(404).json({ message: "Application not found." });

    const utilizador = await User.findOne({ email: pedido.emailDono });
    if (!utilizador) return res.status(404).json({ message: "User associated with application not found." });

    utilizador.role = "comerciante";
    await utilizador.save();

    // RGPD Compliance: Delete PDF after approval
    if (pedido.documentoPdfUrl) {
      const relativePath = pedido.documentoPdfUrl.replace(/^\//, '');
      const filePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pedido.deleteOne();
    res.status(200).json({ message: "Application approved! User is now a merchant.", user: { id: utilizador._id, name: utilizador.name, role: utilizador.role } });
  } catch (err) {
    console.error("Error approving application:", err);
    res.status(500).json({ message: "Internal server error approving application", details: err.message });
  }
});

/**
 * @swagger
 * /apagarPedidoComerciante/{id}:
 *   delete:
 *     summary: Delete/Reject merchant application and PDF (RGPD)
 *     tags: [Merchant Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Application rejected and deleted successfully. }
 *       404: { description: Application not found. }
 */
app.delete("/apagarPedidoComerciante/:id", authorize(["camara"]), async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await PedidosComerciante.findById(id);

    if (!pedido) return res.status(404).json({ message: "Application not found." });

    // RGPD: Clean up file system
    if (pedido.documentoPdfUrl) {
      const relativePath = pedido.documentoPdfUrl.replace(/^\//, '');
      const filePath = path.join(process.cwd(), relativePath);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`PDF file deleted from disk: ${filePath}`);
        } catch (fsErr) {
          console.error(`Warning: Failed to delete physical file, but DB record will be removed. Error: ${fsErr.message}`);
        }
      }
    }

    await pedido.deleteOne();
    res.status(200).json({ message: "Application rejected and deleted successfully!" });

  } catch (err) {
    console.error("Error deleting application:", err);
    res.status(500).json({ message: "Internal server error deleting application", details: err.message });
  }
});

// ============================================================================
// 8. GAMIFICATION & INVOICE PROCESSING ROUTES (OCR / QR CODE)
// ============================================================================

/**
 * @swagger
 * /lerFatura:
 *   post:
 *     summary: Process invoice QR Code and image to award points
 *     tags: [Invoices & Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - ReceiptImage
 *               - QRCodeData
 *             properties:
 *               ReceiptImage: { type: string, format: binary }
 *               QRCodeData: { type: string }
 *     responses:
 *       200: { description: Invoice processed successfully, points awarded. }
 *       400: { description: Validation error or duplicate invoice. }
 *       429: { description: Daily limit reached. }
 *       500: { description: Server error during processing. }
 */
app.post("/lerFatura", strictLimiter, authorize(["cidadao", "comerciante", "camara"]), upload.single('ReceiptImage'), async (req, res) => {
  try {
    const { QRCodeData } = req.body;
    if (!req.file) return res.status(400).json({ message: "Receipt photo is mandatory." });

    if (!QRCodeData || String(QRCodeData).trim() === "") {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "QR Code not detected. Ensure it is focused." });
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
    const NIFStore = QRCodeFields["A"];
    const NIFClient = QRCodeFields["B"];
    const CountryClient = QRCodeFields["C"];
    const TypeDocument = QRCodeFields["D"];
    const StateDocument = QRCodeFields["E"];
    const BoughtDate = QRCodeFields["F"];
    const SerialNumber = QRCodeFields["G"];
    const CodeATCUD = QRCodeFields["H"];
    const hash = QRCodeFields["Q"];
    const SoftCertNumber = QRCodeFields["R"];
    const RegionTax = QRCodeFields["11"];
    const NoIVAValue = QRCodeFields["L"];
    const AllTaxValue = QRCodeFields["N"];
    const BoughtValue = QRCodeFields["O"];
    const AditionalInfo = QRCodeFields["S"];

    // 1. Compress image in memory before sending to Azure
    const compressedImageBuffer = await sharp(req.file.path)
      .resize({ width: 2500, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const azureEndpoint = process.env.AZURE_VISION_ENDPOINT; 
    const azureKey = process.env.AZURE_VISION_KEY;
    
    const client = new DocumentAnalysisClient(azureEndpoint, new AzureKeyCredential(azureKey));
    const poller = await client.beginAnalyzeDocument("prebuilt-layout", compressedImageBuffer);
    const { pages } = await poller.pollUntilDone();

    let extractedText = "";
    if (pages && pages.length > 0) {
      pages.forEach(page => page.lines.forEach(line => extractedText += line.content + "\n"));
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const ocrDigits = extractedText.replace(/\D/g, '');

    // 2. OCR Resilient Validation: Check if NIF and ATCUD exist in the extracted text
    if (!ocrDigits.includes(NIFClient)) {
      return res.status(400).json({ message: "Client NIF not detected correctly in the photo." });
    }

    const atcudDigits = CodeATCUD.replace(/\D/g, '');
    if (!ocrDigits.includes(atcudDigits)) {
      return res.status(400).json({ message: "ATCUD code not detected correctly in the photo." });
    }

    // 3. Prevent Duplicate Invoices
    const faturaRepetida = await Invoice.findOne({ ATCUD: CodeATCUD, hash: hash });
    if (faturaRepetida) {
      return res.status(400).json({ message: "This invoice has already been scanned." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    // 4. Portuguese NIF Mathematical Validation
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
      return res.status(400).json({ message: "QR Code contains mathematically invalid NIF." });
    }
    if (NIFClient === "999999990") {
      return res.status(400).json({ message: "Invoices issued to 'Consumidor Final' cannot earn points." });
    }
    if (user.NIF !== Number(NIFClient)) {
      return res.status(400).json({ message: "The NIF on this invoice does not belong to your account." });
    }

    // 5. Format Validations
    const atcudRegex = /^[A-Z0-9]+-[0-9]+$/;
    if (!CodeATCUD || !atcudRegex.test(CodeATCUD) || CodeATCUD.length < 10) {
      return res.status(400).json({ message: "Invalid ATCUD format." });
    }
    const documentosElegiveis = ["FT", "FS", "FR"];
    if (!TypeDocument || !documentosElegiveis.includes(TypeDocument.toUpperCase())) {
      return res.status(400).json({ message: "This document type is not valid for points." });
    }
    if (!StateDocument || StateDocument.toUpperCase() !== "N") {
      return res.status(400).json({ message: "Only 'Normal' state invoices can earn points." });
    }
    if (BoughtValue < 1) {
      return res.status(400).json({ message: "Amount spent is less than 1€." });
    }

    // 6. Campaign Eligibility Check
    const store = await Business.findOne({ NIF: Number(NIFStore) }).populate("campaigns.campaign");
    if (!store) return res.status(404).json({ message: "This store is not registered in the app." });
    
    const activeCampaignEntry = store.campaigns.find((entry) => {
      if (entry.status !== "aprovado") return false;
      const camp = entry.campaign;
      if (!camp || camp.status !== "ativa") return false;
      const hoje = new Date();
      if (hoje > camp.expirationDate) return false;
      return true;
    });
    
    if (!activeCampaignEntry) {
      return res.status(400).json({ message: "This store has no active points campaign at the moment." });
    }

    // 7. Gamification Rate Limiting (20 invoices per day)
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);
    const faturasLidasHoje = await Invoice.countDocuments({ user: user._id, createdAt: { $gte: inicioDoDia } });
    if (faturasLidasHoje >= 20) {
      return res.status(429).json({ message: "Daily limit reached. You can only register 20 invoices per day." });
    }

    // 8. Date Validation
    const invoiceYear = parseInt(BoughtDate.substring(0, 4));
    const invoiceMonth = parseInt(BoughtDate.substring(4, 6)) - 1;
    const invoiceDay = parseInt(BoughtDate.substring(6, 8));
    const dataDaFatura = new Date(invoiceYear, invoiceMonth, invoiceDay);
    if (dataDaFatura > new Date()) {
      return res.status(400).json({ message: "Invoice date cannot be in the future." });
    }

    // 9. Persist Data & Award Points
    const pointsDeserved = Math.trunc(BoughtValue);
    user.Points += pointsDeserved;
    await user.save();

    await Invoice.create({
      user: user._id, business: store._id, ATCUD: CodeATCUD, hash: hash, amount: BoughtValue, purchaseDate: BoughtDate,
    });

    return res.status(200).json({
      sucesso: "Invoice processed successfully!",
      pontosGanhos: pointsDeserved,
      saldoAtual: user.Points,
    });
  } catch (error) {
    console.error("Invoice Processing Error:", error);
    return res.status(500).json({ erro: "Internal server error processing invoice." });
  }
});

// ============================================================================
// 9. CAMPAIGN MANAGEMENT ROUTES
// ============================================================================

const uploadCampanha = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'panfleto', maxCount: 1 }
]);

/**
 * @swagger
 * /criarCampanha:
 *   post:
 *     summary: Create a new campaign (City Council only)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo: { type: string }
 *               slogan: { type: string }
 *               descricao: { type: string }
 *               listaCAES: { type: string } # JSON string array
 *               dataInicio: { type: string }
 *               dataExpiracao: { type: string }
 *               normas: { type: string }
 *               packs: { type: string } # JSON string array
 *               logo: { type: string, format: binary }
 *               panfleto: { type: string, format: binary }
 *     responses:
 *       200: { description: Campaign created successfully. }
 *       500: { description: Server error. }
 */
app.post("/criarCampanha", authorize(["camara"]), uploadCampanha, async (req, res) => {
  try {
    const { titulo, slogan, descricao, listaCAES, dataInicio, dataExpiracao, normas, packs } = req.body;

    let parsedPacks = packs ? (typeof packs === 'string' ? JSON.parse(packs) : packs) : [];
    let parsedCAES = listaCAES ? (typeof listaCAES === 'string' ? JSON.parse(listaCAES) : listaCAES) : [];

    let logoUrl = "";
    let panfletoUrl = "";

    // Process Logo
    if (req.files && req.files['logo'] && req.files['logo'][0]) {
      const logoFile = req.files['logo'][0];
      const nomeSemExtensao = path.parse(logoFile.filename).name;
      const webpFilename = `${Date.now()}-${nomeSemExtensao}_logo.webp`;
      const logoTargetPath = path.join('uploads/imagens/', webpFilename);
      
      try {
        await sharp(logoFile.path).resize({ width: 800 }).toFormat('webp').webp({ quality: 80 }).toFile(logoTargetPath);
        logoUrl = `/uploads/imagens/${webpFilename}`;
      } catch (e) {
        try { fs.unlinkSync(logoFile.path); } catch (err) {}
        return res.status(500).json({ message: "Error processing campaign logo." });
      }
      try { fs.unlinkSync(logoFile.path); } catch (e) {}
    } 

    // Process Flyer
    if (req.files && req.files['panfleto'] && req.files['panfleto'][0]) {
      const panfletoFile = req.files['panfleto'][0];
      const nomeSemExtensao = path.parse(panfletoFile.filename).name;
      const webpFilename = `${Date.now()}-${nomeSemExtensao}_flyer.webp`;
      const panfletoTargetPath = path.join('uploads/imagens/', webpFilename);

      try {
        await sharp(panfletoFile.path).resize({ width: 800 }).toFormat('webp').webp({ quality: 80 }).toFile(panfletoTargetPath);
        panfletoUrl = `/uploads/imagens/${webpFilename}`;
      } catch (e) {
        try { fs.unlinkSync(panfletoFile.path); } catch (err) {}
        return res.status(500).json({ message: "Error processing flyer." });
      }
      try { fs.unlinkSync(panfletoFile.path); } catch (e) {}
    }

    const newCampaign = new Campaign({
      createdBy: req.user.id, titulo, slogan, descricao, listaCAES: parsedCAES, 
      dataInicio: dataInicio ? new Date(dataInicio) : undefined, 
      DataExpiracao: dataExpiracao ? new Date(dataExpiracao) : undefined,
      normas, packs: parsedPacks, logo: logoUrl, panfleto: panfletoUrl
    });
    
    await newCampaign.save();
    return res.status(200).json({ message: "Campaign created successfully!", id: newCampaign._id });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ message: "Internal server error processing campaign." });
  }
});

/**
 * @swagger
 * /listaCampanhas:
 *   get:
 *     summary: List all campaigns
 *     tags: [Campaigns]
 *     responses:
 *       200: { description: List of campaigns. }
 *       500: { description: Server error. }
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
    res.status(500).json("Error listing campaigns.");
  }
});

/**
 * @swagger
 * /campanhas/aderir:
 *   post:
 *     summary: Merchant applies a business to a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *               - campaignId
 *             properties:
 *               businessId: { type: string }
 *               campaignId: { type: string }
 *     responses:
 *       200: { description: Application sent successfully. }
 *       400: { description: Already applied. }
 *       404: { description: Business not found. }
 */
app.post("/campanhas/aderir", authorize(["comerciante"]), async (req, res) => {
  const { businessId, campaignId } = req.body;
  try {
    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Business not found." });

    const jaAderiu = business.campaigns.find(c => c.campaign.toString() === campaignId);
    if (jaAderiu) return res.status(400).json({ message: "Application already submitted for this business." });

    business.campaigns.push({ campaign: campaignId, status: "pendente", requestDate: new Date() });
    await business.save();
    return res.status(200).json({ message: "Application sent successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

/**
 * @swagger
 * /campanhas/comerciante-disponiveis:
 *   get:
 *     summary: List campaigns matching merchant's CAEs
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of compatible campaigns. }
 *       500: { description: Server error. }
 */
app.get("/campanhas/comerciante-disponiveis", authorize(["comerciante"]), async (req, res) => {
  try {
    const hoje = new Date();
    const ownerId = req.user.id;
    
    const meusNegocios = await Business.find({ owner: ownerId, status: "aprovado" });
    const todosOsMeusCaes = [...new Set(meusNegocios.flatMap(n => n.listaCAES || []))];

    const campanhas = await Campaign.find({
        DataInicio: { $lte: hoje },
        DataExpiracao: { $gte: hoje },
        listaCAES: { $in: todosOsMeusCaes },
    });

    return res.status(200).json(campanhas);
  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ message: "Error fetching compatible campaigns." });
  }
});

/**
 * @swagger
 * /candidaturasCampanha:
 *   get:
 *     summary: List all pending campaign applications (City Council only)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of pending campaign applications. }
 *       500: { description: Server error. }
 */
app.get("/candidaturasCampanha", authorize(["camara"]), async (req, res) => {
  try {
    const businesses = await Business.find({}).populate('campaigns.campaign');
    let candidaturas = [];
    
    businesses.forEach(business => {
      business.campaigns.forEach(cap => {
        if (cap.status === "pendente") {
          candidaturas.push({
            businessId: business._id,
            businessName: business.name,
            campaignId: cap.campaign._id,
            campaignTitle: cap.campaign.titulo, 
            requestDate: cap.requestDate
          });
        }
      });
    });

    res.json(candidaturas);
  } catch (error) {
    res.status(500).json({ message: "Error fetching applications." });
  }
});

/**
 * @swagger
 * /decidirAdesaoCampanha:
 *   post:
 *     summary: City Council approves or rejects campaign application
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *               - campaignId
 *               - acao
 *             properties:
 *               businessId: { type: string }
 *               campaignId: { type: string }
 *               acao: { type: string, enum: [aprovado, rejeitado] }
 *     responses:
 *       200: { description: Application evaluated successfully. }
 *       400: { description: Invalid data. }
 *       404: { description: Business or application not found. }
 */
app.post("/decidirAdesaoCampanha", authorize(["camara"]), async (req, res) => {
  try {
    const { businessId, campaignId, acao } = req.body; 
    if (!businessId || !campaignId || !["aprovado", "rejeitado"].includes(acao)) {
      return res.status(400).json({ message: "Invalid data. Action must be 'aprovado' or 'rejeitado'." });
    }

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Business not found." });

    const candidatura = business.campaigns.find((c) => c.campaign.toString() === campaignId.toString());
    if (!candidatura) return res.status(404).json({ message: "Application not found in this business." });

    candidatura.status = acao;
    await business.save();

    return res.status(200).json({ success: true, message: `Application evaluated successfully as: ${acao}.` });
  } catch (error) {
    console.error("Error saving council decision:", error);
    res.status(500).json({ message: "Internal server error saving decision." });
  }
});

// ============================================================================
// 10. DASHBOARD & ANALYTICS ROUTES
// ============================================================================

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get statistics for the City Council dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Statistical data retrieved successfully. }
 *       500: { description: Server error. }
 */
app.get("/dashboard", authorize(["camara"]), async (req, res) => {
  try {
    const [cityAndCountryStats, businessByCategory, totalUsersCount, totalBusinessesCount] = await Promise.all([
      User.aggregate([
        { $group: { _id: "$city", total: { $sum: 1 } } },
        { $lookup: { from: CitiesAndCountries.collection.name, localField: "_id", foreignField: "name", as: "locationData" } },
        { $unwind: { path: "$locationData", preserveNullAndEmptyArrays: false } },
        { $project: { city: "$_id", country: "$locationData.country_name", total: 1 } }
      ]),
      Business.aggregate([{ $group: { _id: "$category", total: { $sum: 1 } } }]),
      User.countDocuments(),
      Business.countDocuments()
    ]);

    const usersByCity = [];
    const countryMap = {};

    cityAndCountryStats.forEach(stat => {
      if (stat.country === "Portugal") usersByCity.push({ _id: stat.city, total: stat.total });
      countryMap[stat.country] = (countryMap[stat.country] || 0) + stat.total;
    });

    const usersByCountry = Object.keys(countryMap).map(key => ({ _id: key, total: countryMap[key] }));

    res.status(200).json({
      cities: usersByCity,
      countries: usersByCountry,
      categories: businessByCategory,
      totalUsers: totalUsersCount,
      totalBusinesses: totalBusinessesCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving information." });
  }
});

// ============================================================================
// 11. SERVER INITIALIZATION
// ============================================================================

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server started successfully on port ${PORT}`)
);