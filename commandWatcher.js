const {parentPort} = require('worker_threads');
const { logMessage } = require('./shared/logMessage');
const io = require("socket.io")

parentPort.on("message", (message) => {
    switch(message.status){
        case "LOGIN":
            if(findUserByNickname(message.users, message.nickname) != null){
                throw "Já existe um usuário com esse nome!"
            }
            return parentPort.postMessage({
                status: "LOGIN_SUCCEDDED",
                newUser: message.nickname
            })

        case "CHANGE_NICK":
            if(message.oldNickname != null && 
                findUserByNickname(message.users, message.newNickname) == null){
                    console.log(logMessage(`${message.oldNickname} mudou o nickname para ${message.newNickname}`));
                    return parentPort.postMessage({
                        status: "CHANGE_NICK_SUCCEDDED",
                        newNick: message.newNickname
                    })
            } else {
                throw "Este nickname já existe!";
            }

        case "MESSAGE":
            if(message.nickname == null){
                console.log(logMessage("Alguem tentou enviar mensagens sem logar!"));
                throw "Você precisa logar para enviar mensagens!";
            }

            if(message.type == "PUBLIC"){
                return parentPort.postMessage({
                    status: "PUBLIC_MESSAGE_SUCCEDDED",
                    message: message.message,
                    nickname: message.nickname
                })
            }

            if(message.type == "PRIVATE"){
                var targetNickname = findUserByNickname(message.users, message.targetNickname).nickname;
                if(targetNickname != null){
                    return parentPort.postMessage({
                        status: "PRIVATE_MESSAGE_SUCCEDDED",
                        message: message.message,
                        nickname: message.nickname,
                        targetNickname: targetNickname
                    })
                } else {
                    throw "Usuário não existe"
                }
            }

            if(message.type == "FILE"){
                var targetNickname = findUserByNickname(message.users, message.targetNickname).nickname;
                if(targetNickname != null){
                    return parentPort.postMessage({
                        status: "FILE_SUCCEDDED",
                        url: message.message,
                        nickname: message.nickname,
                        targetNickname: targetNickname
                    })
                } else {
                    throw "Usuário não existe"
                }
            }

        case "LOGOUT":
            console.log(message.nickname + " está se desconectando!");
            if(message.nickname != null){
                var userId = findUserByNickname(message.users, message.nickname).id;
                return parentPort.postMessage({
                    status: "LOGOUT_SUCCEDDED",
                    userId: userId
                });
            } else {
                throw "Você não pode sair se você ainda não entrou"
            }
    }
})

const findUserByNickname = (users, nickname) => {
    return users.find(user => user.nickname == nickname)
}


