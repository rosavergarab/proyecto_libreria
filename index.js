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
let libros = [];

//variable de morgan para ir creando el log de acceso. 
var accessLogStream = fs.createWriteStream(`${config.files.path}/${config.files.filename.accessLog}`, {flags: `a` });

//MIDDLEWARES

//middleware del log audit creado manual. 
const auditoria = (req, res, next)=>{  

    //crea la variable log para almacenar lo que ira en el log
    const log = {
        fecha: new Date(),
        ruta: req.path,
        usuario: req.body.username
    };    
    
    fs.appendFile(`./${config.files.path}/${config.files.filename.auditLog}`,`${JSON.stringify(log)}`, (err) => {
        if (err){
            console.log(`Ocurrió un error escribiendo en el archivo`);
        };
    });
    next();
};

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

//Parte 1 - Rutas de los libros

//Ruta raiz /, para lo cual vamos a listar los libros existentes en el array de libros
app.get(`/`, (req, res)=>{
    
    let cadena_libros =``;

    for(u in libros){
        cadena_libros += `\nId del Libro: ${libros[u].id} - Nombre del Libro: ${libros[u].name} - Autor: ${libros[u].author}`;
    };
    res
    .status(200)
    .send(`Los Libros disponibles son: ${cadena_libros}`);
});

//Ruta de libros por ID
app.get(`/books/:id`, (req, res)=>{
    
    const id = req.params.id;
    let cadena_resultado =``;

   for (let i=0; i< libros.length; i++){
        

        if (id == libros[i].id){
            cadena_resultado = libros[i].name;
            
        }
    }    
        res
        .status(200)
        .send(`El libro solicitado es ${cadena_resultado}`); 
    
});

//Ruta para ir agregando los libros
app.post(`/books`, auth, (req, res) =>{
    let libro = {
        id: req.body.id,
        name: req.body.name,
        author: req.body.author,
    };
    libros.push(libro);
    res
    .status(200)
    .send(`El Libro ${libro.name} fue creado`);
});

//Parte 2 - Ruta de los usuarios

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

app.post(`/users/login`, auditoria, (req, res) =>{

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




app.listen(config.port, ()=> {
    //se va a realizar la función de leer un archivo para users
    fs.readFile(`./${config.files.path}/${config.files.filename.users}`, `utf8`, (err, data)=>{
        if(err){
            console.log(`Ocurrió un error leyendo el archivo`);
        };
        usuarios = JSON.parse(data);
    });
    console.log(`Servidor iniciado`);
});