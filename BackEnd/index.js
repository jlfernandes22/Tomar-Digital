import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/User.js'
import Business from './models/Business.js';
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
   
    const {email, password, confirmPassword} = req.body

    try{

        //verificar se já existe
        const user = await User.findOne({email: email})
        if(user){
            return res.status(400).json({message: "Utilizador já existe"})
        }


        console.log(password)
        console.log(confirmPassword)

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
            password: hashedPassword

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

        if(!rightPassword){
            return res.status(400).json({message: "Palavra-passe errada"})
        }

        const token = jwt.sign(
            {userId: user._id, email: user.email},
            SECRET_KEY,
            {expiresIn: '7d'}
        )

        res.status(201).json({message: "Login efetuado com sucesso",
            token: token,
            user: {name: user.name, email: user.email}
    })


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
app.post('/registarNegocio',async (req, res) => {

    const {name, category, location} = req.body

    console.log(req.body)

    try{

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



///////////////////
//Lista de negócios
app.get('/negocios', async (req, res) => {

    const Businesses = await Business.find();
    res.json(Businesses)

});


app.listen(3000, '0.0.0.0', () => console.log('Servidor ligado'));