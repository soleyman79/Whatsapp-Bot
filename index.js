const { Client, LocalAuth } = require("whatsapp-web.js");

const qrcode = require("qrcode");
const puppeteer = require("puppeteer");
const fs = require("fs");
const express = require("express");
const app = express();
const path = require("path");


const PORT = process.env.PORT || 3000;
app.use(express.json()); // to parse JSON bodies

// WhatsApp client setup
let qrCodeData = null;


// create WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: puppeteer.executablePath()
    },
});

// genrate QR code to log in
client.on("qr", (qr) => {
    qrCodeData = qr;
    console.log("Scan the QR code in WhatsApp to log in.");
    qrcode.toFile("qrcode.png", qr.toString(), {
        color: {
            dark: '#000',
            light: '#FFF',
        },
    });
});

// notify when logged in
client.on("ready", () => {
    console.log("WhatsApp Bot is ready!");
    app.listen(PORT, () => {
        console.log(`🚀 API server is running at http://localhost:${PORT}`);
    });
});

function sendMessageTo(phoneNumber, message) {
    const chatId = phoneNumber.replace("+", "") + "@c.us";
    client.sendMessage(chatId, message)
        .then(() => {
            console.log(`✅ Message sent to ${phoneNumber}`);
        })
        .catch((err) => {
            console.error(`❌ Error: ${err.message}`);
            promptForMessage("+989301395175", "Hello, this is an automated message from my bot! 🚀");
        });
}

// ask user for phone number and message
function promptForMessage(number, message) {
    sendMessageTo(number, message);
}

// start the client
client.initialize();


// return the QR code image
app.get("/qrcode", (req, res) => {
    if (!qrCodeData || !fs.existsSync("qrcode.png")) {
        return res.status(404).send("QR code not ready yet.");
    }
    res.sendFile(__dirname + "/qrcode.png");
});

// send a message to a phone number
app.post("/text", async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: "Missing 'number' or 'message' field" });
    }

    const chatId = number.replace("+", "") + "@c.us";
    try {
        await client.sendMessage(chatId, message);
        res.json({ status: "success", message: `Message sent to ${number}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", error: err.message });
    }
});

// delete authentication folders
app.delete("/reset", (req, res) => {
    const authFolderPath = path.join(__dirname, ".wwebjs_auth");
    const cacheFolderPath = path.join(__dirname, ".wwebjs_cache");

    fs.rm(authFolderPath, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error("❌ Error deleting folder:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        console.log("✅ Folder deleted.");
        res.json({ success: true, message: "Folder has been deleted." });
    });

    fs.rm(cacheFolderPath, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error("❌ Error deleting folder:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        console.log("✅ Folder deleted.");
        res.json({ success: true, message: "Folder has been deleted." });
    });
});

// start the HTTP server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
