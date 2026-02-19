import type { WeatherData } from '@/types/weather';

const OWM_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function fetchWeatherByCoords(
  lat: number,
  lon: number,
  apiKey: string,
): Promise<WeatherData> {
  const res = await fetch(
    `${OWM_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`,
  );

  if (!res.ok) throw new Error('Failed to fetch weather data');
  const data = await res.json();

  return {
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind.speed * 3.6,
    windDirection: data.wind.deg,
    cloudCover: data.clouds.all,
    description: data.weather[0]?.description || '',
    icon: data.weather[0]?.icon || '01d',
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
  };
}
