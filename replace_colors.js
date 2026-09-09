const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'design', 'stitch');

const colorMap = {
  '#FF6B4A': '#2563EB',
  '#FFEAE4': '#DBEAFE',
  '#D94827': '#1D4ED8',
  '#2D8A68': '#16A34A', // Using success green here, wait, for secondary it should be yellow
  '#E6F5EF': '#FEF3C7', // container
  '#1E6148': '#D99A16', // active/text
  '#F5A623': '#F5B82E',
  '#FEF6E7': '#FEF3C7',
  '#E53935': '#DC2626',
  '#FDEBEB': '#FEE2E2',
  '#2575FC': '#2563EB',
  '#EBF3FF': '#DBEAFE',
  'primary-container: \'#ff6b4a\'': 'primary-container: \'#dbeafe\'',
  'Primary Coral': 'Primary Blue',
  'Secondary Sage': 'Secondary Yellow'
};

const mapRegex = new RegExp(Object.keys(colorMap).join('|'), 'gi');

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  Object.keys(colorMap).forEach(key => {
    const regex = new RegExp(key, 'gi');
    newContent = newContent.replace(regex, colorMap[key]);
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated: ' + filePath);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.md')) {
      processFile(fullPath);
    }
  }
}

processDirectory(directoryPath);
console.log('Done replacing colors in markdown files.');
