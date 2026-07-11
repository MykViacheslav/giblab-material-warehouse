const fs = require('fs');
const readline = require('readline');

const inputPath = 'C:\\Users\\mykyt\\.gemini\\antigravity\\brain\\45f15a4b-2374-4c14-b81c-32682869f3eb\\.system_generated\\logs\\transcript.jsonl';
const outputPath = 'C:\\Users\\mykyt\\Documents\\GibLab magazyn\\historia_rozmowy.md';

const readStream = fs.createReadStream(inputPath);
const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
});

let markdown = '# Historia Rozmowy\n\n';

rl.on('line', (line) => {
    try {
        const step = JSON.parse(line);
        if (step.type === 'USER_INPUT' && step.content) {
            // Extract content from <USER_REQUEST> if present
            let content = step.content;
            const reqMatch = content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
            if (reqMatch) content = reqMatch[1].trim();
            
            markdown += `**Ty (${new Date(step.created_at).toLocaleString('pl-PL')}):**\n${content}\n\n`;
        } else if (step.type === 'PLANNER_RESPONSE' && step.content && step.content.trim()) {
            markdown += `**Asystent (Antigravity) (${new Date(step.created_at).toLocaleString('pl-PL')}):**\n${step.content.trim()}\n\n`;
            markdown += `---\n\n`;
        }
    } catch (e) {
        // skip invalid lines
    }
});

rl.on('close', () => {
    fs.writeFileSync(outputPath, markdown, 'utf8');
    console.log('Done writing chat log to historia_rozmowy.md');
});
