const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require("socket.io").listen(server);
const {Worker} = require('worker_threads');
const fileStore = require("./api/fileStore");
const DBAction = require("./www/db/dbServices");

var users = [];
//Isto é um workaround devido ao fato de não ser possivel passar um socket a uma thread com 
//Os frameworks que estou usando atualmente
var usersSockets = [];
var usersSoFar = 0;

app.use(express.json());

app.use("/", express.static(__dirname + "/www"));
app.use("/File", fileStore);

io.sockets.on("connection", (socket) => {
    var db = new DBAction();
    db.getLatestMessages(socket);
    var commandWatcher = new Worker(__dirname + "/commandWatcher.js", () => { });

    commandWatcher.on("message", (msg) => {
        switch(msg.status){
            case "LOGIN_SUCCEDDED":
                socket.nickname = msg.newUser;
                users.push({
                    id: usersSoFar++,
                    nickname: socket.nickname,
                });
                //Adiciona tambem a lista de sockets
                usersSockets.push({
                    id:users[users.length - 1].id,
                    nickname: socket.nickname,
                    socket:socket,
                })
                logUsuariosConectados();
                socket.emit("newMsg", "você entrou no chat, digite commands() para lista de comandos.", "Servidor");
                return socket.broadcast.emit("newMsg", socket.nickname + " entrou no chat", "Servidor");

            case "CHANGE_NICK_SUCCEDDED":
                var oldUser = users.find(user => user.nickname == socket.nickname);
                var oldSocket = usersSockets.find(user => user.nickname == socket.nickname);
                socket.nickname = msg.newNick;
                users.splice(oldUser.id, 1, {
                    ...oldUser,
                    nickname: socket.nickname
                })
                //Atualiza tambem a lista de sockets
                usersSockets.splice(oldSocket.id, 1, {
                    ...oldSocket,
                    nickname: socket.nickname
                })
                logUsuariosConectados();
                return socket.emit("newMsg", "Nickname alterado com sucesso!", "Servidor");

            case "PUBLIC_MESSAGE_SUCCEDDED":
                console.log("Attempting to store a message in database");
                db.insertMessage(msg.nickname, msg.message, "");
                return socket.broadcast.emit("newMsg", msg.message, msg.nickname)

            case "PRIVATE_MESSAGE_SUCCEDDED":
                targetSocket = findSocketByUsername(msg.targetNickname);
                return targetSocket.emit("newMsg", msg.message, `${msg.nickname}(Private):`)

            case "FILE_SUCCEDDED":
                targetSocket = findSocketByUsername(msg.targetNickname);
                return targetSocket.emit("newLink", msg.url, msg.nickname)

            case "LOGOUT_SUCCEDDED":
                socket.emit("newMsg", "Você se desconectou", "Servidor");
                socket.broadcast.emit("newMsg", socket.nickname + " saiu", "Servidor");
                users.splice(msg.userId, 1);
                usersSockets.splice(msg.userId, 1);
                logUsuariosConectados();
                console.log(`\n${socket.nickname} saiu`);
                socket.disconnect();

    }});

    commandWatcher.on("error", (msg) => {
        socket.emit("newMsg", msg, "Servidor");
    })

    //#region Commands
    socket.on("login", (nickname) => {
        commandWatcher.postMessage({
            status: "LOGIN",
            nickname: nickname,
            users: users
        });
    })

    socket.on("changeNick", (nickname) => {
        commandWatcher.postMessage({
            status: "CHANGE_NICK",
            oldNickname: socket.nickname,
            newNickname: nickname,
            users: users
        })
    })

    socket.on("sendMsg", (msg) => {
        commandWatcher.postMessage({
            status: "MESSAGE",
            type:"PUBLIC",
            nickname: socket.nickname,
            message: msg
        });
    })

    socket.on("disconnect", () => {
        commandWatcher.postMessage({
            status: "LOGOUT",
            nickname: socket.nickname,
            users: users
        });
    })

    socket.on("desconectar", () => {
        commandWatcher.postMessage({
            status: "LOGOUT",
            nickname: socket.nickname,
            users: users
        });
    })

    socket.on("sendMsgPrivate", (msg, targetNickname) => {
        commandWatcher.postMessage({
            status: "MESSAGE",
            type:"PRIVATE",
            targetNickname: targetNickname,
            nickname: socket.nickname,
            users: users,
            message: msg
        });
    })

    socket.on("shareFile", (msg, targetNickname) => {
        commandWatcher.postMessage({
            status: "MESSAGE",
            type:"FILE",
            targetNickname: targetNickname,
            nickname: socket.nickname,
            users: users,
            message: msg
        });
    })
    //#endregion
});

server.listen(3000, () => {
    console.log(`Listening on port 3000`);
})

const logUsuariosConectados = () => {
    console.log("\nUsuários conectados");
    users.map((user) => {
        console.log(`\t ${user.id} - ${user.nickname}`);
    });
    logSocketsConectados();
}

const logSocketsConectados = () => {
    console.log("Sockets");
    usersSockets.map((socket) => {
        console.log(`\t ${socket.id} - ${socket.nickname}`);
    })
}

const findSocketByUsername = (nickname) => {
    return usersSockets.find(socket => socket.nickname == nickname).socket
}