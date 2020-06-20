

//Abre o socket e conecta ao servidor
const socket = io();

window.onload = () => {
    //Ouve o evento de click no botão de enviar
    document
    .getElementById("send-button")
    .addEventListener("click", (event) => {
        event.preventDefault();
        const msgInput = document.getElementById("message-input");
        const fileInput = document.getElementById("file-input");
        const msg = msgInput.value;
        //Se a mensagem não estiver vazia:
        if(msg.trim().length > 0){
            //Envia nickname ao servidor
            loginCommand = msg.match(/^login(.*)$/);
            if(loginCommand != null){
                msgInput.value = "";
                var nickname = loginCommand[1]
                .replace("(", "")
                .replace(")", "");
                if(nickname.trim().length > 2){
                    return socket.emit("login", nickname);
                } else {
                    return _ShowMessage(`Nickname muito curto!`, "Servidor:");
                }
            }
            //Desconecta do servidor
            exitCommand = msg.match(/^exit()/);
            if (exitCommand != null){
                msgInput.value = "";
                return socket.emit("desconectar");
            }
            //Envia mensagem privada
            privateCommand = msg.match(/^private(.*):.*/);
            if(privateCommand != null){
                msgInput.value = "";
                var nickname = privateCommand[0]
                .split(/^private(.*):/)[1]
                .replace("(", "")
                .replace(")", "");
                //Se houver um arquivo a ser enviado, o comando vai enviar o arquivo ao invés
                //Enviar uma mensagem
                if(fileInput.value != ""){
                    const formData = new FormData();
                    formData.append("avatar", fileInput.files[0]);
                    const response = fetch(`http://localhost:3000/file`, {
                        method: 'POST',
                        // headers: {
                        //     'content-type': 'application/x-www-form-urlencoded', 
                        // },
                        body: formData
                    }).then((response) => {
                        return response.json();
                    }).then((response) => {
                        return socket.emit("shareFile", `http://localhost:3000/file/${response.filename}`, nickname);
                    });
                    fileInput.value = "";
                    fileInput.files[0] = null;
                    return _ShowMessage("Você compartilhou um arquivo", "Servidor");
                } else {
                    //Envia mensagem privada
                    var privateMessage = privateCommand[0].split(/^private(.*):/)[2];
                    socket.emit("sendMsgPrivate", privateMessage, nickname);
                    return _ShowMessage(privateMessage, "Você para " + nickname);
                }
            }

            publicCommand = msg.match(/^msg:.*/);
            if(publicCommand != null){
                msgInput.value = "";
                var publicMessage = publicCommand[0].split(/^msg:/)[1];
                _ShowMessage(publicMessage, "Você");
                return socket.emit("sendMsg", publicMessage);
            }
            //Muda o nickname do usuário
            nickCommand = msg.match(/^nick(.*)/);
            if(nickCommand != null){
                msgInput.value = "";
                var newNickname = nickCommand[1]
                .replace("(", "")
                .replace(")", "");
                if(newNickname.trim().length > 2){
                    return socket.emit("changeNick", newNickname);
                } else {
                    return _ShowMessage(`Nickname muito curto!`, "Servidor:");
                }
                
            }

            if(msg.match(/^commands()/)){
                msgInput.value = "";
                return _ShowMessage(`login(&ltnickname&gt): Faz login no servidor com um nickname <br>
                nick(&ltnickname&gt): Altera o seu nickname <br>
                exit(): desconecta o seu usuário <br>
                msg:&ltmensagem&gt: Envia uma mensagem pública <br>
                private(&ltnickname&gt): &ltmensagem&gt: Envia uma mensagem privada OU caso haja
                um arquivo a ser enviado, enviará o arquivo para esse usuário (Neste caso não
                    precisa ter mensagem)`, "Servidor:");
            }

            msgInput.value = "";
            _ShowMessage(`Envie com msg:&ltsua mensagem&gt para publico ou private(&ltnickname&gt): &ltmensagem&gt para privado`, "Servidor:");
        }
        
    })

    socket.on("connect", () => {
        console.log("Conectado ao servidor");
        _ShowMessage("Escreva login(apelido) para logar!", "Servidor");

        socket.on("newMsg", (msg, nickname) => {
            _ShowMessage(msg, nickname);
        })

        socket.on("newLink", (url, nickname) => {
            _ShowLink(url, nickname);
        })

        //Caso não aceite o login
        socket.on("loginNotSucceded", () => {
            _ShowMessage("Mensagem não enviada! Logue para enviar mensagens", "Servidor");
        })
    })

    const _ShowMessage = (msg, nickname) => {
        document
        .getElementById("message-container")
        .innerHTML += "<p>" + nickname + ": " + msg + "</p>"
    }

    const _ShowLink = (url, nickname) => {
        document
        .getElementById("message-container")
        .innerHTML += `<a href=${url}>${nickname} compartilhou um arquivo com você.</a>`
    }
    
}

