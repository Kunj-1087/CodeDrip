import React from 'react';
import { Keyboard, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';

/** Wrap forms so a tap on empty space dismisses the keyboard. */
export function KeyboardDismiss({ children }: { children: React.ReactNode }) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.fill}>{children}</View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
