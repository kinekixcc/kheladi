# 📁 Project Structure Guide

## 🎯 **Core Files (Always Include)**

### **Essential Configuration**
```
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── index.html                # Main HTML entry point
└── .env.example              # Environment variables template
```

### **Source Code Structure**
```
src/
├── main.tsx                  # Application entry point
├── App.tsx                   # Main app component
├── index.css                 # Global styles
├── vite-env.d.ts            # Vite type definitions
├── types/
│   └── index.ts             # TypeScript type definitions
├── lib/
│   ├── supabase.ts          # Supabase client configuration
│   ├── database.ts          # Database operations
│   └── esewa.ts             # Payment integration
├── context/
│   ├── AuthContext.tsx      # Authentication context
│   └── NotificationContext.tsx # Notification system
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── layout/              # Layout components
│   ├── tournament/          # Tournament-specific components
│   ├── payment/             # Payment components
│   └── monetization/        # Revenue components
├── pages/                   # Page components
├── hooks/                   # Custom React hooks
└── utils/                   # Utility functions
```

## 🚫 **Files to Ignore (Reduce Token Size)**

### **Build and Dependencies**
- `node_modules/` - Dependencies (can be reinstalled)
- `dist/` - Build output (regenerated)
- `package-lock.json` - Lock file (large, auto-generated)

### **IDE and System Files**
- `.vscode/` - Editor settings
- `.DS_Store` - macOS system files
- `*.log` - Log files

### **Environment and Secrets**
- `.env` - Contains sensitive data
- `.env.local` - Local environment overrides

### **Documentation (Optional)**
- `docs/` - Can be excluded if not essential
- `README.md` - Can be summarized or excluded

### **Media Files**
- `*.jpg`, `*.png`, `*.pdf` - Use external URLs instead
- `public/icon.png` - Use placeholder or external URL

## 📋 **Minimal File Set for Development**

### **Must Have (Core Functionality)**
```
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/index.ts
│   ├── lib/supabase.ts
│   ├── context/AuthContext.tsx
│   ├── components/ui/Button.tsx
│   ├── components/ui/Card.tsx
│   ├── components/layout/Header.tsx
│   ├── pages/Home.tsx
│   ├── pages/auth/Login.tsx
│   └── pages/AdminDashboard.tsx
```

### **Can Add Later (Extended Features)**
```
├── src/
│   ├── lib/database.ts
│   ├── components/tournament/
│   ├── pages/TournamentMap.tsx
│   ├── pages/CreateTournament.tsx
│   ├── components/payment/
│   ├── utils/sampleData.ts
│   └── docs/
```

## 🔧 **Token Optimization Strategies**

### **1. File Consolidation**
- Combine small related components into single files
- Merge utility functions into fewer files
- Consolidate type definitions

### **2. Remove Redundancy**
- Delete unused components and pages
- Remove duplicate code
- Eliminate dead imports

### **3. External References**
- Use external URLs for images instead of local files
- Reference documentation online instead of local docs
- Use CDN links for large assets

### **4. Selective Inclusion**
- Include only files needed for current development
- Add other files as needed during development
- Focus on core functionality first

## 🎯 **Recommended Approach**

### **Phase 1: Core Setup**
1. Start with minimal file set
2. Get authentication working
3. Basic UI components only

### **Phase 2: Add Features**
1. Add tournament management
2. Add payment integration
3. Add advanced features

### **Phase 3: Polish**
1. Add documentation
2. Add testing
3. Add deployment configs

## 📊 **File Size Impact**

### **High Impact (Remove First)**
- `node_modules/` - ~100MB+
- `dist/` - ~10-50MB
- `package-lock.json` - ~500KB-2MB
- Documentation files - ~100-500KB
- Media files - ~1-10MB each

### **Medium Impact**
- Unused components - ~10-50KB each
- Sample data files - ~50-200KB
- Configuration files - ~5-20KB each

### **Low Impact (Keep)**
- Core source files - ~5-20KB each
- Type definitions - ~2-10KB
- Small utility files - ~2-5KB each

This structure will significantly reduce the token count while maintaining all essential functionality for development.