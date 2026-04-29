const mapToken = window.mapToken;
const mapEl = document.getElementById("map");
let listingCoordinates = [];
const fallbackCoordinates = [77.209, 28.6139];

if (mapEl && mapEl.dataset.coordinates) {
    try {
        listingCoordinates = JSON.parse(mapEl.dataset.coordinates);
    } catch (err) {
        listingCoordinates = [];
    }
}

if (
    mapToken &&
    typeof mapboxgl !== "undefined" &&
    mapEl
) {
    const hasValidCoordinates =
        Array.isArray(listingCoordinates) && listingCoordinates.length === 2;
    const centerCoordinates = hasValidCoordinates ? listingCoordinates : fallbackCoordinates;

    mapboxgl.accessToken = mapToken;
    const map = new mapboxgl.Map({
        container: mapEl,
        style: "mapbox://styles/mapbox/streets-v12",
        center: centerCoordinates,
        zoom: 9,
    });

    new mapboxgl.Marker().setLngLat(centerCoordinates).addTo(map);
}