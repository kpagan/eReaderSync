var devices = ['kobo', 'kindle', 'tolino', 'ereader'];
// main function
try {
    if (isDeviceAReader()) {
        // hide upload for e-Readers
        document.getElementById("sender").classList.add('hidden');
    }
    var activeRoom = getQueryParam('room');
    if (activeRoom) {
        document.getElementById('joinRoomId').value = activeRoom;
        document.getElementById('roomDisplay').innerText = "Code: " + activeRoom;
        loadRoomFiles(activeRoom);
    }
    
    // Handle file upload form submission
    document.getElementById('uploadForm').addEventListener('submit', function(e) {
        e.preventDefault();
        uploadFile();
    });
} catch (err) {
    log(err, 'error');
}

function getQueryParam(name) {
    var search = window.location.search.substring(1);
    if (!search) return null;

    var params = search.split('&');
    for (var i = 0; i < params.length; i++) {
        var pair = params[i].split('=');
        if (decodeURIComponent(pair[0]) === name) {
            return decodeURIComponent(pair[1]);
        }
    }
    return null;
}

// Phone/PC side creation (Uses fetch since smartphones support it fine)
function createRoom() {
    fetch('/api/create-room')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            document.getElementById('roomDisplay').innerText = "Code: " + data.roomId;
            document.getElementById('formRoomId').value = data.roomId;
            document.getElementById('uploadForm').style.display = 'block';
        });
}

// Handle file upload with error handling
function uploadFile() {
    var form = document.getElementById('uploadForm');
    var formData = new FormData(form);
    
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(function (res) {
        if (res.ok) {
            // On success, redirect
            window.location.href = '/?room=' + formData.get('roomId');
        } else {
            // On error, read the error message
            return res.text().then(function(errorMsg) {
                throw new Error(errorMsg);
            });
        }
    })
    .catch(function (err) {
        log('Upload failed: ' + err.message, 'error');
    });
}

// e-Reader FIX: Uses old-school XMLHttpRequest (AJAX) which works natively on Kobo
function loadRoomFiles(roomId) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/room/' + roomId, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            var list = document.getElementById('fileList');
            list.innerHTML = '';

            if (data.error || !data.files.length) {
                list.innerHTML = '<li>No files found or room expired.</li>';
                return;
            }

            data.files.forEach(function (file) {
                var li = document.createElement('li');
                li.innerHTML = '<a href="' + file.serverPath + '" download>📥 Download ' + file.originalName + '</a>';
                list.appendChild(li);
            });
        }
    };
    xhr.send();
}

function log(msg, type = 'info') {
    document.getElementById("messages-container").classList.remove('hidden');
    document.getElementById('messages').innerHTML += msg + '<br/>';
    var msgClass = type === 'info' ? 'info' : 'error';
    document.getElementById("messages").classList.add(msgClass);
}

function isDeviceAReader() {
    var agent = navigator.userAgent.toLowerCase();
    for (var i = 0; i < devices.length; i++) {
        if (stringContains(agent, devices[i].toLowerCase())) {
            return true;
        }
    }
    return false;
}

function stringContains(str, substr) {
    return str.indexOf(substr) !== -1;
}
