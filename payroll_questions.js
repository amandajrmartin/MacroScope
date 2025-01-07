const inquirer = require('inquirer');
const fs = require('fs');

// Define questions
const questions = [
  {
    type: 'input',
    name: 'payrollSoftware',
    message: 'What payroll software are you using?',
  },
  {
    type: 'input',
    name: 'macroHeaders',
    message: 'What are the column headers?',
  },
  {
    type: 'input',
    name: 'employeeTypes',
    message: 'What wage types does your payroll use?',
  },
  {
    type: 'input',
    name: 'overtime',
    message: 'What are your overtime rules?',
  },
  {
    type: 'input',
    name: 'employeePosition',
    message: 'Are there specific employee positions that trigger different overtime rules?',
  },
  {
    type: 'input',
    name: 'employeeShifts',
    message: 'Are there specific employee shifts or overnight shifts that need to be handled differently?',
  },
  {
    type: 'input',
    name: 'unions',
    message: 'Does your company have unions? If so, how are those handled?',
  },
  {
    type: 'input',
    name: 'payPeriods',
    message: 'What are your pay periods like?',
  },
  {
    type: 'input',
    name: 'extraNotes',
    message: 'Are there any other specific payroll related needs that we did not discuss?',
  },
  {
    type: 'input',
    name: 'outputFormats',
    message: 'What output formats are required (e.g., Excel, PDF, CSV)?',
  },
];

// Function to ask questions one at a time and log answers
async function askQuestions() {
  const answers = {};

  // Ask each question sequentially
  for (const question of questions) {
    const answer = await inquirer.prompt([question]);
    const answerKey = Object.keys(answer)[0]; // Get the answer key (e.g., 'payrollSoftware')

    // Log and store the answer
    console.log(`${question.message} ${answer[answerKey]}`);
    answers[answerKey] = answer[answerKey];
  }

  // After all questions are asked, write answers to CSV
  const csvContent = `
Field,Answer
Software Name,${answers.payrollSoftware}
Column Headers,${answers.macroHeaders}
Employee Types,${answers.employeeTypes}
Overtime Rules,${answers.overtime}
Employee Positions,${answers.employeePosition}
Employee Shifts,${answers.employeeShifts}
Unions,${answers.unions}
Pay Periods,${answers.payPeriods}
Extra Notes,${answers.extraNotes}
Output Formats,${answers.outputFormats}
`;

  // Write the answers to a CSV file
  fs.writeFileSync('payroll_requirements.csv', csvContent, 'utf8');
  console.log('Your answers have been saved to payroll_requirements.csv');

  // Prompt the user to upload a payroll import file
  const uploadAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'filePath',
      message: 'Enter the path to the payroll data CSV file you want to upload:',
      validate: (input) => {
        // Check if the file exists
        if (fs.existsSync(input)) {
          return true;
        }
        return 'Please enter a valid path to an existing CSV file.';
      },
    },
  ]);

  const { filePath } = uploadAnswer;

  // Read and display the uploaded CSV content
  const fileContent = fs.readFileSync(filePath, 'utf8');
  console.log('Uploaded Payroll Data:');
  console.log(fileContent);

  // Optionally process the payroll data (e.g., parsing or validation)
  console.log('Payroll data has been successfully uploaded and processed.');
}

// Start asking questions
askQuestions().catch((error) => {
  console.error('An error occurred:', error.message);
});
