import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/User.js'
import Business from './models/Business.js';
import Favorite from './models/Favorite.js';
import { authorize } from './middleware/auth.js';
import 'dotenv/config';

const SECRET_KEY = process.env.JWT_SECRET;
const app = express();
app.use(express.json());
app.use(cors());

//////////////////////////////
//Conectar à mongoDb no docker
mongoose.connect('mongodb://localhost:27017/tomar_db')
    .then(() => console.log('Conectado a base de dados'))
    .catch(err => console.error('Erro: ',err))



//////////////////////
//Registar utilizador
app.post('/registar',async (req, res) => {

    console.log("Recebido pedido de registo:", req.body);
   
    const {email, password, confirmPassword, role} = req.body

    try{

        //verificar se já existe
        const user = await User.findOne({email: email})
        if(user){
            return res.status(400).json({message: "Utilizador já existe"})
        }

        //verificar se as passowrds coincidem
        if(password != confirmPassword){
            return res.status(400).json({message: "Palavra-passe não coincide"})
        }

        const salt = 10;
        const hashedPassword = await bcrypt.hash(password, salt)        

        //Definir utilizador com password em hash
        const newUser = new User({
            name: email,
            email: email,
            password: hashedPassword,
            role: role

        });

        await newUser.save();
        res.status(201).json({message: "Utilizador criado com sucesso"})
    }catch(err){
        res.status(400).json({message: "Erro ao criar conta"})
    }


});



/////////////////
//Iniciar Sessão
app.post('/iniciarSessao', async (req, res) => {
    
    const {email, password} = req.body
    try{

        //procurar o utilizador pelo email
        const user = await User.findOne({email: email })
        
        //se não existir utilizador
        if (!user){
            return res.status(400).json({message: "Conta não existe"})
        }

        const rightPassword = await bcrypt.compare(password, user.password)
        //se não fizer match de password
        if(!rightPassword){
            return res.status(400).json({message: "Palavra-passe errada"})
        }

        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        

        //gerar token
           res.json({
                token,
                userId: user._id,
                user: {
                    name: user.name,
                    email: user.email,
                    role: user.role 
                }
    });


    }catch(err){
        console.error("Erro ao inciar sessão: ",err)
        res.status(400).json({
            message: "Erro ao iniciar sessão"}
            
            
        )
    }
})



////////////////////////
//Lista de utilizadores
app.get('/utilizadores', async (req, res) => {

    const users = await User.find()
    res.json(users)

});



///////////////////
//Registar negócio
app.post('/registarNegocio', authorize(['camara']),async (req, res) => {
    const {name, category, location} = req.body

    try{
        const existingBusiness = await Business.findOne({ name: name });
        if (existingBusiness) {
            return res.status(409).json({ message: "Este negócio já está registrado" });
        }
        const newBusiness = await new Business({

            name: name,
            category:category,
            location:{
                lat:location.lat,
                long:location.long
            }
        });

        await newBusiness.save();
        res.status(201).json({message: "Negócio registrado com sucesso"})
    }catch(err){
        res.status(400).json({message: "Erro ao registar negócio"})
    }


});

//Lista de negócios
app.get('/negocios', async (req, res) => {

    const Businesses = await Business.find();
    res.json(Businesses)

});
//guardar comercio
app.post('/guardarFavorito', async (req, res) => {
  const { userId, businessId } = req.body; // Verifica se os nomes batem com o Frontend!

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

app.get('/meusFavoritos/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Procura todos os favoritos deste user
    const favoritos = await Favorite.find({ userId: userId }).populate('businessId');
    
    // Forçamos o envio de um ARRAY, mesmo que esteja vazio []
    res.status(200).json(Array.isArray(favoritos) ? favoritos : []);
    
  } catch (err) {
    res.status(500).json([]); // Envia array vazio em caso de erro para não quebrar o app
  }
});


app.listen(3000, '0.0.0.0', () => console.log('Servidor ligado'));
//await User.deleteMany({}); // Apaga todos os documentos da coleção User
