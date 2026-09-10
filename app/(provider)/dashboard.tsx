import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/core/components/Screen';

export default function DashboardTab() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.text}>Tổng quan (Placeholder)</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16 },
});
