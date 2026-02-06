import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'key'

export const saveToken = async (token: string) => {

    try{

        await SecureStore.setItemAsync(TOKEN_KEY, token)
        console.log('Token guardado')

    }catch(err){
        console.error("Erro: ", err)
    }

}

export const getToken = async () => {

    try{
        return await SecureStore.getItemAsync(TOKEN_KEY)
    }catch(err){
        console.error("Erro: ", err)
        return null
    }
}

export const deleteToken = async () => {

    try{

        await SecureStore.deleteItemAsync(TOKEN_KEY)

    }catch(err){
        console.error("Erro ao apagar token: ",err)
    }

}