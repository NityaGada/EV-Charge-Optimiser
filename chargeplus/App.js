import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps'; // Import Polyline
import axios from 'axios';

const MapScreen = () => {
  const [chargingStations, setChargingStations] = useState([]);
  const [region, setRegion] = useState({
    latitude: 20.5937, // Default location (e.g., New Delhi, India)
    longitude: 78.9629,
    latitudeDelta: 10,
    longitudeDelta: 10,
  });

  const [selectedStation, setSelectedStation] = useState(null);
  const [carRange] = useState(500); // Car's range in kilometers

  useEffect(() => {
    // Fetch charging station data using your API key
    const apiKey = '9b15606a-fcb3-4ec8-86c7-1b3fba02234b';
    axios
      .get(`https://api.openchargemap.io/v3/poi`, {
        params: {
          output: 'json',
          countrycode: 'IN',
          maxresults: 100, // Adjust the number of results as needed
          key: apiKey,
        },
      })
      .then((response) => {
        setChargingStations(response.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 403) {
          console.error('API Key is invalid or lacks permissions.');
        } else {
          console.error('An error occurred:', error);
        }
      });
  }, []);

  const startLocation = { latitude: 19.0760, longitude: 72.8777 };
  const destinationLocation = { latitude: 24.5926, longitude: 72.7156 };
  const findChargingStationsAlongRoute = () => {
    const stationsAlongRoute = chargingStations.filter((station) => {
      const stationLocation = {
        latitude: station.AddressInfo.Latitude,
        longitude: station.AddressInfo.Longitude,
      };

      const distanceToStart = calculateDistance(stationLocation, startLocation);
      const distanceToDestination = calculateDistance(stationLocation, destinationLocation);

      return distanceToStart <= carRange && distanceToDestination <= carRange;
    });

    return stationsAlongRoute;
  };

  const stationsAlongRoute = findChargingStationsAlongRoute();

  const routeCoordinates = [
    startLocation,
    ...stationsAlongRoute.map((station) => ({
      latitude: station.AddressInfo.Latitude,
      longitude: station.AddressInfo.Longitude,
    })),
    destinationLocation,
  ];
  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }} region={region}>
      <Polyline
          coordinates={routeCoordinates}
          strokeWidth={4}
          strokeColor="blue"
        />
        
        {chargingStations.map((station) => (
          <Marker
            key={station.ID}
            coordinate={{
              latitude: station.AddressInfo.Latitude,
              longitude: station.AddressInfo.Longitude,
            }}
            pinColor={station.StatusType.IsOperational ? 'green' : 'red'}
            onPress={() => setSelectedStation(station)}
          >
            <Callout>
              <View>
                <Text style={{ fontWeight: 'bold' }}>{station.AddressInfo.Title}</Text>
                <Text>Location: {station.AddressInfo.AddressLine1}</Text>
                <Text>Operational: {station.StatusType.IsOperational ? 'Yes' : 'No'}</Text>
                <Text>Number of Points: {station.NumberOfPoints}</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {findChargingStationsAlongRoute().map((station) => (
          <Marker
            key={station.ID}
            coordinate={{
              latitude: station.AddressInfo.Latitude,
              longitude: station.AddressInfo.Longitude,
            }}
            pinColor="blue" // Customize the color for stations along the route
            onPress={() => setSelectedStation(station)}
          >
            <Callout>
              <View>
                <Text style={{ fontWeight: 'bold' }}>{station.AddressInfo.Title}</Text>
                <Text>Location: {station.AddressInfo.AddressLine1}</Text>
                <Text>Operational: {station.StatusType.IsOperational ? 'Yes' : 'No'}</Text>
                <Text>Number of Points: {station.NumberOfPoints}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      {selectedStation && (
        <View style={styles.calloutContainer}>
          <View>
            <Text style={{ fontWeight: 'bold' }}>{selectedStation.AddressInfo.Title}</Text>
            <Text>Location: {selectedStation.AddressInfo.AddressLine1}</Text>
            <Text>Operational: {selectedStation.StatusType.IsOperational ? 'Yes' : 'No'}</Text>
            <Text>Number of Points: {selectedStation.NumberOfPoints}</Text>
          </View>
          <TouchableOpacity
            style={styles.calloutButton}
            onPress={() => setSelectedStation(null)}
          >
            <Text style={styles.calloutButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const calculateDistance = (location1, location2) => {
  const { latitude: lat1, longitude: lon1 } = location1;
  const { latitude: lat2, longitude: lon2 } = location2;

  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in kilometers
  return distance;
};


const styles = StyleSheet.create({
  calloutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calloutButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  calloutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MapScreen;