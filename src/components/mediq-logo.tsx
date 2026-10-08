import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface MediqLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function MediqLogo({ size = 'md' }: MediqLogoProps) {
  const dimensions = {
    sm: { width: 90, height: 28 },
    md: { width: 120, height: 38 },
    lg: { width: 150, height: 48 },
  }[size];

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/mediq-logo.png')}
        style={{ width: dimensions.width, height: dimensions.height }}
        resizeMode="contain"
        accessibilityLabel="Mediq Logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

