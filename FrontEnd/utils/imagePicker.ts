import * as ImagePicker from "expo-image-picker";

  /* função para escolher uma imagem */
  export const pickImage = async (options?: ImagePicker.ImagePickerOptions): Promise<string | null> => {

    try{ 

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if(!permissionResult.granted){
        return "É necessário permissão de ficheiros para poder aceder as imagens"
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        //qualidade a 70% para poupar espaço no servidor
        quality:0.7,
        ...options
      })

      console.log(result)

      if(!result.canceled){
        return result.assets[0].uri
      }

      return null

    }catch(err){
      return ("Erro:" + err)
    }


  }



