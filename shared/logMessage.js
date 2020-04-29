function logMessage(msg) {
    return `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}:: ${msg}`;
}

exports.logMessage = logMessage;