import { registerRootComponent } from 'expo';  // <-- Добавить эту строку
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthScreen from './src/screens/AuthScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProgressScreen from './src/screens/ProgressScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false, // ← ЭТО ВАЖНО!
          cardStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="Progress" component={ProgressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default registerRootComponent(App);  // <-- Изменить эту строку