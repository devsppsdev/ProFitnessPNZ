// mobile-app/src/screens/AuthScreen.js
import React, { useState, useEffect } from 'react';
import {
	View, TextInput, Text, Alert,
	TouchableOpacity, StyleSheet,
	KeyboardAvoidingView, Platform,
	Modal,
	Animated,
	StatusBar,
	SafeAreaView,
	ScrollView,
	Dimensions,
	Image,
	BackHandler
} from 'react-native';
// import { sendSMSCode } from '../services/api';
import Icon from '../assets/icons/icon';

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
	const [phone, setPhone] = useState('+7');
	const [loading, setLoading] = useState(false);
	const [codeModalVisible, setCodeModalVisible] = useState(false);
	const [code, setCode] = useState('');
	const [fadeAnim] = useState(new Animated.Value(0));

	// Блокируем кнопку "назад" на Android
	useEffect(() => {
		const backHandler = BackHandler.addEventListener(
			'hardwareBackPress',
			() => {
				// Не даем вернуться назад
				return true;
			}
		);

		return () => backHandler.remove();
	}, []);

	// Отключаем жесты навигации
	useEffect(() => {
		navigation.setOptions({
			gestureEnabled: false, // Отключаем свайпы
		});
	}, [navigation]);

	const handleSendCode = async () => {
		if (!phone || phone.length < 11) {
			Alert.alert('Ошибка', 'Введите корректный номер телефона');
			return;
		}

		setLoading(true);
		try {
			console.log('Отправка кода на номер:', phone);

			setCodeModalVisible(true);

			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();

		} catch (error) {
			Alert.alert('❌ Ошибка', error.message || 'Ошибка сервера');
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyCode = () => {
		if (code === '1234') {
			setCodeModalVisible(false);
			setCode('');

			// Важное изменение: заменяем стек навигации
			navigation.reset({
				index: 0,
				routes: [{ name: 'Profile' }],
			});
		} else {
			Alert.alert('❌ Неверный код', 'Попробуйте снова');
		}
	};

	const handleCloseModal = () => {
		Animated.timing(fadeAnim, {
			toValue: 0,
			duration: 200,
			useNativeDriver: true,
		}).start(() => {
			setCodeModalVisible(false);
			setCode('');
		});
	};

	// Обработчик ввода кода - БЕЗ авто-проверки
	const handleCodeChange = (text) => {
		setCode(text);
		// Убрал авто-проверку
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="light-content" backgroundColor="#000" />

			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				{/* Геометрический фон с лого */}
				<View style={styles.geometricBackground}>
					{/* Логотип в центре фона */}
					<View style={styles.logoContainer}>
						<Image
							source={require('../assets/logo.png')} // ЛОКАЛЬНЫЙ ФАЙЛ
							// ИЛИ если URL: source={{ uri: LOGO_URI }}
							style={styles.logo}
							resizeMode="contain"
						/>
					</View>

					{/* Геометрические элементы */}
					<View style={[styles.geometricShape, styles.shape1]} />
					<View style={[styles.geometricShape, styles.shape2]} />
					<View style={[styles.geometricShape, styles.shape3]} />
					<View style={[styles.geometricShape, styles.shape4]} />
					<View style={[styles.geometricShape, styles.shape5]} />
				</View>

				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					{/* Лого/заголовок */}
					<View style={styles.header}>
						{/* Маленькое лого в заголовке */}
						<View style={styles.headerLogoContainer}>
							<Image
								source={require('../assets/logo.png')} // ЛОКАЛЬНЫЙ ФАЙЛ
								// ИЛИ если URL: source={{ uri: LOGO_URI }}
								style={styles.headerLogo}
								resizeMode="contain"
							/>
						</View>
						<Text style={styles.title}>Про Фитнес</Text>
						<Text style={styles.subtitle}>Добро пожаловать</Text>
						<View style={styles.divider} />
					</View>

					{/* Форма ввода */}
					<View style={styles.form}>
						<View style={styles.labelContainer}>
							<Icon name="profile" size={20} color="#DB6A50" />
							<Text style={styles.label}>НОМЕР ТЕЛЕФОНА</Text>
						</View>

						<View style={styles.inputContainer}>
							<Icon name="profile" size={22} color="#E1A6AD" style={styles.inputIcon} />
							<TextInput
								placeholder="+7 (999) 123-45-67"
								value={phone}
								onChangeText={setPhone}
								keyboardType="phone-pad"
								style={styles.input}
								placeholderTextColor="rgba(239, 235, 220, 0.4)"
								editable={!loading}
							/>
						</View>

						<TouchableOpacity
							style={[styles.button, loading && styles.buttonDisabled]}
							onPress={handleSendCode}
							disabled={loading}
						>
							<Icon name="extend" size={22} color="#000" />
							<Text style={styles.buttonText}>
								{loading ? 'ОТПРАВЛЯЕМ...' : 'ПОЛУЧИТЬ КОД'}
							</Text>
						</TouchableOpacity>

						<Text style={styles.hint}>
							Тестовый код: <Text style={styles.hintHighlight}>1234</Text>
						</Text>
					</View>

					{/* Футер с лого */}
					<View style={styles.footer}>
						{/*<View style={styles.footerLogo}>
							<Image
								source={require('../assets/logo.png')} // ЛОКАЛЬНЫЙ ФАЙЛ
								// ИЛИ если URL: source={{ uri: LOGO_URI }}
								style={styles.footerLogoImage}
								resizeMode="contain"
							/>
						</View>*/}
						<Text style={styles.footerText}>
							Нажимая кнопку, вы соглашаетесь с условиями
						</Text>
						<Text style={styles.contactText}>
							Есть вопросы? Звоните: 8-800-XXX-XX-XX
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* МОДАЛЬНОЕ ОКНО ДЛЯ КОДА */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={codeModalVisible}
				onRequestClose={handleCloseModal}
			>
				<Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<View style={styles.modalLogo}>

							</View>
						</View>

						<Text style={styles.modalText}>
							Введите код из SMS для
						</Text>
						<Text style={styles.modalPhone}>{phone}</Text>

						{/* Выровненные цифры кода */}
						<View style={styles.codeContainer}>
							{[0, 1, 2, 3].map((index) => (
								<View key={index} style={styles.codeDigitContainer}>
									<Text style={[
										styles.codeDigit,
										code.length > index && styles.codeDigitFilled
									]}>
										{code[index] || ''}
									</Text>
									<View style={[
										styles.codeDigitLine,
										code.length > index && styles.codeDigitLineActive
									]} />
								</View>
							))}
						</View>

						{/* Скрытый инпут для клавиатуры */}
						<TextInput
							style={styles.hiddenInput}
							value={code}
							onChangeText={handleCodeChange}
							keyboardType="number-pad"
							maxLength={4}
							autoFocus={true}
						/>

						<Text style={[
							styles.codeHint,
							code.length === 4 && styles.codeHintReady
						]}>
							{code.length === 4 ? 'Введите 4 цифры из SMS' : 'Введите 4 цифры из SMS'}
						</Text>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.modalButton, styles.cancelButton]}
								onPress={handleCloseModal}
							>
								<Text style={styles.cancelButtonText}>Отмена</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.modalButton, styles.verifyButton, code.length !== 4 && styles.verifyButtonDisabled]}
								onPress={handleVerifyCode}
								disabled={code.length !== 4}
							>
								<Text style={styles.verifyButtonText}>
									{code.length === 4 ? 'Подтвердить' : 'Подтвердить'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Animated.View>
			</Modal>
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
	// Геометрический фон с лого
	geometricBackground: {
		position: 'absolute',
		width: width,
		height: height,
		opacity: 0.8,
	},
	logoContainer: {
		position: 'absolute',
		top: '20%',
		left: 0,
		right: 0,
		alignItems: 'center',
		opacity: 0.15, // Очень прозрачное лого как текстура фона
	},
	logo: {
		width: 300, // Размер для фона
		height: 300,
		opacity: 0.7,
	},
	geometricShape: {
		position: 'absolute',
		backgroundColor: 'rgba(219, 106, 80, 0.03)',
		borderWidth: 1,
	},
	shape1: {
		top: '10%',
		right: '10%',
		width: 120,
		height: 120,
		borderRadius: 60,
		borderColor: 'rgba(219, 106, 80, 0.08)',
		transform: [{ rotate: '45deg' }],
	},
	shape2: {
		bottom: '20%',
		left: '5%',
		width: 80,
		height: 80,
		borderRadius: 40,
		borderColor: 'rgba(225, 166, 173, 0.06)',
	},
	shape3: {
		top: '40%',
		right: '20%',
		width: 60,
		height: 60,
		borderColor: 'rgba(239, 235, 220, 0.04)',
		transform: [{ rotate: '15deg' }],
	},
	shape4: {
		bottom: '40%',
		left: '15%',
		width: 100,
		height: 50,
		borderRadius: 25,
		borderColor: 'rgba(219, 106, 80, 0.05)',
		transform: [{ rotate: '-15deg' }],
	},
	shape5: {
		top: '15%',
		left: '10%',
		width: 70,
		height: 70,
		borderRadius: 35,
		borderColor: 'rgba(225, 166, 173, 0.04)',
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 28,
		paddingTop: height * 0.12,
		paddingBottom: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	header: {
		alignItems: 'center',
		marginBottom: 40,
		width: '100%',
	},
	headerLogoContainer: {
		marginBottom: 20,
	},
	headerLogo: {
		width: 80, // Маленький размер для заголовка
		height: 80,
		tintColor: '#EFEBDC', // Можно убрать tintColor если лого цветное
		opacity: 0.9,
	},
	title: {
		fontSize: 36,
		fontWeight: '800',
		color: '#EFEBDC',
		letterSpacing: 1.2,
		marginBottom: 8,
		textAlign: 'center',
		textShadowColor: 'rgba(219, 106, 80, 0.3)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 6,
	},
	subtitle: {
		fontSize: 16,
		color: '#E1A6AD',
		opacity: 0.9,
		letterSpacing: 0.6,
		marginBottom: 20,
		textAlign: 'center',
	},
	divider: {
		width: 60,
		height: 2,
		backgroundColor: '#DB6A50',
		borderRadius: 1,
	},
	form: {
		backgroundColor: 'rgba(20, 20, 20, 0.85)',
		borderRadius: 24,
		padding: 28,
		borderWidth: 1.5,
		borderColor: 'rgba(219, 106, 80, 0.2)',
		width: '100%',
		shadowColor: '#DB6A50',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.2,
		shadowRadius: 16,
		elevation: 10,
		marginBottom: 30,
	},
	labelContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 16,
	},
	label: {
		fontSize: 13,
		color: '#DB6A50',
		fontWeight: '700',
		letterSpacing: 1,
		textTransform: 'uppercase',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(35, 44, 63, 0.6)',
		borderRadius: 14,
		borderWidth: 1.5,
		borderColor: 'rgba(225, 166, 173, 0.15)',
		marginBottom: 25,
		overflow: 'hidden',
	},
	inputIcon: {
		paddingHorizontal: 16,
	},
	input: {
		flex: 1,
		paddingVertical: 18,
		fontSize: 17,
		color: '#EFEBDC',
		fontWeight: '500',
		letterSpacing: 0.5,
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#DB6A50',
		borderRadius: 14,
		paddingVertical: 18,
		gap: 12,
		shadowColor: '#DB6A50',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.4,
		shadowRadius: 10,
		elevation: 8,
		marginBottom: 20,
	},
	buttonDisabled: {
		backgroundColor: 'rgba(219, 106, 80, 0.5)',
		opacity: 0.7,
	},
	buttonText: {
		color: '#000',
		fontSize: 16,
		fontWeight: '800',
		letterSpacing: 0.6,
	},
	hint: {
		color: '#E1A6AD',
		fontSize: 13,
		textAlign: 'center',
		opacity: 0.9,
		fontWeight: '500',
	},
	hintHighlight: {
		color: '#DB6A50',
		fontWeight: '700',
		fontSize: 14,
	},
	footer: {
		alignItems: 'center',
		marginTop: 10,
	},
	footerLogo: {
		marginBottom: 15,
	},
	footerLogoImage: {
		width: 50,
		height: 50,
		tintColor: '#E1A6AD',
		opacity: 0.8,
	},
	footerText: {
		color: 'rgba(239, 235, 220, 0.5)',
		fontSize: 11,
		textAlign: 'center',
		marginBottom: 12,
		lineHeight: 16,
		maxWidth: 300,
	},
	contactText: {
		color: '#E1A6AD',
		fontSize: 13,
		fontWeight: '600',
	},
	// Стили для модального окна
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.97)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	modalContent: {
		backgroundColor: 'rgba(20, 20, 20, 0.95)',
		borderRadius: 28,
		padding: 32,
		width: '100%',
		maxWidth: 420,
		borderWidth: 2,
		borderColor: '#DB6A50',
		shadowColor: '#DB6A50',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 20,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 28,
		position: 'relative',
	},
	modalLogo: {
		position: 'absolute',
		left: 0,
	},
	modalLogoImage: {
		width: 40,
		height: 40,
		tintColor: '#DB6A50',
	},
	modalTitle: {
		flex: 1,
		fontSize: 24,
		fontWeight: '800',
		color: '#EFEBDC',
		textAlign: 'center',
	},
	modalClose: {
		position: 'absolute',
		right: 0,
		padding: 6,
	},
	modalText: {
		fontSize: 25,
		color: '#E1A6AD',
		textAlign: 'center',
		marginBottom: 2,
		fontWeight: '500',
	},
	modalPhone: {
		fontSize: 20,
		color: '#DB6A50',
		textAlign: 'center',
		fontWeight: '700',
		marginBottom: 40,
		letterSpacing: 0.5,
	},
	// Выровненные цифры кода
	codeContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 40,
		paddingHorizontal: 20,
	},
	codeDigitContainer: {
		alignItems: 'center',
		width: 70,
	},
	codeDigit: {
		fontSize: 44,
		color: 'rgba(239, 235, 220, 0.2)',
		fontWeight: '800',
		height: 60,
		width: 60,
		textAlign: 'center',
		lineHeight: 60,
		marginBottom: 12,
	},
	codeDigitFilled: {
		color: '#DB6A50',
		textShadowColor: 'rgba(219, 106, 80, 0.4)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 6,
	},
	codeDigitLine: {
		width: '100%',
		height: 3,
		backgroundColor: 'rgba(239, 235, 220, 0.15)',
		borderRadius: 2,
	},
	codeDigitLineActive: {
		backgroundColor: '#DB6A50',
	},
	hiddenInput: {
		position: 'absolute',
		width: 1,
		height: 1,
		opacity: 0,
	},
	codeHint: {
		color: 'rgba(225, 166, 173, 0.7)',
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 28,
		fontWeight: '500',
	},
	codeHintReady: {
		color: '#4CAF50',
	},
	modalButtons: {
		flexDirection: 'row',
		gap: 16,
	},
	modalButton: {
		flex: 1,
		borderRadius: 14,
		paddingVertical: 18,
		alignItems: 'center',
	},
	cancelButton: {
		backgroundColor: 'rgba(35, 44, 63, 0.8)',
		borderWidth: 1.5,
		borderColor: 'rgba(225, 166, 173, 0.2)',
	},
	verifyButton: {
		backgroundColor: '#DB6A50',
	},
	verifyButtonDisabled: {
		backgroundColor: 'rgba(219, 106, 80, 0.3)',
		opacity: 0.6,
	},
	cancelButtonText: {
		color: '#E1A6AD',
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 0.5,
	},
	verifyButtonText: {
		color: '#000',
		fontSize: 16,
		fontWeight: '800',
		letterSpacing: 0.8,
	},
});