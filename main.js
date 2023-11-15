const { IpApiService } = require("./ip-api");
const { ParserAccessLogService } = require("./parser");
const fs = require("fs");

(async () => {
  const tiempoTotalDeEspera = calcularTiempoEsperaApi();
  crearArchivoTxt(tiempoTotalDeEspera);
})();

async function crearArchivoTxt(tiempoTotalDeEspera) {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const ipApiService = new IpApiService();
  const parserAccessLogService = new ParserAccessLogService();
  const accessLog = parserAccessLogService.getAccessLogInfo();
  let httpRequestCount = 0;
  let arrayIpsInfo = [];
  const today = new Date();
  const fechaHoy = today.toISOString().split("T")[0].replace(/-/g, "_");
  const tableName = `access_log_${fechaHoy}`;
  let contenidoTxt = `CREATE TABLE ${tableName} (ID_ACCESS_LOG INT(10) UNSIGNED NOT NULL AUTO_INCREMENT, IP VARCHAR(255) NULL DEFAULT NULL, SERVER_IP VARCHAR(255) NULL DEFAULT NULL, BROWSER VARCHAR(512) NULL DEFAULT NULL, TIMESTAMP VARCHAR(255) NULL DEFAULT NULL, METHOD VARCHAR(10) NULL DEFAULT NULL, URL TEXT NULL DEFAULT NULL, STATUSCODE VARCHAR(10) NULL DEFAULT NULL, COUNTRY VARCHAR(255) NULL DEFAULT NULL, COUNTRYCODE VARCHAR(10) NULL DEFAULT NULL, REGION VARCHAR(10) NULL DEFAULT NULL, REGIONNAME VARCHAR(255) NULL DEFAULT NULL, CITY VARCHAR(255) NULL DEFAULT NULL, ZIP VARCHAR(20) NULL DEFAULT NULL, LAT VARCHAR(50) NULL DEFAULT NULL, LON VARCHAR(50) NULL DEFAULT NULL, TIMEZONE VARCHAR(255) NULL DEFAULT NULL, ISP VARCHAR(255) NULL DEFAULT NULL, ORG VARCHAR(255) NULL DEFAULT NULL, ORG_AS VARCHAR(255) NULL DEFAULT NULL, PRIMARY KEY (ID_ACCESS_LOG)) ENGINE = InnoDB;`;
  let minutosEsperados = 0;
  let cantidadIps = 0;

  for (const log of accessLog) {
    const ip = log.ip;
    if (ip !== "") {
      let indexIpInfo = arrayIpsInfo.findIndex((ipInfo) => ipInfo.query === ip); //Me fijo si tengo la info de la ip ya guardada
      let ipInfo = null;
      let ipInfoJSON = null;

      contenidoTxt += `\nINSERT INTO ${tableName} (IP, SERVER_IP, BROWSER, TIMESTAMP, METHOD, URL, STATUSCODE, COUNTRY, COUNTRYCODE, REGION, REGIONNAME, CITY, ZIP, LAT, LON, TIMEZONE, ISP, ORG, ORG_AS) VALUES ('${log.ip}', '${log.serverIp}', '${log.browser}', '${log.timestamp}', '${log.method}', '${log.url}', '${log.statusCode}'`;

      if (
        indexIpInfo === -1 &&
        ip &&
        ip !== "" &&
        !ip.startsWith("10.") &&
        !ip.startsWith("192.168.")
      ) {
        cantidadIps++;
        //Si no tengo la info, consulto la api
        try {
          console.log(
            `Se llama a la api con la ip: ${ip} (se llamo a la api ${cantidadIps} veces).`
          );
          ipInfo = await ipApiService.getIpInfo(ip);
          if (ipInfo) {
            ipInfoJSON = JSON.stringify(ipInfo);
            arrayIpsInfo.push(ipInfo);
          }
          console.log(`response de la api: ${ipInfoJSON}`);
          httpRequestCount++;
          await delay(100);
        } catch (error) {
          console.log(error);
          return;
        }

        if (httpRequestCount === 45) {
          // La API permite 45 request por minuto
          const tiempoRestante = tiempoTotalDeEspera - minutosEsperados;
          console.log(`Esperando 1 minuto... (tiempo restante: ${tiempoRestante} minutos)`);
          httpRequestCount = 0;
          await delay(60000);
          minutosEsperados++;
          console.log(`Se han esperado ${minutosEsperados} minutos.`);
        }
      } else {
        ipInfo = arrayIpsInfo[indexIpInfo];
      }

      if (ipInfo && ipInfo.status === "success") {
        contenidoTxt += `, '${ipInfo.country}', '${ipInfo.countryCode}', '${ipInfo.region}', '${ipInfo.regionName}', '${ipInfo.city}', '${ipInfo.zip}', ${ipInfo.lat}, ${ipInfo.lon}, '${ipInfo.timezone}', '${ipInfo.isp}', '${ipInfo.org}', '${ipInfo.as}'`;
      } else {
        contenidoTxt += `, null, null, null, null, null, null, null, null, null, null, null, null`;
      }

      contenidoTxt += ");";
    }
  }

  const nombreTxt = `insert_${fechaHoy}.txt`;

  try {
    await fs.writeFileSync(nombreTxt, contenidoTxt, "utf8");
    console.log(`Llamadas a la API (cantidad de IPs): ${cantidadIps}`);
    console.log(`Se ha creado el archivo "${nombreTxt}"`);
  } catch (error) {
    console.error(`Error al escribir el archivo: ${error}`);
  }
}

function calcularTiempoEsperaApi() {
  const cantidadIps = calcularCantidadIps();
  let tiempoTotal = cantidadIps / 45;
  let unidadTiempo = "minutos";

  if (tiempoTotal < 1) {
    // Transformo a segundos
    tiempoTotal *= 60;
    unidadTiempo = "segundos";
  } else if (tiempoTotal >= 60) {
    // Transformo a horas
    tiempoTotal /= 60;
    unidadTiempo = "horas";
  }

  tiempoTotal = Math.floor(tiempoTotal); // Usar Math.floor para redondear hacia abajo
  const tiempoTotalString = `${tiempoTotal} ${unidadTiempo}.`;
  console.log(
    `El tiempo estimado en hacer todas las llamadas a la api es: ${tiempoTotalString}`
  );
  
  return tiempoTotal;
}

function calcularCantidadIps() {
  const parserAccessLogService = new ParserAccessLogService();
  const accessLog = parserAccessLogService.getAccessLogInfo();

  const arrayIps = accessLog.map((log) => log.ip);
  const arrayIpsFiltrado = arrayIps.filter(
    (ip) => !ip.startsWith("10.") && !ip.startsWith("192.168.")
  );
  const uniqueIps = new Set(arrayIpsFiltrado);

  return uniqueIps.size;
}
