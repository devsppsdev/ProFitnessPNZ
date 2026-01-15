// utils/formatters.js
export const formatTime = (time) => {
    if (!time) return '--:--';
    return time.length === 5 ? time : `${time}:00`;
};

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('ru-RU', options);
};