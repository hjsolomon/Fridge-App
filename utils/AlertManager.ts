import Toast from 'react-native-toast-message';

export const showGlobalAlert = (
  id: string,
  message: string,
  type: 'error' | 'info' | 'success' = 'info'
) => {
  Toast.show({
    type,
    text1: message,
    position: 'top',
    topOffset: 50,
    visibilityTime: 4000,
    autoHide: true,
  });
};
