const config = {
    port: 80,
    tokenKey: "my-secret-key",
    saltRounds:10,
    files:{
        path: "files",
        filename: {
            users:"users.json",
            errorLog: "error.log",
            accessLog: "access.log"
        }
    },
    books:{
        path:"books",
        bookname:{
            books:"books.json",
            berrorLog:"error.log",
            baccessLog:"access.log"
        }
    }
};
module.exports = config;