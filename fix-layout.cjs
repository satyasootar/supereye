const fs = require('fs');
const file = 'e:\\CODE\\Hackathon\\supereye\\components\\brief\\brief-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix horizontal scrollbar
content = content.replace('className="max-h-[420px] space-y-1 overflow-y-auto pr-0.5"', 'className="max-h-[420px] space-y-1 overflow-y-auto overflow-x-hidden pr-0.5"');

// 2. Wrap Col 1
content = content.replace('{/* Main 3-column layout */}\n              <div className="grid gap-3 lg:grid-cols-12">\n                {/* Column 1: Action items */}\n                <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3 lg:col-span-3">', 
`{/* Main content layout */}
              <div className="space-y-3">
                {/* Top Row: Focus + Email */}
                <div className="grid gap-3 lg:grid-cols-12">
                  {/* Column 1: Action items */}
                  <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3 lg:col-span-5">`);

// 3. Swap Col 2 and Col 3
const col2StartMarker = '                {/* Column 2: Schedule + integrations */}';
const col3StartMarker = '                {/* Column 3: Inbox priorities + tabbed mail */}';
const pluginsStartMarker = '              {/* Connected plugins strip */}';

const col2StartIndex = content.indexOf(col2StartMarker);
const col3StartIndex = content.indexOf(col3StartMarker);
const pluginsStartIndex = content.indexOf(pluginsStartMarker);

// The main grid closing is just before plugins strip
const mainGridClosing = content.slice(0, pluginsStartIndex).lastIndexOf('              </div>');

const col2Code = content.slice(col2StartIndex, col3StartIndex);
const col3Code = content.slice(col3StartIndex, mainGridClosing);

const newCol3Code = col3Code.replace('lg:col-span-5', 'lg:col-span-7');
const newCol2Code = col2Code.replace('<div className="space-y-3 lg:col-span-4">', '<div className="grid gap-3 lg:grid-cols-3">');

const reconstructed = content.slice(0, col2StartIndex) + 
  newCol3Code + 
  '                </div>\n\n                {/* Bottom Row: Schedule, GitHub, Drive */}\n' + 
  newCol2Code + 
  '              </div>\n\n' + 
  content.slice(pluginsStartIndex);

fs.writeFileSync(file, reconstructed);
console.log('Layout updated successfully.');
