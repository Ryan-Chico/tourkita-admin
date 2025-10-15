import React, { useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

mapboxgl.accessToken =
  "pk.eyJ1Ijoiem5lcmlnaHQiLCJhIjoiY21kZzFlaXd2MDM3NjJrczcwemVpMDlxOSJ9.EsDK4EfxFiml0EqsPS-F6g";

export default function AdminMapTool() {
  const [map, setMap] = useState(null);
  const [draw, setDraw] = useState(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#FF0000");
  const [geometry, setGeometry] = useState(null);
  const [landmarks, setLandmarks] = useState([]);


  useEffect(() => {
    const timeout = setTimeout(() => {
      const container = document.getElementById("admin-map");
      if (!container) return;

      const mapInstance = new mapboxgl.Map({
        container: "admin-map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: [120.973, 14.592],
        zoom: 15,
      });

      const drawControl = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, point: true, line_string: true, trash: true },
      });

      mapInstance.addControl(drawControl);
      setMap(mapInstance);
      setDraw(drawControl);

      mapInstance.on("draw.create", (e) => setGeometry(e.features[0].geometry));
      mapInstance.on("draw.update", (e) => setGeometry(e.features[0].geometry));

     
      mapInstance.on("load", () => {
        mapInstance.resize();
      });

      window.addEventListener("resize", () => mapInstance.resize());

      return () => {
        mapInstance.remove();
        window.removeEventListener("resize", () => mapInstance.resize());
      };
    }, 250); 

    return () => clearTimeout(timeout);
  }, []);

  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "customLandmarks"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLandmarks(data);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Save new landmark
  const saveToFirebase = async () => {
    if (!geometry) return alert("Draw a shape first!");
    if (!name.trim()) return alert("Please enter a landmark name!");

    try {
      await addDoc(collection(db, "customLandmarks"), {
        name,
        color,
        geometry: JSON.stringify(geometry),
        createdAt: serverTimestamp(),
      });

      alert("Highlight saved successfully!");
      setName("");
      setColor("#FF0000");
      draw?.deleteAll();
      setGeometry(null);
    } catch (error) {
      console.error("Error saving highlight:", error);
      alert("Failed to save. Check console for details.");
    }
  };

  // ✅ Delete landmark
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this highlight?")) return;

    try {
      await deleteDoc(doc(db, "customLandmarks", id));
      alert("Highlight deleted. Please refresh your browser.");
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete highlight.");
    }
  };

 
  useEffect(() => {
    if (!map) return;

    const drawLandmarks = () => {
      landmarks.forEach((landmark) => {
        const sourceId = `source-${landmark.id}`;
        const layerId = `layer-${landmark.id}`;

        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        let geometry = landmark.geometry;
        if (typeof geometry === "string") {
          try {
            geometry = JSON.parse(geometry);
          } catch {
            console.warn("Invalid geometry:", landmark.id);
            return;
          }
        }

        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry,
            properties: { name: landmark.name, color: landmark.color },
          },
        });

        map.addLayer({
          id: layerId,
          type:
            geometry.type === "Polygon"
              ? "fill"
              : geometry.type === "Point"
                ? "circle"
                : geometry.type === "LineString"
                  ? "line"
                  : "circle",
          source: sourceId,
          paint:
            geometry.type === "Polygon"
              ? { "fill-color": landmark.color, "fill-opacity": 0.6 }
              : geometry.type === "Point"
                ? { "circle-radius": 6, "circle-color": landmark.color }
                : geometry.type === "LineString"
                  ? { "line-color": landmark.color || "#FF0000", "line-width": 3 }
                  : {},
        });

        map.off("click", layerId);
        map.on("click", layerId, () => handleDelete(landmark.id));
      });

      map.resize();
    };

    if (map.isStyleLoaded()) {
      drawLandmarks();
    } else {
      map.once("style.load", drawLandmarks);
    }

  }, [landmarks, map]);


  return (
    <div>
      <div className="filter-container" style={{ marginBottom: "15px" }}>
        <div className="chart-filters row-flex">
          <div className="filter-group">
            <label>Landmark Name:</label>
            <input
              type="text"
              placeholder="Enter landmark name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                width: "220px",
                marginRight: "10px",
              }}
            />
          </div>

          <div className="filter-group">
            <label>Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ marginLeft: "5px" }}
            />
          </div>

          <button
            className="pdf-btn"
            onClick={saveToFirebase}
            style={{
              marginLeft: "15px",
              backgroundColor: "#493628",
              alignSelf: "flex-end",
            }}
          >
            Save Highlight
          </button>
        </div>
      </div>

      <div
        id="admin-map"
        style={{
          width: "100%",
          height: "75vh",
          minHeight: "400px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          display: "block",
        }}
      />
    </div>
  );
}
