import * as Location from 'expo-location';

/**
 * Davomat tugmasi bosilgan lahzada qurilma koordinatasini oladi.
 * Fon rejimida kuzatuv qilinmaydi: foydalanuvchi maxfiyligi uchun joylashuv
 * faqat aniq check-in/check-out amali vaqtida ishlatiladi.
 */
export async function getAttendanceLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error("Joylashuv ruxsati berilmadi. Davomat uchun GPS ruxsatini yoqing.");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}
