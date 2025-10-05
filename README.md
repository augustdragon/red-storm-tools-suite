# Red Storm Tools Suite

A comprehensive set of tools for the Red Storm board game by GMT Games.

## 🎯 Available Tools

### 🎲 Initiative Chit Pull
Mobile and web app for simulating chit pulls in Red Storm scenarios.

### ✈️ Order of Battle Generator  
Tool for generating aircraft flights according to official Red Storm OOB tables.

## 🌐 Web Applications

Visit our GitHub Pages site to access all tools: [Red Storm Tools](https://augustdragon.github.io/red-storm-tools-suite/)

### Direct Links:
- **Chit Pull App**: https://augustdragon.github.io/red-storm-tools-suite/chit-pull/
- **OOB Generator**: https://augustdragon.github.io/red-storm-tools-suite/oob-generator/

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
git clone https://github.com/augustdragon/red-storm-tools-suite.git
cd red-storm-tools-suite

# Install dependencies
npm install

# Start the development server
npx expo start --tunnel
```

## 🎲 Initiative Chit Pull Features

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

## ✈️ Order of Battle Generator Features

### Core Functionality
- **Complete OOB Tables**: All NATO and Warsaw Pact aircraft tables
- **Accurate Generation**: Follows official Red Storm rules
- **Multiple Rolls**: Generate multiple results per table
- **Date Variants**: Support for different scenario timeframes

### User Experience
- **Table Selection**: Choose from Tables A through L
- **Result Management**: Store and view generated aircraft
- **Clear Documentation**: View table structures and probabilities
- **Quick Access**: One-tap access to game resources
- **Community**: Connect with other Red Storm players

## 🎯 How to Use

### Initiative Chit Pull
1. **Choose Chit Type**: Tap "Draw Small" or "Draw Large"
2. **View Result**: Chit value appears with color-coded type
3. **Track History**: Toggle "Draw History" to see all draws
4. **Access Resources**: Tap "Links" for game information
5. **Clear History**: Reset all draws and start fresh

### Order of Battle Generator
1. **Select Table**: Choose from NATO (A-F) or Warsaw Pact (G-L) tables
2. **Set Variables**: Configure ATAF zone and date if applicable
3. **Generate Aircraft**: Roll for flights according to official tables
4. **View Results**: See generated aircraft with details
5. **Multiple Rolls**: Generate multiple flights per table

## 📁 Project Structure

```
red-storm-tools/
├── chit-pull/          # Initiative Chit Pull web app
├── oob-generator/      # Order of Battle Generator web app
├── shared/             # Shared CSS and resources
├── App.js              # React Native mobile app (Chit Pull)
└── .github/workflows/  # Deployment automation
```

## 🔧 Technical Details

- **Built with**: React Native + Expo SDK 54 (mobile), HTML/CSS/JavaScript (web)
- **Performance**: Optimized for mobile and desktop devices
- **Compatibility**: iOS, Android, and modern web browsers
- **State Management**: Efficient React hooks and vanilla JavaScript
- **No Data Collection**: Completely private, no user data stored
- **Shared Architecture**: Common CSS for consistent styling across all tools

## 🎮 About Red Storm

Red Storm is a board game by GMT Games simulating air combat over Central Germany in 1987. This tools suite helps with various game mechanics:

- **Initiative Chit Pull**: Determines turn order and special events
- **Order of Battle Generation**: Creates realistic aircraft flights for scenarios

**Official Game Links:**
- [GMT Games Product Page](https://www.gmtgames.com/p-1059-red-storm-2nd-printing.aspx)
- [BoardGameGeek Page](https://boardgamegeek.com/boardgame/213497/red-storm-the-air-war-over-central-germany-1987)
- [ConsimWorld Discussion](https://talk.consimworld.com/WebX/.1ddc7afe/1)

## 📝 Feedback

Found a bug or have a suggestion? These tools are actively maintained and we welcome feedback!

---

*This is an unofficial fan-made tool suite for the Red Storm board game. GMT Games and Red Storm are trademarks of their respective owners.*