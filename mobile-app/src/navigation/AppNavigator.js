// mobile-app/src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from '../screens/AuthScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ScheduleScreen from '../screens/ScheduleScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Auth"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#0A0A0A',
                    },
                    headerTintColor: '#FF6B00',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen
                    name="Auth"
                    component={AuthScreen}
                    options={{ headerShown: false }} // Скрываем header на экране авторизации
                />
                <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: 'Мой профиль' }}
                />
                <Stack.Screen
                    name="Schedule"
                    component={ScheduleScreen}
                    options={{ title: 'Расписание' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}