const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const app = express();
const PORT = process.env.PORT || 3000; // Use an environment variable or default to 3000

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Handle form submission
app.post("/submit", async (req, res) => {
  try {
    const responses = req.body;

    // Ensure the "output" directory exists
    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true }); // Create directory recursively
    }

    // Generate a timestamped filename
    const timestamp = new Date().toISOString().replace(/:/g, "-"); // Replace ':' to avoid invalid filename
    const filename = `Form_Responses_${timestamp}.xlsx`;
    const filepath = path.join(outputDir, filename);

    // Extract headers from the second question (macroHeaders)
    const headers = responses.macroHeaders
      ? responses.macroHeaders.split(",").map(header => header.trim())
      : Object.keys(responses); // Default to all keys if macroHeaders is not provided

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    // First Sheet: Headers from `macroHeaders`
    const headersSheet = workbook.addWorksheet("Headers");
    headersSheet.addRow(headers); // Add headers as the first row
    const rowData = headers.map(header => responses[header] || ""); // Map responses based on headers
    headersSheet.addRow(rowData); // Add responses to the sheet

    // Second Sheet: All Questions and Answers
    const allResponsesSheet = workbook.addWorksheet("All Responses");
    const allHeaders = Object.keys(responses); // Use all keys as headers
    allResponsesSheet.addRow(allHeaders); // Add headers as the first row
    const allRowData = allHeaders.map(header => responses[header] || ""); // Map all responses
    allResponsesSheet.addRow(allRowData); // Add responses to the sheet

    // Save the workbook
    await workbook.xlsx.writeFile(filepath);

    console.log(`Form responses saved to ${filepath}`);
    res.send(
      `Form submitted successfully! Your responses have been saved in an Excel file: <a href="/output/${filename}" download>${filename}</a>`
    );
  } catch (error) {
    console.error("Error saving form responses:", error);
    res.status(500).send("An error occurred while saving the form responses.");
  }
});

// Serve the generated Excel files
app.use("/output", express.static(path.join(__dirname, "output")));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});