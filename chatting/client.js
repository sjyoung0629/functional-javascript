var socket = io.connect('http://localhost:5500');
socket.on('hello', (data) => {
    console.log(data);

    socket.emit('first', {my: 'data'});
});

const chatLog = document.querySelector('.chat_log');
const chatForm = document.querySelector('#chatForm');
const submitBtn = chatForm.querySelector('.chat');
const addImage = chatForm.querySelector('.imgUpload');

submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    let name = $('#name').val();
    let msg = $('#message').val();
    socket.emit('send_msg', name, msg);

    $('#message').val('');
    $('#message').focus();
});

addImage.addEventListener('click', () => {
    let imgInput = document.querySelector('input[type=file]');

    imgInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const img = this.files[0];
            const reader  = new FileReader();

            reader.onload = function (e) {
                // preview.src = reader.result;
                var srcData = e.target.result; // <--- data: base64
                socket.emit('imgSrc', srcData);

                let preview = document.createElement('img');
                preview.src = srcData;
            }

            reader.readAsDataURL(img);

        }
    });
});

socket.on('receive_msg', function(msgObj){
    if (msgObj.hasOwnProperty('message')) {
        $('#chatLog').append(msg+'\n');
        $('#chatLog').scrollTop($('#chatLog')[0].scrollHeight);

    } else if (msgObj.hasOwnProperty('img_src')) {
        let preview = document.createElement('img');
        preview.src = msgObj.img_src;
        chatLog.append(preview);
    }
});