// mobile-app/src/assets/icons/Icon.js
import React from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';

const Icon = ({ name, size = 24, color = '#FFFFFF', style }) => {
    const iconMap = {
        home: 'https://img.icons8.com/?size=100&id=83246&format=png&color=000000',
        calendar: 'https://img.icons8.com/?size=100&id=3524&format=png&color=000000',
        stats: 'https://img.icons8.com/?size=100&id=11496&format=png&color=000000',
        profile: 'https://img.icons8.com/?size=100&id=7820&format=png&color=000000',
        settings: 'https://img.icons8.com/?size=100&id=59817&format=png&color=FFFFFF',
        ticket: 'https://img.icons8.com/?size=100&id=CJEEOCCfqBgg&format=png&color=000000',
        fire: 'https://img.icons8.com/?size=100&id=xppiIYlI9vqZ&format=png&color=000000',
        trophy: 'https://img.icons8.com/?size=100&id=6YtrB5VnlPqY&format=png&color=000000',
        freeze: 'https://img.icons8.com/?size=100&id=7518&format=png&color=000000',
        extend: 'https://img.icons8.com/?size=100&id=90922&format=png&color=000000',
        logout: 'https://img.icons8.com/?size=100&id=20175&format=png&color=000000',
        info: 'https://img.icons8.com/?size=100&id=17077&format=png&color=000000',

        ruler: 'https://img.icons8.com/?size=100&id=20138&format=png&color=000000',
        height: 'https://img.icons8.com/?size=100&id=774&format=png&color=000000',
        weight: 'https://img.icons8.com/?size=100&id=774&format=png&color=000000',
        chest: 'https://img.icons8.com/?size=100&id=774&format=png&color=000000',
        waist: 'https://img.icons8.com/?size=100&id=774&format=png&color=000000',
        hips: 'https://img.icons8.com/?size=100&id=774&format=png&color=000000',
        clear: 'https://img.icons8.com/?size=100&id=1942&format=png&color=000000',
        save: 'https://img.icons8.com/?size=100&id=25157&format=png&color=000000',
        calculator: 'https://img.icons8.com/?size=100&id=gGUs3TPWpvgb&format=png&color=000000',
        dumbbell: 'https://img.icons8.com/?size=100&id=11408&format=png&color=000000',
        nutrition: 'https://img.icons8.com/?size=100&id=24555&format=png&color=000000',
        advice: 'https://img.icons8.com/?size=100&id=19167&format=png&color=000000',
        arrow_up: 'https://img.icons8.com/?size=100&id=166&format=png&color=000000',
        arrow_down: 'https://img.icons8.com/?size=100&id=164&format=png&color=000000',
    };

    const iconUrl = iconMap[name];

    if (iconUrl && iconUrl.startsWith('http')) {
        return (
            <Image
                source={{ uri: iconUrl }}
                style={[
                    styles.icon,
                    { width: size, height: size, tintColor: color },
                    style
                ]}
                resizeMode="contain"
            />
        );
    }

    return (
        <View style={[styles.fallbackIcon, { width: size, height: size }]}>
            <Text style={[styles.fallbackText, { fontSize: size * 0.8, color }]}>
                {iconUrl || '?'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    icon: {
        width: 24,
        height: 24,
    },
    fallbackIcon: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackText: {
        textAlign: 'center',
    },
});

export default Icon;