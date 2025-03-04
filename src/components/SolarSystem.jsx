import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const Planet = ({ position, size, color, orbitRadius, speed, name }) => {
  const meshRef = useRef();
  const [rotation, setRotation] = useState(0);

  useFrame(() => {
    const newRotation = rotation + speed;
    setRotation(newRotation);
    
    meshRef.current.position.x = Math.cos(rotation) * orbitRadius;
    meshRef.current.position.z = Math.sin(rotation) * orbitRadius;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const Sun = () => {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={0.5} />
      <pointLight intensity={1.5} distance={100} />
    </mesh>
  );
};

const defaultPlanets = [
  { name: 'Mercury', size: 0.4, color: '#A0522D', orbitRadius: 4, speed: 0.01 },
  { name: 'Venus', size: 0.6, color: '#DEB887', orbitRadius: 6, speed: 0.008 },
  { name: 'Earth', size: 0.6, color: '#4169E1', orbitRadius: 8, speed: 0.006 },
  { name: 'Mars', size: 0.5, color: '#CD5C5C', orbitRadius: 10, speed: 0.004 },
  { name: 'Jupiter', size: 1.2, color: '#DAA520', orbitRadius: 14, speed: 0.002 },
  { name: 'Saturn', size: 1, color: '#F4A460', orbitRadius: 18, speed: 0.001 },
];

export const SolarSystem = () => {
  const [planets, setPlanets] = useState(defaultPlanets);
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  const savePlanetConfig = async () => {
    try {
      const docRef = await addDoc(collection(db, 'configurations'), {
        planets,
        timestamp: new Date(),
      });
      console.log('Configuration saved with ID: ', docRef.id);
    } catch (error) {
      console.error('Error saving configuration: ', error);
    }
  };

  const loadConfigurations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'configurations'));
      const configs = [];
      querySnapshot.forEach((doc) => {
        configs.push({ id: doc.id, ...doc.data() });
      });
      // Load the most recent configuration
      if (configs.length > 0) {
        const sortedConfigs = configs.sort((a, b) => b.timestamp - a.timestamp);
        setPlanets(sortedConfigs[0].planets);
      }
    } catch (error) {
      console.error('Error loading configurations: ', error);
    }
  };

  const updatePlanetProperty = (planetName, property, value) => {
    setPlanets(planets.map(planet => 
      planet.name === planetName ? { ...planet, [property]: value } : planet
    ));
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, background: 'rgba(0,0,0,0.7)', padding: 10, color: 'white' }}>
        <h2>Solar System Controls</h2>
        <select onChange={(e) => setSelectedPlanet(e.target.value)}>
          <option value="">Select Planet</option>
          {planets.map(planet => (
            <option key={planet.name} value={planet.name}>{planet.name}</option>
          ))}
        </select>
        
        {selectedPlanet && (
          <div>
            <h3>{selectedPlanet}</h3>
            <div>
              <label>Size:</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={planets.find(p => p.name === selectedPlanet).size}
                onChange={(e) => updatePlanetProperty(selectedPlanet, 'size', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label>Speed:</label>
              <input
                type="range"
                min="0.001"
                max="0.02"
                step="0.001"
                value={planets.find(p => p.name === selectedPlanet).speed}
                onChange={(e) => updatePlanetProperty(selectedPlanet, 'speed', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label>Orbit Radius:</label>
              <input
                type="range"
                min="3"
                max="20"
                step="0.5"
                value={planets.find(p => p.name === selectedPlanet).orbitRadius}
                onChange={(e) => updatePlanetProperty(selectedPlanet, 'orbitRadius', parseFloat(e.target.value))}
              />
            </div>
          </div>
        )}
        
        <button onClick={savePlanetConfig}>Save Configuration</button>
        <button onClick={loadConfigurations}>Load Last Configuration</button>
      </div>
      
      <Canvas camera={{ position: [0, 20, 25], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
        <Sun />
        {planets.map((planet) => (
          <Planet key={planet.name} {...planet} position={[planet.orbitRadius, 0, 0]} />
        ))}
        <OrbitControls />
      </Canvas>
    </div>
  );
}; 