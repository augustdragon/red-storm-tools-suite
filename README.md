# Red Storm Tools Suite

A comprehensive web-based tool suite for the Red Storm and Baltic Approaches board games by GMT Games.

## 🎯 Live Site

**Visit:** [https://augustdragon.github.io/red-storm-tools-suite/](https://augustdragon.github.io/red-storm-tools-suite/)

## 🌐 Available Modules

### Red Storm (Central Germany 1987)
- Order of Battle Generator
- Flight Sheet Designer  
- Aircraft Notes Reference
- Chit Pull Generator
- Aircraft Data Reference

### Baltic Approaches (Northern Europe)
- Order of Battle Generator
- Aircraft Notes Reference
- Table Reference
- Surface Search Radar Reference
- Aircraft Data Reference

## ✈️ Features

### Order of Battle Generator
- **Complete OOB Tables**: All NATO and Warsaw Pact aircraft tables
- **Accurate Generation**: Follows official Red Storm/Baltic Approaches rules
- **Automated Processing**: Aircraft notes, ordnance rolls, weapon variants
- **Flight Sheet Printing**: Professional printable flight cards
- **CSAR Support**: Compact cards for rescue missions
- **Date Variants**: Support for different scenario timeframes

### Aircraft Data Reference
- **Comprehensive Database**: All aircraft from both modules
- **Search & Filter**: By nation, module, or aircraft name
- **Complete Stats**: Weapons, speeds, radar, EW systems, capabilities
- **Surface Radar Data**: Detailed radar specs for naval strike aircraft
- **Notes with Tooltips**: Hover over note codes for full descriptions

### Other Tools
- **Chit Pull Generator**: Digital chit draws for initiative
- **Flight Sheet Designer**: Create custom flight sheets manually
- **Aircraft Notes**: Detailed reference for all aircraft special rules
- **Table Reference**: Quick lookup for OOB table structures

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
red-storm-tools-suite/
├── index.html              # Module selection landing page
├── modules/
│   ├── red-storm/          # Red Storm module
│   │   └── oob-generator/  # OOB Generator and tools
│   └── baltic-approaches/  # Baltic Approaches module
│       └── oob-generator/  # OOB Generator and tools
├── shared/
│   ├── oob-generator/      # Shared OOB logic and processors
│   ├── data/               # Shared aircraft databases
│   ├── css/                # Shared stylesheets
│   ├── assets/             # Roundels and images
│   ├── chit-pull/          # Initiative chit pull tool
│   └── docs/               # User guide and documentation
├── mobile-app/             # React Native mobile app (Chit Pull)
└── .github/workflows/      # GitHub Pages deployment
```

## 🔧 Technical Details

- **Architecture**: Modular multi-game system with shared components
- **Frontend**: Pure HTML/CSS/JavaScript (no build step required)
- **Mobile App**: React Native + Expo SDK 54 (separate chit pull app in mobile-app/)
- **Deployment**: GitHub Pages with automated workflow
- **Performance**: Optimized for mobile and desktop devices
- **Compatibility**: Modern web browsers (Chrome, Firefox, Safari, Edge)
- **No Data Collection**: Completely private, no user data stored or tracked
- **Shared Components**: Common CSS, JavaScript modules, and aircraft databases

## 🎮 About the Games

**Red Storm** and **Baltic Approaches** are board games by GMT Games simulating air combat in Cold War gone hot scenarios:

- **Red Storm**: Central Germany, 1987 - Warsaw Pact invasion
- **Baltic Approaches**: Northern Europe - Naval and air operations in Scandinavia

This tools suite automates game mechanics and provides quick reference materials:
- **Initiative System**: Chit pulls for turn order and events
- **Order of Battle**: Realistic aircraft flight generation
- **Flight Management**: Professional flight sheet printing
- **Reference Data**: Complete aircraft specifications and rules

**Official Game Links:**
- [Red Storm at GMT Games](https://www.gmtgames.com/p-1059-red-storm-2nd-printing.aspx)
- [Baltic Approaches at GMT Games](https://www.gmtgames.com/p-1060-baltic-approaches-2nd-printing.aspx)
- [BoardGameGeek - Red Storm](https://boardgamegeek.com/boardgame/213497/red-storm-the-air-war-over-central-germany-1987)
- [BoardGameGeek - Baltic Approaches](https://boardgamegeek.com/boardgame/329506/baltic-approaches)
- [ConsimWorld Discussion](https://talk.consimworld.com/WebX/.1ddc7afe/1)

## 📝 Feedback & Support

Found a bug or have a suggestion? Open an issue on the [GitHub repository](https://github.com/augustdragon/red-storm-tools-suite/issues).

For questions or discussion, visit the [ConsimWorld forum](https://talk.consimworld.com/WebX/.1ddc7afe/1).

---

*This is an unofficial fan-made tool suite for Red Storm and Baltic Approaches. GMT Games, Red Storm, and Baltic Approaches are trademarks of their respective owners.*