const connection = require("./database");

function DBAction(){

    this.getLatestMessages = (socket) => {
        var testVariable = "Hello this is test";
        console.log("Attempting to make a db call");
        connection.query("SELECT * FROM MySimpleChatroom.tb_messages LIMIT 10;", (error, results, fields) => {
            results.forEach(message => {
                socket.emit("newMsg", message.message, message.sender_nickname);
            });
            
        })
    }

    this.insertMessage = (sendernickname, message, targetnickname) => {
        const query = `INSERT INTO MySimpleChatroom.tb_messages
        (sender_nickname,
        message,
        target_nickname)
        VALUES
        ("${sendernickname}",
        "${message}",
        "${targetnickname}");`;
        console.log(query);
        connection.query(query, (error, results, fields) => {
            console.log(results);
        })
    }
}

module.exports = DBAction;