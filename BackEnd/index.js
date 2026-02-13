import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/User.js'
import Business from './models/Business.js';
import Favorite from './models/Favorite.js';
import Transaction from './models/Transaction.js';
import { authorize } from './middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
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
   
    const {email, password, confirmPassword, role, city} = req.body

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
            role: role,
            city: city

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
            { expiresIn: '1d' }
        );

        

        //gerar token
           res.json({
                token,
                userId: user._id,
                user: {
                    name: user.name,
                    email: user.email,
                    saldo: user.saldo,
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


////////////////////////
//Lista de utilizadores
app.get('/utilizador/:id', authorize(['camara']), async (req, res) => {

    try {
        
        const pendentes = await Business.find({ status: 'pendente' });
        
        
        const ownerIds = pendentes.map(negocio => negocio.owner);


        const owners = await User.find({ _id: { $in: ownerIds } });

        console.log("Donos encontrados:", owners.length);


        res.json(owners);

    } catch (error) {
        console.error("Erro ao procurar donos:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }

});



///////////////////
//Registar negócio
// comerciante propor ou a camara registar
app.post('/registarNegocio', authorize(['comerciante', 'camara']), async (req, res) => {
    try {
        const { name, category, location, owner } = req.body;

        if (!name || !category || !location) {
            return res.status(400).json({ message: "Dados incompletos (Nome, Categoria e Localização são obrigatórios)." });
        }

        const ownerId = req.user.role === 'camara' ? (owner || req.user.id) : req.user.id;
        //Verificar se já existe um negócio com o mesmo nome para este dono
        const existe = await Business.findOne({ name, owner: ownerId });

        if (existe) {
            return res.status(400).json({ 
                message: "Já tens um negócio registado com este nome." 
            });
        }

        // Se for o comerciante a criar, o status deve ser 'pendente'
        // Se for a camara, podes definir logo como 'aprovado'
        const novoNegocio = new Business({
            name,
            category,
            location: {
                lat: Number(location.lat), // Forçamos a conversão para número por segurança
                long: Number(location.long)
            },
            owner: ownerId,
            status: req.user.role === 'camara' ? 'aprovado' : 'pendente'
        });

        await novoNegocio.save();

        res.status(201).json({ 
            message: "Negocio registado com sucesso!", 
            business: novoNegocio 
        });

    } catch (error) {
        console.error("Erro no registo:", error);
        res.status(500).json({ message: "Erro interno ao guardar o negócio." });
    }
});

////////////////////////
//Lista de negócios
app.get('/negocios', async (req, res) => {
  try {
    const negocios = await Business.find({ status: 'aprovado' });
    res.json(negocios);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar lojas." });
  }
});

////////////////////////
//negocio por id
app.get('/negocios/:id', async (req, res) => {
  try {
    console.log(req.params.id)
    const negocio = await Business.findById(req.params.id);
    console.log(negocio);
    res.json(negocio);
    
  } catch (error) {
    res.status(500).json({ message: "Erro ao encontrar id." });
  }
});

////////////////////////
//guardar comércio
app.post('/guardarFavorito', async (req, res) => {
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

////////////////////////
//retirar favorito
app.post('/retirarFavorito', async (req, res) => {
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


////////////////////////
//meus favoritos
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

////////////////////////
//aprovação 
app.post('/business/aprovar/:id',authorize(['camara']), async (req, res) => {
    try {
        const business = await Business.findByIdAndUpdate(
            req.params.id, 
            { status: 'aprovado' }, 
            { new: true } // Retorna o documento já atualizado
        );

        if (!business) {
            return res.status(404).json({ message: "Negócio não encontrado." });
        }

        res.json({ 
            message: "Loja aprovada com sucesso!", 
            business 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao aprovar loja." });
    }
});

////////////////////////
//rejeitar
app.delete('/business/rejeitar/:id', authorize(['camara']), async (req, res) => {
    try {
        await Business.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Negócio descartado com sucesso." });
    } catch (error) {
        res.status(500).json({ message: "Erro ao descartar." });
    }
});

////////////////////////
//pedidos negócios pendentes
app.get('/business/pendentes', authorize(['camara']), async (req, res) => {
    try {
        
        const lista = await Business.find({ status: 'pendente' });
        
        res.status(200).json(lista);
    } catch (error) {
        console.error("Erro ao buscar pendentes:", error);
        res.status(500).json({ message: "Erro ao carregar lista da Câmara." });
    }
});

////////////////////////
//gerar QRcode
app.post('/gerarQrCode', authorize(['comerciante']), async (req, res) => {
    try {
        const { valorOriginal, lojaId } = req.body;

        if (!valorOriginal || valorOriginal <= 0) {
            return res.status(400).json({ message: "Valor de venda inválido." });
        }

        // Regra de negócio: 10% de saldo (exemplo)
        const percentagem = 0.10; 
        const saldoGerado = (valorOriginal * percentagem).toFixed(2);

        // Gerar um token único e curto para o QR Code
        // Usamos uuid para ser impossível de adivinhar
        const tokenUnico = uuidv4();

        const novaTransacao = new Transaction({
            lojaId: lojaId,
            valorOriginal,
            saldoGerado,
            token: tokenUnico,
            status: 'pendente'
        });

        await novaTransacao.save();

        // Enviamos o token para o Frontend gerar o QR Code
        res.status(201).json({ 
            token: tokenUnico, 
            saldoParaOCliente: saldoGerado 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao gerar token de saldo." });
    }
});

////////////////////////
//ler QRcode e ganhar saldo
app.post('/reclamarSaldo', authorize(['cidadao']), async (req, res) => {
    try {
        const { token } = req.body;

        // 1. Procurar a transação (usando o token UUID)
        // Importante: verificar se o status é 'pendente'
        const transacao = await Transaction.findOne({ token: token, status: 'pendente' });

        if (!transacao) {
            console.log("Transação não encontrada ou já processada.");
            return res.status(404).json({ message: "Este código já foi usado ou é inválido." });
        }

        // 2. Procurar o utilizador que está a ler o código
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Utilizador não encontrado." });
        }

        // 3. Somar o saldo
        // Usamos parseFloat para garantir que não há concatenação de texto
        const valorGanho = parseFloat(transacao.saldoGerado);
        user.saldo = (user.saldo || 0) + valorGanho;

        // 4. Marcar a transação como concluída ANTES de salvar para evitar re-entradas
        transacao.status = 'concluido';
        transacao.clienteId = user._id;

        // 5. Salvar as alterações
        await user.save();
        await transacao.save();

        console.log(`Sucesso: ${valorGanho}€ adicionados ao user ${user.id}`);

        console.log(user.saldo);
        return res.json({ 
            message: "Saldo adicionado com sucesso!", 
            valorGanho, 
            novoSaldoTotal: user.saldo 
        });

    } catch (error) {
        // ISTO VAI MOSTRAR O ERRO REAL NO TEU TERMINAL
        console.error("ERRO CRÍTICO NO BACKEND:", error.message);
        return res.status(500).json({ message: "Erro interno ao processar saldo." });
    }
});


////////////////////////
//negócios do comerciante
app.get('/meusNegocios', authorize(['comerciante']), async (req, res) => {
    try {
        console.log("A procurar lojas para o dono:", req.user.id);

        const negocios = await Business.find({ 
            owner: req.user.id 
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


////////////////////////
//dashboard
app.get('/dashboard', authorize(['camara']), async (req, res) => {
    try {
        
        // 1. Agregação para contar utilizadores por Cidade
        // O $group agrupa documentos que tenham o mesmo valor em "$city"
        const usersByCity = await User.aggregate([
            {
                $group: {
                    _id: "$city",
                    total : {$sum: 1}
                }
            }
        ])

        // 2. Agregação para contar negócios por Categoria
        const businessByCategory = await Business.aggregate([
            {
                $group:{
                    _id: "$category",
                    total : {$sum : 1}
                }
            }
        ])
        
        
        res.status(200).json({

            cities: usersByCity,
            categories: businessByCategory

        });

    } catch (error) {
        console.error("Erro ao obter as informações", error);
        res.status(500).json({ message: "Erro ao obter as informações" });
    }
});

app.listen(3000, '0.0.0.0', () => console.log('Servidor ligado'));
//await Business.deleteMany({}); // Apaga todos os documentos da coleção User
