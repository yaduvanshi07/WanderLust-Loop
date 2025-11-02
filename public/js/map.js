// Initialize map
let map;
let markers = [];
let markerCluster;
let userMarker;
let currentRadius = 50;
let socket;

// Initialize Leaflet map
function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5); // Default to India center
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Initialize marker cluster
    markerCluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        chunkedLoading: true
    });
    map.addLayer(markerCluster);
    
    // Initialize Socket.IO
    socket = io();
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('location:subscribe');
    });
    
    socket.on('location:update', (data) => {
        updateMarkerOnMap(data);
    });
    
    // Request user's current location
    requestLocation();
    
    // Load nearby travelers
    loadNearbyTravelers();
}

// Request browser geolocation
function requestLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            // Update map center
            map.setView([latitude, longitude], 10);
            
            // Add/update user marker
            if (userMarker) {
                userMarker.setLatLng([latitude, longitude]);
            } else {
                userMarker = L.marker([latitude, longitude], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41]
                    })
                }).addTo(map);
                userMarker.bindPopup('<b>Your Location</b>').openPopup();
            }
            
            // Update location on server if sharing is enabled
            if (document.getElementById('locationSharingToggle').checked) {
                updateLocationOnServer(latitude, longitude);
            }
        },
        (error) => {
            console.error('Error getting location:', error);
            alert('Unable to get your location. Please enable location permissions.');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Update location on server
async function updateLocationOnServer(lat, lon) {
    const visibility = document.getElementById('privacyLevel').value;
    const travelStatus = document.getElementById('travelStatus').value;
    
    try {
        const response = await fetch('/buddy/location/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: lat,
                longitude: lon,
                visibility: visibility,
                travelStatus: travelStatus
            })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('Location updated on server');
        }
    } catch (error) {
        console.error('Error updating location:', error);
    }
}

// Load nearby travelers from API
async function loadNearbyTravelers() {
    try {
        const response = await fetch(`/buddy/location/nearby?radius=${currentRadius}&maxResults=100`);
        const data = await response.json();
        
        if (data.success) {
            // Clear existing markers
            markerCluster.clearLayers();
            markers = [];
            
            // Add markers for each nearby user
            data.users.forEach(user => {
                const [lon, lat] = user.location.coordinates;
                
                // Determine marker color based on compatibility (if available)
                const compatibilityScore = user.compatibilityScore || 50;
                let markerColor = 'blue';
                let scoreClass = 'score-medium';
                
                if (compatibilityScore >= 75) {
                    markerColor = 'green';
                    scoreClass = 'score-high';
                } else if (compatibilityScore >= 50) {
                    markerColor = 'yellow';
                    scoreClass = 'score-medium';
                } else {
                    markerColor = 'red';
                    scoreClass = 'score-low';
                }
                
                // Status badge
                const statusClass = `status-${user.location.travelStatus || 'in-transit'}`;
                const statusText = (user.location.travelStatus || 'in-transit').replace('-', ' ');
                
                // Create custom icon
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background: ${markerColor === 'green' ? '#28a745' : markerColor === 'yellow' ? '#ffc107' : '#dc3545'}; 
                                   width: 30px; height: 30px; border-radius: 50%; 
                                   border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });
                
                const marker = L.marker([lat, lon], { icon: icon });
                
                // Create popup content
                const popupContent = `
                    <div style="min-width: 200px;">
                        <h6 style="margin: 0 0 0.5rem 0;">
                            ${user.user.username || 'Traveler'}
                            ${user.compatibilityScore ? `<span class="compatibility-score ${scoreClass}">${user.compatibilityScore}%</span>` : ''}
                        </h6>
                        <p style="margin: 0.25rem 0;">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </p>
                        <p style="margin: 0.5rem 0 0.25rem 0; font-size: 0.9rem; color: #666;">
                            <i class="fa-solid fa-map-marker-alt"></i> ${user.distance} km away
                        </p>
                        ${user.location.city ? `<p style="margin: 0.25rem 0; font-size: 0.85rem; color: #888;"><i class="fa-solid fa-city"></i> ${user.location.city}</p>` : ''}
                        <a href="/buddy/profile?userId=${user.user._id}" class="btn btn-sm btn-primary mt-2" style="width: 100%;">
                            View Profile
                        </a>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                markerCluster.addLayer(marker);
                markers.push({ marker, user });
            });
        }
    } catch (error) {
        console.error('Error loading nearby travelers:', error);
    }
}

// Update marker on map from WebSocket
function updateMarkerOnMap(data) {
    // Find and update marker if it exists
    const existingMarker = markers.find(m => m.user.user._id === data.userId);
    if (existingMarker && data.location.coordinates) {
        const [lon, lat] = data.location.coordinates;
        existingMarker.marker.setLatLng([lat, lon]);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    
    // Location sharing toggle
    document.getElementById('locationSharingToggle').addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        document.getElementById('sharingStatus').textContent = isEnabled ? 'On' : 'Off';
        
        if (isEnabled) {
            requestLocation();
            // Update privacy setting
            updatePrivacySettings();
        } else {
            // Disable location sharing
            fetch('/buddy/location/privacy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sharingEnabled: false })
            });
        }
    });
    
    // Privacy level change
    document.getElementById('privacyLevel').addEventListener('change', () => {
        if (document.getElementById('locationSharingToggle').checked) {
            updatePrivacySettings();
            requestLocation();
        }
    });
    
    // Travel status change
    document.getElementById('travelStatus').addEventListener('change', () => {
        if (document.getElementById('locationSharingToggle').checked) {
            requestLocation();
        }
    });
    
    // Radius slider
    document.getElementById('radiusSlider').addEventListener('input', (e) => {
        currentRadius = parseInt(e.target.value);
        document.getElementById('radiusValue').textContent = currentRadius;
    });
    
    // Refresh map button
    document.getElementById('refreshMap').addEventListener('click', () => {
        loadNearbyTravelers();
        if (document.getElementById('locationSharingToggle').checked) {
            requestLocation();
        }
    });
});

// Update privacy settings
async function updatePrivacySettings() {
    const visibility = document.getElementById('privacyLevel').value;
    
    try {
        await fetch('/buddy/location/privacy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visibility, sharingEnabled: true })
        });
    } catch (error) {
        console.error('Error updating privacy settings:', error);
    }
}

// Periodic location updates (every 30 seconds if sharing is enabled)
setInterval(() => {
    if (document.getElementById('locationSharingToggle').checked) {
        requestLocation();
    }
}, 30000);

