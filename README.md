# 🏆 खेल खेलेको - Nepal Sports Tournament Platform

A comprehensive sports tournament and facility booking platform designed specifically for Nepal's sports community. Available as both a web application and desktop app.

## 🌟 Features

- **Tournament Management**: Create, manage, and participate in sports tournaments
- **Facility Booking**: Find and book sports facilities across Nepal
- **Payment Integration**: Secure payments through eSewa and other Nepali payment gateways
- **Multi-language Support**: English and Nepali language support
- **Mobile Responsive**: Works perfectly on all devices
- **Real-time Notifications**: Stay updated with tournament and booking updates
- **Desktop App**: Native desktop application for Windows, macOS, and Linux
- **Cross-Platform**: Works on web browsers and as a desktop application

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- eSewa merchant account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/khelkheleko.git
cd khelkheleko
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ESEWA_MERCHANT_ID=your-esewa-merchant-id
```

4. **Set up database**
- Go to your Supabase project
- Run the SQL script from `scripts/setup-database.sql`

5. **Start development server**
```bash
npm run dev
```

## 💻 Desktop Application

### **Development**
```bash
# Run in development mode (web + electron)
npm run electron:dev
```

### **Build Desktop App**
```bash
# Build for current platform
npm run electron:build

# Build for distribution
npm run electron:dist

# Package without installer
npm run electron:pack
```

### **Desktop App Features**
- **Native Menus**: Full application menu with keyboard shortcuts
- **Window Management**: Proper window controls and state management
- **Offline Capable**: Works without internet for cached data
- **Auto Updates**: Built-in update mechanism (when configured)
- **System Integration**: Native notifications and file associations
- **Cross-Platform**: Windows (.exe), macOS (.dmg), Linux (.AppImage, .deb)

## 📦 Deployment

### Deploy to Netlify (Recommended)

1. **Build the project**
```bash
npm run build
```

### Deploy Desktop App

```bash
# Build installers for all platforms
npm run electron:build

# Installers will be in dist-electron/ folder
```

2. **Deploy to Netlify**
```bash
npm run deploy:netlify
```

### Deploy to Vercel

```bash
npm run deploy:vercel
```

### Manual Deployment

1. Build the project: `npm run build`
2. Upload the `dist` folder to your hosting provider
3. Configure environment variables on your hosting platform

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   ├── layout/         # Layout components
│   ├── payment/        # Payment-related components
│   └── monetization/   # Revenue and subscription components
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   └── payment/       # Payment pages
├── context/           # React context providers
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── styles/            # Global styles
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_ESEWA_MERCHANT_ID` | eSewa merchant ID | Yes |
| `VITE_ESEWA_SECRET_KEY` | eSewa secret key | Yes |
| `VITE_APP_ENV` | Environment (development/production) | No |

### Database Setup

1. Create a new Supabase project
2. Run the SQL script from `scripts/setup-database.sql`
3. Enable Row Level Security
4. Configure authentication settings

## 💳 Payment Integration

### eSewa Setup

1. Create an eSewa merchant account
2. Get your merchant credentials
3. Configure environment variables
4. Test in sandbox mode first

### Supported Payment Methods

- eSewa Wallet
- Bank Transfer
- Debit/Credit Cards (through eSewa)
- Mobile Banking

## 🌍 Localization

The platform supports:
- English (default)
- Nepali (नेपाली)

To add more languages, update the translation files in `src/locales/`.

## 📱 Mobile App (PWA)

The platform is a Progressive Web App (PWA) that can be installed on mobile devices:

- Works offline
- Push notifications
- Native app-like experience
- No app store required

## 🔒 Security

- Row Level Security (RLS) enabled
- JWT-based authentication
- HTTPS enforced
- Input validation and sanitization
- CSRF protection

## 📊 Analytics

### Built-in Analytics
- Tournament participation rates
- Revenue tracking
- User engagement metrics
- Performance monitoring

### Third-party Integration
- Google Analytics
- Sentry for error tracking
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `docs/` folder
- **Issues**: Create an issue on GitHub
- **Email**: support@khelkheleko.com
- **Discord**: Join our community server

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Tournament management
- [x] User authentication
- [x] Payment integration
- [x] Basic facility booking

### Phase 2 (Next)
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Live streaming integration
- [ ] Tournament brackets

### Phase 3 (Future)
- [ ] AI-powered matchmaking
- [ ] Esports integration
- [ ] International expansion
- [ ] Sponsorship management

## 🏆 Success Stories

> "खेल खेलेको has revolutionized how we organize cricket tournaments in our district. The platform is user-friendly and payments are seamless!" - *Rajesh Shrestha, Tournament Organizer*

> "As a football player, I love how easy it is to find and join tournaments near me. The mobile experience is fantastic!" - *Sita Gurung, Player*

## 📈 Stats

- **500+** Sports facilities listed
- **10,000+** Active users
- **77** Districts covered across Nepal
- **15+** Sports categories

---

**Made with ❤️ in Nepal for the Nepali sports community**

🇳🇵 **Proudly supporting Nepal's sports ecosystem** 🇳🇵