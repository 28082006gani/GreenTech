const API_BASE = '/api';

export async function searchCities(query = '') {
  try {
    const res = await fetch(`${API_BASE}/cities/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return await res.json();
  } catch (err) {
    console.error('Error searching cities:', err);
    return { results: [] };
  }
}

export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`${API_BASE}/cities/reverse?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Reverse geocode failed');
    return await res.json();
  } catch (err) {
    console.error('Error reverse geocoding:', err);
    return null;
  }
}

export async function getAllCities() {
  try {
    const res = await fetch(`${API_BASE}/cities/all`);
    if (!res.ok) throw new Error('Failed to fetch cities');
    return await res.json();
  } catch (err) {
    console.error('Error fetching all cities:', err);
    return { cities: [] };
  }
}

export async function getForecast({ cityId, city, state, country, lat, lon, population }) {
  try {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId);
    if (city) params.append('city', city);
    if (state) params.append('state', state);
    if (country) params.append('country', country);
    if (lat !== undefined && lon !== undefined) {
      params.append('lat', lat);
      params.append('lon', lon);
    }
    if (population) params.append('population', population);
    const res = await fetch(`${API_BASE}/forecast?${params.toString()}`);
    if (!res.ok) throw new Error('Forecast fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Error fetching forecast:', err);
    throw err;
  }
}

export async function getInversion({ cityId, city, state, country, lat, lon }) {
  try {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId);
    if (city) params.append('city', city);
    if (state) params.append('state', state);
    if (country) params.append('country', country);
    if (lat !== undefined && lon !== undefined) {
      params.append('lat', lat);
      params.append('lon', lon);
    }
    const res = await fetch(`${API_BASE}/inversion?${params.toString()}`);
    if (!res.ok) throw new Error('Inversion fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Error fetching inversion metrics:', err);
    throw err;
  }
}

export async function getFires(hours = 24) {
  try {
    const res = await fetch(`${API_BASE}/fires?hours=${hours}`);
    if (!res.ok) throw new Error('Fires fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Error fetching active fires:', err);
    return { features: [] };
  }
}

export async function getPlume({ cityId, city, lat, lon, country }) {
  try {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId);
    if (city) params.append('city', city);
    if (country) params.append('country', country);
    if (lat !== undefined && lon !== undefined) {
      params.append('lat', lat);
      params.append('lon', lon);
    }
    const res = await fetch(`${API_BASE}/plume?${params.toString()}`);
    if (!res.ok) throw new Error('Plume fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Error fetching plume trajectory:', err);
    return null;
  }
}

export async function getMapStations() {
  try {
    const res = await fetch(`${API_BASE}/map/stations`);
    if (!res.ok) throw new Error('Map stations fetch failed');
    return await res.json();
  } catch (err) {
    console.error('Error fetching map stations:', err);
    return { stations: [] };
  }
}
