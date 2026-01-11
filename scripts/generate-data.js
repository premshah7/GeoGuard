const fs = require('fs');
const path = require('path');

const count = 500;
let csvContent = "Roll Number,Enrollment Number,Name,Email\n";
let txtContent = "";

for (let i = 1; i <= count; i++) {
    const roll = (1000 + i).toString();
    const enroll = `ENR${20240000 + i}`;
    const name = `Student ${i}`;
    const email = `student${i}@example.com`;

    csvContent += `${roll},${enroll},${name},${email}\n`;
    txtContent += `${roll}  ${enroll}  ${name}  ${email}\n`;
}

const csvPath = path.join(__dirname, '../public/students_500.csv');
const txtPath = path.join(__dirname, '../public/students_500.txt');

fs.writeFileSync(csvPath, csvContent);
fs.writeFileSync(txtPath, txtContent);

console.log(`Generated ${count} students.`);
console.log(`CSV: ${csvPath}`);
console.log(`TXT: ${txtPath}`);
