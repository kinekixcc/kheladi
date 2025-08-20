# 🖥️ Desktop Application Guide

## 📱 खेल खेलेको Desktop App

Transform your web application into a native desktop experience for Windows, macOS, and Linux users.

---

## 🚀 **Quick Start**

### **Development Mode**
```bash
# Install dependencies
npm install

# Run web + desktop app in development
npm run electron:dev
```

### **Build Desktop App**
```bash
# Build for current platform
npm run electron:build

# Build for distribution (all platforms)
npm run electron:dist
```

---

## 🎯 **Desktop App Features**

### **🔧 Native Application Features:**
- ✅ **Native Window Controls** - Minimize, maximize, close
- ✅ **Application Menu** - File, Edit, View, Navigate, Help menus
- ✅ **Keyboard Shortcuts** - Ctrl+H (Home), Ctrl+F (Facilities), etc.
- ✅ **System Tray Integration** - (Optional) Background running
- ✅ **Auto-updater Ready** - Built-in update mechanism
- ✅ **Offline Capability** - Works without internet for cached data

### **🎨 Enhanced User Experience:**
- ✅ **Custom Title Bar** - Branded application header
- ✅ **Window State Management** - Remembers size and position
- ✅ **Deep Linking** - Handle custom URL schemes
- ✅ **File Associations** - Open tournament files directly
- ✅ **Native Notifications** - System-level notifications

### **🔒 Security & Performance:**
- ✅ **Context Isolation** - Secure renderer process
- ✅ **No Node Integration** - Prevents security vulnerabilities
- ✅ **Preload Scripts** - Safe API exposure
- ✅ **External Link Handling** - Opens links in default browser

---

## 📋 **Available Commands**

### **Development:**
```bash
npm run electron:dev     # Run web + electron in development
npm run dev             # Web only (for web development)
```

### **Building:**
```bash
npm run electron:build  # Build installer for current platform
npm run electron:dist   # Build for distribution (all platforms)
npm run electron:pack   # Package without installer
```

### **Platform-Specific Builds:**
```bash
# Windows
npm run electron:build -- --win

# macOS
npm run electron:build -- --mac

# Linux
npm run electron:build -- --linux
```

---

## 🎛️ **Application Menu Structure**

### **खेल खेलेको Menu:**
- About खेल खेलेको
- Preferences (Ctrl+,)
- Quit (Ctrl+Q / Cmd+Q)

### **Navigate Menu:**
- Home (Ctrl+H)
- Find Facilities (Ctrl+F)
- Tournament Map (Ctrl+T)
- Player Dashboard (Ctrl+D)

### **View Menu:**
- Reload, Force Reload
- Toggle Developer Tools
- Zoom In/Out/Reset
- Toggle Fullscreen

---

## 📦 **Distribution**

### **Output Files:**
After building, you'll find installers in `dist-electron/`:

**Windows:**
- `खेल खेलेको Setup 1.0.0.exe` - NSIS installer
- `खेल खेलेको 1.0.0.exe` - Portable executable

**macOS:**
- `खेल खेलेको-1.0.0.dmg` - Disk image installer
- `खेल खेलेको-1.0.0-mac.zip` - Zip archive

**Linux:**
- `खेल खेलेको-1.0.0.AppImage` - Portable AppImage
- `खेल खेलेको_1.0.0_amd64.deb` - Debian package

### **File Sizes (Approximate):**
- Windows: ~150MB
- macOS: ~160MB  
- Linux: ~155MB

---

## ⚙️ **Configuration**

### **App Metadata** (`electron-builder.json`):
```json
{
  "appId": "com.khelkheleko.app",
  "productName": "खेल खेलेको",
  "category": "Sports"
}
```

### **Window Settings** (`electron/main.js`):
```javascript
{
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600
}
```

---

## 🔧 **Customization Options**

### **1. Change App Icon:**
Replace `public/icon.png` with your custom icon (512x512 PNG)

### **2. Modify Window Behavior:**
Edit `electron/main.js` to change:
- Default window size
- Minimum window size
- Window position
- Fullscreen behavior

### **3. Add Custom Menu Items:**
Extend the menu template in `electron/main.js`:
```javascript
{
  label: 'Custom Action',
  accelerator: 'CmdOrCtrl+K',
  click: () => {
    // Your custom action
  }
}
```

### **4. Enable Auto-Updates:**
Configure in `electron-builder.json`:
```json
{
  "publish": {
    "provider": "github",
    "owner": "yourusername",
    "repo": "khelkheleko"
  }
}
```

---

## 🐛 **Troubleshooting**

### **Common Issues:**

**1. Build Fails:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist dist-electron
npm install
npm run electron:build
```

**2. App Won't Start:**
```bash
# Check for missing dependencies
npm run electron:dev
# Look for errors in console
```

**3. Menu Not Working:**
- Verify `electron/preload.js` is properly configured
- Check IPC communication in browser dev tools

**4. Icon Not Showing:**
- Ensure `public/icon.png` exists and is 512x512
- Rebuild after changing icon

---

## 🚀 **Advanced Features**

### **1. Auto-Updater:**
```javascript
// In main.js
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

### **2. System Tray:**
```javascript
// Add to main.js
const { Tray } = require('electron');

let tray = new Tray('path/to/icon.png');
tray.setContextMenu(contextMenu);
```

### **3. Custom Protocols:**
```javascript
// Handle custom URLs like khelkheleko://tournament/123
app.setAsDefaultProtocolClient('khelkheleko');
```

---

## 📊 **Performance Tips**

### **1. Optimize Bundle Size:**
- Use `electron-builder` compression
- Exclude unnecessary files
- Use `asar` packaging

### **2. Memory Management:**
- Limit renderer processes
- Use proper garbage collection
- Monitor memory usage

### **3. Startup Performance:**
- Lazy load heavy components
- Use splash screen
- Preload critical resources

---

## 🎯 **Distribution Strategy**

### **1. Direct Download:**
- Host installers on your website
- Provide checksums for verification
- Include installation instructions

### **2. App Stores:**
- **Microsoft Store** (Windows)
- **Mac App Store** (macOS)
- **Snap Store** (Linux)

### **3. Package Managers:**
```bash
# Homebrew (macOS)
brew install --cask khelkheleko

# Chocolatey (Windows)
choco install khelkheleko

# APT (Ubuntu/Debian)
sudo apt install khelkheleko
```

---

## 🔐 **Code Signing**

### **Windows:**
```bash
# Get code signing certificate
# Configure in electron-builder.json
{
  "win": {
    "certificateFile": "path/to/cert.p12",
    "certificatePassword": "password"
  }
}
```

### **macOS:**
```bash
# Apple Developer Certificate required
{
  "mac": {
    "identity": "Developer ID Application: Your Name"
  }
}
```

---

**Your web app is now a full-featured desktop application! 🎉**

Users can download and install खेल खेलेको just like any other desktop software, with all the benefits of native integration while maintaining the power of your web technology stack.