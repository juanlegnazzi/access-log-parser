const axios = require("axios");

class HttpClient {
  async get(url) {
    const proxyUsername = "gestion";
    const proxyPassword = "gestion";

    const axiosConfig = {
      // La URL de tu servidor proxy
      proxy: {
        protocol: "http",
        host: "10.1.33.254",
        port: 80,
        auth: {
          username: proxyUsername,
          password: proxyPassword,
        },
      },
    };

    const { data, status } = await axios.get(url, axiosConfig);
    return { data, status };
  }
}

module.exports = { HttpClient };