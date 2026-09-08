import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DisclaimerBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Disclaimer: KalleMind verifies registration status only.
        We do not endorse any practitioner — users must do their own due diligence.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f5fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  text: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
  },
});