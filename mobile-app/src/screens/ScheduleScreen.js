// mobile-app/src/screens/ScheduleScreen.js
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    StatusBar, Modal, FlatList, SafeAreaView,
    Image
} from 'react-native';
import { getBranches, getSchedule } from '../services/api';
import Icon from '../assets/icons/icon';

export default function ScheduleScreen({ navigation }) {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [weekDates, setWeekDates] = useState([]);

    // Логотип для кнопки "Про Фитнес"
    const proFitnessLogo = require('../assets/logo.png');

    // Генерация недели
    const generateWeekDates = () => {
        const today = new Date();
        const dates = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            dates.push({
                date: dateStr,
                day: date.getDate(),
                weekday: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
                month: date.toLocaleDateString('ru-RU', { month: 'short' }),
                isToday: i === 0,
                isSelected: i === 0
            });
        }

        setWeekDates(dates);
        setSelectedDate(dates[0].date);
        return dates[0].date;
    };

    // Загрузка филиалов
    const loadBranches = async () => {
        try {
            const response = await getBranches();
            let branchesData = [];

            if (response.data?.items) branchesData = response.data.items;
            else if (response.data?.data) branchesData = response.data.data;
            else if (Array.isArray(response.data)) branchesData = response.data;

            if (branchesData.length > 0) {
                const formattedBranches = branchesData.map(b => ({
                    id: b.id || b.ID || 0,
                    name: b.name || b.Name || 'Филиал',
                    address: b.address || b.Address || ''
                }));

                setBranches(formattedBranches);
                if (!selectedBranch) {
                    setSelectedBranch(formattedBranches[0]);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки филиалов:', error.message);
        }
    };

    // Загрузка расписания
    const loadScheduleData = async (date) => {
        if (!selectedBranch || !date) return;

        try {
            setRefreshing(true);
            const response = await getSchedule(date, date, selectedBranch.id);

            let scheduleData = [];

            if (response.data?.items) {
                scheduleData = response.data.items;
            } else if (response.data?.data) {
                scheduleData = response.data.data;
            }

            // Сортируем по времени
            const sorted = scheduleData.sort((a, b) => {
                const timeA = (a.time || '00:00').substring(0, 5);
                const timeB = (b.time || '00:00').substring(0, 5);
                return timeA.localeCompare(timeB);
            });

            setSchedule(sorted);
        } catch (error) {
            console.error('Ошибка загрузки расписания:', error.message);
            setSchedule([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Первоначальная загрузка
    useEffect(() => {
        loadBranches();
        const today = generateWeekDates();
        loadScheduleData(today);
    }, []);

    // Загрузка расписания при изменении филиала или даты
    useEffect(() => {
        if (selectedBranch && selectedDate) {
            loadScheduleData(selectedDate);
        }
    }, [selectedBranch, selectedDate]);

    // Обработчик выбора даты
    const handleDateSelect = (dateItem) => {
        const updatedWeek = weekDates.map(item => ({
            ...item,
            isSelected: item.date === dateItem.date
        }));
        setWeekDates(updatedWeek);
        setSelectedDate(dateItem.date);
    };

    // Форматирование времени
    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        return timeStr.substring(0, 5);
    };

    // Рендер загрузки
    if (loading && schedule.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#DB6A50" />
                    <Text style={styles.loadingText}>Загружаем расписание...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={styles.container}>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Шапка */}
                    <View style={styles.header}>
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>Расписание</Text>

                            <TouchableOpacity
                                style={styles.branchSelector}
                                onPress={() => setShowBranchModal(true)}
                            >
                                <Icon name="height" size={16} color="#FFF" />
                                <Text style={styles.branchName} numberOfLines={1}>
                                    {selectedBranch?.name || 'Филиал'}
                                </Text>

                            </TouchableOpacity>
                        </View>

                        {/* Календарь недели */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.weekContainer}
                            contentContainerStyle={styles.weekContent}
                        >
                            {weekDates.map((dateItem, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dateItem,
                                        dateItem.isSelected && styles.dateItemSelected,
                                        dateItem.isToday && styles.dateItemToday
                                    ]}
                                    onPress={() => handleDateSelect(dateItem)}
                                >
                                    <Text style={[
                                        styles.dateWeekday,
                                        dateItem.isSelected && styles.dateWeekdaySelected
                                    ]}>
                                        {dateItem.weekday}
                                    </Text>
                                    <Text style={[
                                        styles.dateDay,
                                        dateItem.isSelected && styles.dateDaySelected
                                    ]}>
                                        {dateItem.day}
                                    </Text>
                                    <Text style={[
                                        styles.dateMonth,
                                        dateItem.isSelected && styles.dateMonthSelected
                                    ]}>
                                        {dateItem.month}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Список занятий */}
                    <ScrollView
                        style={styles.scheduleContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => loadScheduleData(selectedDate)}
                                colors={["#DB6A50"]}
                                tintColor="#DB6A50"
                            />
                        }
                        contentContainerStyle={schedule.length === 0 ? styles.emptyContainer : styles.scheduleContent}
                    >
                        {schedule.length === 0 ? (
                            <View style={styles.empty}>
                                <Icon name="ticket" size={70} color="#444" />
                                <Text style={styles.emptyTitle}>Нет занятий</Text>
                                <Text style={styles.emptyText}>
                                    На выбранный день нет запланированных занятий
                                </Text>
                            </View>
                        ) : (
                            schedule.map((item, index) => (
                                <View key={`${item.id}-${index}`} style={styles.card}>
                                    {/* Время */}
                                    <View style={styles.timeSection}>
                                        <View style={styles.timeContainer}>
                                            <Icon name="fire" size={20} color="#DB6A50" />
                                            <Text style={styles.time}>
                                                {formatTime(item.time)}
                                            </Text>
                                        </View>
                                        <View style={styles.durationBadge}>
                                            <Text style={styles.duration}>{item.duration || 60} мин</Text>
                                        </View>
                                    </View>

                                    {/* Информация о занятии */}
                                    <View style={styles.cardBody}>
                                        <Text style={styles.workoutName} numberOfLines={2}>
                                            {item.name || 'Групповое занятие'}
                                        </Text>

                                        <View style={styles.infoRow}>
                                            <Icon name="profile" size={16} color="#DB6A50" />
                                            <Text style={styles.coach} numberOfLines={1}>
                                                {item.coach_name || item.coach || 'Тренер'}
                                            </Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Icon name="height" size={14} color="#E1A6AD" />
                                            <Text style={styles.room} numberOfLines={1}>
                                                {item.room_name || item.room || 'Основной зал'}
                                            </Text>
                                        </View>

                                        {/* Места */}
                                        <View style={styles.placesContainer}>
                                            <View style={styles.placesInfo}>
                                                <Icon name="profile" size={16} color="#E1A6AD" />
                                                <Text style={styles.placesText}>
                                                    <Text style={styles.placesFree}>{item.free_places || 0}</Text>
                                                    <Text style={styles.placesSeparator}> из </Text>
                                                    <Text style={styles.placesTotal}>{item.max_places || 10}</Text>
                                                    <Text style={styles.placesLabel}> мест свободно</Text>
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Кнопка записи */}
                                    <TouchableOpacity
                                        style={[
                                            styles.bookButton,
                                            (item.free_places === 0) && styles.bookButtonDisabled
                                        ]}
                                        disabled={item.free_places === 0}
                                    >
                                        <Icon
                                            name="extend"
                                            size={18}
                                            color={item.free_places === 0 ? "#999" : "#FFF"}
                                        />
                                        <Text style={[
                                            styles.bookButtonText,
                                            (item.free_places === 0) && styles.bookButtonTextDisabled
                                        ]}>
                                            {item.free_places === 0 ? 'МЕСТ НЕТ' : 'ЗАПИСАТЬСЯ'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    <View style={styles.spacer} />
                </ScrollView>

                {/* ФИКСИРОВАННАЯ НАВИГАЦИЯ ВНИЗУ */}
                <View style={styles.bottomNavigationContainer}>
                    <View style={styles.navBackground}>
                        {/* Профиль */}
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Icon name="profile" size={24} color="#FFF" />
                            <Text style={styles.navButtonText}>Профиль</Text>
                        </TouchableOpacity>

                        {/* Расписание (АКТИВНЫЙ) */}
                        <TouchableOpacity style={styles.navButton}>
                            <Icon name="calendar" size={26} color="#000" style={styles.activeIcon} />
                            <Text style={[styles.navButtonText, styles.navButtonActive]}>Расписание</Text>
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

            {/* Модальное окно выбора филиала */}
            <Modal
                visible={showBranchModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowBranchModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Выберите филиал</Text>
                            <TouchableOpacity
                                onPress={() => setShowBranchModal(false)}
                                style={styles.closeButton}
                            >
                                <Icon name="freeze" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={branches}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.branchItem,
                                        selectedBranch?.id === item.id && styles.branchItemSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedBranch(item);
                                        setShowBranchModal(false);
                                    }}
                                >
                                    <View style={styles.branchIcon}>
                                        <Icon name="profile" size={18} color="#DB6A50" />
                                    </View>
                                    <View style={styles.branchInfo}>
                                        <Text style={styles.branchItemName}>{item.name}</Text>
                                        {item.address && (
                                            <Text style={styles.branchAddress}>{item.address}</Text>
                                        )}
                                    </View>
                                    {selectedBranch?.id === item.id && (
                                        <View style={styles.checkIcon}>
                                            <Icon name="freeze" size={18} color="#DB6A50" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFF',
        marginTop: 15,
        fontSize: 16,
        fontWeight: '500',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    branchSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(219, 106, 80, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(219, 106, 80, 0.3)',
        maxWidth: 160,
    },
    branchName: {
        color: '#FFF',
        marginHorizontal: 8,
        fontSize: 14,
        fontWeight: '600',
        flexShrink: 1,
    },
    weekContainer: {
        marginBottom: 10,
    },
    weekContent: {
        paddingHorizontal: 5,
    },
    dateItem: {
        width: 68,
        alignItems: 'center',
        paddingVertical: 14,
        marginHorizontal: 4,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    dateItemSelected: {
        backgroundColor: '#DB6A50',
        transform: [{ scale: 1.05 }],
    },
    dateItemToday: {
        borderWidth: 2,
        borderColor: '#DB6A50',
    },
    dateWeekday: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 6,
    },
    dateWeekdaySelected: {
        color: '#FFF',
    },
    dateDay: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
    },
    dateDaySelected: {
        color: '#FFF',
    },
    dateMonth: {
        fontSize: 11,
        color: '#AAA',
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    dateMonthSelected: {
        color: '#FFF',
        fontWeight: '700',
    },
    scheduleContainer: {
        flex: 1,
    },
    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    scheduleContent: {
        paddingVertical: 10,
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: '#1A1A1A',
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    timeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'rgba(219, 106, 80, 0.12)',
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    time: {
        fontSize: 28,
        fontWeight: '800',
        color: '#DB6A50',
        marginLeft: 12,
        letterSpacing: 0.5,
    },
    durationBadge: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    duration: {
        fontSize: 13,
        color: '#AAA',
        fontWeight: '600',
    },
    cardBody: {
        padding: 20,
    },
    workoutName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 16,
        lineHeight: 26,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    coach: {
        color: '#DB6A50',
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    room: {
        color: '#E1A6AD',
        marginLeft: 10,
        fontSize: 14,
        flex: 1,
    },
    placesContainer: {
        marginTop: 18,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: '#2A2A2A',
    },
    placesInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    placesText: {
        fontSize: 15,
        marginLeft: 10,
    },
    placesFree: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 18,
    },
    placesSeparator: {
        color: '#666',
        fontSize: 15,
    },
    placesTotal: {
        color: '#666',
        fontSize: 15,
    },
    placesLabel: {
        color: '#E1A6AD',
        fontSize: 13,
        marginLeft: 4,
    },
    bookButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#DB6A50',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 16,
        borderRadius: 14,
        gap: 10,
    },
    bookButtonDisabled: {
        backgroundColor: '#2A2A2A',
        borderWidth: 1,
        borderColor: '#3A3A3A',
    },
    bookButtonText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    bookButtonTextDisabled: {
        color: '#777',
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        marginTop: 25,
        marginBottom: 12,
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 25,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 22,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
    },
    closeButton: {
        padding: 6,
    },
    branchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    branchItemSelected: {
        backgroundColor: 'rgba(219, 106, 80, 0.1)',
    },
    branchIcon: {
        width: 40,
        alignItems: 'center',
    },
    branchInfo: {
        flex: 1,
        marginLeft: 8,
    },
    branchItemName: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    branchAddress: {
        color: '#888',
        fontSize: 13,
        lineHeight: 18,
    },
    checkIcon: {
        width: 30,
        alignItems: 'center',
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
    activeIcon: {
        transform: [{ scale: 1.1 }],
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
});