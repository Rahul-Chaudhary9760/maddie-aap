import { Image, StyleSheet, View } from 'react-native';

export interface MedieLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function MedieLogo({ size = 'md' }: MedieLogoProps) {
  const dimensions = {
    sm: { width: 85, height: 35 },
    md: { width: 115, height: 47 },
    lg: { width: 145, height: 59 },
  }[size];

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/medie-logo.png')}
        style={{ width: dimensions.width, height: dimensions.height }}
        resizeMode="contain"
        accessibilityLabel="Medie Logo"
      />
    </View>
  );
}

// Deprecated alias for backwards compatibility
export const medieLogo = MedieLogo;
export type medieLogoProps = MedieLogoProps;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
