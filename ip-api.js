const { HttpClient } = require("./http-client");

class IpApiService {
  async getIpInfo(ip) {
    const http = new HttpClient();
    const apiUrl = `http://ip-api.com/json/${ip}`;
    const { data } = await http.get(apiUrl);
    return data;
  }
}

module.exports = { IpApiService };
