# Retro Spotify Player

A nostalgic desktop music player inspired by classic Microsoft Windows (95/98/XP era) that streams and controls Spotify playback. Experience the charm of retro computing while enjoying modern music streaming.

## Features

### Desktop Experience
- 🪟 Draggable, resizable windows with proper focus and z-index management
- 📋 Windows-style title bars, menus, and controls
- 💾 Classic grey UI panels and beveled buttons
- 🖥️ Retro boot-up sequence
- 📊 Taskbar with window management
- 🎨 Authentic Windows 95/98 color palette and fonts

### Spotify Integration
- 🔐 OAuth authentication with Spotify
- 🎵 Full playback control (play, pause, skip, seek, volume)
- 🎨 Album art display in classic bordered frame
- 📁 Browse your playlists
- ❤️ Access your liked songs
- 🕐 View recently played tracks
- 🎧 Browser-based playback via Spotify Web Playback SDK

### UI Components
- **Main Player Window**: Transport controls, track info, progress bar, volume
- **Playlist Browser**: Tabbed interface for playlists, liked songs, and history
- **Settings**: Audio preferences, appearance options, keyboard shortcuts
- **About Dialog**: Application information and credits

### Keyboard Shortcuts
- `Space` - Play/Pause
- `→` - Next track
- `←` - Previous track
- `↑` - Volume up
- `↓` - Volume down

## Prerequisites

- Node.js 18+ and npm
- A Spotify account (Premium required for playback)
- Spotify Developer credentials

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd retro-spotify-player
npm install
```

### 2. Configure Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://localhost:5173` to the Redirect URIs
4. Copy your Client ID

### 3. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your credentials
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Authenticate

1. Click "Connect to Spotify" on the login dialog
2. Log in to your Spotify account (Premium required)
3. Authorize the application
4. Enjoy your music!

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
retro-spotify-player/
├── src/
│   ├── components/
│   │   ├── windows/          # Window content components
│   │   │   ├── PlayerWindow.jsx
│   │   │   ├── PlaylistWindow.jsx
│   │   │   ├── SettingsWindow.jsx
│   │   │   └── AboutWindow.jsx
│   │   ├── Window.jsx        # Reusable window component
│   │   ├── Taskbar.jsx       # Bottom taskbar
│   │   ├── Desktop.jsx       # Desktop icons
│   │   ├── BootScreen.jsx    # Boot sequence
│   │   └── LoginDialog.jsx   # Spotify auth dialog
│   ├── contexts/
│   │   ├── WindowContext.jsx  # Window management
│   │   └── SpotifyContext.jsx # Spotify API integration
│   ├── windows95.css         # Windows 95/98 styles
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
└── README.md
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Spotify Web API** - Playlist/library data
- **Spotify Web Playback SDK** - Browser-based playback
- **react-draggable** - Window dragging
- **CSS3** - Retro Windows styling

## Browser Compatibility

- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+
- Requires modern browser with ES6+ support

**Note**: The Spotify Web Playback SDK requires a modern browser with proper CORS and HTTPS support (except for localhost during development).

## Important Notes

### Spotify Premium Required
Browser-based playback requires a Spotify Premium subscription. Free accounts can browse playlists and see what's playing, but cannot control playback.

### Security
- Never commit your `.env` file with real credentials
- The app uses PKCE-less OAuth flow suitable for SPAs
- Tokens are stored in localStorage for persistence

### Known Limitations
- Mobile browser support is limited
- No offline playback
- No local file uploads
- Volume control may not work on some devices (OS-controlled)

## Customization

### Themes
The app supports multiple themes. Currently implemented:
- `classic` - Windows 95/98 style (default)
- `xp` - Windows XP style (planned)

Edit `src/components/windows/SettingsWindow.jsx` to add more themes.

### Sound Effects
UI sound effects can be enabled in Settings. Add audio files to:
- `public/sounds/click.mp3`
- `public/sounds/error.mp3`
- `public/sounds/startup.mp3`

## Troubleshooting

### "Authentication failed" error
- Check that your Client ID is correct in `.env`
- Verify the redirect URI matches exactly in Spotify Dashboard
- Clear browser localStorage and try again

### "Premium account required" error
- Browser playback requires Spotify Premium
- Upgrade your account or use Spotify Connect instead

### "Player not ready" message
- Wait a few seconds for the SDK to initialize
- Refresh the page
- Check browser console for errors

### Windows not dragging properly
- Ensure no browser extensions are interfering
- Try a different browser
- Check that `react-draggable` is installed correctly

## Development

### Adding New Window Types

1. Create a new component in `src/components/windows/`
2. Add the window type to `WINDOW_TYPES` in `WindowContext.jsx`
3. Add window configuration in `App.jsx`
4. Add desktop icon in `Desktop.jsx`

### Adding Spotify API Calls

Use the `apiRequest` helper from `SpotifyContext`:

```javascript
const { apiRequest } = useSpotify();

const getUserProfile = async () => {
  const data = await apiRequest('/me');
  return data;
};
```

## License

MIT License - feel free to use this project for learning or personal use.

## Acknowledgments

- Spotify for their excellent Web API and Playback SDK
- Microsoft for the iconic Windows 95/98 design language
- The React team for the amazing framework

---

**Enjoy your retro music experience!** 🎵🖥️
