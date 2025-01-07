const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// The file token.json stores the user's access and refresh tokens and is created
// automatically when the authorization flow completes for the first time.
const TOKEN_PATH = 'token.json';

// Scopes to request from the user.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'];

// Load client secrets from a local file.
function loadCredentials() {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, 'credentials.json'), (err, content) => {
      if (err) {
        reject('Error loading client secret file: ' + err);
        return;
      }
      authorize(JSON.parse(content), resolve);
    });
  });
}

// Create an OAuth2 client with the given credentials.
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.setCredentials(JSON.parse(token));
      callback(oauth2Client);
    }
  });
}

// Get and store new token after prompting for user authorization.
function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) {
          console.error(err);
        }
        console.log('Token stored to ' + TOKEN_PATH);
      });
      callback(oauth2Client);
    });
  });
}

// Create a new Google Sheet based on the responses
async function createSheet(auth, responses) {
  const sheets = google.sheets({ version: 'v4', auth });
  const resource = {
    properties: {
      title: 'Payroll Responses', // The title of the new sheet
    },
    sheets: [
      {
        properties: {
          title: 'Responses',
        },
      },
    ],
  };
  
  try {
    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({ resource });
    console.log('Spreadsheet created:', spreadsheet.data.spreadsheetId);
    
    // Add responses to the sheet
    const sheetId = spreadsheet.data.spreadsheetId;
    const range = 'Responses!A1';
    
    const values = [
      ['Question', 'Answer'],
      ['Payroll Software', responses.payrollSoftware],
      ['Column Headers', responses.macroHeaders],
      ['Employee Types', responses.employeeTypes],
      ['Overtime Rules', responses.overtime],
      ['Employee Positions', responses.employeePosition],
      ['Employee Shifts', responses.employeeShifts],
      ['Unions', responses.unions],
      ['Pay Periods', responses.payPeriods],
      ['Extra Notes', responses.extraNotes],
      ['Output Formats', responses.outputFormats],
    ];

    const resourceData = {
      values,
    };
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      resource: resourceData,
    });

    console.log('Responses added to the sheet');
  } catch (error) {
    console.log('Error creating or updating the spreadsheet:', error);
  }
}

module.exports = { loadCredentials, createSheet };