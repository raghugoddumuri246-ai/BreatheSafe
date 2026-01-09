import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const AQIMap = ({ coordinates, onClick }) => {
  const mapRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [mapScale, setMapScale] = useState(1);

  // Generate a simple map visualization
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw map background
    ctx.fillStyle = '#E6F2FF';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#C1D9F0';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw some random city shapes
    ctx.fillStyle = '#D9E6F2';
    
    // Apply current pan/zoom
    ctx.save();
    ctx.translate(mapOffset.x, mapOffset.y);
    ctx.scale(mapScale, mapScale);
    
    // Draw random city blocks
    const numBlocks = 50;
    const seed = Math.floor(coordinates.latitude * 100 + coordinates.longitude);
    const pseudoRandom = (n) => ((seed * n) % 17) / 17;
    
    for (let i = 0; i < numBlocks; i++) {
      const x = pseudoRandom(i * 3) * width * 1.5 - width * 0.25;
      const y = pseudoRandom(i * 5) * height * 1.5 - height * 0.25;
      const w = 20 + pseudoRandom(i * 7) * 60;
      const h = 20 + pseudoRandom(i * 11) * 60;
      
      ctx.fillStyle = `rgba(180, 200, 220, ${0.5 + pseudoRandom(i) * 0.5})`;
      ctx.fillRect(x, y, w, h);
    }
    
    // Draw main roads
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    
    // Horizontal main road
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Vertical main road
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    
    // Draw secondary roads
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    
    for (let i = 1; i < 3; i++) {
      // Horizontal secondary roads
      ctx.beginPath();
      ctx.moveTo(0, height / 4 * i);
      ctx.lineTo(width, height / 4 * i);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, height / 4 * (i + 2));
      ctx.lineTo(width, height / 4 * (i + 2));
      ctx.stroke();
      
      // Vertical secondary roads
      ctx.beginPath();
      ctx.moveTo(width / 4 * i, 0);
      ctx.lineTo(width / 4 * i, height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(width / 4 * (i + 2), 0);
      ctx.lineTo(width / 4 * (i + 2), height);
      ctx.stroke();
    }
    
    // Draw AQI markers (placeholder)
    const markers = [
      { lat: 0.2, lng: 0.3, aqi: 32, color: '#10B981' },
      { lat: 0.8, lng: 0.7, aqi: 85, color: '#F59E0B' },
      { lat: 0.4, lng: 0.8, aqi: 168, color: '#EF4444' },
      { lat: 0.6, lng: 0.2, aqi: 42, color: '#10B981' },
      { lat: 0.1, lng: 0.6, aqi: 58, color: '#10B981' },
      { lat: 0.9, lng: 0.4, aqi: 128, color: '#F59E0B' },
    ];
    
    markers.forEach(marker => {
      const x = marker.lng * width;
      const y = marker.lat * height;
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = marker.color;
      ctx.fill();
      
      // Draw AQI value
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(marker.aqi, x, y);
    });
    
    // Coordinate indicator (where user clicked)
    const userX = width / 2;
    const userY = height / 2;
    
    // Draw marker
    ctx.beginPath();
    ctx.arc(userX, userY, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#1E90FF';
    ctx.fill();
    
    // Draw pulsing effect
    ctx.beginPath();
    ctx.arc(userX, userY, 20, 0, Math.PI * 2);
    ctx.strokeStyle = '#1E90FF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw inner dot
    ctx.beginPath();
    ctx.arc(userX, userY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    ctx.restore();
  }, [coordinates, mapOffset, mapScale]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - mapOffset.x,
      y: e.clientY - mapOffset.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setMapOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMapClick = (e) => {
    if (!mapRef.current || !onClick) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Convert to lat/lng (mock values)
    const lat = coordinates.latitude + (y - 0.5) * 0.2;
    const lng = coordinates.longitude + (x - 0.5) * 0.2;
    
    onClick(lat, lng);
  };

  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      // Adjust scale factor based on wheel delta
      const delta = -e.deltaY * 0.01;
      setMapScale(prev => {
        const newScale = prev + delta;
        // Clamp scale between 0.5 and 2
        return Math.max(0.5, Math.min(2, newScale));
      });
    };

    const mapElement = mapRef.current;
    if (mapElement) {
      mapElement.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (mapElement) {
        mapElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleMapClick}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full"
      />
      <div className="absolute bottom-4 left-4 bg-white dark:bg-dark-800 shadow-md p-2 rounded-md text-xs text-gray-700 dark:text-gray-300">
        <div>Drag to pan | Scroll to zoom</div>
        <div>Click anywhere to select location</div>
      </div>
    </div>
  );
};

AQIMap.propTypes = {
  coordinates: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
  }).isRequired,
  onClick: PropTypes.func
};

export default AQIMap;