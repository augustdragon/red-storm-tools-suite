# Red Storm Initiative Chit Pull

A mobile app for simulating chit pulls in the Red Storm board game by GMT Games.

## 📱 Test the App Now!

### Option 1: Expo Go (Recommended)
1. **Install Expo Go** on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Open the app** using this link:
   ```
   exp://fuvgfvq-anonymous-8081.exp.direct
   ```
   
3. **Or scan this QR code** in the Expo Go app camera

*Note: The developer needs to have the Expo server running for this to work*

### Option 2: Local Development
```bash
# Clone the repository
git clone https://github.com/augustdragon/red-storm-chit-pull.git
cd red-storm-chit-pull

# Install dependencies
npm install

# Start the development server
npx expo start --tunnel
```

## 🎲 Features

### Core Functionality
- **Authentic Chit Pools**: Exact Red Storm game probabilities
  - Small Chits: [0,0,1,1,1,2,2,2,2,3]
  - Large Chits: [1,2,2,2,3,3,4,4,4,5]
- **Random Draw with Replacement**: Simulates real game mechanics
- **Visual Chit Display**: Shows drawn value and type (SM/LG)

### User Experience
- **Stable UI**: Placeholder chit prevents layout jumping
- **Draw History**: Track up to 100 recent draws with infinite scroll
- **Smart Toggles**: History and Links are mutually exclusive
- **Professional Styling**: Clean, mobile-optimized interface

### Resources
- **Direct Links**: GMT Games, ConsimWorld, BoardGameGeek
- **Quick Access**: One-tap access to game resources
- **Community**: Connect with other Red Storm players

## 🎯 How to Use

1. **Choose Chit Type**: Tap "Draw Small" or "Draw Large"
2. **View Result**: Chit value appears with color-coded type
3. **Track History**: Toggle "Draw History" to see all draws
4. **Access Resources**: Tap "Links" for game information
5. **Clear History**: Reset all draws and start fresh

## 🔧 Technical Details

- **Built with**: React Native + Expo SDK 54
- **Performance**: Optimized for mobile devices
- **Compatibility**: iOS and Android via Expo Go
- **State Management**: Efficient React hooks
- **No Data Collection**: Completely private, no user data stored

## 🎮 About Red Storm

Red Storm is a board game by GMT Games simulating air combat over Central Germany in 1987. This app specifically helps with the initiative chit pull mechanism that determines turn order and special events.

**Official Game Links:**
- [GMT Games Product Page](https://www.gmtgames.com/p-1059-red-storm-2nd-printing.aspx)
- [BoardGameGeek Page](https://boardgamegeek.com/boardgame/213497/red-storm-the-air-war-over-central-germany-1987)
- [ConsimWorld Discussion](https://talk.consimworld.com/WebX/.1ddc7afe/1)

## 📝 Feedback

Found a bug or have a suggestion? This is a beta version and we welcome feedback!

---

*This is an unofficial fan-made tool for the Red Storm board game. GMT Games and Red Storm are trademarks of their respective owners.*