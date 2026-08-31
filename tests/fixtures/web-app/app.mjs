import http from "node:http";
const server=http.createServer((req,res)=>{if(req.url==="/"&&req.method==="GET"){res.writeHead(200,{"content-type":"text/plain"});res.end("hello from fixture");return;}res.writeHead(404);res.end("not found");});
const port=Number(process.env.PORT||0);server.listen(port,"127.0.0.1",()=>console.log(JSON.stringify({port:server.address().port})));if(process.send)process.send({port:server.address()?.port});
