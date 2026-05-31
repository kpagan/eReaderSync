const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const roomDir = path.join(__dirname, 'uploads', req.body.roomId);
        if (!fs.existsSync(roomDir)) {
            fs.mkdirSync(roomDir, { recursive: true });
        }
        cb(null, roomDir);
    },
    filename: (req, file, cb) => {
        // FIX: Convert filename encoding from Latin1 back to UTF-8 to fix Unicode corruption
        const safeUnicodeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        
        // Save locally using a clean timestamp prefix to avoid conflicts
        cb(null, Date.now() + '-' + safeUnicodeName);
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rooms = {};

									
app.get('/api/create-room', (req, res) => {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    rooms[roomId] = { files: [] };
    res.json({ roomId });
});

									
app.post('/api/upload', upload.single('file'), (req, res) => {
    const { roomId } = req.body;
						 
    if (!rooms[roomId]) return res.status(404).send('Room not found.');
	 
    
    // FIX: Re-decode the original name here as well
    const safeUnicodeName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    
    const fileData = {
        originalName: safeUnicodeName,
        // The URL path needs to be URI encoded so the browser can request it properly
        serverPath: `/download/${roomId}/${encodeURIComponent(req.file.filename)}`
    };
    
    rooms[roomId].files.push(fileData);
    res.redirect(`/?room=${roomId}`);
});

// eReader FIX: Traditional POST route for joining a room without using JavaScript fetch
app.post('/join-room', (req, res) => {
    const roomId = req.body.roomId;
    res.redirect(`/?room=${roomId}`);
});

// eReader FIX: Instead of delivering raw JSON data, we let the frontend request this via scripts if needed, 
// but we keep the main UI render-friendly.
app.get('/api/room/:roomId', (req, res) => {
    const { roomId } = req.params;
    if (!rooms[roomId]) return res.json({ error: 'Room empty or expired', files: [] });
    res.json(rooms[roomId]);
});

// Download Route
app.get('/download/:roomId/:filename', (req, res) => {
    const { roomId, filename } = req.params;
    
    // Decode the filename coming from the URL path
    const decodedFilename = decodeURIComponent(filename);
    const filePath = path.join(__dirname, 'uploads', roomId, decodedFilename);
    
    if (fs.existsSync(filePath)) {
        // Strip the timestamp prefix when presenting the download file to the user
        const originalName = decodedFilename.replace(/^\d+-/, '');
        
        // FIX: Force RFC 5987 standard for content-disposition header to support Unicode names across all browsers
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});