import * as ImagePicker from 'expo-image-picker';

const UploadImage = async (): Promise<string | null> => {
  // Pede permissão para aceder à galeria
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Precisamos de permissão para aceder às suas fotos!');
    return null;
  }

  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7, // Reduz ligeiramente para não sobrecarregar a memória
  });

  if (!result.canceled) {
    return result.assets[0].uri; // Devolve o caminho local "file:///..."
  }
  return null;
};

export default UploadImage;