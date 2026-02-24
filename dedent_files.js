const fs = require('fs');
const path = require('path');

const dir = 'composicoes-modelo-v4';
const filesToFix = ['INF-CRT-PAR-15X15.md', 'INF-CRT-PIS-20X15.md', 'LOG-MAT-TRANSP-100.md', 'LOG-ENT-ENSAC-100.md', 'MUR-BLC-14-01.md'];

for (const file of filesToFix) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove leading 4 spaces and change #### X.X TITLE to inline bolding
    // We want the text to look like V3 (bulleted and bolded)
    // First, remove the 4 spaces
    content = content.replace(/^    ([^\n])/gm, '$1');

    // Convert `#### 1.1 ESCOPO DETALHADO` to `**1.1 ESCOPO DETALHADO:**` 
    content = content.replace(/^#### (\d\.\d) (.*?)$/gm, '**$1 $2:**');

    fs.writeFileSync(filePath, content);
    console.log(`Re-formatted ${file}`);
}
