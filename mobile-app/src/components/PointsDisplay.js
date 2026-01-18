// src/components/PointsDisplay.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from '../assets/icons/icon';

export default function PointsDisplay({ points, showAnimation, animationPoints }) {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(20));

    useEffect(() => {
        if (showAnimation) {
            // Сбрасываем анимацию
            fadeAnim.setValue(0);
            slideAnim.setValue(20);

            // Запускаем анимацию появления
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Через 2 секунды скрываем
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }, 1700);
        }
    }, [showAnimation]);

    return (
        <View style={styles.container}>
            <View style={styles.pointsContainer}>
                {/*<Icon name="trophy" size={20} color="#DB6A50" />*/}
                <Text style={styles.pointsText}> {points}</Text>
                <Text style={styles.pointsLabel}>    бонусов</Text>
            </View>

            {showAnimation && (
                <Animated.View
                    style={[
                        styles.animationContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <View style={styles.animationContent}>
                        <Icon name="trophy" size={16} color="#FFF" />
                        <Text style={styles.animationText}>
                            +{animationPoints} баллов
                        </Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    /*pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(219, 106, 80, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(219, 106, 80, 0.3)',
    },*/
    pointsText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
        alignItems: 'center'
    },
    pointsLabel: {
        fontSize: 13,
        color: '#E1A6AD',
        fontWeight: '500',
        opacity: 0.9,
        marginleft: 1900,
    },
    animationContainer: {
        position: 'absolute',
        top: -40,
        alignSelf: 'center',
        backgroundColor: '#DB6A50',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 8,
        shadowColor: '#DB6A50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 100,
    },
    animationContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    animationText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
});