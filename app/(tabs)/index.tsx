import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice, { SpeechErrorEvent, SpeechResultsEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const STORAGE_KEY = '@tasks_v1';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export default function VoiceTaskApp() {
  const [isListening, setIsListening] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [partialResult, setPartialResult] = useState('');

  useEffect(() => {
    loadTasks();
    setupVoice();
    return () => {
      try {
        Voice.destroy().then(Voice.removeAllListeners);
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  const setupVoice = () => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error(e);
      setIsListening(false);
      // Alert.alert('Voice Error', e.error?.message || 'Unknown error');
    };
  };

  const loadTasks = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) setTasks(JSON.parse(json));
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  };

  const saveTasks = async (newTasks: Task[]) => {
    setTasks(newTasks);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    const text = e.value?.[0];
    if (text) {
      handleVoiceCommand(text);
    }
  };

  const handleVoiceCommand = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: cleanText,
      completed: false,
      createdAt: Date.now(),
    };

    const updatedTasks = [newTask, ...tasks];
    saveTasks(updatedTasks);
    
    // Feedback
    Speech.speak(`Added task: ${cleanText}`);
    setPartialResult('');
    
    // Stop listening after one command for button mode
    stopListening();
  };

  const startListening = async () => {
    try {
      await Voice.start('en-US');
      setPartialResult('Listening...');
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      setPartialResult('');
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Taskr Voice</Text>
        <Text style={styles.subtitle}>Say "Keshava" logic coming soon...</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity 
              onPress={() => toggleTask(item.id)}
              style={[styles.checkbox, item.completed && styles.checked]}
            >
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={[styles.taskText, item.completed && styles.completedText]}>
              {item.text}
            </Text>
            <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet.</Text>
            <Text style={styles.emptySubText}>Press the mic and say a task!</Text>
          </View>
        }
      />

      <View style={styles.controls}>
        <Text style={styles.statusText}>
          {isListening ? 'Listening...' : partialResult || 'Press to create task'}
        </Text>
        
        <TouchableOpacity
          onPress={isListening ? stopListening : startListening}
          style={[styles.micButton, isListening && styles.micActive]}
        >
          <Text style={styles.micIcon}>{isListening ? '⏹' : '🎤'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: StatusBar.currentHeight || 40,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120, // Space for mic
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
    color: '#ff4444',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    alignItems: 'center',
  },
  statusText: {
    marginBottom: 16,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  micActive: {
    backgroundColor: '#ff4444',
    shadowColor: '#ff4444',
  },
  micIcon: {
    fontSize: 32,
    color: '#fff',
  },
});
