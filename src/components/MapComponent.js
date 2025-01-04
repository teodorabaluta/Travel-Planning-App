import React, { useState, useRef, useEffect } from "react";
import {
  GoogleMap,
  Autocomplete,
  Marker,
  useJsApiLoader,
  InfoWindow,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import "./MapComponent.css";

const MapComponent = () => {
  const { groupId } = useParams();
  const [markers, setMarkers] = useState([]);
  const [newLocation, setNewLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 44.4268, lng: 26.1025 });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const autocompleteRef = useRef(null);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyC2RelmO1xwOqOvoBWJOkS0ra1d7Fh89QE",
    libraries: ["places"],
  });

  // Fetch locations from Firestore
  useEffect(() => {
    if (!groupId) {
      alert("Nu există Group ID pentru salvarea locației.");
      console.error("Group ID este lipsă!");
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, `groups/${groupId}/locations`),
      (snapshot) => {
        const fetchedMarkers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMarkers(fetchedMarkers);
      },
      (error) => {
        console.error("Error fetching locations:", error);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // Add a new location to Firestore
  const handleAddLocation = async () => {
    if (!groupId) {
      alert("Nu există Group ID pentru salvarea locației.");
      return;
    }

    if (newLocation) {
      try {
        const docRef = doc(collection(db, `groups/${groupId}/locations`));
        await setDoc(docRef, newLocation);
        setNewLocation(null);
      } catch (error) {
        console.error("Error adding location:", error.message);
        alert(`A apărut o eroare la salvarea locației: ${error.message}`);
      }
    } else {
      console.warn("Nu există locație de adăugat.");
    }
  };

  // Remove a location from Firestore
  const handleRemoveLocation = async (id) => {
    if (!groupId) {
      alert("Nu există Group ID pentru ștergerea locației.");
      return;
    }

    try {
      await deleteDoc(doc(db, `groups/${groupId}/locations`, id));
    } catch (error) {
      console.error("Error removing location:", error);
      alert("A apărut o eroare la ștergerea locației.");
    }
  };

  // Handle place selection
  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        name: place.name || "Locație necunoscută",
      };
      setNewLocation(location);
      setMapCenter(location);
    } else {
      console.error("Locația selectată nu conține geometrie!");
    }
  };

  // Generate route
  const generateRoute = () => {
    if (markers.length < 2) {
      alert("Trebuie să aveți cel puțin două locații pentru a genera un traseu.");
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    const origin = { lat: markers[0].lat, lng: markers[0].lng };
    const destination = { lat: markers[markers.length - 1].lat, lng: markers[markers.length - 1].lng };
    const waypoints = markers.slice(1, -1).map((marker) => ({
      location: { lat: marker.lat, lng: marker.lng },
      stopover: true,
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);

          const route = result.routes[0];
          const totalDistance = route.legs.reduce((acc, leg) => acc + leg.distance.value, 0) / 1000;
          const totalDuration = route.legs.reduce((acc, leg) => acc + leg.duration.value, 0) / 60;

          setDistance(`${totalDistance.toFixed(2)} km`);
          setDuration(`${totalDuration.toFixed(2)} minute`);
        } else {
          alert("Nu s-a putut genera traseul. Vă rugăm să încercați din nou.");
          console.error("Eroare la generarea traseului:", status);
        }
      }
    );
  };

  if (!isLoaded) {
    return <div>Se încarcă harta...</div>;
  }

  return (
    <div className="map-container">
      <div className="search-bar">
        <Autocomplete
          onLoad={(autocomplete) => {
            autocompleteRef.current = autocomplete;
          }}
          onPlaceChanged={handlePlaceChanged}
        >
          <input type="text" placeholder="Caută o locație" />
        </Autocomplete>
        <button onClick={handleAddLocation} disabled={!newLocation}>
          Adaugă locația
        </button>
        <button onClick={generateRoute} disabled={markers.length < 2}>
          Generează traseu
        </button>
      </div>

      {distance && duration && (
        <div className="route-info">
          <p><strong>Distanță totală:</strong> {distance}</p>
          <p><strong>Durată estimată:</strong> {duration}</p>
        </div>
      )}

      <div className="map-and-list">
        <GoogleMap
          mapContainerStyle={{ height: "100vh", width: "80%" }}
          center={mapCenter}
          zoom={15}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setSelectedLocation(marker)}
            />
          ))}
          {directions && <DirectionsRenderer directions={directions} />}
          {selectedLocation && (
            <InfoWindow
              position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
              onCloseClick={() => setSelectedLocation(null)}
            >
              <div>
                <h4>{selectedLocation.name}</h4>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        <div className="location-list">
          <h3>Locații Salvate:</h3>
          <ul>
            {markers.map((marker) => (
              <li key={marker.id} onClick={() => setMapCenter({ lat: marker.lat, lng: marker.lng })}>
                {marker.name}
                <button onClick={() => handleRemoveLocation(marker.id)}>Șterge</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
