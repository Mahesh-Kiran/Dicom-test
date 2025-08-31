const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

async function testSharpTiling() {
  console.log('🧪 Testing Sharp DZI tiling...');
  
  // Create a test image (simple gradient)
  const testImagePath = path.join(__dirname, 'test-image.png');
  const testId = 'test-' + Date.now();
  const tilesPath = path.join(__dirname, 'server', 'data', 'tiles', testId);
  
  try {
    // Create a simple test image
    console.log('📸 Creating test image...');
    await sharp({
      create: {
        width: 1024,
        height: 768,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .png()
    .toFile(testImagePath);
    
    console.log('✅ Test image created:', testImagePath);
    
    // Ensure tiles directory exists
    await fs.mkdir(tilesPath, { recursive: true });
    console.log('📁 Tiles directory created:', tilesPath);
    
    // Test Sharp tiling
    console.log('🔧 Testing Sharp DZI tiling...');
    await sharp(testImagePath)
      .png({ quality: 90, progressive: false })
      .tile({
        size: 512,
        layout: 'dz',
        overlap: 1,
        container: 'fs'
      })
      .toFile(path.join(tilesPath, testId));
    
    console.log('✅ Sharp tiling completed');
    
    // Check what files were created
    console.log('🔍 Checking created files...');
    const files = await fs.readdir(tilesPath, { withFileTypes: true });
    console.log('📂 Files created:', files.map(f => ({ name: f.name, isDirectory: f.isDirectory() })));
    
    // Check for DZI file
    const dziPath = path.join(tilesPath, `${testId}.dzi`);
    const dziExists = await fs.access(dziPath).then(() => true).catch(() => false);
    console.log('📄 DZI file exists:', dziExists, 'at:', dziPath);
    
    if (dziExists) {
      const dziContent = await fs.readFile(dziPath, 'utf8');
      console.log('📄 DZI content:');
      console.log(dziContent);
    }
    
    // Check for tile directories
    for (const file of files) {
      if (file.isDirectory()) {
        const subDir = path.join(tilesPath, file.name);
        const subFiles = await fs.readdir(subDir, { withFileTypes: true });
        console.log(`📁 Directory ${file.name} contains:`, subFiles.map(f => f.name));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    try {
      await fs.unlink(testImagePath);
      await fs.rm(tilesPath, { recursive: true, force: true });
      console.log('🧹 Cleanup completed');
    } catch (error) {
      console.log('🧹 Cleanup error (ignored):', error.message);
    }
  }
}

testSharpTiling();
