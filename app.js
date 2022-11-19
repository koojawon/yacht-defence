const Koa = require('koa');
const app = new Koa();
const path = require('path');
const fs = require('fs');

require('dotenv').config();
if (process.env.NODE_ENV === undefined) process.env.NODE_ENV = 'development';

app.use(require('koa-bodyparser')());
app.use(require('./routes').routes());

app.use(require('koa-static')(path.join(__dirname, '/dist')));

app.use(async (ctx) => {
	ctx.status = 404;
	ctx.redirect('/');
	return;
});

const server = require('http').createServer(app.callback());
const io = require('socket.io')(server);

require('./js/GameServer').init(io);
server.listen(8080);