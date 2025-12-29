# AARUTO_ANIME.AI – Production-Ready Anime Generator

A **god-tier anime character generator** powered by Google Gemini AI with real-time database integration.

## ✨ Features

- 🎨 **AI-Powered Design Generation** – Use Gemini AI to create unique anime character designs
- 📊 **Character Evolution** – Evolve and refine designs with real-time updates
- 🌍 **World Generation** – Generate environment images for characters
- 🎵 **Theme Audio Synthesis** – Create character theme music
- 💾 **Persistent History** – Auto-save and archive character creations
- 👤 **User Authentication** – Secure login/signup with localStorage persistence
- 📈 **Visitor Tracking** – Real-time counter with Firebase integration
- 🎯 **Responsive Design** – Mobile-first glassmorphic UI with Tailwind CSS

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env

# Start dev server
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

## 🌐 Deployment to Netlify

### Automatic Deployment (GitHub)
1. Push to GitHub
2. Connect repo at [netlify.com](https://app.netlify.com/start)
3. Build settings auto-configured via `netlify.toml`
4. Add `VITE_GEMINI_API_KEY` environment variable
5. Deploy

### Manual Deployment
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

See `NETLIFY_DEPLOY.md` for detailed instructions.

## 📋 Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Build Tool:** Vite 6
- **AI Integration:** Google Gemini AI SDK
- **Database:** Firebase Realtime Database
- **Hosting:** Netlify (SPA-ready)
- **Icons:** Font Awesome 6.4
- **Fonts:** Bungee Inline, Inter, Space Grotesk

## 📁 Project Structure

```
src/
├── App.tsx                 # Main app with auth & generation logic
├── components/
│   └── CharacterSheet.tsx  # Character details & editor
├── services/
│   └── geminiService.ts    # Gemini AI integration
├── types.ts                # TypeScript interfaces
└── index.tsx              # React entry point

index.html                 # Entry HTML
vite.config.ts            # Vite configuration
netlify.toml              # Netlify deployment config
tsconfig.json             # TypeScript config
```

## 🔐 Environment Variables

Create a `.env` file:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_CONFIG={"apiKey":"...", ...}  # Optional
```

For Netlify, set these in **Site Settings → Build & Deploy → Environment**.

## 🎮 Usage

1. **Register/Login** – Create account or use admin credentials
2. **Enter Prompt** – Describe your anime character concept
3. **Generate** – Click "MANIFEST" to create design + image
4. **Evolve** – Refine the character with evolution
5. **Archive** – Save to eternal archive for later
6. **View History** – Access temporal history sidebar

### Admin Access
- Email: `abhi.solanki142011@gmail.com`
- Password: `aaruto100108112`

## 📊 Features in Detail

### Generation Levels
- **GENIN** – Fast, lower quality
- **CHUNIN** – Balanced quality & speed
- **JONIN** – High quality, slower

### Character Customization
- Art styles (11 variants)
- Lighting modes (6 options)
- Composition styles (5 layouts)
- Resolution (512px, 1024px, 2048px)

### Session Tracking
- Local session counter (persisted)
- Global visitor count (Firebase)
- Auto-increment on login/signup
- Clear on logout

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| API errors | Verify `VITE_GEMINI_API_KEY` is set |
| Build fails | Check Node version ≥20.11.1 |
| Routes not working | `netlify.toml` handles SPA routing |
| Login fails | Clear localStorage: `localStorage.clear()` |
| Blank page | Check browser console for errors |

## 📝 License

© 2025 AARUTO-347. All rights reserved.

## 🤝 Support

For issues or feature requests, check the GitHub repository.

---

**Ready to summon some anime magic?** ✨🎨
