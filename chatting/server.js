var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(5500, () => {
    console.log('## server start!');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    // 서버가 클라이언트에 보내는 이벤트
    socket.emit('hello', {hello: 'world'});

    // socket.emit('connection', {
    //     type : 'connected'
    // });

    // 클라이언트에서 받은 이벤트 처리
    socket.on('first', (data) => {
        console.log(data);
    });

    socket.on('send_msg', (name, msg) => {
        console.log("receive message => ", msg);
        socket.emit('receive_msg', {message: msg});
    });

    socket.on('imgSrc', (src) => {
        console.log("receive src => ", src);
        socket.emit('receive_msg', {img_src: src});
    });

    socket.on('connection', function(data) {
        if(data.type == 'join') {
            socket.join(data.room);
            socket.set('room', data.room);

            socket.emit('system', {
                message : '채팅방에 오신 것을 환영합니다.'
            });
            
            socket.broadcast.to(data.room).emit('system', {
                message : data.name + '님이 접속하셨습니다.'
            });
        }
    });

    socket.on('user', function(data) {
        socket.get('room', function(error, room) {
            socket.broadcast.to(room).emit('message', data);
        });
    });
});

// /* Server Source */
// var express = require('express');
// var app = express();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);

// // var io = require('socket.io').listen(process.env.PORT || 3000);

// io.sockets.on('connection', function(socket) {
//     socket.emit('news', { hello: 'world' });
//     console.log('connection!');
//     socket.emit('connection', {
//         type : 'connected'
//     });
    
//     socket.on('connection', function(data) {
//         if(data.type == 'join') {
//             socket.join(data.room);
//             socket.set('room', data.room);

//             socket.emit('system', {
//                 message : '채팅방에 오신 것을 환영합니다.'
//             });
            
//             socket.broadcast.to(data.room).emit('system', {
//                 message : data.name + '님이 접속하셨습니다.'
//             });
//         }
//     });
    
//     socket.on('user', function(data) {
//         socket.get('room', function(error, room) {
//             socket.broadcast.to(room).emit('message', data);
//         });
//     });
// });


// http.listen(process.env.PORT || 3000, function(){ //4
//     console.log('server on!');
// });