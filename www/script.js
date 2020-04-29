//Abre o socket e conecta ao servidor
const socket = io();

window.onload = () => {
    document
    .getElementById("send-button")
    .addEventListener("click", (event) => {
        event.preventDefault();
        const msgInput = document.getElementById("message-input");
        const fileInput = document.getElementById("file-input");
        const msg = msgInput.value;

        if(msg.trim().length > 0){
            //Envia nickname ao servidor
            loginCommand = msg.match(/^Login(.*)$/);
            if(loginCommand != null){
                msgInput.value = "";
                var nickname = loginCommand[1]
                .replace("(", "")
                .replace(")", "");
                return socket.emit("login", nickname);
            }

            exitCommand = msg.match(/^exit()/);
            if (exitCommand != null){
                msgInput.value = "";
                return socket.emit("desconectar");
            }

            privateCommand = msg.match(/^private(.*):.*/);
            if(privateCommand != null){
                msgInput.value = "";
                var nickname = privateCommand[0]
                .split(/^private(.*):/)[1]
                .replace("(", "")
                .replace(")", "");
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

            nickCommand = msg.match(/^nick(.*)/);
            if(nickCommand != null){
                msgInput.value = "";
                var newNickname = nickCommand[1]
                .replace("(", "")
                .replace(")", "");;
                return socket.emit("changeNick", newNickname);
            }

            msgInput.value = "";
            _ShowMessage(`Envie com msg:&ltsua mensagem&gt para publico ou private(&ltnickname&gt): &ltmensagem&gt para privado`, "Servidor:");
        }
        
    })

    socket.on("connect", () => {
        console.log("Conectado ao servidor");
        _ShowMessage("Escreva Login(apelido) para logar!", "Servidor");

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

