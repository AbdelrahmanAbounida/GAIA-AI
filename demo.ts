// TODO:: remove this fil

/**
 * demo tool 
 * 
 * 
 * async function getWeather({city}:{city: string}) {
  // Step 1: Get coordinates from city name
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geoResponse = await fetch(geoUrl);
  
  if (!geoResponse.ok) {
    throw new Error(`Geocoding API error: ${geoResponse.status}`);
  }
  
  const geoData = await geoResponse.json();
  
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`City not found: ${city}`);
  }
  
  const { latitude, longitude } = geoData.results[0];
  
  // Step 2: Get weather data
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  const weatherResponse = await fetch(weatherUrl);
  
  if (!weatherResponse.ok) {
    throw new Error(`Weather API error: ${weatherResponse.status}`);
  }
  
  return await weatherResponse.json();
}
 */
