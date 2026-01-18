// mobile-app/src/screens/ProgressScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    TextInput,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Icon from '../assets/icons/icon';

export default function ProgressScreen({ navigation, route }) {
    // Логотип для кнопки "Про Фитнес"
    const proFitnessLogo = require('../assets/logo.png');

    // Текущие параметры
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [chest, setChest] = useState('');
    const [waist, setWaist] = useState('');
    const [hips, setHips] = useState('');

    // Предыдущие параметры (моковые данные)
    const [previousData, setPreviousData] = useState(null);

    // Рассчитанные показатели
    const [bmi, setBmi] = useState(null);
    const [bmiCategory, setBmiCategory] = useState('');
    const [advice, setAdvice] = useState('');
    const [progress, setProgress] = useState({});

    // Дни подряд (в реальном приложении загружаем из API)
    const [streakDays, setStreakDays] = useState(15);

    // Загружаем предыдущие данные при монтировании
    useEffect(() => {
        loadPreviousData();
    }, []);

    // Рассчитываем показатели при изменении параметров
    useEffect(() => {
        if (height && weight) {
            calculateBMI();
        }
        if (chest && waist && hips && previousData) {
            calculateDetailedProgress();
        }
    }, [height, weight, chest, waist, hips]);

    const loadPreviousData = () => {
        // Моковые данные - в реальности будет запрос к API
        const mockPreviousData = {
            date: '15.01.2024',
            height: 180,
            weight: 75,
            chest: 95,
            waist: 80,
            hips: 100,
            bmi: 23.1
        };
        setPreviousData(mockPreviousData);
    };

    const calculateBMI = () => {
        const heightInMeters = parseFloat(height) / 100;
        const weightValue = parseFloat(weight);

        if (heightInMeters > 0 && weightValue > 0) {
            const bmiValue = weightValue / (heightInMeters * heightInMeters);
            setBmi(bmiValue.toFixed(1));

            // Определяем категорию ИМТ
            let category = '';
            let recommendation = '';

            if (bmiValue < 18.5) {
                category = 'Недостаточный вес';
                recommendation = 'Рекомендуем силовые тренировки для набора мышечной массы';
            } else if (bmiValue >= 18.5 && bmiValue < 25) {
                category = 'Нормальный вес';
                recommendation = 'Идеальный баланс! Поддерживайте форму смешанными тренировками';
            } else if (bmiValue >= 25 && bmiValue < 30) {
                category = 'Избыточный вес';
                recommendation = 'Рекомендуем кардио тренировки для снижения веса';
            } else {
                category = 'Ожирение';
                recommendation = 'Требуется консультация тренера, начинайте с легкого кардио';
            }

            setBmiCategory(category);
            setAdvice(recommendation);
        }
    };

    const calculateDetailedProgress = () => {
        if (!previousData) return;

        const currentData = {
            height: parseFloat(height) || 0,
            weight: parseFloat(weight) || 0,
            chest: parseFloat(chest) || 0,
            waist: parseFloat(waist) || 0,
            hips: parseFloat(hips) || 0
        };

        const detailedProgress = {};

        ['chest', 'waist', 'hips'].forEach(measurement => {
            const current = currentData[measurement];
            const previous = previousData[measurement];

            if (current > 0 && previous > 0) {
                const change = current - previous;
                const percentChange = ((change / previous) * 100).toFixed(1);

                detailedProgress[measurement] = {
                    current,
                    previous,
                    change: Math.abs(change),
                    percentChange: Math.abs(percentChange),
                    direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable',
                    isPositive: measurement === 'waist' ? change < 0 : change > 0
                };
            } else {
                detailedProgress[measurement] = {
                    current,
                    previous: 0,
                    change: 0,
                    percentChange: 0,
                    direction: 'new',
                    isPositive: true
                };
            }
        });

        setProgress(detailedProgress);
    };

    // ФУНКЦИЯ ДЛЯ РАСЧЕТА БАЛЛОВ
    const calculatePoints = () => {
        const basePoints = 30;
        // Если streakDays > 10, начисляем в 1.5 раза больше
        return streakDays > 10 ? Math.round(basePoints * 1.5) : basePoints;
    };

    // ОБНОВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ
    const handleSave = () => {
        if (!height || !weight || !chest || !waist || !hips) {
            Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
            return;
        }

        // Рассчитываем баллы
        const earnedPoints = calculatePoints();

        // Показываем сообщение о начислении баллов
        Alert.alert(
            'Сохранено!',
            `Ваши показатели успешно сохранены!\n\nВам начислено ${earnedPoints} баллов${streakDays > 10 ? ' (бонус за серию!)' : ''}`,
            [
                {
                    text: 'Отлично!',
                    onPress: () => {
                        // Обновляем предыдущие данные
                        setPreviousData({
                            date: new Date().toLocaleDateString('ru-RU'),
                            height: parseFloat(height),
                            weight: parseFloat(weight),
                            chest: parseFloat(chest),
                            waist: parseFloat(waist),
                            hips: parseFloat(hips),
                            bmi: parseFloat(bmi)
                        });

                        // Переходим обратно в профиль и передаем начисленные баллы
                        navigation.navigate('Profile', {
                            newPoints: earnedPoints
                        });
                    }
                }
            ]
        );
    };

    const handleClear = () => {
        setHeight('');
        setWeight('');
        setChest('');
        setWaist('');
        setHips('');
        setBmi(null);
        setProgress({});
    };

    const renderInputField = (label, value, setValue, unit, iconName) => (
        <View style={styles.inputField}>
            <View style={styles.inputLabelRow}>
                <Icon name={iconName} size={18} color="#DB6A50" />
                <Text style={styles.inputLabel}>{label}</Text>
            </View>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={setValue}
                    keyboardType="numeric"
                    placeholder={`Введите ${label.toLowerCase()}`}
                    placeholderTextColor="rgba(239, 235, 220, 0.3)"
                    maxLength={3}
                />
                <View style={styles.unitBadge}>
                    <Text style={styles.unitText}>{unit}</Text>
                </View>
            </View>
        </View>
    );

    const renderProgressItem = (measurement, label) => {
        const data = progress[measurement];
        if (!data) return null;

        return (
            <View style={styles.progressItem}>
                <View style={styles.progressItemLeft}>
                    <View style={styles.progressIconContainer}>
                        <Icon
                            name={measurement === 'chest' ? 'chest' : measurement === 'waist' ? 'waist' : 'hips'}
                            size={20}
                            color={data.isPositive ? '#4CAF50' : '#F44336'}
                        />
                    </View>
                    <View>
                        <Text style={styles.progressItemLabel}>{label}</Text>
                        <Text style={styles.progressItemValue}>{data.current} см</Text>
                        {data.previous > 0 && (
                            <Text style={styles.progressItemPrevious}>
                                Было: {data.previous} см
                            </Text>
                        )}
                    </View>
                </View>

                {data.direction !== 'new' && (
                    <View style={[
                        styles.progressChangeBadge,
                        { backgroundColor: data.isPositive ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)' }
                    ]}>
                        <Icon
                            name={data.isPositive ? 'arrow_up' : 'arrow_down'}
                            size={14}
                            color={data.isPositive ? '#4CAF50' : '#F44336'}
                        />
                        <Text style={[
                            styles.progressChangeText,
                            { color: data.isPositive ? '#4CAF50' : '#F44336' }
                        ]}>
                            {data.change} см ({data.percentChange}%)
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Заголовок */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Мои показатели</Text>
                        <Text style={styles.subtitle}>Отслеживайте свой прогресс</Text>
                    </View>

                    {/* Форма ввода параметров */}
                    <View style={styles.formSection}>
                        <View style={styles.sectionHeader}>
                            <Icon name="ruler" size={24} color="#DB6A50" />
                            <Text style={styles.sectionTitle}>Введите параметры</Text>
                        </View>

                        <View style={styles.inputsContainer}>
                            {renderInputField('Рост', height, setHeight, 'см', 'height')}
                            {renderInputField('Вес', weight, setWeight, 'кг', 'weight')}
                            {renderInputField('Обхват груди', chest, setChest, 'см', 'chest')}
                            {renderInputField('Обхват талии', waist, setWaist, 'см', 'waist')}
                            {renderInputField('Обхват бедер', hips, setHips, 'см', 'hips')}
                        </View>

                        <View style={styles.formButtons}>
                            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                                <Icon name="clear" size={18} color="#E1A6AD" />
                                <Text style={styles.clearButtonText}>Очистить</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Icon name="save" size={20} color="#000" />
                                <Text style={styles.saveButtonText}>СОХРАНИТЬ</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Результаты расчетов */}
                    {bmi && (
                        <View style={styles.resultsSection}>
                            <View style={styles.sectionHeader}>
                                <Icon name="calculator" size={24} color="#DB6A50" />
                                <Text style={styles.sectionTitle}>Результаты</Text>
                            </View>

                            {/* ИМТ */}
                            <View style={styles.bmiCard}>
                                <View style={styles.bmiHeader}>
                                    <Text style={styles.bmiTitle}>Индекс массы тела (ИМТ)</Text>
                                    <View style={styles.bmiValueContainer}>
                                        <Text style={styles.bmiValue}>{bmi}</Text>
                                        <Text style={styles.bmiUnit}>кг/м²</Text>
                                    </View>
                                </View>
                                <View style={[
                                    styles.bmiCategoryBadge,
                                    {
                                        backgroundColor:
                                            bmiCategory === 'Нормальный вес' ? 'rgba(76, 175, 80, 0.15)' :
                                                bmiCategory === 'Недостаточный вес' ? 'rgba(255, 193, 7, 0.15)' :
                                                    bmiCategory === 'Избыточный вес' ? 'rgba(255, 152, 0, 0.15)' :
                                                        'rgba(244, 67, 54, 0.15)'
                                    }
                                ]}>
                                    <Text style={[
                                        styles.bmiCategory,
                                        {
                                            color:
                                                bmiCategory === 'Нормальный вес' ? '#4CAF50' :
                                                    bmiCategory === 'Недостаточный вес' ? '#FFC107' :
                                                        bmiCategory === 'Избыточный вес' ? '#FF9800' :
                                                            '#F44336'
                                        }
                                    ]}>
                                        {bmiCategory}
                                    </Text>
                                </View>
                                <Text style={styles.bmiAdvice}>{advice}</Text>
                            </View>

                            {/* Прогресс */}
                            {Object.keys(progress).length > 0 && (
                                <View style={styles.progressCard}>
                                    <View style={styles.progressHeader}>
                                        <Text style={styles.progressTitle}>Изменения</Text>
                                        {previousData && (
                                            <Text style={styles.progressDate}>
                                                Сравнение с {previousData.date}
                                            </Text>
                                        )}
                                    </View>

                                    <View style={styles.progressItems}>
                                        {renderProgressItem('chest', 'Грудь')}
                                        {renderProgressItem('waist', 'Талия')}
                                        {renderProgressItem('hips', 'Бедра')}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Советы по тренировкам */}
                    {bmi && (
                        <View style={styles.adviceSection}>
                            <View style={styles.sectionHeader}>
                                <Icon name="advice" size={24} color="#DB6A50" />
                                <Text style={styles.sectionTitle}>Рекомендации</Text>
                            </View>

                            <View style={styles.adviceCards}>
                                <View style={styles.adviceCard}>
                                    <Icon name="dumbbell" size={24} color="#DB6A50" />
                                    <Text style={styles.adviceCardTitle}>
                                        {bmiCategory === 'Недостаточный вес' ? 'Силовые тренировки' :
                                            bmiCategory === 'Нормальный вес' ? 'Смешанные тренировки' :
                                                bmiCategory === 'Избыточный вес' ? 'Кардио тренировки' :
                                                    'Консультация тренера'}
                                    </Text>
                                    <Text style={styles.adviceCardText}>
                                        {bmiCategory === 'Недостаточный вес' ? '3-4 раза в неделю, фокус на базовые упражнения' :
                                            bmiCategory === 'Нормальный вес' ? '2 дня силовых + 2 дня кардио в неделю' :
                                                bmiCategory === 'Избыточный вес' ? '4-5 раз в неделю, интервальные тренировки' :
                                                    'Начните с легкого кардио, проконсультируйтесь с тренером'}
                                    </Text>
                                </View>

                                <View style={styles.adviceCard}>
                                    <Icon name="nutrition" size={24} color="#E1A6AD" />
                                    <Text style={styles.adviceCardTitle}>Питание</Text>
                                    <Text style={styles.adviceCardText}>
                                        {bmiCategory === 'Недостаточный вес' ? 'Профицит калорий +1.5г белка на кг веса' :
                                            bmiCategory === 'Нормальный вес' ? 'Баланс БЖУ, поддерживающая калорийность' :
                                                bmiCategory === 'Избыточный вес' ? 'Дефицит 300-500 ккал, 1.2г белка на кг' :
                                                    'Контроль порций, снижение простых углеводов'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

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

                        {/* Расписание */}
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate('Schedule')}
                        >
                            <Icon name="calendar" size={24} color="#FFF" />
                            <Text style={styles.navButtonText}>Расписание</Text>
                        </TouchableOpacity>

                        {/* Показатели (АКТИВНЫЙ) */}
                        <TouchableOpacity style={styles.navButton}>
                            <Icon name="stats" size={26} color="#000" style={styles.activeIcon} />
                            <Text style={[styles.navButtonText, styles.navButtonActive]}>Показатели</Text>
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#EFEBDC',
        letterSpacing: -0.5,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#E1A6AD',
        opacity: 0.9,
        textAlign: 'center',
    },
    formSection: {
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#EFEBDC',
        letterSpacing: -0.3,
    },
    inputsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    inputField: {
        marginBottom: 4,
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 15,
        color: '#E1A6AD',
        fontWeight: '600',
        opacity: 0.9,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(35, 44, 63, 0.8)',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(225, 166, 173, 0.2)',
        overflow: 'hidden',
        height: 56,
    },
    input: {
        flex: 1,
        paddingHorizontal: 20,
        fontSize: 18,
        color: '#EFEBDC',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    unitBadge: {
        backgroundColor: 'rgba(219, 106, 80, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 18,
        height: '100%',
        justifyContent: 'center',
    },
    unitText: {
        fontSize: 16,
        color: '#DB6A50',
        fontWeight: '600',
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    clearButton: {
        flex: 1.6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(225, 166, 173, 0.1)',
        borderRadius: 14,
        paddingVertical: 18,
        gap: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(225, 166, 173, 0.2)',
    },
    clearButtonText: {
        color: '#E1A6AD',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DB6A50',
        borderRadius: 10,
        paddingVertical: 14,
        gap: 6,
        shadowColor: '#DB6A50',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    resultsSection: {
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    bmiCard: {
        backgroundColor: 'rgba(26, 36, 56, 0.8)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(44, 55, 79, 0.5)',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    bmiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    bmiTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#EFEBDC',
        flex: 1,
    },
    bmiValueContainer: {
        alignItems: 'flex-end',
    },
    bmiValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#DB6A50',
    },
    bmiUnit: {
        fontSize: 12,
        color: '#E1A6AD',
        opacity: 0.8,
        marginTop: 2,
    },
    bmiCategoryBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    bmiCategory: {
        fontSize: 15,
        fontWeight: '600',
    },
    bmiAdvice: {
        fontSize: 14,
        color: '#E1A6AD',
        lineHeight: 20,
        opacity: 0.9,
    },
    progressCard: {
        backgroundColor: 'rgba(26, 36, 56, 0.8)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(44, 55, 79, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    progressHeader: {
        marginBottom: 20,
    },
    progressTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#EFEBDC',
        marginBottom: 4,
    },
    progressDate: {
        fontSize: 13,
        color: '#E1A6AD',
        opacity: 0.7,
    },
    progressItems: {
        gap: 16,
    },
    progressItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(44, 55, 79, 0.3)',
    },
    progressItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    progressIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressItemLabel: {
        fontSize: 14,
        color: '#E1A6AD',
        opacity: 0.8,
        marginBottom: 2,
    },
    progressItemValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#EFEBDC',
    },
    progressItemPrevious: {
        fontSize: 12,
        color: '#E1A6AD',
        opacity: 0.6,
        marginTop: 2,
    },
    progressChangeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    progressChangeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    adviceSection: {
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    adviceCards: {
        gap: 16,
    },
    adviceCard: {
        backgroundColor: 'rgba(26, 36, 56, 0.8)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(44, 55, 79, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    adviceCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#DB6A50',
        marginTop: 12,
        marginBottom: 8,
    },
    adviceCardText: {
        fontSize: 14,
        color: '#EFEBDC',
        lineHeight: 20,
        opacity: 0.9,
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