import React, { useState, useRef, useEffect } from "react";
import {
  GoogleMap,
  Autocomplete,
  Marker,
  useJsApiLoader,
  InfoWindow,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useParams } from "react-router-dom";
import "./MapComponent.css";

const MapComponent = () => {
  // Declare hooks here at the top of the functional component
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [newLocation, setNewLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 44.4268, lng: 26.1025 });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const autocompleteRef = useRef(null);

  // Toggle chat functionality
  const toggleChat = () => {
    setIsChatMinimized(!isChatMinimized);
  };

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyC2RelmO1xwOqOvoBWJOkS0ra1d7Fh89QE", // Replace with your API key
    libraries: ["places"],
  });

  const { groupId } = useParams();

  // Check if the user is the organizer
  useEffect(() => {
    if (!groupId) {
      console.error("No groupId found!");
      return;
    }

    const checkIfOrganizer = async () => {
      try {
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);

        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          const currentUserEmail = auth.currentUser?.email;

          // Check if the user is the creator
          if (groupData.creator === currentUserEmail) {
            setIsOrganizer(true);
          } else {
            setIsOrganizer(false);
          }
        } else {
          console.error("Group document does not exist!");
        }
      } catch (error) {
        console.error("Error checking if user is organizer:", error);
      }
    };

    checkIfOrganizer();
  }, [groupId]);

  // Detect user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not access your location.");
        },
        { enableHighAccuracy: true }
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error updating location:", error);
        },
        { enableHighAccuracy: true }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }, []);

  // Fetch locations from Firestore
  useEffect(() => {
    if (!groupId) {
      console.error("No group ID for saving location.");
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

  // Add a new location
  const handleAddLocation = async () => {
    if (!groupId) {
      console.error("No group ID for saving location.");
      return;
    }

    if (newLocation) {
      try {
        const docRef = doc(collection(db, `groups/${groupId}/locations`));
        await setDoc(docRef, newLocation);
        setNewLocation(null);
      } catch (error) {
        console.error("Error adding location:", error);
        alert(`Error saving location: ${error.message}`);
      }
    } else {
      console.warn("No location to add.");
    }
  };

  // Remove a location
  const handleRemoveLocation = async (id) => {
    if (!groupId) {
      console.error("No group ID for deleting location.");
      return;
    }

    try {
      await deleteDoc(doc(db, `groups/${groupId}/locations`, id));
    } catch (error) {
      console.error("Error removing location:", error);
      alert("Error deleting location.");
    }
  };

  // Handle place changed
  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        name: place.name || "Unknown location",
      };
      setNewLocation(location);
      setMapCenter(location);
    } else {
      console.error("Selected place has no geometry!");
    }
  };

  // Generate route
  const generateRoute = () => {
    if (markers.length < 2) {
      alert("You need at least two locations to generate a route.");
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    const origin = { lat: markers[0].lat, lng: markers[0].lng };
    const destination = {
      lat: markers[markers.length - 1].lat,
      lng: markers[markers.length - 1].lng,
    };
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
          const totalDistance = route.legs.reduce(
            (acc, leg) => acc + leg.distance.value,
            0
          );
          const totalDuration = route.legs.reduce(
            (acc, leg) => acc + leg.duration.value,
            0
          );

          setDistance(`${(totalDistance / 1000).toFixed(2)} km`);
          setDuration(`${(totalDuration / 60).toFixed(2)} minutes`);
        } else {
          alert("Could not generate route. Please try again.");
        }
      }
    );
  };

  // Fetch chat messages
  useEffect(() => {
    if (!groupId) return;

    const messagesRef = collection(db, `groups/${groupId}/messages`);
    const q = query(messagesRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Send a new chat message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messagesRef = collection(db, `groups/${groupId}/messages`);
    await addDoc(messagesRef, {
      sender: auth.currentUser.email,
      content: newMessage,
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  if (!isLoaded) {
    return <div>Loading map...</div>;
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
        {isOrganizer && (
          <>
            <button onClick={handleAddLocation} disabled={!newLocation}>
              Adaugă locația
            </button>
            <button onClick={generateRoute} disabled={markers.length < 2}>
              Generează traseu
            </button>
          </>
        )}
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
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
            />
          )}
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
                {isOrganizer && (
                  <button onClick={() => handleRemoveLocation(marker.id)}>Șterge</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`chat-container ${isChatMinimized ? "minimized" : ""}`}>
        <div className="chat-header">
          <h3 onClick={toggleChat}>Chat Grup</h3>
          <button onClick={toggleChat}>{isChatMinimized ? "⬆️" : "❌"}</button>
        </div>
        {!isChatMinimized && (
          <>
            <div className="chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message ${
                    message.sender === auth.currentUser.email ? "own-message" : "other-message"
                  }`}
                >
                  <p>
                    <strong>{message.sender}:</strong> {message.content}
                  </p>
                  <small>{new Date(message.timestamp?.toDate()).toLocaleTimeString()}</small>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                placeholder="Scrie un mesaj..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button onClick={handleSendMessage}>Trimite</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
