import { networkInterfaces } from "node:os";
console.log("Computador: http://localhost:8080/");
const addresses = Object.values(networkInterfaces()).flat().filter((ip) => ip && ip.family === "IPv4" && !ip.internal);
for (const ip of addresses) console.log(`Rede local: http://${ip.address}:8080/`);
if (!addresses.length) console.log("Nenhum endereço IPv4 de rede local disponível.");
