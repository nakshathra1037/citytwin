import React, { createContext, useContext, useState, useEffect } from 'react';
import { cityService } from '../services/cityService';

const CityContext = createContext(null);

export const CityProvider = ({ children }) => {
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('coimbatore');
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const data = await cityService.getCities();
        setCities(data);
        const initial = data.find(c => c.id === selectedCityId) || data[0];
        if (initial) {
          setSelectedCity(initial);
          setSelectedCityId(initial.id);
        }
      } catch (err) {
        console.error('Failed to load cities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, []);

  const changeCity = (cityId) => {
    setSelectedCityId(cityId);
    const found = cities.find(c => c.id === cityId);
    if (found) {
      setSelectedCity(found);
    }
  };

  return (
    <CityContext.Provider value={{ cities, selectedCityId, selectedCity, changeCity, loading }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => useContext(CityContext);
