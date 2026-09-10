import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/core/components/Screen';

export default function ChatTab() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.text}>Tin nhắn (Placeholder)</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16 },
});
