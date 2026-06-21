const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const expirationTime = 30 * 60 * 1000; // 30 minutes in milliseconds

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const roomDir = path.join(__dirname, '..', 'uploads', req.body.roomId);
        if (!fs.existsSync(roomDir)) {
            fs.mkdirSync(roomDir, { recursive: true });
        }
        cb(null, roomDir);
    },
    filename: (req, file, cb) => {
        // FIX: Convert filename encoding from Latin1 back to UTF-8 to fix Unicode corruption
        const safeUnicodeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        
        // Save locally using a clean timestamp prefix to avoid conflicts
        cb(null, safeUnicodeName);
    }
});

const allowedFileExtensions = ['.epub', '.mobi', '.pdf', '.txt', '.cbz', '.cbr'];

const fileFilter = (req, file, cb) => {
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedFileExtensions.includes(fileExt)) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed. Allowed types: EPUB, MOBI, PDF, TXT, CBZ, CBR.'));
    }
};

const upload = multer({ storage: storage, fileFilter });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rooms = {};

									
app.get('/api/create-room', (req, res) => {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    rooms[roomId] = { files: [] };
    res.json({ roomId });
});

									
app.post('/api/upload', (req, res, next) => {
    upload.single('file')(req, res, function (err) {
        if (err) return res.status(400).send(err.message);
        const { roomId } = req.body;

        if (!rooms[roomId]) return res.status(404).send('Room not found.');
        if (!req.file) return res.status(400).send('No file uploaded.');

        // FIX: Re-decode the original name here as well
        const safeUnicodeName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

        const fileData = {
            originalName: safeUnicodeName,
            // The URL path needs to be URI encoded so the browser can request it properly
            serverPath: `/${encodeURIComponent(req.file.filename)}?roomId=${roomId}`
        };

        const timeoutHandle = setTimeout(() => cleanupRoom(roomId), expirationTime);
        rooms[roomId].files.push(fileData);
        rooms[roomId].timeoutHandle = timeoutHandle;
        rooms[roomId].expirationTime = Date.now() + expirationTime;
        res.redirect(`/?room=${roomId}`);
    });
});

function cleanupRoom(roomId) {
    console.log(`Cleaning up room ${roomId}`);
    if (rooms[roomId]) {
        clearTimeout(rooms[roomId].timeoutHandle);
        const roomDir = path.join(__dirname, '..', 'uploads', roomId);
        if (fs.existsSync(roomDir)) {
            console.log(`Deleting directory: ${roomDir}`);
            fs.rmSync(roomDir, { recursive: true, force: true });
        }  
        delete rooms[roomId];
    }
}

// Periodic cleanup: Remove orphaned files every 1 hour
function periodicCleanup() {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
        return;
    }

    try {
        const directories = fs.readdirSync(uploadsDir);
        let deletedCount = 0;

        directories.forEach(dir => {
            const dirPath = path.join(uploadsDir, dir);
            const stats = fs.statSync(dirPath);

            if (stats.isDirectory()) {
                // Check if this directory corresponds to an active room
                if (!rooms[dir]) {
                    console.log(`[Periodic Cleanup] Removing orphaned directory: ${dir}`);
                    try {
                        fs.rmSync(dirPath, { recursive: true, force: true });
                        deletedCount++;
                    } catch (err) {
                        console.error(`[Periodic Cleanup] Failed to delete ${dirPath}:`, err.message);
                    }
                }
            }
        });

        if (deletedCount > 0) {
            console.log(`[Periodic Cleanup] Completed - Deleted ${deletedCount} orphaned folder(s)`);
        }
    } catch (err) {
        console.error('[Periodic Cleanup] Error during cleanup:', err.message);
    }
}

// Start periodic cleanup interval (every 1 hour = 3600000 milliseconds)
const cleanupInterval = setInterval(periodicCleanup, 3600000);

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
    
    // Calculate remaining time in seconds based on actual expiration timestamp
    const remainingMs = rooms[roomId].expirationTime - Date.now();
    const expiresInSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    
    res.json({
        files: rooms[roomId].files,
        expiresInSeconds: expiresInSeconds
    });
});

// Download Route
app.get('/:filename', (req, res, next) => {
    const roomId = req.query.roomId;
    if (!roomId) return next(); // If no roomId query, pass to next route (e.g. static files)

    // the only way to get the correct filename in the eReader device properly
    // is to pass it directly in the download link. The headers have no effect
    const filename = req.params.filename;
    
    const room = rooms[roomId];
    if (!room) return res.status(404).send('Room not found.');
    const fileEntry = room.files.find(f => f.serverPath.includes(encodeURIComponent(filename)));
    if (!fileEntry) return res.status(404).send('File not found in room.');

    // Decode the filename coming from the URL path 
    const decodedFilename = decodeURIComponent(filename);
    const filePath = path.join(__dirname, '..', 'uploads', roomId, decodedFilename);
    
    if (fs.existsSync(filePath)) {
        // FIX: Force RFC 5987 standard for content-disposition header to support Unicode names across all browsers
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(decodedFilename)}`);
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown: Clear cleanup interval
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    clearInterval(cleanupInterval);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nServer terminating...');
    clearInterval(cleanupInterval);
    process.exit(0);
});