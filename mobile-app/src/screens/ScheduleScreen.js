// mobile-app/src/screens/ScheduleScreen.js
import React from 'react';
import { View, Text, Button } from 'react-native';

export default function ScheduleScreen({ navigation }) {
    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 24 }}>Расписание</Text>
            <Text>Здесь будет виджет CRM</Text>
            <Button title="Профиль" onPress={() => navigation.navigate('Profile')} />
        </View>
    );
}