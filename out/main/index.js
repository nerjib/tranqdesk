"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const icon = path.join(__dirname, "../../resources/icon.png");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
let db;
function initializeDatabase() {
  const dbPath = path.join(electron.app.getPath("userData"), "lodge_data.db");
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      return console.error("Database opening error: ", err.message);
    }
    console.log("Connected to the SQLite database.");
    db.run(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                price INTEGER,
                images TEXT
            )
        `);
    db.run(`
          CREATE TABLE IF NOT EXISTS bookings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              booking_id TEXT UNIQUE NOT NULL,
              name TEXT,
              email TEXT,
              phone TEXT,
              room_types TEXT[],
              check_in DATE NOT NULL,
              check_out DATE NOT NULL,
              guests INTEGER,
              special_requests TEXT,
              payment_id TEXT
              is_paid BOOLEAN DEFAULT FALSE,
              amount TEXT,
              status TEXT,
              booking_status TEXT,
              discount INTEGER
          )
      `);
    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_id TEXT UNIQUE NOT NULL,
            booking_id TEXT NOT NULL,
            date Timestamp not null,
            amount INTEGER,
            status VARCHAR,
            name TEXT,
            email TEXT,
            refund INTEGER,
            reason VARCHAR
        )
    `);
  });
}
const transporter = nodemailer.createTransport({
  host: "mail.tranquilitylodgekd.com",
  port: 465,
  secure: true,
  // service: 'gmail', // or your email service
  auth: {
    user: "payments@tranquilitylodgekd.com",
    // Your email address
    pass: "tranquility@2025"
    // Your email password or app password (recommended)
  }
});
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : { icon },
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    electron.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": ["default-src 'self' 'unsafe-inline' connect-src 'self' https://lodgeback-cbc389a0f95e.herokuapp.com ws://lodgeback-cbc389a0f95e.herokuapp.com 'unsafe-eval'"]
          // Add your backend URL
        }
      });
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  initializeDatabase();
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.handle("get-rooms-offline", async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM rooms", [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
});
electron.ipcMain.handle("save-rooms-offline", async (event, rooms) => {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO rooms (id, name, description, price, images) VALUES (?, ?, ?, ?, ?)");
    for (const room of rooms) {
      await new Promise((resolve, reject) => {
        stmt.run(room.id, room.name, room.description, room.price, room.images, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
    stmt.finalize();
    return { success: true };
  } catch (error) {
    console.error("Error saving rooms offline:", error);
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("get-reservations-offline", async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM bookings ORDER BY id DESC", [], (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
});
electron.ipcMain.handle("save-reservations-offline", async (event, reservations) => {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO bookings (id, booking_id, name, email, phone, room_types, check_in, check_out, guests, special_requests, payment_id, amount, status, booking_status, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const reservation of reservations) {
      await new Promise((resolve, reject) => {
        stmt.run(reservation.id, reservation.booking_id, reservation.name, reservation.email, reservation.phone, JSON.stringify(reservation.room_types), reservation.check_in, reservation.check_out, reservation.guests, reservation.special_requests, reservation.payment_id, reservation.amount, reservation.status, reservation.booking_status, reservation.discount, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
    stmt.finalize();
    console.log("saving reservations offline:");
    return { success: true };
  } catch (error) {
    console.error("Error saving reservations offline:", error);
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("get-payments-offline", async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM payments ORDER BY id  DESC", [], (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
});
electron.ipcMain.handle("save-payments-offline", async (event, payments) => {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO payments (payment_id, booking_id, date, amount, status, name, email, reason, refund) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const payment of payments) {
      await new Promise((resolve, reject) => {
        stmt.run(payment.payment_id, payment.booking_id, payment.created_at, payment.amount, payment.status, payment?.book_data?.name, payment?.book_data?.email, payment.reason, payment.refund, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
    stmt.finalize();
    return { success: true };
  } catch (error) {
    console.error("Error saving payments offline:", error);
    return { success: false, error: error.message };
  }
});
electron.ipcMain.handle("send-invoice-email", async (event, { to, subject, html, attachments }) => {
  try {
    const mailOptions = {
      from: "payments@tranquilitylodgekd.com",
      // Sender address
      to,
      // Recipient address
      subject,
      // Subject line
      html,
      // Email body (HTML)
      attachments
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: error.message };
  }
});
