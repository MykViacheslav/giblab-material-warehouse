const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const start = html.indexOf('<section id="cuttingTab"');
const end = html.indexOf('</section>', start);

// Grab the last 50 chars before </section>
const snippet = html.substring(end - 50, end);
console.log('Snippet before fix:\n' + snippet);

// Replace "</div>\n          </div>\n        </section>" with "</div>\n        </section>"
// Actually, let's just do a string replacement targeting the exact sequence.
const target = `</div>
          </div>
        </section>`;
        
if (html.includes(target)) {
    const replacement = `</div>
        </section>`;
    html = html.replace(target, replacement);
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log('Fixed extra div!');
} else {
    // maybe different whitespace
    const target2 = `</div>\n          </div>\n        </section>`;
    const target3 = `</div>\r\n          </div>\r\n        </section>`;
    if (html.includes(target2)) {
         html = html.replace(target2, `</div>\n        </section>`);
         fs.writeFileSync('public/index.html', html, 'utf8');
         console.log('Fixed extra div (LF)!');
    } else if (html.includes(target3)) {
         html = html.replace(target3, `</div>\r\n        </section>`);
         fs.writeFileSync('public/index.html', html, 'utf8');
         console.log('Fixed extra div (CRLF)!');
    } else {
         console.log('Could not find exact target string.');
    }
}
