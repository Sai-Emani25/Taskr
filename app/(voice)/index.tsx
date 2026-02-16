// This will be the main entry point for the "Voice Mode" tab or screen.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
const FileSystem = require('expo-file-system');

const STORAGE_KEY_CHAT = '@chat_logs_v1';
const APPSERVER_URL = 'http://192.168.1.5:8081'; // Placeholder for live server logic

export default function VoiceChatScreen() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  // Voice setup
  useEffect(() => {
    loadMessages();
    setupVoice();
    
    // Initial welcome message
    if (messages.length === 0) {
      const welcome: IMessage = {
        _id: 1,
        text: 'Hello! I am Keshava. Press the mic to add a task, or ask me to list your tasks.',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Keshava',
          avatar: 'https://placeimg.com/140/140/tech',
        },
      };
      setMessages([welcome]);
    }

    return () => {
      stopVoice();
    };
  }, []);

  const setupVoice = async () => {
    try {
      await Voice.destroy();
      Voice.onSpeechStart = () => setIsListening(true);
      Voice.onSpeechEnd = () => setIsListening(false);
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = (e) => {
        console.error(e);
        setIsListening(false);
      };
    } catch (e) {
      console.error(e);
    }
  };
  
  const stopVoice = async () => {
      try {
          await Voice.destroy();
          Voice.removeAllListeners();
      } catch (e) {
          console.error(e);
      }
  }

  const loadMessages = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY_CHAT);
      if (json) {
         const oldMessages = JSON.parse(json);
         // Convert date strings back to Date objects
         const parsed = oldMessages.map((m: any) => ({
             ...m,
             createdAt: new Date(m.createdAt)
         }));
         setMessages(parsed);
      }
    } catch (e) {
      console.log('No chat history');
    }
  };

  const saveMessages = async (newMessages: IMessage[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(newMessages));
    } catch (e) {
      console.error(e);
    }
  };

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    setMessages(previous => {
        const updated = GiftedChat.append(previous, newMessages);
        saveMessages(updated);
        return updated;
    });
    
    // Simulate bot response for tasks
    const text = newMessages[0].text;
    handleCommand(text);
  }, []);

  const handleCommand = (text: string) => {
      // Simple keyword matching for "Taskr" logic
      const lower = text.toLowerCase();
      let responseText = '';

      if (lower.includes('task') || lower.includes('remind')) {
          responseText = `I've added "${text}" to your task list.`;
          // In a real app, this would add to the tasks context/storage
      } else if (lower.includes('list') || lower.includes('show')) {
          responseText = "Here are your pending tasks: ... (Fetching from storage)";
      } else {
          responseText = `I heard: "${text}". Is this a task?`;
      }

      const botMessage: IMessage = {
          _id: Math.round(Math.random() * 1000000),
          text: responseText,
          createdAt: new Date(),
          user: {
              _id: 2,
              name: 'Keshava',
              avatar: 'https://placeimg.com/140/140/tech', // Check user if they have a real avatar URL
          },
      };

      setTimeout(() => {
          setMessages(previous => {
            const updated = GiftedChat.append(previous, [botMessage]);
            saveMessages(updated);
            return updated;
          });
          Speech.speak(responseText);
      }, 1000);
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    const text = e.value?.[0];
    if (text) {
        const userMessage: IMessage = {
            _id: Math.round(Math.random() * 1000000),
            text: text,
            createdAt: new Date(),
            user: {
                _id: 1, // User is 1
            },
        };
        onSend([userMessage]);
        stopListening();
    }
  };

  const startListening = async () => {
    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  const renderActions = (props: any) => {
      return (
          <TouchableOpacity 
            style={[styles.micButton, isListening && styles.micActive]} 
            onPress={isListening ? stopListening : startListening}
          >
              <Text style={styles.micIcon}>{isListening ? '⏹' : '🎤'}</Text>
          </TouchableOpacity>
      );
  };

  // Feature: Share a live server link or logs
  const shareLogs = async () => {
    // Generate a simple HTML log file
    const logContent = messages.map(m => `[${new Date(m.createdAt).toLocaleTimeString()}] ${m.user.name}: ${m.text}`).join('\n');
    const path = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + 'chat_logs.txt';
    
    await FileSystem.writeAsStringAsync(path, logContent);
    
    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
    } else {
        Alert.alert("Sharing not available");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.title}>Chat with Keshava</Text>
          <TouchableOpacity onPress={shareLogs}>
              <Text style={styles.shareLink}>Share Logs</Text>
          </TouchableOpacity>
      </View>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: 1,
        }}
        renderActions={renderActions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      marginTop: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  title: {
      fontSize: 18,
      fontWeight: 'bold',
  },
  shareLink: {
      color: '#007AFF',
  },
  micButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
      marginBottom: 0,
  },
  micActive: {
      backgroundColor: '#ffcccc',
  },
  micIcon: {
      fontSize: 24,
  }
});
