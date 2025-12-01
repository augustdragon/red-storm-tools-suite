import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, SafeAreaView, Linking, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [selectedType, setSelectedType] = useState(null);
  const [drawnValue, setDrawnValue] = useState(null);
  const [drawHistory, setDrawHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  
  // Chit pools - these never change
  const chitPools = {
    small: [0, 0, 1, 1, 1, 2, 2, 2, 2, 3],
    large: [1, 2, 2, 2, 3, 3, 4, 4, 4, 5]
  };

  // Red Storm game links
  const gameLinks = [
    {
      title: 'GMT Games - Official Product Page',
      url: 'https://www.gmtgames.com/p-1059-red-storm-2nd-printing.aspx'
    },
    {
      title: 'ConsimWorld Forum Discussion',
      url: 'https://talk.consimworld.com/WebX/.1ddc7afe/1'
    },
    {
      title: 'BoardGameGeek Page',
      url: 'https://boardgamegeek.com/boardgame/213497/red-storm-the-air-war-over-central-germany-1987'
    }
  ];

  const drawChit = (type) => {
    const chits = chitPools[type];
    
    // Randomly select a chit (with replacement)
    const randomIndex = Math.floor(Math.random() * chits.length);
    const drawnChit = chits[randomIndex];
    
    // Add to draw history (limit to 100 items for performance)
    const historyEntry = {
      id: Date.now(),
      type,
      value: drawnChit
    };
    
    setDrawHistory(prev => {
      const newHistory = [historyEntry, ...prev];
      return newHistory.slice(0, 100); // Keep only the most recent 100 draws
    });
    setDrawnValue(drawnChit);
    setSelectedType(type);
  };

  const toggleHistory = () => {
    if (!showHistory) {
      setShowLinks(false); // Close links when opening history
    }
    setShowHistory(!showHistory);
  };

  const toggleLinks = () => {
    if (!showLinks) {
      setShowHistory(false); // Close history when opening links
    }
    setShowLinks(!showLinks);
  };

  const clearHistory = () => {
    setDrawHistory([]);
    setDrawnValue(null);
    setSelectedType(null);
    setShowHistory(false);
  };

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Unable to open link');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
          
      <View style={styles.header}>
        <Text style={styles.title}>Red Storm</Text>
        <Text style={styles.subtitle}>Initiative Chit Pull</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.fixedSection}>
          <View style={styles.resultContainer}>
            <View style={[
              styles.chitDisplay, 
              drawnValue !== null 
                ? (selectedType === 'small' ? styles.smallChit : styles.largeChit)
                : styles.placeholderChit
            ]}>
              <Text style={[
                styles.chitValue,
                drawnValue !== null 
                  ? (selectedType === 'small' ? styles.smallText : styles.largeText)
                  : styles.placeholderText
              ]}>
                {drawnValue !== null ? drawnValue : '?'}
              </Text>
              {drawnValue !== null && (
                <Text style={[
                  styles.chitType,
                  selectedType === 'small' ? styles.smallText : styles.largeText
                ]}>
                  {selectedType === 'small' ? 'SM' : 'LG'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.smallButton]} 
              onPress={() => drawChit('small')}
            >
              <Text style={styles.buttonText}>Draw Small</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.largeButton]} 
              onPress={() => drawChit('large')}
            >
              <Text style={styles.buttonText}>Draw Large</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scrollableSection}>
          <View style={styles.topButtonRow}>
            <TouchableOpacity style={styles.historyButton} onPress={toggleHistory}>
              <Text style={styles.historyButtonText}>
                {showHistory ? 'Hide History' : 'Draw History'} ({Math.min(drawHistory.length, 100)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={clearHistory}>
              <Text style={styles.resetButtonText}>Clear History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomButtonRow}>
            <TouchableOpacity style={styles.linksButton} onPress={toggleLinks}>
              <Text style={styles.linksButtonText}>
                {showLinks ? 'Hide Links' : 'Links'}
              </Text>
            </TouchableOpacity>
          </View>

          {showHistory && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Draw History (Last 100)</Text>
              {drawHistory.length === 0 ? (
                <Text style={styles.emptyHistory}>No draws yet</Text>
              ) : (
                <ScrollView 
                  style={styles.historyList} 
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {drawHistory.map((entry, index) => (
                    <View key={entry.id} style={styles.historyItem}>
                      <Text style={styles.historyNumber}>#{drawHistory.length - index}</Text>
                      <Text style={[
                        styles.historyValue,
                        entry.type === 'small' ? styles.smallText : styles.largeText
                      ]}>
                        {entry.value}
                      </Text>
                      <Text style={styles.historyType}>
                        {entry.type === 'small' ? 'SM' : 'LG'}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {showLinks && (
            <View style={styles.linksContainer}>
              <Text style={styles.linksTitle}>Red Storm Resources</Text>
              {gameLinks.map((link, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.linkItem} 
                  onPress={() => openLink(link.url)}
                >
                  <Text style={styles.linkText}>{link.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2d3d2d',
  },
  header: {
    backgroundColor: '#1a2a1a',
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#4a5a4a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f4f4f4',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#d4d4d4',
    fontStyle: 'italic',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  fixedSection: {
    alignItems: 'center',
    width: '100%',
    minHeight: 300, // Fixed height to prevent jumping
  },
  scrollableSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  instruction: {
    fontSize: 18,
    color: '#d4d4d4',
    marginBottom: 40,
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  chitDisplay: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#4a4a4a',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  smallChit: {
    backgroundColor: '#f4f4f4',
    borderColor: '#4a4a4a',
  },
  largeChit: {
    backgroundColor: '#f4f4f4',
    borderColor: '#4a4a4a',
  },
  placeholderChit: {
    backgroundColor: '#e0e0e0',
    borderColor: '#9e9e9e',
  },
  chitValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chitType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  smallText: {
    color: '#d32f2f',
  },
  largeText: {
    color: '#1976d2',
  },
  placeholderText: {
    color: '#9e9e9e',
    fontSize: 48,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  smallButton: {
    backgroundColor: '#d32f2f',
  },
  largeButton: {
    backgroundColor: '#1976d2',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  historyButton: {
    backgroundColor: '#5d6d47',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  historyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  linksButton: {
    backgroundColor: '#6d5d47',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  linksButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#4a4a4a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyContainer: {
    backgroundColor: '#3a4a3a',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    width: '100%',
    maxHeight: 250, // Reduced height to leave room for links
  },
  historyTitle: {
    color: '#f4f4f4',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyHistory: {
    color: '#d4d4d4',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  historyList: {
    maxHeight: 200,
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#4a5a4a',
    marginBottom: 5,
    borderRadius: 5,
  },
  historyNumber: {
    color: '#f4f4f4',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 30,
  },
  historyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  historyType: {
    color: '#d4d4d4',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 25,
    textAlign: 'right',
  },
  linksContainer: {
    backgroundColor: '#3a3a4a',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    width: '100%',
    marginBottom: 20, // Add bottom margin to prevent cutting off
  },
  linksTitle: {
    color: '#f4f4f4',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  linkItem: {
    backgroundColor: '#4a4a5a',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginBottom: 8,
  },
  linkText: {
    color: '#f4f4f4',
    fontSize: 14,
    textAlign: 'center',
  },
});