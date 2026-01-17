// mobile-app/src/screens/ScheduleScreen.js
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    StatusBar, Modal, FlatList, Dimensions
} from 'react-native';
import { getBranches, getSchedule } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export default function ScheduleScreen() {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [weekDates, setWeekDates] = useState([]);

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

    // Загрузка расписания для выбранной даты
    const loadScheduleData = async (date) => {
        if (!selectedBranch || !date) return;

        try {
            setRefreshing(true);
            console.log(`Загружаем расписание: филиал=${selectedBranch.id}, дата=${date}`);

            // Используем ту же дату для date_from и date_to (один день)
            const response = await getSchedule(date, date, selectedBranch.id);

            console.log('Ответ API:', {
                success: response.data?.success,
                total: response.data?.meta?.total,
                itemsCount: response.data?.items?.length || 0
            });

            let scheduleData = [];

            if (response.data?.items) {
                scheduleData = response.data.items;
            } else if (response.data?.data) {
                scheduleData = response.data.data;
            }

            console.log(`Найдено ${scheduleData.length} занятий на ${date}`);

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
            <View style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                    <Text style={styles.loadingText}>Загружаем расписание...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

            {/* Шапка */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>Расписание</Text>

                    </View>

                    <TouchableOpacity
                        style={styles.branchSelector}
                        onPress={() => setShowBranchModal(true)}
                    >
                        <Icon name="map-marker" size={18} color="#FF6B00" />
                        <Text style={styles.branchName} numberOfLines={1}>
                            {selectedBranch?.name || 'Филиал'}
                        </Text>
                        <Icon name="chevron-down" size={16} color="#FF6B00" />
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

                {/* Статистика */}
                {schedule.length > 0 && (
                    <View style={styles.stats}>
                        <View style={styles.stat}>
                            <View style={styles.statIconContainer}>
                                <Icon name="calendar-check" size={18} color="#FF6B00" />
                            </View>
                            <Text style={styles.statValue}>{schedule.length}</Text>
                            <Text style={styles.statLabel}>занятий</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <View style={styles.statIconContainer}>
                                <Icon name="account-group" size={18} color="#4CAF50" />
                            </View>
                            <Text style={styles.statValue}>
                                {schedule.reduce((sum, item) => sum + (item.free_places || 0), 0)}
                            </Text>
                            <Text style={styles.statLabel}>свободно</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Список занятий */}
            <ScrollView
                style={styles.scheduleContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadScheduleData(selectedDate)}
                        colors={["#FF6B00"]}
                        tintColor="#FF6B00"
                    />
                }
                contentContainerStyle={schedule.length === 0 ? styles.emptyContainer : styles.scheduleContent}
            >
                {schedule.length === 0 ? (
                    <View style={styles.empty}>
                        <Icon name="calendar-blank" size={80} color="#444" />
                        <Text style={styles.emptyTitle}>Нет занятий</Text>
                        <Text style={styles.emptyText}>
                            На выбранный день нет запланированных занятий
                        </Text>
                        <TouchableOpacity
                            style={styles.tryButton}
                            onPress={() => {
                                const today = new Date().toISOString().split('T')[0];
                                handleDateSelect(weekDates.find(d => d.date === today) || weekDates[0]);
                            }}
                        >
                            <Text style={styles.tryButtonText}>Показать сегодня</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    schedule.map((item, index) => (
                        <View key={`${item.id}-${index}`} style={styles.card}>
                            {/* Время */}
                            <View style={styles.timeSection}>
                                <View style={styles.timeContainer}>
                                    <Icon name="clock-outline" size={20} color="#FF6B00" />
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
                                    <Icon name="account" size={16} color="#FF6B00" />
                                    <Text style={styles.coach} numberOfLines={1}>
                                        {item.coach_name || item.coach || 'Тренер'}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Icon name="map-marker" size={14} color="#888" />
                                    <Text style={styles.room} numberOfLines={1}>
                                        {item.room_name || item.room || 'Основной зал'}
                                    </Text>
                                </View>

                                {/* Места */}
                                <View style={styles.placesContainer}>
                                    <View style={styles.placesInfo}>
                                        <Icon name="account-group" size={16} color="#888" />
                                        <Text style={styles.placesText}>
                                            <Text style={styles.placesFree}>{item.free_places || 0}</Text>
                                            <Text style={styles.placesSeparator}> из </Text>
                                            <Text style={styles.placesTotal}>{item.max_places || 10}</Text>
                                            <Text style={styles.placesLabel}> мест свободно</Text>
                                        </Text>
                                    </View>

                                    {/* Индикатор заполненности */}
                                    <View style={styles.placesIndicator}>
                                        <View
                                            style={[
                                                styles.placesFill,
                                                {
                                                    width: `${Math.min(100, 100 - ((item.free_places || 0) / (item.max_places || 10) * 100))}%`
                                                }
                                            ]}
                                        />
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
                                    name={item.free_places === 0 ? "lock" : "calendar-plus"}
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
                                <Icon name="close" size={24} color="#FFF" />
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
                                        <Icon name="map-marker" size={20} color="#FF6B00" />
                                    </View>
                                    <View style={styles.branchInfo}>
                                        <Text style={styles.branchItemName}>{item.name}</Text>
                                        {item.address && (
                                            <Text style={styles.branchAddress}>{item.address}</Text>
                                        )}
                                    </View>
                                    {selectedBranch?.id === item.id && (
                                        <View style={styles.checkIcon}>
                                            <Icon name="check" size={20} color="#FF6B00" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0A0A0A',
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
        backgroundColor: '#111',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    date: {
        fontSize: 16,
        color: '#FF6B00',
        marginTop: 5,
        fontWeight: '600',
    },
    branchSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,107,0,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,107,0,0.3)',
        maxWidth: 160,
    },
    branchName: {
        color: '#FF6B00',
        marginHorizontal: 8,
        fontSize: 14,
        fontWeight: '600',
        flexShrink: 1,
    },
    weekContainer: {
        marginBottom: 20,
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
        backgroundColor: '#FF6B00',
        transform: [{ scale: 1.05 }],
    },
    dateItemToday: {
        borderWidth: 2,
        borderColor: '#FF6B00',
    },
    dateWeekday: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 6,
    },
    dateWeekdaySelected: {
        color: '#000',
    },
    dateDay: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
    },
    dateDaySelected: {
        color: '#000',
    },
    dateMonth: {
        fontSize: 11,
        color: '#AAA',
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    dateMonthSelected: {
        color: '#333',
        fontWeight: '700',
    },
    stats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: 16,
        marginTop: 10,
        alignItems: 'center',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 10,
    },
    scheduleContainer: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    scheduleContent: {
        paddingVertical: 20,
        paddingHorizontal: 16,
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
        backgroundColor: 'rgba(255,107,0,0.12)',
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
        color: '#FF6B00',
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
        color: '#FF6B00',
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    room: {
        color: '#888',
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
        color: '#999',
        fontSize: 13,
        marginLeft: 4,
    },
    placesIndicator: {
        height: 6,
        backgroundColor: '#2A2A2A',
        borderRadius: 3,
        overflow: 'hidden',
    },
    placesFill: {
        height: '100%',
        backgroundColor: '#FF6B00',
        borderRadius: 3,
    },
    bookButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FF6B00',
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
    tryButton: {
        paddingVertical: 14,
        paddingHorizontal: 28,
        backgroundColor: 'rgba(255,107,0,0.15)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,107,0,0.3)',
    },
    tryButtonText: {
        color: '#FF6B00',
        fontWeight: '700',
        fontSize: 14,
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
        backgroundColor: 'rgba(255,107,0,0.1)',
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
});