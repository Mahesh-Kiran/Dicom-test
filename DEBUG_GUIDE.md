# 🔍 Debugging Guide: Image Display Issues

## 🎯 **Quick Diagnosis Steps**

### Step 1: Test Sharp DZI Generation
Run the test script to verify Sharp is working correctly:
```bash
cd server
node ../debug-test.js
```

**Expected Output:**
```
🧪 Testing Sharp DZI tiling...
📸 Creating test image...
✅ Test image created: /path/to/test-image.png
📁 Tiles directory created: /path/to/tiles/test-1234567890
🔧 Testing Sharp DZI tiling...
✅ Sharp tiling completed
🔍 Checking created files...
📂 Files created: [
  { name: 'test-1234567890.dzi', isDirectory: false },
  { name: 'test-1234567890_files', isDirectory: true }
]
📄 DZI file exists: true at: /path/to/tiles/test-1234567890/test-1234567890.dzi
📄 DZI content:
<?xml version="1.0" encoding="UTF-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
       Url=""
       Format="png"
       Overlap="1"
       TileSize="512"
       Width="1024"
       Height="768">
</Image>
```

### Step 2: Upload an Image and Check Backend Logs
1. Start your server: `npm run dev` (in server directory)
2. Upload an image through the frontend
3. Check server console for these logs:
   ```
   📊 Image metadata: 1920x1080, format: png
   📁 Tiles directory created/verified: /path/to/data/tiles/{imageId}
   🔧 Creating tiles with Sharp DZI layout...
   ✅ Sharp tiling completed
   ✅ DZI file verified: /path/to/data/tiles/{imageId}/{imageId}.dzi
   🔍 Checking created files...
   📂 Created files/dirs: [
     { name: '{imageId}.dzi', isDirectory: false },
     { name: '{imageId}_files', isDirectory: true }
   ]
   📄 DZI content preview: <?xml version="1.0"...
   📊 Calculated tile info: { tileSize: 512, levels: 3, ... }
   ```

### Step 3: Check File Structure
Use the debug endpoint to verify file structure:
```bash
curl http://localhost:3000/api/debug/files/{imageId}
```

**Expected Response:**
```json
{
  "id": "{imageId}",
  "tilesDir": "/path/to/data/tiles/{imageId}",
  "uploadsDir": "/path/to/data/uploads/{imageId}",
  "tilesExists": true,
  "uploadsExists": true,
  "tilesFiles": [
    { "name": "{imageId}.dzi", "isDirectory": false },
    { "name": "{imageId}_files", "isDirectory": true }
  ],
  "uploadsFiles": [
    { "name": "original.png", "isDirectory": false }
  ]
}
```

### Step 4: Test DZI File Access
Check if the DZI file is accessible:
```bash
curl http://localhost:3000/api/debug/dzi/{imageId}
```

**Expected Response:**
```json
{
  "exists": true,
  "path": "/path/to/data/tiles/{imageId}/{imageId}.dzi",
  "contentLength": 234,
  "content": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>..."
}
```

### Step 5: Check Frontend Network Requests
1. Open browser DevTools → Network tab
2. Upload an image
3. Look for these requests:
   - `POST /api/images/upload` (should return 201)
   - `GET /tiles/{imageId}/{imageId}.dzi` (should return 200 with XML)
   - `GET /tiles/{imageId}/{imageId}_files/{level}/{x}_{y}.png` (tile requests)

## 🚨 **Common Issues & Solutions**

### Issue 1: Sharp Tiling Fails
**Symptoms:** Server logs show "❌ Tiling failed"
**Solution:** 
- Check if Sharp is properly installed: `npm list sharp`
- Verify image format is supported
- Check disk space in tiles directory

### Issue 2: DZI File Not Created
**Symptoms:** "DZI file not created at expected path"
**Solution:**
- The Sharp tiling configuration was fixed in `tiler.ts`
- Ensure the tiles directory has write permissions
- Check if the image is corrupted

### Issue 3: Frontend Can't Access DZI
**Symptoms:** 404 errors for DZI requests
**Solution:**
- Verify static file serving in `server/src/index.ts`
- Check CORS configuration
- Ensure the DZI file path matches the URL structure

### Issue 4: OpenSeaDragon Loading Errors
**Symptoms:** "Failed to load image" in frontend console
**Solution:**
- Check browser console for specific error messages
- Verify DZI XML content is valid
- Test DZI URL directly in browser

## 🔧 **Manual Testing Commands**

### Test Server Health
```bash
curl http://localhost:3000/health
```

### Test API Endpoints
```bash
# Upload test
curl -X POST -F "file=@test-image.png" http://localhost:3000/api/images/upload

# Get manifest
curl http://localhost:3000/api/images/{imageId}/manifest

# Get stats
curl http://localhost:3000/api/images/{imageId}/stats
```

### Test Static File Serving
```bash
# Test DZI file
curl http://localhost:3000/tiles/{imageId}/{imageId}.dzi

# Test tile file (if exists)
curl http://localhost:3000/tiles/{imageId}/{imageId}_files/0/0_0.png
```

## 📋 **Checklist for Fixes**

- [ ] Sharp DZI generation works (test script passes)
- [ ] Server logs show successful tiling
- [ ] DZI file exists and is accessible
- [ ] Static file serving configured correctly
- [ ] CORS allows frontend access
- [ ] Frontend can fetch DZI file
- [ ] OpenSeaDragon can parse DZI XML
- [ ] Tile files are accessible

## 🎯 **Most Likely Fix**

The main issue was in the Sharp tiling configuration. The updated `tiler.ts` now:

1. ✅ Uses Sharp's built-in DZI generation correctly
2. ✅ Verifies DZI file creation before responding
3. ✅ Parses actual DZI content for accurate tile info
4. ✅ Provides detailed debugging logs

**If images still don't display after these fixes:**

1. Run the debug test script
2. Check server logs during upload
3. Use the debug endpoints to verify file structure
4. Check browser network tab for failed requests
5. Test DZI URL directly in browser

The enhanced logging will help identify exactly where the issue occurs in the pipeline.
