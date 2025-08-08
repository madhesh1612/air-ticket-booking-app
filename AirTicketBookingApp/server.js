const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login handler
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === '1234') {
    req.session.user = username;
    res.redirect('/bookform');  // Redirect to booking form
  } else {
    res.status(401).send('❌ Invalid credentials.');
  }
});

// Booking form after login
app.get('/bookform', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'bookform.html'));
});

// Book route
app.post('/book', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { name, source, destination, date } = req.body;

  if (!name || !source || !destination || !date) {
    return res.status(400).send("Please fill in all fields.");
  }

  const doc = new PDFDocument();
  const timestamp = Date.now();
  const filename = `ticket-${timestamp}.pdf`;
  const filepath = path.join(__dirname, 'public', filename);

  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  doc.fontSize(26).text('✈️ Air Ticket Confirmation', { align: 'center' });
  doc.moveDown();
  doc.fontSize(18).text(`👤 Passenger Name: ${name}`);
  doc.text(`🛫 Source: ${source}`);
  doc.text(`🛬 Destination: ${destination}`);
  doc.text(`📅 Travel Date: ${date}`);
  doc.end();

  stream.on('finish', () => {
    res.download(filepath, filename, (err) => {
      if (!err) {
        fs.unlink(filepath, (err) => {
          if (err) console.error("Failed to delete PDF:", err);
        });
      } else {
        console.error("Download error:", err);
      }
    });
  });

  stream.on('error', (err) => {
    console.error('PDF generation error:', err);
    res.status(500).send('Error generating PDF');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
