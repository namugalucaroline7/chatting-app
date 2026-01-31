import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../../firebase/config';

interface Message {
  messageId: string;
  senderId: string;
  text: string;
  timestamp: any;
  read: boolean;
}

interface User {
  uid: string;
  name: string;
  email: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const chatId = params.chatId as string;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        // Get chat document to find other user
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const participants = chatData.participants as string[];
          const otherUserId = participants.find(uid => uid !== auth.currentUser?.uid);
          
          if (otherUserId) {
            // Fetch other user data
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              setOtherUser(userDoc.data() as User);
            }
          }
        }

        // Listen to messages in real-time
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const messagesList: Message[] = [];
          querySnapshot.forEach((doc) => {
            messagesList.push({
              messageId: doc.id,
              ...doc.data(),
            } as Message);
          });
          setMessages(messagesList);
          setLoading(false);
          
          // Auto-scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setLoading(false);
      }
    };

    if (chatId) {
      fetchChatData();
    }
  }, [chatId]);

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    
    try {
      // Add message to messages subcollection
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId: auth.currentUser?.uid,
        text: messageText.trim(),
        timestamp: new Date(),
        read: false,
      });

      // Update chat document with last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: messageText.trim(),
        lastTime: new Date(),
      });

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (senderId: string): boolean => {
    return senderId === auth.currentUser?.uid;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const own = isOwnMessage(item.senderId);
    
    return (
      <View style={[
        styles.messageContainer,
        own ? styles.ownMessage : styles.otherMessage,
      ]}>
        <Text style={[
          styles.messageText,
          own ? styles.ownMessageText : styles.otherMessageText,
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.messageTime,
          own ? styles.ownMessageTime : styles.otherMessageTime,
        ]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF00" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {otherUser?.name || 'Unknown User'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Messages and Input Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.messageId}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          keyboardShouldPersistTaps="handled"
          inverted={false}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        />

        {/* Input Container */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#666666"
            multiline
            maxLength={500}
            textAlignVertical="center"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#00FF00',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#00FF00',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1A',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#000000',
  },
  otherMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
  },
  ownMessageTime: {
    color: '#333333',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#666666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#000000',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#00FF00',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666666',
  },
  sendButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
