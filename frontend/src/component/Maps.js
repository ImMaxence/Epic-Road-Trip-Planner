import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css'; // NE SURTOUT PAS ENLEVER
import L from 'leaflet';
import 'leaflet-routing-machine'; // Ajout de l'extension pour le calcul d'itinéraire
import hamburger from "../../src/maps/hamburger.png";
import flag1 from "../../src/maps/flag1.png";
import flag2 from "../../src/maps/flag2.png";
import flag3 from "../../src/maps/flag3.png";
import MenuMaps from './MenuMaps';
import { useSearchParams } from 'react-router-dom';
import communeV2 from "../../src/maps/communes_codepostalV2.json";
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const Maps = () => {
    const getLatLong = (location) => {
        if (location === undefined) {
            return null
        }
        else {
            //     console.log("dddd : " + location)
            const { latitude, longitude } = communeV2[decodeURIComponent(location).replace(/"/g, '')];
            return { latitude, longitude };
        }

    };

    const mapRef = useRef(null);
    const [search] = useSearchParams();
    const [mapCreated, setMapCreated] = useState(false);
    const [routingControl, setRoutingControl] = useState(null);

    const [steps, setSteps] = useState([]);
    const [circles, setCircles] = useState([]);

    const startCity = search.get("startCity");
    const endCity = search.get("endCity");
    const colorLine = search.get("colorLine") || "#1677ff";
    const styleMap = search.get("style_map") || "landscape";

    const hamburgerIcon = L.icon({
        iconUrl: hamburger,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const flag1Icon = L.icon({
        iconUrl: flag1,
        iconSize: [32, 32],
        iconAnchor: [6, 32],
        popupAnchor: [0, -32]
    });

    const flag2Icon = L.icon({
        iconUrl: flag2,
        iconSize: [32, 32],
        iconAnchor: [6, 32],
        popupAnchor: [0, -32]
    });

    const flag3Icon = L.icon({
        iconUrl: flag3,
        iconSize: [32, 32],
        iconAnchor: [6, 32],
        popupAnchor: [0, -32]
    });

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.remove();
            setMapCreated(false);
        }

        mapRef.current = L.map('map').setView([47.0833, 2.4], 6);

        L.tileLayer(`https://tile.thunderforest.com/${styleMap}/{z}/{x}/{y}.png?apikey=0510416355894ef7bb60a2f07a5d7547`, {
            attribution: '© OpenStreetMap contributors, Thunderforest',
            apikey: '0510416355894ef7bb60a2f07a5d7547'
        }).addTo(mapRef.current);

        setMapCreated(true);
    }, [styleMap]);

    useEffect(() => {
        let newSteps = [];
        search.forEach((value, key) => {
            if (key.startsWith("step")) {
                newSteps.push(value);
            }
        });
        setSteps(newSteps);
    }, [search]);

    useEffect(() => {

        circles.forEach(circle => {
            circle.remove();
        });

        const newCircles = steps.map(item => {
            return L.circle([parseFloat(getLatLong(item).latitude), parseFloat(getLatLong(item).longitude)], {
                color: 'transparent',
                fillColor: colorLine,
                fillOpacity: 0.5,
                radius: 10000
            }).addTo(mapRef.current);
        });

        setCircles(newCircles);

        return () => {
            newCircles.forEach(circle => {
                circle.remove();
            });
        };
    }, [steps]);


    useEffect(() => {
        if (mapRef.current && mapCreated) {
            mapRef.current.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    mapRef.current.removeLayer(layer);
                }
            });

            const marker1 = L.marker([getLatLong(startCity).latitude, getLatLong(startCity).longitude], { icon: flag1Icon }).addTo(mapRef.current);
            marker1.bindPopup(startCity);

            const marker2 = L.marker([getLatLong(endCity).latitude, getLatLong(endCity).longitude], { icon: flag2Icon }).addTo(mapRef.current);
            marker2.bindPopup(endCity).openPopup();

            steps.forEach((item, index) => {
                const marker = L.marker([parseFloat(getLatLong(item).latitude), parseFloat(getLatLong(item).longitude)], { icon: flag3Icon }).addTo(mapRef.current);
                marker.bindPopup(`Étape ${index + 1} : ${item}`);
            });

            const waypoints = [
                L.latLng(parseFloat(getLatLong(startCity).latitude), parseFloat(getLatLong(startCity).longitude))
            ];

            steps.forEach((item) => {
                waypoints.push(
                    L.latLng(parseFloat(getLatLong(item).latitude), parseFloat(getLatLong(item).longitude))
                );
            });

            waypoints.push(
                L.latLng(parseFloat(getLatLong(endCity).latitude), parseFloat(getLatLong(endCity).longitude))
            );

            if (routingControl) {
                routingControl.remove();
            }

            const newRoutingControl = L.Routing.control({
                addWaypoints: false,
                draggableWaypoints: false,
                createMarker: function () { return null; },
                lineOptions: {
                    styles: [{ color: `${colorLine}`, opacity: 1, weight: 5 }]
                },
                waypoints: waypoints
            }).addTo(mapRef.current);

            setRoutingControl(newRoutingControl);
        }
    }, [mapCreated, startCity, endCity, colorLine, steps]);

    return (
        <>
            <MenuMaps start={startCity} />
            <div id="map" />
        </>
    );
};

export default Maps;
