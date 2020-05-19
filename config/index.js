const config = {
    port: 80,
    tokenKey: "my-secret-key",
    saltRounds:10,
    files:{
        path: "files",
        filename: {
            users:"users.json",
            auditLog: "audit.log",
            accessLog: "access.log"
        }
    }
};
module.exports = config;