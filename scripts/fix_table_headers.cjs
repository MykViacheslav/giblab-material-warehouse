const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const tablePattern = `                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Zamwienie</th>
                      <th>Klient</th>
                      <th>Pozycja</th>
                      <th>Materia</th>
                      <th>Status</th>
                      <th>Szt.</th>
                      <th>m2 formatek</th>
                      <th>GibLab ark./m2</th>
                      <th>Okleina mb</th>
                    </tr>
                  </thead>
                  <tbody id="cutJobsBody"></tbody>
                </table>`;
                
// Let's use string operations to find the table block before cutJobsBody
const tbodyIndex = html.indexOf('<tbody id="cutJobsBody">');
if (tbodyIndex !== -1) {
    const tableStartIndex = html.lastIndexOf('<table>', tbodyIndex);
    const tableEndIndex = html.indexOf('</table>', tbodyIndex) + 8;
    
    if (tableStartIndex !== -1) {
        const replacementTable = `<table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Pozycja</th>
                      <th>Materiał</th>
                      <th>Status</th>
                      <th>Szt.</th>
                      <th>m2 formatek</th>
                      <th>GibLab ark./m2</th>
                      <th>Okleina mb</th>
                    </tr>
                  </thead>
                  <tbody id="cutJobsBody"></tbody>
                </table>`;
        html = html.substring(0, tableStartIndex) + replacementTable + html.substring(tableEndIndex);
        fs.writeFileSync('public/index.html', html, 'utf8');
        console.log("Replaced the table headers explicitly!");
    } else {
        console.log("Could not find table start index");
    }
} else {
    console.log("Could not find tbody cutJobsBody");
}
