import AsyncStorage from "@react-native-async-storage/async-storage"
import { router, SplashScreen } from "expo-router"
import { createContext, PropsWithChildren, useEffect, useState } from "react"


SplashScreen.preventAutoHideAsync()
type AuthState = {
  isReady: boolean  
  isLoggedIn: boolean
  logIn: () => void
  logOut: () => void
}
const authKey = "auth-key"
export const AuthContext = createContext<AuthState>({
  isReady: false,
  isLoggedIn: false,
  logIn: () => {},
  logOut: () => {}
})

export function AuthProvider({children}: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isReady, setisReady] = useState(false)
  const storeAuthState =async(newState:{isLoggedIn:boolean})=>{
    try {
      const jsonValue = JSON.stringify(newState)
      await AsyncStorage.setItem(authKey, jsonValue)
        
    } catch (error) {
        console.log(error)
        
    }
  }

  const logIn = () => {
    setIsLoggedIn(true)
    storeAuthState({isLoggedIn:true})
    router.replace('/(protected)/(tabs)')
  }

  const logOut = () => {
    setIsLoggedIn(false)
    storeAuthState({isLoggedIn:false})
    router.replace('/login')
  }
  useEffect(()=>{
    const getAuthStorage= async()=>{
        try {
            const jsonValue = await AsyncStorage.getItem(authKey);
            if(jsonValue!==null){
                const auth = JSON.parse(jsonValue)  
                setIsLoggedIn(auth.isLoggedIn)
            }
            
        } catch (error) {
            console.log(error)
            
        }
        setisReady(true)
    };
    getAuthStorage()

  }, [])
  useEffect(()=>{
    if(isReady){
        SplashScreen.hideAsync()
    }
    
  }, [isReady])

  return (
    <AuthContext.Provider value={{isLoggedIn, logIn, logOut, isReady}}>
      {children}
    </AuthContext.Provider>
  )
}