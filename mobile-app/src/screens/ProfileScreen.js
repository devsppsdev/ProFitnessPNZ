// mobile-app/src/screens/ProfileScreen.js
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from 'react-native';

export default function ProfileScreen({ navigation }) {
    return (
        <ScrollView style={styles.container}>
            {/* Шапка профиля */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>Ф</Text>
                </View>
                <Text style={styles.name}>Клиент Фитнес-студии</Text>
                <Text style={styles.phone}>+7 (999) 123-45-67</Text>
            </View>

            {/* Статистика */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>15</Text>
                    <Text style={styles.statLabel}>дней подряд</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>480</Text>
                    <Text style={styles.statLabel}>баллов</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>8</Text>
                    <Text style={styles.statLabel}>посещений</Text>
                </View>
            </View>

            {/* Меню */}
            <View style={styles.menu}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Schedule')}
                >
                    <Text style={styles.menuText}>📅 Расписание</Text>
                    <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuText}>🎯 Мои цели</Text>
                    <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuText}>📊 Прогресс</Text>
                    <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuText}>⚙️ Настройки</Text>
                    <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, styles.logoutButton]}>
                    <Text style={styles.logoutText}>Выйти</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        backgroundColor: '#1A1A1A',
        padding: 30,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#FF6B00',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FF6B00',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#0A0A0A',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    phone: {
        fontSize: 16,
        color: '#FF6B00',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#1A1A1A',
        margin: 20,
        borderRadius: 20,
    },
    statCard: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF6B00',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    menu: {
        margin: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    menuText: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    menuArrow: {
        fontSize: 28,
        color: '#FF6B00',
        fontWeight: 'bold',
    },
    logoutButton: {
        borderBottomWidth: 0,
        marginTop: 10,
    },
    logoutText: {
        fontSize: 18,
        color: '#FF6B00',
        fontWeight: 'bold',
        textAlign: 'center',
        width: '100%',
    },
});