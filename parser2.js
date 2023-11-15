const fs = require('fs');

class ParserAccessLogService {
  parseLogEntry(logEntry) {
    // Divide la entrada de registro por espacios
    const logParts = logEntry.split(" ");
    const logPartsByComma = logEntry.split('"');
    // Extrae la información relevante (ajusta esto según el formato de tu registro)
    const ip = logParts.length > 0 ? logParts[0] : "";
    const browser = logPartsByComma.length > 5 ? logPartsByComma[5] : "";
    const timestamp = logParts.length > 3 ? logParts[3].replace("[", "") : "";
    const method = logParts.length > 5 ? logParts[5].replace('"', "") : "";
    const url = logParts.length > 6 ? logParts[6] : "";
    const statusCode = logParts.length > 8 ? logParts[8] : "";
  
    // Crea un objeto para representar la entrada de registro analizada
    return { ip, browser, timestamp, method, url, statusCode };
  }

  getAccessLogInfo() {
    // Lee el archivo de registro de acceso de Nginx
    const logFilePath = "access.log";
    const logData = fs.readFileSync(logFilePath, "utf-8").split("\n");

    // Define un array para almacenar las entradas de registro analizadas
    const parsedLogEntries = [];

    // Analiza cada entrada de registro
    logData.forEach((logEntry) => {
      const parsedLogEntry = this.parseLogEntry(logEntry);
      if (parsedLogEntry) {
        // Agrega la entrada de registro analizada al array
        parsedLogEntries.push(parsedLogEntry);
      }
    });

    // Ahora tienes un array de entradas de registro analizadas
    return parsedLogEntries;
  }
}

module.exports = { ParserAccessLogService };