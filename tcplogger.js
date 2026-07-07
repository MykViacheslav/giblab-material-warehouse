import net from "net";
const ports = [80, 443, 3000, 3080, 8080, 8000];

ports.forEach(port => {
  const server = net.createServer((socket) => {
    console.log(`CLIENT CONNECTED ON PORT ${port}!`);
    socket.on("data", (data) => {
      console.log(`RECEIVED DATA ON PORT ${port}:\n` + data.toString());
      socket.write("HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n");
      socket.end();
    });
    socket.on("error", (err) => console.log(`SOCKET ERROR ON PORT ${port}:`, err));
  });
  
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} is already in use.`);
    } else {
      console.log(`Server error on port ${port}:`, err);
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`TCP Logger listening on port ${port}...`);
  });
});
