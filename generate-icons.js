const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Your researchCollab logo SVG
const logoSvg = `<svg width="274" height="273" viewBox="0 0 274 273" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M33.9695 99.228C36.9125 78.3512 45.8399 61.966 58.7417 50.74C71.8467 39.3373 90.0928 32.3536 112.971 32.3536C156.574 32.3536 183.44 63.4032 190.212 93.0963C193.63 108.084 191.857 120.593 187.167 128.883C182.851 136.51 175.254 142.155 162.327 142.924C149.76 143.671 142.246 138.926 137.337 132.632C131.882 125.637 129.204 115.962 129.204 107.845C129.204 98.9107 121.936 91.6682 112.971 91.6682C104.006 91.6682 96.7379 98.9107 96.7379 107.845C96.7379 121.836 101.071 138.854 111.703 152.485C122.88 166.817 140.528 176.632 164.261 175.219C187.589 173.831 205.424 162.49 215.447 144.773C225.096 127.72 226.57 106.528 221.871 85.9264C212.41 44.4418 174.562 0 112.971 0C83.2527 0 57.1283 9.19297 37.3881 26.3692C17.651 43.5427 5.33752 67.7934 1.63944 96.0467L1.50308 97.0882V230.921H33.9695V99.228Z" fill="#0E70FF"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M145.438 110.003C145.438 91.4946 129.623 74.8279 108.345 78.0088C97.0166 79.7023 90.2083 85.1862 86.3285 92.6819C82.1476 100.759 80.5778 112.859 83.9197 128.125C90.2777 157.163 116.494 186.573 160.589 186.573C206.536 186.573 239.591 154.976 239.591 120.788H272.057C272.057 177.132 219.836 218.927 160.589 218.927C99.491 218.927 61.4255 177.159 52.1996 135.021C47.7499 114.697 48.8854 94.4435 57.4746 77.8501C66.3647 60.6753 82.3911 49.173 103.529 46.0133C147.183 39.4875 177.904 74.5859 177.904 110.003C177.904 118.938 170.637 126.18 161.671 126.18C152.706 126.18 145.438 118.938 145.438 110.003Z" fill="#F59B14"/>
</svg>`;

async function generateIcons() {
  // Create assets directory if it doesn't exist
  const assetsDir = path.join(__dirname, 'public', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const sizes = [16, 32, 80];
  
  for (const size of sizes) {
    try {
      await sharp(Buffer.from(logoSvg))
        .resize(size, size)
        .png()
        .toFile(path.join(assetsDir, `icon-${size}.png`));
      
      console.log(`✅ Generated icon-${size}.png`);
    } catch (error) {
      console.error(`❌ Error generating icon-${size}.png:`, error);
    }
  }
  
  console.log('\n🎉 All icons generated successfully!');
  console.log('Files created in /public/assets/:');
  console.log('- icon-16.png');
  console.log('- icon-32.png');
  console.log('- icon-80.png');
}

generateIcons();
