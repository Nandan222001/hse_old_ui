import React, { useState } from 'react';
import { Icon } from '../components/display/Icon';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { ScreenLayout } from '../components/layout/ScreenLayout';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  checklist?: string[];
  doc?: { title: string; desc: string };
}

export default function AISafetyAssistantScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello Alex. I'm your AI Safety Assistant. How can I help you ensure site safety today?",
      time: '08:42 AM',
    },
    {
      id: '2',
      sender: 'user',
      text: 'What PPE is required for Zone B?',
      time: '08:45 AM',
    },
    {
      id: '3',
      sender: 'ai',
      text: 'For **Zone B (High Pressure Testing Area)**, the following PPE is mandatory as per the latest safety audit:',
      time: '08:45 AM',
      checklist: [
        'Level 3 Arc-Rated Flash Suit',
        'Impact-resistant safety goggles (ANSI Z87.1)',
        'Reinforced steel-toe industrial boots',
        'Double hearing protection (Plugs + Muffs)',
      ],
      doc: {
        title: 'SOP-HP-2024-B.pdf',
        desc: 'Standard Operating Procedure - Zone B',
      },
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: String(messages.length + 1),
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulated reply
    setTimeout(() => {
      const reply: Message = {
        id: String(messages.length + 2),
        sender: 'ai',
        text: "I've logged your query. Let me look up the relevant Safety SOP for you.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, reply]);
    }, 1200);
  };

  return (
    <ScreenLayout bg="#F8FAFC">
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Icon emoji="←" style={styles.headerIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Safety Assistant</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
          <Icon emoji="🔔" style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dateLabel}>
            <Text style={styles.dateText}>Today</Text>
          </View>

          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.sender === 'user' ? styles.messageRowUser : styles.messageRowAi,
              ]}
            >
              {/* Icon */}
              {msg.sender === 'ai' && (
                <View style={styles.aiIconBox}>
                  <Icon emoji="🤖" style={styles.aiIcon} />
                </View>
              )}

              <View style={styles.messageContent}>
                <View
                  style={[
                    styles.bubble,
                    msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi,
                  ]}
                >
                  <Text style={[styles.msgText, msg.sender === 'user' && styles.msgTextUser]}>
                    {msg.text}
                  </Text>

                  {/* Checklist */}
                  {msg.checklist && (
                    <View style={styles.checklist}>
                      {msg.checklist.map((item, idx) => (
                        <View key={idx} style={styles.checkItem}>
                          <Icon emoji="✓" style={styles.checkIcon} />
                          <Text style={styles.checkText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Doc Box */}
                  {msg.doc && (
                    <View style={styles.docBox}>
                      <View style={styles.pdfIcon}>
                        <Text style={styles.pdfIconText}>PDF</Text>
                      </View>
                      <View style={styles.docDetails}>
                        <Text style={styles.docTitle}>{msg.doc.title}</Text>
                        <Text style={styles.docDesc}>{msg.doc.desc}</Text>
                      </View>
                      <Icon emoji="⎋" style={styles.docOpenIcon} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.timeText,
                    msg.sender === 'user' ? styles.timeTextUser : styles.timeTextAi,
                  ]}
                >
                  {msg.time}
                </Text>
              </View>

              {msg.sender === 'user' && (
                <View style={styles.userIconBox}>
                  <Icon emoji="👤" style={styles.userIcon} />
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Suggestion pills */}
        <View style={styles.suggestions}>
          <TouchableOpacity style={styles.pill} onPress={() => setInputText('How to report a hazard?')}>
            <Text style={styles.pillText}>How to report a hazard?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => setInputText('Permit guidance')}>
            <Text style={styles.pillText}>Permit guidance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => setInputText('Latest incident reports')}>
            <Text style={styles.pillText}>Latest incident reports</Text>
          </TouchableOpacity>
        </View>

        {/* Input area */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachmentBtn}>
            <Icon emoji="📎" style={styles.attachmentIcon} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Ask AI anything about safety SOP..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Icon emoji="➤" style={styles.sendIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerIcon: {
    fontSize: 22,
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  container: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  dateLabel: {
    alignSelf: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  aiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    elevation: 1,
  },
  aiIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  userIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    elevation: 1,
  },
  userIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  messageContent: {
    maxWidth: '75%',
  },
  bubble: {
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  bubbleAi: {
    backgroundColor: '#EFF6FF',
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#2563EB',
    borderTopRightRadius: 4,
  },
  msgText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    fontWeight: '500',
  },
  msgTextUser: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  timeTextAi: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  timeTextUser: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  checklist: {
    marginTop: 12,
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
    marginRight: 8,
  },
  checkText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  docBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pdfIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pdfIconText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  docDetails: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  docDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  docOpenIcon: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 6,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  pill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  attachmentBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentIcon: {
    fontSize: 22,
    color: '#64748B',
  },
  textInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});
