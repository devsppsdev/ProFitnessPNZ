// mobile-app/src/screens/ScheduleScreen.js
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    SafeAreaView, StatusBar, Modal, FlatList
} from 'react-native';
import { getBranches, getSchedule } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ScheduleScreen() {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [showBranchModal, setShowBranchModal] = useState(false);

    // Получаем сегодняшнюю дату в правильном формате
    const getTodayDate = () => {
        const now = new Date();
        const hours = now.getHours();
        
        // Если после 22:00, показываем завтра
        if (hours >= 22) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }
        return now.toISOString().split('T')[0];
    };

    // Загрузка филиалов
    const loadBranches = async () => {
        try {
            console.log('🔄 Загружаем филиалы...');
            const response = await getBranches();
            console.log('✅ Филиалы:', response.data);
            
            let branchesData = [];
            
            // Ищем данные в разных местах ответа
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
            console.error('❌ Ошибка филиалов:', error.response?.data || error.message);
        }
    };

    // Загрузка расписания
    const loadScheduleData = async () => {
        if (!selectedBranch) return;
        
        try {
            setRefreshing(true);
            const date = getTodayDate();
            console.log(`📅 Загружаем расписание: филиал=${selectedBranch.id}, дата=${date}`);
            
            const response = await getSchedule(date, selectedBranch.id);
            console.log('✅ Расписание:', response.data);
            
            let scheduleData = [];
            
            // Ищем данные в разных местах ответа
            if (response.data?.items) scheduleData = response.data.items;
            else if (response.data?.data) scheduleData = response.data.data;
            else if (Array.isArray(response.data)) scheduleData = response.data;
            
            // Сортируем по времени
            const sorted = scheduleData.sort((a, b) => {
                const timeA = (a.time || '00:00').substring(0, 5);
                const timeB = (b.time || '00:00').substring(0, 5);
                return timeA.localeCompare(timeB);
            });
            
            setSchedule(sorted);
        } catch (error) {
            console.error('❌ Ошибка расписания:', error.response?.data || error.message);
            setSchedule([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Первоначальная загрузка
    useEffect(() => {
        loadBranches();
    }, []);

    // Загрузка расписания при выборе филиала
    useEffect(() => {
        if (selectedBranch) {
            loadScheduleData();
        }
    }, [selectedBranch]);

    // Форматирование даты
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = getTodayDate();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        if (dateStr === today) return `сегодня, ${date.getDate()} ${date.toLocaleString('ru-RU', { month: 'long' })}`;
        if (dateStr === tomorrowStr) return `завтра, ${date.getDate()} ${date.toLocaleString('ru-RU', { month: 'long' })}`;
        
        return date.toLocaleString('ru-RU', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                    <Text style={styles.loadingText}>Загружаем...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
            
            {/* Шапка */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.title}>Расписание</Text>
                        <Text style={styles.date}>{formatDate(getTodayDate())}</Text>
                    </View>
                    
                    <TouchableOpacity
                        style={styles.branchSelector}
                        onPress={() => setShowBranchModal(true)}
                    >
                        <Icon name="map-marker" size={18} color="#FF6B00" />
                        <Text style={styles.branchName} numberOfLines={1}>
                            {selectedBranch?.name || 'Выбрать филиал'}
                        </Text>
                        <Icon name="chevron-down" size={16} color="#FF6B00" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.stats}>
                    <View style={styles.stat}>
                        <Icon name="calendar-check" size={18} color="#FF6B00" />
                        <Text style={styles.statValue}>{schedule.length}</Text>
                        <Text style={styles.statLabel}>занятий</Text>
                    </View>
                    <View style={styles.stat}>
                        <Icon name="account-group" size={18} color="#4CAF50" />
                        <Text style={styles.statValue}>
                            {schedule.reduce((sum, item) => sum + (item.free_places || 0), 0)}
                        </Text>
                        <Text style={styles.statLabel}>свободно</Text>
                    </View>
                </View>
            </View>

            {/* Список */}
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={loadScheduleData}
                        colors={["#FF6B00"]}
                    />
                }
            >
                {schedule.length === 0 ? (
                    <View style={styles.empty}>
                        <Icon name="calendar-remove" size={60} color="#666" />
                        <Text style={styles.emptyText}>Нет занятий на эту дату</Text>
                    </View>
                ) : (
                    schedule.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.time}>{item.time?.substring(0, 5) || '--:--'}</Text>
                                <Text style={styles.duration}>{item.duration || 60} мин</Text>
                            </View>
                            
                            <View style={styles.cardBody}>
                                <Text style={styles.workoutName}>{item.name || 'Занятие'}</Text>
                                
                                <View style={styles.row}>
                                    <Icon name="account" size={14} color="#FF6B00" />
                                    <Text style={styles.coach}>{item.coach_name || item.coach || 'Тренер'}</Text>
                                </View>
                                
                                {item.room_name && (
                                    <View style={styles.row}>
                                        <Icon name="map-marker" size={12} color="#666" />
                                        <Text style={styles.room}>{item.room_name}</Text>
                                    </View>
                                )}
                                
                                <View style={styles.places}>
                                    <Text style={styles.placesText}>
                                        <Text style={styles.placesFree}>{item.free_places || 0}</Text>
                                        <Text style={styles.placesTotal}> / {item.max_places || 10}</Text>
                                        <Text style={styles.placesLabel}> свободно</Text>
                                    </Text>
                                </View>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.bookButton, item.free_places === 0 && styles.bookButtonDisabled]}
                                disabled={item.free_places === 0}
                            >
                                <Text style={styles.bookButtonText}>
                                    {item.free_places === 0 ? 'МЕСТ НЕТ' : 'ЗАПИСАТЬСЯ'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Модалка филиалов */}
            <Modal
                visible={showBranchModal}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Выберите филиал</Text>
                            <TouchableOpacity onPress={() => setShowBranchModal(false)}>
                                <Icon name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList
                            data={branches}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.branchItem, selectedBranch?.id === item.id && styles.branchItemSelected]}
                                    onPress={() => {
                                        setSelectedBranch(item);
                                        setShowBranchModal(false);
                                    }}
                                >
                                    <Icon name="map-marker" size={20} color="#FF6B00" />
                                    <View style={styles.branchInfo}>
                                        <Text style={styles.branchItemName}>{item.name}</Text>
                                        {item.address && (
                                            <Text style={styles.branchAddress}>{item.address}</Text>
                                        )}
                                    </View>
                                    {selectedBranch?.id === item.id && (
                                        <Icon name="check" size={20} color="#FF6B00" />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFF',
        marginTop: 10,
    },
    header: {
        backgroundColor: '#1A1A1A',
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    date: {
        fontSize: 16,
        color: '#FF6B00',
        marginTop: 4,
    },
    branchSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,107,0,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,107,0,0.3)',
        maxWidth: 150,
    },
    branchName: {
        color: '#FF6B00',
        marginHorizontal: 6,
        fontSize: 14,
    },
    stats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    card: {
        backgroundColor: '#1A1A1A',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        backgroundColor: '#FF6B00',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    time: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    duration: {
        color: '#FFF',
        fontSize: 14,
    },
    cardBody: {
        padding: 16,
    },
    workoutName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    coach: {
        color: '#FF6B00',
        marginLeft: 6,
        fontSize: 14,
    },
    room: {
        color: '#666',
        marginLeft: 6,
        fontSize: 12,
    },
    places: {
        marginTop: 10,
    },
    placesText: {
        fontSize: 14,
    },
    placesFree: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    placesTotal: {
        color: '#666',
    },
    placesLabel: {
        color: '#999',
        fontSize: 12,
    },
    bookButton: {
        backgroundColor: '#FF6B00',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    bookButtonDisabled: {
        backgroundColor: '#666',
    },
    bookButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        marginTop: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    branchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    branchItemSelected: {
        backgroundColor: 'rgba(255,107,0,0.1)',
    },
    branchInfo: {
        flex: 1,
        marginLeft: 12,
    },
    branchItemName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    branchAddress: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
});