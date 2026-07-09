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
import Redemption from "./models/Redemption.js";
import { authorize } from "./middleware/auth.js";
import { createHash, randomBytes } from "crypto";

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
  max: 100, // Limit each IP to 5 requests per minute
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
  definition: {
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
      { name: "Packs", description: "Pack purchases, voucher wallet, and validation" },
      { name: "Dashboard", description: "Municipal analytics and statistics" },
    ],
    // Dynamic server selection based on MONGO_URI:
    // If MONGO_URI is set (production/Atlas), use the Azure URL.
    // If MONGO_URI is not set (local Docker MongoDB), use localhost.
    // This prevents Swagger UI from sending "Try it out" requests to the
    // wrong server (e.g. Azure when running locally).
    servers: process.env.MONGO_URI && !process.env.MONGO_URI.includes("localhost")
      ? [
          { url: "https://tomar-rg-b0bvd9e7fkdhatbh.westeurope-01.azurewebsites.net", description: "Production (Azure)" },
        ]
      : [
          { url: `http://localhost:${process.env.PORT || 8080}`, description: "Local Development Server" },
        ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    // GLOBAL SECURITY: All endpoints require authentication by default.
    // Individual public endpoints (registar, login, etc.) override this
    // by setting `security: []` in their own @swagger block.
    security: [
      { bearerAuth: [] },
    ],
  },
  apis: ["./index.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Serve the raw OpenAPI JSON spec (for external tools and debugging)
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerDocs);
});

// --- Swagger UI Setup ---
// Absolute minimal setup: no custom options, no custom CSS.
// swagger-ui-express v5 with zero options should work out of the box.
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
 *     security: []
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
 *               email: { type: string, example: "cidadao@tomar.pt" }
 *               password: { type: string, example: "SenhaForte123!" }
 *               city: { type: string, example: "Tomar" }
 *               name: { type: string, example: "Cidadão Demo" }
 *     responses:
 *       '200':
 *         description: Registration successful, verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Invalid input or user already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '429':
 *         description: Too many requests. Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Too many attempts. Please wait 1 minute." }
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
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email: { type: string, example: "cidadao@tomar.pt" }
 *               code: { type: string, example: "123456" }
 *     responses:
 *       '200':
 *         description: Account validated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Invalid code or user not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '429':
 *         description: Too many requests. Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Too many attempts. Please wait 1 minute." }
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
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string, example: "cidadao@tomar.pt" }
 *               password: { type: string, example: "SenhaForte123!" }
 *     responses:
 *       '200':
 *         description: Login successful, returns JWT token and user data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string, example: "eyJhbGciOiJIUzI1NiIs..." }
 *                 userId: { type: string, example: "6a43df284d5511729767322a" }
 *                 user:
 *                   type: object
 *                   properties:
 *                     name: { type: string, example: "Cidadão Demo" }
 *                     email: { type: string, example: "cidadao@tomar.pt" }
 *                     Points: { type: integer, example: 850 }
 *                     role: { type: string, example: "cidadao" }
 *                     city: { type: string, example: "Tomar" }
 *                     NIF: { type: integer, example: 282659706 }
 *                     acceptedInvoiceTerms: { type: boolean, example: true }
 *                     Avatar: { type: string, example: "" }
 *       '400':
 *         description: Invalid credentials or account not verified.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Wrong password." }
 *       '429':
 *         description: Too many requests. Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Too many attempts. Please wait 1 minute." }
 */
app.post("/iniciarSessao", strictLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Validate that body was parsed correctly
  if (!req.body || !email || !password) {
    return res.status(400).json({
      message: "Email e password são obrigatórios.",
    });
  }
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
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email: { type: string, example: "cidadao@tomar.pt" }
 *     responses:
 *       '200':
 *         description: Recovery code sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '429':
 *         description: Too many requests. Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Too many attempts. Please wait 1 minute." }
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
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email: { type: string, example: "cidadao@tomar.pt" }
 *               code: { type: string, example: "123456" }
 *               newPassword: { type: string, example: "NovaSenha123!" }
 *     responses:
 *       '200':
 *         description: Password updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Invalid or expired code.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '429':
 *         description: Too many requests. Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Too many attempts. Please wait 1 minute." }
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

// ============================================================================
// ACCOUNT DELETION
// ============================================================================
// Security design:
//   1. Requires a valid JWT (any authenticated role can delete their OWN account).
//   2. Re-validates the user's current password (defense against session hijack
//      via stolen JWT — the attacker would also need the password).
//   3. Strict rate limit (5 req/min per IP) to brute-force the password check.
//   4. Atomic cleanup with Mongoose session/transaction — deletes the user,
//      their businesses (+ logo/gallery files), favorites, invoices, and any
//      merchant applications. If any step fails, the whole operation rolls back.
//   5. Audit log line emitted to stdout with timestamp, userId, and email hash.
//   6. JWT is stateless, so we cannot revoke the token server-side here; the
//      client MUST clear its local token on success (handled in the frontend).
// ============================================================================

/**
 * @swagger
 * /apagarConta:
 *   delete:
 *     summary: Delete the authenticated user's account and all associated data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password: { type: string, example: "SenhaForte123!", description: "Current password for confirmation" }
 *     responses:
 *       '200':
 *         description: Account deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Invalid password or missing field.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '401':
 *         description: Unauthorized — missing/invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error during deletion.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '429':
 *         description: Too many requests. Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Too many attempts. Please wait 1 minute." }
 */
app.delete("/apagarConta", strictLimiter, authorize(["cidadao", "comerciante", "camara"]), async (req, res) => {
  try {
    const { password } = req.body;

    // --- 1. Input validation ---
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "É obrigatório introduzir a sua palavra-passe." });
    }

    // --- 2. Load user from DB ---
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    // --- 3. Re-validate the current password ---
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Palavra-passe incorreta. A conta não foi apagada." });
    }

    // --- 4. Cascade delete all user data ---
    // Helper: performs all DB deletes. Pass `null` for session to run without
    // a transaction (fallback for standalone MongoDB instances).
    const cascadeDelete = async (session) => {
      const businesses = await Business.find({ owner: user._id })
        .session(session).lean();
      await Business.deleteMany({ owner: user._id }).session(session);
      await Favorite.deleteMany({ userId: user._id }).session(session);
      await Invoice.deleteMany({ user: user._id }).session(session);
      await PedidosComerciante.deleteMany({ emailDono: user.email }).session(session);
      await User.findByIdAndDelete(user._id).session(session);
      return businesses;
    };

    let businesses;
    try {
      // Attempt atomic deletion with a transaction (requires replica set / mongos).
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        businesses = await cascadeDelete(session);
        await session.commitTransaction();
      } catch (txErr) {
        // Best-effort abort (safe to ignore if transaction already aborted/committed)
        try { await session.abortTransaction(); } catch (_) {}

        // Code 20 / IllegalOperation = standalone MongoDB, no transactions.
        // Fall back to sequential deletes without a transaction.
        if (txErr.codeName === 'IllegalOperation' || txErr.code === 20) {
          console.warn('[apagarConta] Server does not support transactions — falling back to sequential deletes.');
          businesses = await cascadeDelete(null);
        } else {
          throw txErr; // real error, bubble up to outer catch
        }
      } finally {
        session.endSession();
      }
    } catch (sessionErr) {
      // startSession() itself failed — check if it's the replica-set issue
      if (sessionErr.codeName === 'IllegalOperation' || sessionErr.code === 20 ||
          /replica set|mongos/i.test(sessionErr.message)) {
        console.warn('[apagarConta] Could not start session — falling back to sequential deletes.');
        businesses = await cascadeDelete(null);
      } else {
        throw sessionErr;
      }
    }

    // --- 5. Filesystem cleanup (best-effort, AFTER DB commit) ---
    try {
      if (user.Avatar && user.Avatar.startsWith("/uploads/")) {
        const avatarPath = path.join(process.cwd(), user.Avatar.replace(/^\//, ""));
        if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
      }
    } catch (fileErr) {
      console.warn("[apagarConta] Failed to delete avatar file:", fileErr.message);
    }

    for (const biz of businesses) {
      try {
        if (biz.logo) {
          const logoPath = path.join(process.cwd(), biz.logo.replace(/^\//, ""));
          if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
        }
      } catch (e) {
        console.warn(`[apagarConta] Failed to delete logo for business ${biz._id}:`, e.message);
      }

      if (Array.isArray(biz.gallery) && biz.gallery.length > 0) {
        for (const fotoUrl of biz.gallery) {
          try {
            if (fotoUrl) {
              const fotoPath = path.join(process.cwd(), String(fotoUrl).replace(/^\//, ""));
              if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
            }
          } catch (e) {
            console.warn(`[apagarConta] Failed to delete gallery image for business ${biz._id}:`, e.message);
          }
        }
      }
    }

    // --- 6. Audit log (email hash, no plaintext PII) ---
    const emailHash = createHash("sha256").update(user.email).digest("hex").slice(0, 16);
    console.log(
      `[AUDIT][apagarConta] ${new Date().toISOString()} | userId=${user._id} | emailHash=${emailHash} | role=${user.role} | businessesDeleted=${businesses.length}`
    );

    return res.status(200).json({ message: "Conta apagada com sucesso." });
  } catch (error) {
    console.error("[apagarConta] Error:", error);
    return res.status(500).json({ message: "Erro ao apagar a conta. Tente novamente." });
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               acceptedInvoiceTerms: { type: boolean, example: true }
 *     responses:
 *       '200':
 *         description: Terms updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Terms accepted successfully." }
 *                 acceptedInvoiceTerms: { type: boolean, example: true }
 *       '404':
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "User not found." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Error updating terms." }
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
 *     summary: List all users (Camara only — exposes personal info)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of all users (without password hashes).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '403':
 *         description: Only camara can access.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.get("/utilizadores", authorize(["camara"]), async (req, res) => {
  // --- IN-HANDLER VERIFICATION (belt-and-suspenders) ---
  // Even though authorize(["camara"]) middleware should block non-camara users,
  // we double-check here. This ensures that even if middleware is misconfigured
  // or bypassed, the endpoint still refuses to serve data.
  if (!req.user || req.user.role !== "camara") {
    return res.status(403).json({
      message: "Acesso negado: Apenas a Câmara Municipal pode listar utilizadores.",
    });
  }

  // SECURITY: Exclude ALL sensitive fields from the response.
  // -password removes the bcrypt hash
  // -codigoValidar removes the email verification code
  // -codigoResetPassword removes the password reset code
  // -codigoResetExpira removes the reset code expiry
  const users = await User.find()
    .select("-password -codigoValidar -codigoResetPassword -codigoResetExpira")
    .lean();
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
 *     responses:
 *       '200':
 *         description: List of pending business owners.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '403':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *         content:
 *           multipart/form-data:
 *             schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               city: { type: string }
 *               NIF: { type: string }
 *               avatar: { type: string, format: binary }
 *     responses:
 *       '200':
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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

    // --- NIF validation ---
    // NIF is optional on the edit form: if the user already has a NIF, the
    // frontend doesn't send the field at all (receivedNIF is undefined).
    // We only validate when a NIF is actually provided. If not provided,
    // the existing user.NIF is preserved unchanged.
    if (receivedNIF !== undefined && receivedNIF !== null && receivedNIF !== "") {
      if (!validarNIF(receivedNIF)) {
        return res.status(400).json({ message: "The NIF inserted is not valid" });
      }
      if (receivedNIF === "999999990") {
        return res.status(400).json({ message: "Invoices issued to 'Consumidor Final' cannot earn points." });
      }
      user.NIF = receivedNIF;
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
 *         content:
 *           multipart/form-data:
 *             schema:
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
 *       '201':
 *         description: Business registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Missing required data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *     security: []
 *     responses:
 *       '200':
 *         description: List of businesses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Business details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Business not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: Business deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Business not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: List of user's businesses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: List of businesses matching the CAE.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: Business approved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Business not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: Business discarded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: List of pending businesses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *             properties:
 *               businessId: { type: string, example: "650000000000000000000003" }
 *     responses:
 *       '200':
 *         description: Added to favorites successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Already in favorites.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.post("/guardarFavorito", authorize(["cidadao", "comerciante", "camara"]), async (req, res) => {
  const userId = req.user.id; // SECURITY: derive from JWT, not from request body
  const { businessId } = req.body;
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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessId
 *             properties:
 *               businessId: { type: string, example: "650000000000000000000003" }
 *     responses:
 *       '200':
 *         description: Removed from favorites successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Favorite not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.post("/retirarFavorito", authorize(["cidadao", "comerciante", "camara"]), async (req, res) => {
  const userId = req.user.id; // SECURITY: derive from JWT, not from request body
  const { businessId } = req.body;
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: List of favorite businesses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.get("/meusFavoritos/:userId", authorize(["cidadao", "comerciante", "camara"]), async (req, res) => {
  try {
    // SECURITY: Only allow users to read their own favorites.
    // Camara staff can read any user's favorites for audit purposes.
    if (req.user.role !== "camara" && req.user.id !== req.params.userId) {
      return res.status(403).json({ message: "Cannot access another user's favorites." });
    }
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
 *         content:
 *           multipart/form-data:
 *             schema:
 *             type: object
 *             properties:
 *               tituloComercio: { type: string }
 *               donoComercio: { type: string }
 *               emailDono: { type: string }
 *               telefoneDono: { type: string }
 *               documentoPDF: { type: string, format: binary }
 *     responses:
 *       '200':
 *         description: Application submitted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: PDF document is mandatory.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: List of merchant applications.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: User upgraded to merchant.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Application or User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: Application rejected and deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Application not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: Invoice processed successfully, points awarded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Validation error or duplicate invoice.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '429':
 *         description: Daily limit reached.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error during processing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *         content:
 *           multipart/form-data:
 *             schema:
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
 *       '200':
 *         description: Campaign created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *     security: []
 *     responses:
 *       '200':
 *         description: List of campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *         content:
 *           application/json:
 *             schema:
 *             type: object
 *             required:
 *               - businessId
 *               - campaignId
 *             properties:
 *               businessId: { type: string }
 *               campaignId: { type: string }
 *     responses:
 *       '200':
 *         description: Application sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Already applied.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Business not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: List of compatible campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 * /campanhas/comerciante-com-status:
 *   get:
 *     summary: List campaigns matching merchant CAEs with participation status
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of campaigns with participation status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.get("/campanhas/comerciante-com-status", authorize(["comerciante"]), async (req, res) => {
  try {
    const hoje = new Date();
    const ownerId = req.user.id;

    // 1. Buscar todos os negócios do comerciante (aprovados e pendentes)
    //    Incluímos pendentes porque o comerciante pode ter candidatado um
    //    negócio que ainda está a aguardar aprovação da Câmara.
    const meusNegocios = await Business.find({ owner: ownerId });
    const todosOsMeusCaes = [...new Set(meusNegocios.flatMap(n => n.listaCAES || []))];

    // 2. Buscar campanhas ativas que correspondem aos CAEs do comerciante
    const campanhas = await Campaign.find({
      DataInicio: { $lte: hoje },
      DataExpiracao: { $gte: hoje },
      listaCAES: { $in: todosOsMeusCaes },
    }).lean();

    // 3. Para cada campanha, verificar se algum negócio do comerciante participa
    const campanhasComStatus = campanhas.map(campaign => {
      let participacao = { status: null, businessName: null, businessId: null };

      // Procurar em todos os negócios do comerciante se algum tem esta campanha
      for (const negocio of meusNegocios) {
        const adesao = negocio.campaigns.find(
          c => c.campaign.toString() === campaign._id.toString()
        );
        if (adesao) {
          participacao = {
            status: adesao.status, // "pendente" | "aprovado" | "rejeitado"
            businessName: negocio.name,
            businessId: negocio._id,
          };
          break; // Encontrámos — não precisamos de procurar mais
        }
      }

      return {
        ...campaign,
        _id: campaign._id.toString(),
        participacao,
      };
    });

    return res.status(200).json(campanhasComStatus);
  } catch (error) {
    console.error("[comerciante-com-status] ERROR:", error);
    return res.status(500).json({ message: "Error fetching campaigns with status." });
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
 *       '200':
 *         description: List of pending campaign applications.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *         content:
 *           application/json:
 *             schema:
 *             type: object
 *             required:
 *               - businessId
 *               - campaignId
 *               - acao
 *             properties:
 *               businessId: { type: string, example: "650000000000000000000003" }
 *               campaignId: { type: string, example: "650000000000000000000001" }
 *               acao: { type: string, enum: [aprovado, rejeitado], example: "aprovado" }
 *     responses:
 *       '200':
 *         description: Application evaluated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Invalid data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Business or application not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
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
 *       '200':
 *         description: Statistical data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.get("/dashboard", authorize(["camara"]), async (req, res) => {
  try {
    // --- Parallel queries for existing stats ---
    const [cityAndCountryStats, businessByCategory, totalUsersCount, totalBusinessesCount] = await Promise.all([
      User.aggregate([
        { $group: { _id: "$city", total: { $sum: 1 } } },
        { $lookup: { from: CitiesAndCountries.collection.name, localField: "_id", foreignField: "name", as: "locationData" } },
        { $unwind: { path: "$locationData", preserveNullAndEmptyArrays: false } },
        // Deduplicate: if a city name exists in multiple countries/states,
        // merge them back into a single row by grouping on city name again.
        { $group: { _id: "$_id", total: { $first: "$total" }, country: { $first: "$locationData.country_name" } } },
        { $project: { city: "$_id", country: "$country", total: 1 } }
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

    // --- NEW: Campaign analytics ---
    // For each campaign, calculate:
    //   - totalMoneySpent: sum of all invoice amounts for businesses in this campaign
    //   - totalBusinessesAdhered: count of businesses with approved status in this campaign
    //   - totalPacksSold: count of redemptions for this campaign
    //   - totalPointsSpent: sum of pointsCost from redemptions
    //   - totalVouchersDelivered: count of redemptions with status "entregue"
    //   - totalVouchersActive: count of redemptions with status "ativo"
    //   - totalInvoicesProcessed: count of invoices for businesses in this campaign

    const campaigns = await Campaign.find().lean();

    const campaignAnalytics = await Promise.all(
      campaigns.map(async (campaign) => {
        // Find businesses that have this campaign with approved status
        const adheredBusinesses = await Business.find({
          "campaigns.campaign": campaign._id,
          "campaigns.status": "aprovado",
        }).lean();

        const businessIds = adheredBusinesses.map(b => b._id);

        // Calculate total money spent (invoice amounts) for these businesses
        const invoiceStats = businessIds.length > 0
          ? await Invoice.aggregate([
              { $match: { business: { $in: businessIds } } },
              { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }
            ])
          : [{ totalAmount: 0, count: 0 }];

        // Calculate pack purchase stats
        const redemptionStats = await Redemption.aggregate([
          { $match: { campaign: campaign._id } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              pointsSpent: { $sum: "$pack.pointsCost" },
            }
          },
        ]);

        let totalPacksSold = 0;
        let totalPointsSpent = 0;
        let totalVouchersDelivered = 0;
        let totalVouchersActive = 0;
        let totalVouchersExpired = 0;

        redemptionStats.forEach(stat => {
          totalPacksSold += stat.count;
          totalPointsSpent += stat.pointsSpent || 0;
          if (stat._id === "entregue") totalVouchersDelivered = stat.count;
          if (stat._id === "ativo") totalVouchersActive = stat.count;
          if (stat._id === "expirado") totalVouchersExpired = stat.count;
        });

        // Determine campaign status
        const hoje = new Date();
        let status = "ativa";
        if (hoje < new Date(campaign.DataInicio)) status = "agendada";
        if (hoje > new Date(campaign.DataExpiracao)) status = "expirada";

        // Pack-level details
        const packsDetail = (campaign.packs || []).map(pack => ({
          packId: pack._id,
          rewardDescription: pack.rewardDescription,
          pointsCost: pack.pointsCost,
          stock: pack.stock,
          currentStock: pack.currentStock,
          sold: pack.stock - (pack.currentStock || 0),
        }));

        return {
          campaignId: campaign._id,
          titulo: campaign.titulo,
          slogan: campaign.slogan,
          status,
          DataInicio: campaign.DataInicio,
          DataExpiracao: campaign.DataExpiracao,
          totalBusinessesAdhered: adheredBusinesses.length,
          totalMoneySpent: invoiceStats[0]?.totalAmount || 0,
          totalInvoicesProcessed: invoiceStats[0]?.count || 0,
          totalPacksSold,
          totalPointsSpent,
          totalVouchersDelivered,
          totalVouchersActive,
          totalVouchersExpired,
          packs: packsDetail,
        };
      })
    );

    // --- Overall gamification stats ---
    const totalInvoices = await Invoice.countDocuments();
    const totalRedemptions = await Redemption.countDocuments();
    const totalPointsInCirculation = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$Points" } } },
    ]);

    res.status(200).json({
      // Existing stats
      cities: usersByCity,
      countries: usersByCountry,
      categories: businessByCategory,
      totalUsers: totalUsersCount,
      totalBusinesses: totalBusinessesCount,
      // Campaign analytics
      campaigns: campaignAnalytics,
      // Overall gamification stats
      gamification: {
        totalInvoices,
        totalRedemptions,
        totalPointsInCirculation: totalPointsInCirculation[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("[dashboard] Error:", error);
    res.status(500).json({ message: "Error retrieving information." });
  }
});

// ============================================================================
// 11. PACK PURCHASE & VOUCHER VALIDATION ROUTES
// ============================================================================
// Esta secção é dedicada exclusivamente à compra de pacotes de campanhas
// com pontos e à validação presencial dos vouchers na Câmara Municipal.
//
// Ciclo completo:
//   1. Cidadão: POST /packs/comprar       → gasta pontos, gera voucher (pickupCode)
//   2. Cidadão: GET  /packs/minhas-compras → vê o histórico de transações
//   3. Câmara:  POST /packs/validar        → valida o pickupCode e entrega o prémio
//
// Padrões reutilizados:
//   - Transações Mongoose + fallback sequencial (igual ao /apagarConta)
//   - strictLimiter nos endpoints sensíveis (compra e validação)
//   - authorize() para controlo de acesso por role
// ============================================================================

/**
 * @swagger
 * /packs/comprar:
 *   post:
 *     summary: Citizen purchases a pack from a campaign using points
 *     tags: [Packs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               - packId
 *             properties:
 *               campaignId: { type: string, example: "650000000000000000000001" }
 *               packId: { type: string, example: "650000000000000000000002" }
 *     responses:
 *       '200':
 *         description: Pack purchased successfully. Returns pickup code.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Insufficient points, out of stock, or max per user reached.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Campaign or pack not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '429':
 *         description: Too many requests. Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Too many attempts. Please wait 1 minute." }
 */
app.post("/packs/comprar", strictLimiter, authorize(["cidadao", "comerciante", "camara"]), async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { campaignId, packId } = req.body;
    const userId = req.user.id;

    // --- Validação de input ---
    if (!campaignId || !packId) {
      return res.status(400).json({ message: "Campanha e pacote são obrigatórios." });
    }

    // --- Helper: toda a lógica de compra (reutilizável com/sem transação) ---
    // Padrão idêntico ao /apagarConta: tentar transação, fallback sequencial.
    const performPurchase = async (session) => {
      // 1. Carregar utilizador
      const user = await User.findById(userId).session(session);
      if (!user) throw { status: 404, message: "Utilizador não encontrado." };

      // 2. Carregar campanha e verificar que está ativa
      const campaign = await Campaign.findById(campaignId).session(session);
      if (!campaign) throw { status: 404, message: "Campanha não encontrada." };

      const now = new Date();
      if (now < campaign.DataInicio || now > campaign.DataExpiracao) {
        throw { status: 400, message: "Esta campanha não está ativa." };
      }

      // 3. Encontrar o pack dentro da campanha (sub-documento embutido)
      const pack = campaign.packs.id(packId);
      if (!pack) throw { status: 404, message: "Pacote não encontrado nesta campanha." };

      // 3a. Verificação defensiva: garantir que currentStock está inicializado.
      // O default function do schema (default: this.stock) pode não funcionar
      // em campanhas criadas antes desta correção ou em certos cenários.
      // Se currentStock for undefined/null, inicializamos com stock.
      if (pack.currentStock === undefined || pack.currentStock === null) {
        pack.currentStock = pack.stock;
        await campaign.save();
      }

      // 4. Verificar pontos suficientes
      if (user.Points < pack.pointsCost) {
        throw { status: 400, message: "Pontos insuficientes para comprar este pacote." };
      }

      // 5. Verificar stock disponível
      if (pack.currentStock <= 0) {
        throw { status: 400, message: "Pacote esgotado." };
      }

      // 6. Verificar limite maxPerUser
      // Conta apenas vouchers ativos + entregues (expirados não contam).
      const existingPurchases = await Redemption.countDocuments({
        user: userId,
        campaign: campaignId,
        "pack.packId": packId,
        status: { $in: ["ativo", "entregue"] },
      }).session(session);

      if (existingPurchases >= pack.maxPerUser) {
        throw {
          status: 400,
          message: `Já atingiu o limite de ${pack.maxPerUser} compra(s) para este pacote.`,
        };
      }

      // 7. Gerar código único de levantamento
      // Formato: TD-YYYY-XXXXXXXX (8 chars hex maiúsculos = 4 bytes)
      // Entropia: 16^8 = 4.294.967.296 combinações — impróprio para brute-force.
      const year = new Date().getFullYear();
      const random = randomBytes(4).toString("hex").toUpperCase();
      const pickupCode = `TD-${year}-${random}`;

      // 8. Decrementar stock ATOMICAMENTE
      // Usamos $elemMatch para garantir que o update só acontece se o pack
      // específico (com o _id correspondente) tiver currentStock > 0.
      // Isto previne race conditions: se dois cidadãos tentarem comprar o
      // último pacote simultaneamente, apenas um terá sucesso.
      //
      // NOTA: Não se pode usar "packs.$.currentStock" no filtro — o $
      // (positional operator) só é válido no update, não na query.
      // $elemMatch é a forma correta de aplicar múltiplas condições a um
      // elemento específico de um array.
      const stockUpdate = await Campaign.updateOne(
        {
          _id: campaignId,
          packs: {
            $elemMatch: {
              _id: packId,
              currentStock: { $gt: 0 },
            },
          },
        },
        { $inc: { "packs.$.currentStock": -1 } }
      ).session(session);

      if (stockUpdate.matchedCount === 0) {
        // Se chegámos aqui, o pack foi encontrado (passo 3) mas o update
        // não fez match. As causas possíveis:
        //   - currentStock é 0 ou undefined (pack esgotado ou mal inicializado)
        //   - race condition (outro cidadão comprou o último)
        throw { status: 400, message: "Pacote esgotado (compra simultânea)." };
      }

      // 9. Deduzir pontos do utilizador
      user.Points -= pack.pointsCost;
      await user.save();

      // 10. Criar o registo de redenção (voucher)
      // Expira 7 dias depois do fim da campanha (tolerância para levantamento)
      const expiresAt = new Date(
        campaign.DataExpiracao.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      const redemption = new Redemption({
        user: userId,
        campaign: campaignId,
        pack: {
          packId: pack._id,
          rewardDescription: pack.rewardDescription,
          pointsCost: pack.pointsCost,
        },
        pickupCode,
        status: "ativo",
        expiresAt,
      });
      await redemption.save({ session });

      return {
        pickupCode,
        rewardDescription: pack.rewardDescription,
        pointsRemaining: user.Points,
        expiresAt,
      };
    };

    // --- Tentar com transação (replica set) + fallback sequencial (standalone) ---
    let result;
    try {
      session.startTransaction();
      result = await performPurchase(session);
      await session.commitTransaction();
    } catch (txErr) {
      // Best-effort abort (ignora erros se a transação já foi abortada/committed)
      try { await session.abortTransaction(); } catch (_) {}

      // Code 20 / IllegalOperation = MongoDB standalone, sem transações.
      // Fallback para execução sequencial sem transação.
      if (txErr.codeName === 'IllegalOperation' || txErr.code === 20) {
        console.warn('[packs/comprar] Sem transações — fallback sequencial.');
        result = await performPurchase(null);
      } else if (txErr.status) {
        // Erro de validação de negócio (pontos, stock, maxPerUser) — propagar com status
        throw txErr;
      } else {
        throw txErr; // erro real, propagar para o catch exterior
      }
    }

    return res.status(200).json({
      message: "Pacote comprado com sucesso!",
      ...result,
    });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Erro interno ao comprar pacote.";
    console.error("[packs/comprar] Error:", error);
    return res.status(status).json({ message });
  } finally {
    session.endSession();
  }
});

/**
 * @swagger
 * /packs/minhas-compras:
 *   get:
 *     summary: List the current user's pack purchases (voucher wallet)
 *     tags: [Packs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ativo, entregue, expirado] }
 *         description: Filter by status. If omitted, returns all.
 *     responses:
 *       '200':
 *         description: List of user's purchases.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.get("/packs/minhas-compras", authorize(["cidadao", "comerciante", "camara"]), async (req, res) => {
  try {
    // --- Expiração lazy (sem cron job) ---
    // Antes de retornar, marca como "expirado" todos os vouchers ativos
    // cujo prazo de levantamento já passou. Isto garante que o estado
    // apresentado ao cidadão está sempre atualizado.
    await Redemption.updateMany(
      { user: req.user.id, status: "ativo", expiresAt: { $lt: new Date() } },
      { status: "expirado" }
    );

    // --- Construir filtro ---
    const filter = { user: req.user.id };
    if (req.query.status && ["ativo", "entregue", "expirado"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    // --- Buscar compras, populando o título da campanha para exibição ---
    const purchases = await Redemption.find(filter)
      .populate("campaign", "titulo logo")
      .sort({ redeemedAt: -1 }) // Mais recentes primeiro
      .lean();

    return res.status(200).json(purchases);
  } catch (error) {
    console.error("[packs/minhas-compras] Error:", error);
    return res.status(500).json({ message: "Erro ao obter histórico de compras." });
  }
});

/**
 * @swagger
 * /packs/validar:
 *   post:
 *     summary: Camara staff validates a pickup code and delivers the prize in person
 *     tags: [Packs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupCode
 *             properties:
 *               pickupCode: { type: string, example: "TD-2026-A3F8K2", description: "The pickup code" }
 *     responses:
 *       '200':
 *         description: Voucher validated. Returns prize to deliver.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Voucher already delivered, expired, or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '403':
 *         description: Only camara staff can validate.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Voucher not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '429':
 *         description: Too many requests. Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Too many attempts. Please wait 1 minute." }
 */
app.post("/packs/validar", strictLimiter, authorize(["camara"]), async (req, res) => {
  try {
    const { pickupCode } = req.body;
    const staffId = req.user.id;

    // --- Validação de input ---
    if (!pickupCode || typeof pickupCode !== "string") {
      return res.status(400).json({ message: "Código de levantamento é obrigatório." });
    }

    // Normalizar: uppercase e trim (códigos são case-insensitive)
    const normalizedCode = pickupCode.trim().toUpperCase();

    // 1. Procurar o voucher pelo código
    const voucher = await Redemption.findOne({ pickupCode: normalizedCode });

    if (!voucher) {
      return res.status(404).json({ message: "Código não encontrado." });
    }

    // 2. Verificar estado do voucher
    if (voucher.status === "entregue") {
      // Já foi entregue — retornar info sobre quando
      return res.status(400).json({
        message: "Este pacote já foi entregue.",
        deliveredAt: voucher.validatedAt,
      });
    }

    if (voucher.status === "expirado" || voucher.expiresAt < new Date()) {
      // Expirou — atualizar estado se ainda não estiver marcado
      if (voucher.status !== "expirado") {
        voucher.status = "expirado";
        await voucher.save();
      }
      return res.status(400).json({
        message: "Este pacote expirou.",
        expiresAt: voucher.expiresAt,
      });
    }

    // 3. Validação atómica: status "ativo" → "entregue"
    // O filtro status: "ativo" previne dupla entrega se dois funcionários
    // tentarem validar o mesmo código em balcões diferentes simultaneamente.
    const result = await Redemption.updateOne(
      { _id: voucher._id, status: "ativo" },
      {
        status: "entregue",
        validatedAt: new Date(),
        validatedBy: staffId,
      }
    );

    if (result.matchedCount === 0) {
      // Outro funcionário validou entretanto (race condition)
      return res.status(400).json({
        message: "Não foi possível validar o código. Pode ter sido processado entretanto.",
      });
    }

    // 4. Popular dados para o funcionário saber o que entregar
    const populated = await Redemption.findById(voucher._id)
      .populate("user", "name email")
      .populate("campaign", "titulo")
      .lean();

    // --- Log de auditoria ---
    // Regista a validação para conformidade (hash do email, sem PII em plaintext)
    const emailHash = createHash("sha256").update(populated.user.email).digest("hex").slice(0, 16);
    console.log(
      `[AUDIT][packs/validar] ${new Date().toISOString()} | voucherCode=${normalizedCode} | userId=${populated.user._id} | emailHash=${emailHash} | staffId=${staffId}`
    );

    return res.status(200).json({
      message: "Pacote validado com sucesso!",
      rewardDescription: populated.pack.rewardDescription,
      citizenName: populated.user.name,
      citizenEmail: populated.user.email,
      campaignTitle: populated.campaign.titulo,
      redeemedAt: populated.redeemedAt,
      validatedAt: populated.validatedAt,
    });
  } catch (error) {
    console.error("[packs/validar] Error:", error);
    return res.status(500).json({ message: "Erro ao validar pacote." });
  }
});

/**
 * @swagger
 * /packs/campanha/{id}/negocios:
 *   get:
 *     summary: List approved businesses participating in a specific campaign
 *     tags: [Packs]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Campaign ID
 *     responses:
 *       '200':
 *         description: List of approved businesses in this campaign.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Campaign not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.get("/packs/campanha/:id/negocios", async (req, res) => {
  try {
    const campaignId = req.params.id;

    // 1. Verificar que a campanha existe
    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) {
      return res.status(404).json({ message: "Campanha não encontrada." });
    }

    // 2. Procurar negócios aprovados que têm esta campanha no array
    //    business.campaigns com status "aprovado".
    //    O populate do sub-documento campaign dá-nos o título da campanha.
    const businesses = await Business.find({
      status: "aprovado",
      "campaigns.campaign": campaignId,
      "campaigns.status": "aprovado",
    })
      .select("name category logo location address description")
      .lean();

    return res.status(200).json(businesses);
  } catch (error) {
    console.error("[packs/campanha/:id/negocios] Error:", error);
    return res.status(500).json({ message: "Erro ao obter negócios da campanha." });
  }
});

// ============================================================================
// 12. CRUD COMPLETION ROUTES (Invoice History, Campaign CRUD, Pack Edit)
// ============================================================================
// Endpoints added to close CRUD gaps identified during analysis.
// These complement the existing routes to provide full CRUD coverage.
// ============================================================================

// ---------------------------------------------------------------------------
// 12a. INVOICE HISTORY (Read-only — invoices are immutable for audit integrity)
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /faturas:
 *   get:
 *     summary: List the authenticated user's invoice history
 *     tags: [Invoices & Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       '200':
 *         description: Paginated list of the user's invoices.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.get("/faturas", authorize(["cidadao", "comerciante", "camara"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [faturas, total] = await Promise.all([
      Invoice.find({ user: req.user.id })
        .populate("business", "name category logo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments({ user: req.user.id }),
    ]);

    return res.status(200).json({
      faturas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[faturas] Error:", error);
    return res.status(500).json({ message: "Erro ao obter histórico de faturas." });
  }
});

/**
 * @swagger
 * /faturas/{id}:
 *   get:
 *     summary: Get a single invoice by ID (owner or camara only)
 *     tags: [Invoices & Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Invoice details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '403':
 *         description: Cannot access another user's invoice.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Invoice not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.get("/faturas/:id", authorize(["cidadao", "comerciante", "camara"]), async (req, res) => {
  try {
    const fatura = await Invoice.findById(req.params.id)
      .populate("business", "name category logo")
      .populate("user", "name email")
      .lean();

    if (!fatura) {
      return res.status(404).json({ message: "Fatura não encontrada." });
    }

    // SECURITY: Only the owner or camara staff can view an invoice
    if (req.user.role !== "camara" && fatura.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Não pode aceder a faturas de outros utilizadores." });
    }

    return res.status(200).json(fatura);
  } catch (error) {
    console.error("[faturas/:id] Error:", error);
    return res.status(500).json({ message: "Erro ao obter fatura." });
  }
});

// ---------------------------------------------------------------------------
// 12b. CAMPAIGN CRUD (single read, edit, delete)
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /campanhas/{id}:
 *   get:
 *     summary: Get a single campaign by ID with full details
 *     tags: [Campaigns]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Campaign details including packs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Campaign not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.get("/campanhas/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) {
      return res.status(404).json({ message: "Campanha não encontrada." });
    }
    return res.status(200).json(campaign);
  } catch (error) {
    console.error("[campanhas/:id] Error:", error);
    return res.status(500).json({ message: "Erro ao obter campanha." });
  }
});

/**
 * @swagger
 * /editarCampanha/{id}:
 *   put:
 *     summary: Edit a campaign (Camara only). Packs with existing purchases are protected.
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             titulo: { type: string }
 *             slogan: { type: string }
 *             descricao: { type: string }
 *             normas: { type: string }
 *             DataExpiracao: { type: string, format: date }
 *     responses:
 *       '200':
 *         description: Campaign updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '403':
 *         description: Only camara can edit campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Campaign not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.put("/editarCampanha/:id", authorize(["camara"]), async (req, res) => {
  try {
    const { titulo, slogan, descricao, normas, DataExpiracao } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campanha não encontrada." });
    }

    // Update only the provided fields (partial update)
    if (titulo !== undefined) campaign.titulo = titulo;
    if (slogan !== undefined) campaign.slogan = slogan;
    if (descricao !== undefined) campaign.descricao = descricao;
    if (normas !== undefined) campaign.normas = normas;
    if (DataExpiracao !== undefined) {
      // Validate: cannot set expiry before today
      const newExpiry = new Date(DataExpiracao);
      if (newExpiry < new Date()) {
        return res.status(400).json({ message: "A data de expiração não pode ser no passado." });
      }
      campaign.DataExpiracao = newExpiry;
    }

    await campaign.save();
    return res.status(200).json({
      message: "Campanha atualizada com sucesso!",
      campaign: campaign.toObject(),
    });
  } catch (error) {
    console.error("[editarCampanha] Error:", error);
    return res.status(500).json({ message: "Erro ao editar campanha." });
  }
});

/**
 * @swagger
 * /apagarCampanha/{id}:
 *   delete:
 *     summary: Delete a campaign (Camara only). Blocked if any purchases exist.
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Campaign deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Cannot delete — campaign has active purchases.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '403':
 *         description: Only camara can delete campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Campaign not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.delete("/apagarCampanha/:id", authorize(["camara"]), async (req, res) => {
  try {
    const campaignId = req.params.id;

    // SAFEGUARD: Check if any purchases (redemptions) exist for this campaign.
    // If they do, we cannot hard-delete — the audit trail would be broken.
    const purchaseCount = await Redemption.countDocuments({ campaign: campaignId });
    if (purchaseCount > 0) {
      return res.status(400).json({
        message: `Não é possível apagar esta campanha — existem ${purchaseCount} compra(s) associadas. Considere arquivar em vez de apagar.`,
      });
    }

    const campaign = await Campaign.findByIdAndDelete(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campanha não encontrada." });
    }

    // Clean up campaign logo and flyer from disk (best-effort)
    for (const imageUrl of [campaign.logo, campaign.panfleto]) {
      if (imageUrl && imageUrl.startsWith("/uploads/")) {
        try {
          const filePath = path.join(process.cwd(), imageUrl.replace(/^\//, ""));
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
          console.warn("[apagarCampanha] Failed to delete file:", e.message);
        }
      }
    }

    // Remove campaign references from all businesses
    await Business.updateMany(
      {},
      { $pull: { campaigns: { campaign: campaignId } } }
    );

    console.log(`[AUDIT][apagarCampanha] ${new Date().toISOString()} | campaignId=${campaignId} | staffId=${req.user.id}`);
    return res.status(200).json({ message: "Campanha apagada com sucesso!" });
  } catch (error) {
    console.error("[apagarCampanha] Error:", error);
    return res.status(500).json({ message: "Erro ao apagar campanha." });
  }
});

// ---------------------------------------------------------------------------
// 12c. PACK EDIT (stock top-up, description fix — within a campaign)
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /campanhas/{cid}/packs/{pid}:
 *   patch:
 *     summary: Edit a single pack within a campaign - Camara only
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         schema: { type: string }
 *         description: Campaign ID
 *       - in: path
 *         name: pid
 *         required: true
 *         schema: { type: string }
 *         description: Pack ID (sub-document _id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             rewardDescription: { type: string }
 *             stockToAdd: { type: number, description: "Amount to ADD to both stock and currentStock" }
 *     responses:
 *       '200':
 *         description: Pack updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '400':
 *         description: Invalid input or price change attempted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '403':
 *         description: Only camara can edit packs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Campaign or pack not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.patch("/campanhas/:cid/packs/:pid", authorize(["camara"]), async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { rewardDescription, stockToAdd } = req.body;

    const campaign = await Campaign.findById(cid);
    if (!campaign) {
      return res.status(404).json({ message: "Campanha não encontrada." });
    }

    const pack = campaign.packs.id(pid);
    if (!pack) {
      return res.status(404).json({ message: "Pacote não encontrado nesta campanha." });
    }

    // SECURITY: Check if any purchases exist for this pack.
    // If so, we lock the pointsCost (can't change the price after people bought it).
    const purchaseCount = await Redemption.countDocuments({
      campaign: cid,
      "pack.packId": pid,
    });

    // Update rewardDescription (always allowed — it's just a text fix)
    if (rewardDescription !== undefined) {
      pack.rewardDescription = rewardDescription;
    }

    // Add stock (only allowed to ADD, not reduce — reducing would be unfair
    // if people already spent points expecting availability)
    if (stockToAdd !== undefined && stockToAdd > 0) {
      pack.stock += stockToAdd;
      pack.currentStock += stockToAdd;
    }

    // NOTE: pointsCost is intentionally NOT editable — changing the price
    // after purchases is unfair to users who already bought at the old price.
    // If the camara needs to change the price, they should create a new pack.

    await campaign.save();

    console.log(`[AUDIT][editPack] ${new Date().toISOString()} | campaignId=${cid} | packId=${pid} | staffId=${req.user.id} | purchases=${purchaseCount}`);
    return res.status(200).json({
      message: "Pacote atualizado com sucesso!",
      pack: pack.toObject(),
    });
  } catch (error) {
    console.error("[campanhas/:cid/packs/:pid] Error:", error);
    return res.status(500).json({ message: "Erro ao editar pacote." });
  }
});

// ---------------------------------------------------------------------------
// 12d. SINGLE REDEMPTION DETAIL
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /packs/{id}:
 *   get:
 *     summary: Get a single redemption/purchase by ID (owner or camara only)
 *     tags: [Packs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Redemption details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '403':
 *         description: Cannot access another user's redemption.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '404':
 *         description: Redemption not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Response message." }
 */
app.get("/packs/:id", authorize(["cidadao", "comerciante", "camara"]), async (req, res) => {
  try {
    const redemption = await Redemption.findById(req.params.id)
      .populate("campaign", "titulo logo")
      .lean();

    if (!redemption) {
      return res.status(404).json({ message: "Compra não encontrada." });
    }

    // SECURITY: Only the owner or camara staff can view a redemption
    if (req.user.role !== "camara" && redemption.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Não pode aceder a compras de outros utilizadores." });
    }

    return res.status(200).json(redemption);
  } catch (error) {
    console.error("[packs/:id] Error:", error);
    return res.status(500).json({ message: "Erro ao obter compra." });
  }
});

// ============================================================================
// 13. SERVER INITIALIZATION
// ============================================================================

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server started successfully on port ${PORT}`)
);