const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\mykyt\\.gemini\\antigravity\\brain\\45f15a4b-2374-4c14-b81c-32682869f3eb\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let found = false;
  for await (const line of rl) {
    const entry = JSON.parse(line);
    // Look for the output of Get-Content public/index.html
    if (entry.type === 'RUN_COMMAND' && entry.content && entry.content.includes('Get-Content \\"public/index.html\\"')) {
      // Actually we need the RESPONSE to this command, which would be the next RUN_COMMAND with the output, or it was in the background task?
      // Wait, if it was synchronous, the output is in the NEXT step with type 'PLANNER_RESPONSE' or 'SYSTEM'?
      // Usually the system sends back the tool response.
    }
    
    // Better: let's just find the entry that contains "<!DOCTYPE html>" and "<title>Magazyn GibLab - Ekran CNC</title>" or similar.
    // Wait, the user's index.html has "<title>Magazyn GibLab</title>"?
    // Let's search for "exportGiblabBtn" inside the transcript output.
    if (entry.content && entry.content.includes('exportGiblabBtn')) {
      fs.appendFileSync('found_lines.txt', `Step ${entry.step_index} (${entry.type}): ` + entry.content.substring(0, 200) + '\n');
      if (entry.content.length > 5000) {
        fs.writeFileSync(`recovered_${entry.step_index}.txt`, entry.content);
      }
    }
  }
}

processLineByLine();
