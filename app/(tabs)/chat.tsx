import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../firebase/config';

interface Chat {
  chatId: string;
  participants: string[];
  lastMessage: string;
  lastTime: any;
}

interface User {
  uid: string;
  name: string;
  email: string;
}

export default function ChatListScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', auth.currentUser?.uid));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const chatsList: Chat[] = [];
          const userIds = new Set<string>();
          
          querySnapshot.forEach((doc) => {
            const chatData = doc.data() as Chat;
            chatsList.push({
              chatId: doc.id,
              participants: chatData.participants,
              lastMessage: chatData.lastMessage,
              lastTime: chatData.lastTime,
            });
            
            // Collect other user IDs
            chatData.participants.forEach((uid) => {
              if (uid !== auth.currentUser?.uid) {
                userIds.add(uid);
              }
            });
          });

          // Fetch user data for all participants
          const usersData: { [key: string]: User } = {};
          for (const uid of userIds) {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              usersData[uid] = userDoc.data() as User;
            }
          }

          setUsers(usersData);
          setChats(chatsList);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching chats:', error);
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const getOtherUser = (participants: string[]): User | null => {
    const otherUserId = participants.find(uid => uid !== auth.currentUser?.uid);
    return otherUserId ? users[otherUserId] : null;
  };

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes === 0 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}` as any);
  };

  const renderChat = ({ item }: { item: Chat }) => {
    const otherUser = getOtherUser(item.participants);
    
    if (!otherUser) return null;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item.chatId)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {otherUser.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName}>{otherUser.name}</Text>
            <Text style={styles.timeText}>{formatTime(item.lastTime)}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF00" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Chats</Text>
        <Text style={styles.subtitle}>Your recent conversations</Text>
      </View>
      
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start chatting with someone!</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={(item) => item.chatId}
          style={styles.chatsList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  chatsList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444444',
  },
});