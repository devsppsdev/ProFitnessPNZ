// mobile-app/src/screens/AuthScreen.js
import React, { useState } from 'react';
import {
	View, TextInput, Text, Alert,
	TouchableOpacity, StyleSheet,
	KeyboardAvoidingView, Platform,
	Modal, // ← ДОБАВИЛИ
	Animated // ← ДОБАВИЛИ
} from 'react-native';
import { sendSMSCode } from '../services/api';

export default function AuthScreen({ navigation }) {
	const [phone, setPhone] = useState('+7');
	const [loading, setLoading] = useState(false);
	const [codeModalVisible, setCodeModalVisible] = useState(false); // ← состояние модалки
	const [code, setCode] = useState(''); // ← код из SMS
	const [fadeAnim] = useState(new Animated.Value(0)); // анимация

	const handleSendCode = async () => {
		if (!phone || phone.length < 11) {
			Alert.alert('Ошибка', 'Введите корректный номер телефона');
			return;
		}

		setLoading(true);
		try {
			// 1. Отправляем запрос на бэкенд
			const response = await sendSMSCode(phone);

			// 2. Показываем модалку с вводом кода
			setCodeModalVisible(true);

			// 3. Анимация появления
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();

			Alert.alert('📱 Код отправлен', `Введите код 1234 (заглушка)`);

		} catch (error) {
			Alert.alert('❌ Ошибка', error.response?.data?.message || 'Ошибка сервера');
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyCode = () => {
		if (code === '1234') {
			// Закрываем модалку
			setCodeModalVisible(false);
			setCode('');

			// Переходим на ProfileScreen
			navigation.navigate('Profile');
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

	return (
		<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
			<View style={styles.content}>
				{/* Лого/заголовок */}
				<View style={styles.header}>
					<Text style={styles.title}>FITNESS STUDIO</Text>
					<Text style={styles.subtitle}>Добро пожаловать</Text>
				</View>

				{/* Форма ввода */}
				<View style={styles.form}>
					<Text style={styles.label}>НОМЕР ТЕЛЕФОНА</Text>
					<TextInput
						placeholder="+7 (999) 123-45-67"
						value={phone}
						onChangeText={setPhone}
						keyboardType="phone-pad"
						style={styles.input}
						placeholderTextColor="#999"
						editable={!loading}
					/>

					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleSendCode}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? 'ОТПРАВЛЯЕМ...' : 'ПОЛУЧИТЬ КОД'}
						</Text>
					</TouchableOpacity>
				</View>

				{/* Футер */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>
						Нажимая кнопку, вы соглашаетесь с условиями
					</Text>
					<Text style={styles.contactText}>
						Есть вопросы? Звоните: 8-800-XXX-XX-XX
					</Text>
				</View>

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
								<Text style={styles.modalTitle}>Подтверждение</Text>
								<TouchableOpacity onPress={handleCloseModal}>
									<Text style={styles.modalClose}>×</Text>
								</TouchableOpacity>
							</View>

							<Text style={styles.modalText}>
								Введите код из SMS для {phone}
							</Text>

							<Text style={styles.codeHint}>
								🔐 Тестовый код: <Text style={styles.codeHighlight}>1234</Text>
							</Text>

							<TextInput
								style={styles.codeInput}
								value={code}
								onChangeText={setCode}
								keyboardType="number-pad"
								maxLength={4}
								placeholder="0000"
								placeholderTextColor="#666"
								autoFocus={true}
							/>

							<View style={styles.modalButtons}>
								<TouchableOpacity
									style={[styles.modalButton, styles.cancelButton]}
									onPress={handleCloseModal}
								>
									<Text style={styles.cancelButtonText}>Отмена</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.modalButton, styles.verifyButton]}
									onPress={handleVerifyCode}
									disabled={code.length !== 4}
								>
									<Text style={styles.verifyButtonText}>
										{code.length === 4 ? 'ПОДТВЕРДИТЬ' : 'ВВЕДИТЕ 4 ЦИФРЫ'}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</Animated.View>
				</Modal>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0A0A0A',
	},
	content: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 60,
		paddingBottom: 40,
		justifyContent: 'space-between',
	},
	header: {
		alignItems: 'center',
		marginBottom: 50,
	},
	title: {
		fontSize: 32,
		fontWeight: '900',
		color: '#FF6B00',
		letterSpacing: 2,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#FFFFFF',
		opacity: 0.8,
		letterSpacing: 1,
	},
	form: {
		backgroundColor: '#1A1A1A',
		borderRadius: 20,
		padding: 24,
		shadowColor: '#FF6B00',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.1,
		shadowRadius: 20,
		elevation: 10,
	},
	label: {
		fontSize: 12,
		color: '#FF6B00',
		marginBottom: 8,
		fontWeight: '600',
		letterSpacing: 1,
	},
	input: {
		backgroundColor: '#2A2A2A',
		borderRadius: 12,
		paddingHorizontal: 20,
		paddingVertical: 16,
		fontSize: 18,
		color: '#FFFFFF',
		marginBottom: 30,
		borderWidth: 1,
		borderColor: '#333',
	},
	button: {
		backgroundColor: '#FF6B00',
		borderRadius: 12,
		paddingVertical: 18,
		alignItems: 'center',
		shadowColor: '#FF6B00',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	buttonDisabled: {
		backgroundColor: '#FF6B0080',
		opacity: 0.7,
	},
	buttonText: {
		color: '#0A0A0A',
		fontSize: 16,
		fontWeight: '800',
		letterSpacing: 1,
	},
	footer: {
		alignItems: 'center',
	},
	footerText: {
		color: '#666',
		fontSize: 12,
		textAlign: 'center',
		marginBottom: 16,
	},
	contactText: {
		color: '#FF6B00',
		fontSize: 14,
		fontWeight: '600',
	},
	// Стили для модального окна
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContent: {
		backgroundColor: '#1A1A1A',
		borderRadius: 20,
		padding: 24,
		width: '100%',
		maxWidth: 400,
		borderWidth: 2,
		borderColor: '#FF6B00',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: '800',
		color: '#FF6B00',
	},
	modalClose: {
		fontSize: 32,
		color: '#FFF',
		lineHeight: 30,
	},
	modalText: {
		fontSize: 16,
		color: '#FFF',
		marginBottom: 15,
		textAlign: 'center',
	},
	codeHint: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
		marginBottom: 25,
	},
	codeHighlight: {
		color: '#FF6B00',
		fontWeight: 'bold',
		fontSize: 16,
	},
	codeInput: {
		backgroundColor: '#2A2A2A',
		borderRadius: 12,
		paddingHorizontal: 20,
		paddingVertical: 18,
		fontSize: 28,
		color: '#FF6B00',
		textAlign: 'center',
		letterSpacing: 10,
		marginBottom: 25,
		borderWidth: 1,
		borderColor: '#333',
		fontWeight: '800',
	},
	modalButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	modalButton: {
		flex: 1,
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
	},
	cancelButton: {
		backgroundColor: '#333',
	},
	verifyButton: {
		backgroundColor: code => code.length === 4 ? '#FF6B00' : '#666',
	},
	cancelButtonText: {
		color: '#FFF',
		fontSize: 16,
		fontWeight: '600',
	},
	verifyButtonText: {
		color: '#000',
		fontSize: 16,
		fontWeight: '800',
	},
});