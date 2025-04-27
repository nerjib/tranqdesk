import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');

// const isDev = require('electron-is-dev');

// import Database from 'better-sqlite3';

// const {sqlite3} = require('sqlite3').verbose();

// const db = new sqlite3.Database(path.join(__dirname, 'test.db'), (err) => {
//   if (err) {
//     console.error(err.message);
//   }
//   console.log('Connected to the test database.');
// }
// );

// export function connect() {
//   return Database(
//     path.join(__dirname, '../../../', 'release/app', 'mydb.db'),
//     { verbose: console.log, fileMustExist: true },
//   );
// }

let db;

function initializeDatabase() {
    const dbPath = path.join(app.getPath('userData'), 'lodge_data.db'); // Store in user data directory
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            return console.error("Database opening error: ",err.message);
        }
        console.log('Connected to the SQLite database.');
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
              status TEXT
          )
      `);
      // db.run(`ALTER TABLE bookings ADD COLUMN status TEXT`);
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_id TEXT UNIQUE NOT NULL,
            booking_id TEXT NOT NULL,
            date Timestamp not null,
            amount INTEGER,
            status VARCHAR
        )
    `);
        //Create other tables here
    });
}
const transporter = nodemailer.createTransport({
  host: 'mail.tranquilitylodgekd.com',
  port: 465,
  secure: true,
  // service: 'gmail', // or your email service
  auth: {
      user: 'payments@tranquilitylodgekd.com', // Your email address
      pass: 'tranquility@2025', // Your email password or app password (recommended)
  },
});
// connect();
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : { icon }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
      // mainWindow.webContents.openDevTools();
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
          callback({
              responseHeaders: {
                  ...details.responseHeaders,
                  'Content-Security-Policy': ['default-src \'self\' \'unsafe-inline\' connect-src \'self\' https://lodgeback-cbc389a0f95e.herokuapp.com ws://lodgeback-cbc389a0f95e.herokuapp.com \'unsafe-eval\''] // Add your backend URL
              }
          })
      })

  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  initializeDatabase();
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('get-rooms-offline', async () => {
  return new Promise((resolve, reject) => {
      db.all('SELECT * FROM rooms', [], (err, rows) => {
          if(err) reject(err)
          resolve(rows)
      })
  })
})

ipcMain.handle('save-rooms-offline', async (event, rooms) => {
  try {
      const stmt = db.prepare('INSERT OR REPLACE INTO rooms (id, name, description, price, images) VALUES (?, ?, ?, ?, ?)');
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
})

ipcMain.handle('get-reservations-offline', async () => {
  return new Promise((resolve, reject) => {
      db.all('SELECT * FROM bookings', [], (err, rows) => {
          if (err) {
              reject(err);
          }
          resolve(rows);
      });
  });
});

ipcMain.handle('save-reservations-offline', async (event, reservations) => {
  try {
      const stmt = db.prepare('INSERT OR REPLACE INTO bookings (id, booking_id, name, email, phone, room_types, check_in, check_out, guests, special_requests, payment_id, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const reservation of reservations) {
          await new Promise((resolve, reject) => {
              stmt.run(reservation.id, reservation.booking_id, reservation.name, reservation.email, reservation.phone, JSON.stringify(reservation.room_types), reservation.check_in, reservation.check_out, reservation.guests, reservation.special_requests, reservation.payment_id, reservation.amount, reservation.status, (err) => {
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
      // alert("saving reservations offline successful");
      return { success: true };
  } catch (error) {
      console.error("Error saving reservations offline:", error);
      return { success: false, error: error.message };
  }
});

ipcMain.handle('get-payments-offline', async () => {
  return new Promise((resolve, reject) => {
      db.all('SELECT * FROM payments', [], (err, rows) => {
          if (err) {
              reject(err);
          }
          resolve(rows);
      });
  });
});

ipcMain.handle('save-payments-offline', async (event, payments) => {
  try {
      const stmt = db.prepare('INSERT OR REPLACE INTO payments (payment_id, booking_id, date, amount, status) VALUES (?, ?, ?, ?, ?)');
      for (const payment of payments) {
          await new Promise((resolve, reject) => {
              stmt.run(payment.payment_id, payment.booking_id, payment.created_at, payment.amount, payment.status, (err) => {
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
ipcMain.handle('send-invoice-email', async (event, { to, subject, html, attachments }) => {
  try {
      const mailOptions = {
          from: 'payments@tranquilitylodgekd.com', // Sender address
          to: to, // Recipient address
          subject: subject, // Subject line
          html: html, // Email body (HTML)
          attachments: attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      return { success: true, message: 'Email sent successfully!' };
  } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, message: error.message };
  }
});