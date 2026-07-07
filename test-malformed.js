import net from "net";

const payload = "POST /giblab/remainders HTTP/1.1\r\n" +
"type: load\r\n" +
"Content-Type: application/octet-stream; charset=UTF-8\r\n" +
"sheet: true\r\n" +
"code: KS-PL-18-2800X2070-1116\r\n" +
"project: /ZAM-2026-0002-testowe zam.project\r\n" +
"project.name: ZAM-2026-0002-testowe zam\r\n" +
"date\r\n" +
"User-Agent: Java/1.7.0_07\r\n" +
"Host: localhost:3080\r\n" +
"Accept: text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2\r\n" +
"Connection: keep-alive\r\n" +
"Content-Length: 23\r\n\r\nKS-PL-18-2800X2070-1116";

const client = new net.Socket();
client.connect(3080, "127.0.0.1", () => {
  console.log("Connected to server");
  client.write(payload);
});
client.on("data", (data) => {
  console.log("Received: " + data.toString());
  client.destroy();
});
client.on("close", () => {
  console.log("Connection closed");
});
