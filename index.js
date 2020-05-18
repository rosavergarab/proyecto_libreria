//declaración de los modulos a utilizar
const express = require('express');
const nocache = require('nocache');
const bodyParser = require('body-parser');
const fs = require('fs'); //para guardar y leer archivos
const morgan = require('morgan'); //para los logs
const jwt = require('jsonwebtoken'); //para los tokens
const bcrypt = require('bcryptjs'); //para el cifrado de contraseñas

//llamado a la carpeta config
const config = require('./config');

const app = express();

//ARREGLOS
//creo el arreglo Usuarios para ir almacenando los usuarios
let usuarios = [];


//variable de morgan para ir creando el log de acceso. 
var accessLogStream = fs.createWriteStream(`${config.files.path}/${config.files.filename.accessLog}`, {flags: `a` });

//MIDDLEWARES

//middleware de autenticación

const auth = (req, res, next) =>{
    let token = req.headers[`x-access-token`];
    let decoded;
    try {
        decoded =  jwt.verify(token, config.tokenKey); 
    } catch(error)
    {
        decoded = false;
    }
    
    !!decoded ? 
    next()
    :
    res.status(500).send(`usuario no autorizado`);
};

app.use(nocache());
app.use(bodyParser.json());
app.use(morgan(`combined`, { stream: accessLogStream }));

//Rutas

//Ruta raiz /, para lo cual vamos a pedir que muestre error
app.get(`/`,(req, res)=>{
    res
    .sendStatus(500)
});

//Ruta es la de listar los usuarios
app.get(`/users`, auth, (req, res)=>{
    let cadena =``;

    for (u in usuarios)
    {
        cadena += `\nname ${usuarios[u].name} - lastname ${usuarios[u].lastname} - username ${usuarios[u].username} - password ${usuarios[u].password} - doc ${usuarios[u].doc}`;
    }
    res
    .status(200)
    .send(`Usuarios: ${cadena}`); 
});

//Ruta para ir agregando los usuarios
app.post(`/users`,(req, res) =>{
    const plainPassword = req.body.password;
    const salt = bcrypt.genSaltSync(config.saltRounds);
    const hash = bcrypt.hashSync(plainPassword, salt);
    
    let usuario = {
        name: req.body.name,
        lastname: req.body.lastname,
        username: req.body.username,
        password: hash,
        doc: req.body.doc
    };
    usuarios.push(usuario);
    res
    .status(200)
    .send(`El usuario ${usuario.name} fue creado`);
});

//Ruta para el login de los usuarios

app.post(`/users/login`, (req, res) =>{

    const username = req.body.username;
    const password = req.body.password;

    if(!!usuarios.find(usuario => usuario.username === username && 
        bcrypt.compareSync(password,usuario.password)))
    {
        const token = jwt.sign({username: username}, config.tokenKey);
        
        res.status(200).send(`el token es: ${token}`);

    }
    else {
        res.status(500).send(`Datos no validos`);
    }
});

//Ruta para actualizar un usuario
app.put(`/users`,(req, res) =>{
    let usuario = {
        name: req.body.name,
        lastname: req.body.lastname,
        username: req.body.username,
        password: req.body.password,
        doc: req.body.doc
    };
    if (usuario.username ===``)
    {
        res
        .status(501)
        .send(`El usuario no ha sido creado`);
    } else
    {   
        for (u in usuarios)
        {
            if(usuarios[u].username === usuario.username)
            {
                usuarios[u].name = usuario.name;
                usuarios[u].password = usuario.password;
            }
        }
        res
        .status(200)
        .send(`El usuario ${usuario.name} fue actualizado`);
    }
});

//Ruta para borrar un usuario
app.delete(`/users`,(req, res) =>{
    let usuario = {
        username: req.body.username,
    };
    const usuario2 = req.body.username;

    if (usuario.username ===``)
    {
        res
        .status(501)
        .send(`El usuario no ha sido creado`);
    } else
    {   
        for (u in usuarios)
        {
            if(usuarios[u].username === usuario.username)
            {
                usuarios.splice(u,1);
            }
        }
        res
        .status(200)
        .send(`El usuario ${usuario2} fue eliminado`);
    }
});



app.listen(config.port, ()=> {
    //se va a realizar la función de leer un archivo
    fs.readFile(`./${config.files.path}/${config.files.filename.users}`, `utf8`, (err, data)=>{
        if(err){
            console.log(`Ocurrió un error leyendo el archivo`);
        };
        usuarios = JSON.parse(data);
    });
    console.log(`Servidor iniciado`);
});