const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Create an Express app
const app = express();
const port = process.env.PORT || 3000;

// Set up middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Google Sheets API setup
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Google Drive API setup
const drive = google.drive({ version: 'v3', auth: oAuth2Client });
const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

// Authentication function
function authenticate(req, res, next) {
  const { code } = req.query;
  if (code) {
    oAuth2Client.getToken(code, (err, tokens) => {
      if (err) return res.status(500).send('Authentication failed');
      oAuth2Client.setCredentials(tokens);
      res.send('Authentication successful. Now, you can submit data.');
    });
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
}

// Endpoint for writing data to a new Google Sheet
app.post('/submitData', async (req, res) => {
  const { answers } = req.body;

  try {
    // Create a new Google Sheet
    const newSheetResponse = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: `Payroll Information - ${new Date().toISOString()}`,
        },
      },
    });

    const newSheetId = newSheetResponse.data.spreadsheetId;

    // Add headers to the new sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: newSheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      resource: {
        values: [
          [
            'Payroll Software',
            'Macro Headers',
            'Employee Types',
            'Overtime Rules',
            'Employee Position',
            'Employee Shifts',
            'Unions',
            'Pay Periods',
            'Extra Notes',
            'Output Formats',
          ],
        ],
      },
    });

    // Append answers to the new sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: newSheetId,
      range: 'Sheet1!A2',
      valueInputOption: 'RAW',
      resource: {
        values: [
          [
            answers.payrollSoftware,
            answers.macroHeaders,
            answers.employeeTypes,
            answers.overtime,
            answers.employeePosition,
            answers.employeeShifts,
            answers.unions,
            answers.payPeriods,
            answers.extraNotes,
            answers.outputFormats,
          ],
        ],
      },
    });

    // Optionally, move the new sheet to a specific Google Drive folder
    if (process.env.DRIVE_FOLDER_ID) {
      await drive.files.update({
        fileId: newSheetId,
        addParents: process.env.DRIVE_FOLDER_ID,
      });
    }

    res.status(200).send('Data submitted and saved in a new Google Sheet!');
  } catch (error) {
    res.status(500).send('Error submitting data: ' + error.message);
  }
});

// Authentication route (redirects to Google OAuth)
app.get('/auth', authenticate);

// Serve the static HTML page for frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});