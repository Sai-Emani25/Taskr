import { StyleSheet } from 'react-native';

import VoiceChatScreen from '../(voice)/index';

export default function TabTwoScreen() {
  return (
    <VoiceChatScreen />
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
