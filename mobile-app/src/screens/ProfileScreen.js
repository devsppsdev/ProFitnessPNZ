// ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    Image,
    Alert
} from 'react-native';
import Icon from '../assets/icons/icon';
import PointsDisplay from '../components/PointsDisplay';

export default function ProfileScreen({ navigation, route }) {
    const [daysLeft, setDaysLeft] = useState(24);
    const [freezeAvailable, setFreezeAvailable] = useState(true);
    const [points, setPoints] = useState(100);
    const [streakDays, setStreakDays] = useState(15);

    // Состояния для анимации баллов
    const [showPointsAnimation, setShowPointsAnimation] = useState(false);
    const [animationPoints, setAnimationPoints] = useState(0);

    // Логотип для кнопки "Про Фитнес"
    const proFitnessLogo = require('../assets/logo.png');

    // Обработка обновления баллов из других экранов
    useEffect(() => {
        if (route.params?.newPoints) {
            const earnedPoints = route.params.newPoints;
            setAnimationPoints(earnedPoints);
            setShowPointsAnimation(true);
            setPoints(prev => prev + earnedPoints);

            // Через 2 секунды скрываем анимацию
            const timer = setTimeout(() => {
                setShowPointsAnimation(false);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [route.params?.newPoints]);

    const handleLogout = () => {
        Alert.alert(
            'Выход',
            'Вы уверены, что хотите выйти?',
            [
                {
                    text: 'Отмена',
                    style: 'cancel'
                },
                {
                    text: 'Выйти',
                    style: 'destructive',
                    onPress: () => {
                        // Сбрасываем навигацию на экран авторизации
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Auth' }],
                        });
                    }
                }
            ]
        );
    };

    const handleFreeze = () => {
        if (!freezeAvailable) return;
        Alert.alert('Заморозка', 'Абонемент заморожен на 7 дней');
    };

    const handleExtend = () => {
        Alert.alert('Продление', 'Переход на экран продления абонемента');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={styles.container}>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Информация о пользователе */}
                    <View style={styles.userSection}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>Н</Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>Никита</Text>
                                <Text style={styles.userPhone}>+7 (999) 123-45-67</Text>
                            </View>
                        </View>
                    </View>

                    {/* Основная статистика */}
                    <View style={styles.mainStatsSection}>
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <View style={styles.statIconContainer}>
                                    <Icon name="fire" size={32} color="#DB6A50" />
                                </View>
                                <Text style={styles.statNumber}>{streakDays}</Text>
                                <Text style={styles.statLabel}>дней подряд</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statIconContainer}>
                                    <Icon name="trophy" size={32} color="#DB6A50" />
                                </View>
                                <PointsDisplay
                                    points={points}
                                    showAnimation={showPointsAnimation}
                                    animationPoints={animationPoints}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Абонемент */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleWithIcon}>
                                <Icon name="ticket" size={22} color="#FFF" />
                                <Text style={styles.sectionTitle}>Мой абонемент</Text>
                            </View>
                        </View>

                        <View style={styles.subscriptionCard}>
                            <View style={styles.daysContainer}>
                                <Text style={styles.daysLeft}>{daysLeft}</Text>
                                <Text style={styles.daysLabel}>остаток дней</Text>
                            </View>

                            <View style={styles.subscriptionButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.subscriptionButton,
                                        styles.freezeButton,
                                        !freezeAvailable && styles.buttonDisabled
                                    ]}
                                    disabled={!freezeAvailable}
                                    onPress={handleFreeze}
                                >
                                    <Icon name="freeze" size={20} color="#E1A6AD" />
                                    <Text style={styles.buttonText}>Заморозить</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.subscriptionButton, styles.extendButton]}
                                    onPress={handleExtend}
                                >
                                    <Icon name="extend" size={20} color="#FFF" />
                                    <Text style={styles.buttonText}>Продлить</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Кнопка выхода */}
                    <View style={styles.logoutSection}>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <Icon name="logout" size={22} color="#E1A6AD" />
                            <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.spacer} />
                </ScrollView>

                {/* ФИКСИРОВАННАЯ НАВИГАЦИЯ ВНИЗУ */}
                <View style={styles.bottomNavigationContainer}>
                    <View style={styles.navBackground}>
                        {/* Профиль (АКТИВНЫЙ) */}
                        <TouchableOpacity style={styles.navButton}>
                            <Icon name="profile" size={26} color="#000" style={styles.activeIcon} />
                            <Text style={[styles.navButtonText, styles.navButtonActive]}>Профиль</Text>
                        </TouchableOpacity>

                        {/* Расписание */}
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate('Schedule')}
                        >
                            <Icon name="calendar" size={24} color="#FFF" />
                            <Text style={styles.navButtonText}>Расписание</Text>
                        </TouchableOpacity>

                        {/* Показатели */}
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate('Progress')}
                        >
                            <Icon name="stats" size={24} color="#FFF" />
                            <Text style={styles.navButtonText}>Показатели</Text>
                        </TouchableOpacity>

                        {/* Про Фитнес */}
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate('ProFitness')}
                        >
                            <Image
                                source={proFitnessLogo}
                                style={styles.proFitnessIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.navButtonText}>Про Фитнес</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    scrollView: {
        flex: 1,
    },
    userSection: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20,
    },
    avatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#DB6A50',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#DB6A50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFF',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    userPhone: {
        fontSize: 15,
        color: '#DB6A50',
        fontWeight: '600',
        opacity: 0.9,
    },
    mainStatsSection: {
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 5,
    },
    statIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(219, 106, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statNumber: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#E1A6AD',
        fontWeight: '500',
        opacity: 0.9,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    titleWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: -0.3,
    },
    subscriptionCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 5,
    },
    daysContainer: {
        alignItems: 'center',
        marginBottom: 28,
    },
    daysLeft: {
        fontSize: 64,
        fontWeight: '800',
        color: '#DB6A50',
        lineHeight: 70,
        textShadowColor: 'rgba(219, 106, 80, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    daysLabel: {
        fontSize: 15,
        color: '#E1A6AD',
        fontWeight: '500',
        marginTop: 6,
        letterSpacing: 0.5,
    },
    subscriptionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    subscriptionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 2,
        gap: 8,
    },
    freezeButton: {
        backgroundColor: 'transparent',
        borderColor: '#E1A6AD',
    },
    extendButton: {
        backgroundColor: '#DB6A50',
        borderColor: '#DB6A50',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
        letterSpacing: 0.3,
    },
    spacer: {
        height: 100,
    },
    bottomNavigationContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        zIndex: 1000,
    },
    navBackground: {
        flexDirection: 'row',
        backgroundColor: '#DB6A50',
        borderRadius: 35,
        paddingHorizontal: 20,
        paddingVertical: 14,
        shadowColor: '#DB6A50',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 72,
    },
    navButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        gap: 6,
    },
    proFitnessIcon: {
        width: 24,
        height: 24,
        tintColor: '#FFF',
    },
    navButtonText: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: '600',
        letterSpacing: 0.2,
        textAlign: 'center',
        marginTop: 2,
    },
    navButtonActive: {
        fontWeight: '700',
        transform: [{ scale: 1.05 }],
    },
    activeIcon: {
        transform: [{ scale: 1.1 }],
    },
    logoutSection: {
        paddingHorizontal: 24,
        marginTop: 20,
        marginBottom: 30,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(225, 166, 173, 0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(225, 166, 173, 0.3)',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 12,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E1A6AD',
        letterSpacing: 0.3,
    },
});