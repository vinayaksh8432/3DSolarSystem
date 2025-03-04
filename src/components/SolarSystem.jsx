import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import { db } from "../firebase/config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { DoubleSide } from "three";
import * as THREE from "three";

// Default textures mapping
const defaultTextures = {
  Mercury: "mercury.jpg",
  Venus: "venus.jpg",
  Earth: "earth.jpg",
  Mars: "mars.jpg",
  Jupiter: "jupiter.jpg",
  Saturn: "saturn.jpg",
  Uranus: "uranus.jpg",
  Neptune: "neptune.jpg"
};

const createRingMesh = (texture, planetSize) => {
    const ringGeometry = new THREE.RingGeometry(0.4, 1, 128);
    const pos = ringGeometry.attributes.position;
    const v3 = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        ringGeometry.attributes.uv.setXY(i, v3.length() <= 0.75 ? 0 : 1, 1);
    }

    return (
        <mesh
            geometry={ringGeometry}
            rotation={[-Math.PI / 2, Math.PI / 6, 0]}
            scale={[planetSize * 2.5, planetSize * 2.5, planetSize * 2.5]}
        >
            <meshPhongMaterial
                map={texture}
                side={DoubleSide}
                transparent={true}
                opacity={0.4}
                emissive={"#ffffff"}
                emissiveIntensity={0.2}
            />
        </mesh>
    );
};

const Planet = ({
    position,
    size,
    texture,
    orbitRadius,
    speed,
    ringTexture,
    name
}) => {
    const meshRef = useRef();
    const [rotation, setRotation] = useState(0);

    // Calculate texture paths
    const textureToUse = texture || defaultTextures[name] || "earth.jpg";
    const ringTextureToUse = name === "Saturn" ? (ringTexture || "saturn-ring.png") : null;

    // Load textures at the top level
    const props = useTexture({
        planetMap: `/textures/${textureToUse}`,
        ...(ringTextureToUse ? { ringMap: `/textures/${ringTextureToUse}` } : {})
    });

    useFrame(() => {
        const newRotation = rotation + speed;
        setRotation(newRotation);
        if (meshRef.current) {
            meshRef.current.position.x = Math.cos(newRotation) * orbitRadius;
            meshRef.current.position.z = Math.sin(newRotation) * orbitRadius;
        }
    });

    return (
        <group ref={meshRef} position={position}>
            <mesh>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial map={props.planetMap} />
            </mesh>
            {name === "Saturn" && props.ringMap && createRingMesh(props.ringMap, size)}
        </group>
    );
};

const Sun = () => {
    const props = useTexture({
        map: "/textures/sun.jpg"
    });

    return (
        <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[2, 32, 32]} />
            <meshStandardMaterial
                map={props.map}
                emissive="yellow"
                emissiveIntensity={0.5}
            />
            <pointLight intensity={1.5} distance={100} />
        </mesh>
    );
};

const defaultPlanets = [
    {
        name: "Mercury",
        size: 0.4,
        texture: "mercury.jpg",
        orbitRadius: 4,
        speed: 0.01,
    },
    {
        name: "Venus",
        size: 0.6,
        texture: "venus.jpg",
        orbitRadius: 6,
        speed: 0.008,
    },
    {
        name: "Earth",
        size: 0.6,
        texture: "earth.jpg",
        orbitRadius: 8,
        speed: 0.006,
    },
    {
        name: "Mars",
        size: 0.5,
        texture: "mars.jpg",
        orbitRadius: 10,
        speed: 0.004,
    },
    {
        name: "Jupiter",
        size: 1.2,
        texture: "jupiter.jpg",
        orbitRadius: 14,
        speed: 0.002,
    },
    {
        name: "Saturn",
        size: 1,
        texture: "saturn.jpg",
        ringTexture: "saturn-ring.png", // Added ring texture
        orbitRadius: 18,
        speed: 0.001,
    },
    {
        name: "Uranus",
        size: 0.9,
        texture: "uranus.jpg",
        orbitRadius: 22,
        speed: 0.0005,
    },
    {
        name: "Neptune",
        size: 0.8,
        texture: "neptune.jpg",
        orbitRadius: 26,
        speed: 0.0003,
    },
];

// Add a loading component
const LoadingPlanet = ({ size, position }) => {
    return (
        <mesh position={position}>
            <sphereGeometry args={[size, 16, 16]} />
            <meshStandardMaterial color="#666666" wireframe />
        </mesh>
    );
};

export const SolarSystem = () => {
    const [planets, setPlanets] = useState(defaultPlanets);
    const [selectedPlanet, setSelectedPlanet] = useState(null);

    const savePlanetConfig = async () => {
        try {
            // Clean and validate planet data before saving
            const cleanPlanets = planets.map(planet => ({
                name: planet.name,
                size: Number(planet.size) || 1,
                texture: planet.texture || defaultTextures[planet.name],
                orbitRadius: Number(planet.orbitRadius) || 10,
                speed: Number(planet.speed) || 0.01,
                // Only include ringTexture for Saturn
                ...(planet.name === "Saturn" ? { ringTexture: "saturn-ring.png" } : {})
            }));

            const configData = {
                planets: cleanPlanets,
                timestamp: new Date(),
                name: `Solar System Configuration ${new Date().toLocaleString()}`
            };

            const docRef = await addDoc(collection(db, "configurations"), configData);
            console.log("Configuration saved with ID: ", docRef.id);
            
        } catch (error) {
            console.error("Error saving configuration: ", error);
            
        }
    };

    const loadConfigurations = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "configurations"));
            const configs = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Ensure all required properties are present and valid
                const validPlanets = data.planets.map(planet => ({
                    name: planet.name,
                    size: Number(planet.size) || 1,
                    texture: planet.texture || defaultTextures[planet.name],
                    orbitRadius: Number(planet.orbitRadius) || 10,
                    speed: Number(planet.speed) || 0.01,
                    // Only include ringTexture for Saturn
                    ...(planet.name === "Saturn" ? { ringTexture: "saturn-ring.png" } : {})
                }));

                configs.push({
                    id: doc.id,
                    name: data.name || `Configuration ${doc.id}`,
                    timestamp: data.timestamp,
                    planets: validPlanets
                });
            });

            if (configs.length > 0) {
                const sortedConfigs = configs.sort(
                    (a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()
                );
                setPlanets(sortedConfigs[0].planets);
                
            } 
        } catch (error) {
            console.error("Error loading configurations: ", error);
      
        }
    };

    const updatePlanetProperty = (planetName, property, value) => {
        setPlanets(
            planets.map((planet) =>
                planet.name === planetName
                    ? { ...planet, [property]: value }
                    : planet
            )
        );
    };

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    zIndex: 1,
                    background: "rgba(0,0,0,0.7)",
                    padding: 10,
                    color: "white",
                }}
            >
                <h2>Solar System Controls</h2>
                <select onChange={(e) => setSelectedPlanet(e.target.value)}>
                    <option value="">Select Planet</option>
                    {planets.map((planet) => (
                        <option key={planet.name} value={planet.name}>
                            {planet.name}
                        </option>
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
                                value={
                                    planets.find(
                                        (p) => p.name === selectedPlanet
                                    ).size
                                }
                                onChange={(e) =>
                                    updatePlanetProperty(
                                        selectedPlanet,
                                        "size",
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                        </div>
                        <div>
                            <label>Speed:</label>
                            <input
                                type="range"
                                min="0.001"
                                max="0.02"
                                step="0.001"
                                value={
                                    planets.find(
                                        (p) => p.name === selectedPlanet
                                    ).speed
                                }
                                onChange={(e) =>
                                    updatePlanetProperty(
                                        selectedPlanet,
                                        "speed",
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                        </div>
                        <div>
                            <label>Orbit Radius:</label>
                            <input
                                type="range"
                                min="3"
                                max="20"
                                step="0.5"
                                value={
                                    planets.find(
                                        (p) => p.name === selectedPlanet
                                    ).orbitRadius
                                }
                                onChange={(e) =>
                                    updatePlanetProperty(
                                        selectedPlanet,
                                        "orbitRadius",
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                        </div>
                    </div>
                )}

                <button onClick={savePlanetConfig}>Save Configuration</button>
                <button onClick={loadConfigurations}>
                    Load Last Configuration
                </button>
            </div>

            <Canvas camera={{ position: [0, 20, 25], fov: 60 }}>
                <ambientLight intensity={0.3} />
                <Stars
                    radius={100}
                    depth={50}
                    count={5000}
                    factor={4}
                    saturation={0}
                    fade
                />
                <Suspense fallback={null}>
                    <Sun />
                    {planets.map((planet) => (
                        <Suspense 
                            key={planet.name} 
                            fallback={
                                <LoadingPlanet 
                                    size={planet.size} 
                                    position={[planet.orbitRadius, 0, 0]} 
                                />
                            }
                        >
                            <Planet
                                {...planet}
                                position={[planet.orbitRadius, 0, 0]}
                            />
                        </Suspense>
                    ))}
                </Suspense>
                <OrbitControls />
            </Canvas>
        </div>
    );
};
