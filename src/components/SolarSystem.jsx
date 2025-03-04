import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import { db } from "../firebase/config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { DoubleSide } from "three";
import * as THREE from "three";

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
            scale={[planetSize * 2.5, planetSize * 2.5, planetSize * 2.5]} // Size relative to planet
        >
            <meshPhongMaterial
                map={texture}
                side={DoubleSide}
                transparent={true}
                opacity={0.4} // Increased from 0.9 to 1 for full opacity
                emissive={"#ffffff"} // White glow for brightness
                emissiveIntensity={0.2} // Subtle glow to enhance brightness
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
}) => {
    const meshRef = useRef();
    const [rotation, setRotation] = useState(0);
    const planetTexture = useTexture(`/textures/${texture}`);
    const ringTextureMap = ringTexture
        ? useTexture(`/textures/${ringTexture}`)
        : null;

    useFrame(() => {
        const newRotation = rotation + speed;
        setRotation(newRotation);
        if (meshRef.current) {
            meshRef.current.position.x = Math.cos(newRotation) * orbitRadius;
            meshRef.current.position.z = Math.sin(newRotation) * orbitRadius;
        }
    });

    if (ringTexture && !ringTextureMap) {
        console.log(`Failed to load ring texture: /textures/${ringTexture}`);
    }

    return (
        <group ref={meshRef} position={position}>
            {/* Planet */}
            <mesh>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial map={planetTexture} />
            </mesh>
            {/* Saturn Rings */}
            {ringTextureMap && createRingMesh(ringTextureMap, size)}
        </group>
    );
};

const Sun = () => {
    const sunTexture = useTexture("/textures/sun.jpg");

    return (
        <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[2, 32, 32]} />
            <meshStandardMaterial
                map={sunTexture}
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

export const SolarSystem = () => {
    const [planets, setPlanets] = useState(defaultPlanets);
    const [selectedPlanet, setSelectedPlanet] = useState(null);

    const savePlanetConfig = async () => {
        try {
            const docRef = await addDoc(collection(db, "configurations"), {
                planets,
                timestamp: new Date(),
            });
            console.log("Configuration saved with ID: ", docRef.id);
        } catch (error) {
            console.error("Error saving configuration: ", error);
        }
    };

    const loadConfigurations = async () => {
        try {
            const querySnapshot = await getDocs(
                collection(db, "configurations")
            );
            const configs = [];
            querySnapshot.forEach((doc) => {
                configs.push({ id: doc.id, ...doc.data() });
            });
            // Load the most recent configuration
            if (configs.length > 0) {
                const sortedConfigs = configs.sort(
                    (a, b) => b.timestamp - a.timestamp
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
                <Sun />
                {planets.map((planet) => (
                    <Planet
                        key={planet.name}
                        {...planet}
                        position={[planet.orbitRadius, 0, 0]}
                    />
                ))}
                <OrbitControls />
            </Canvas>
        </div>
    );
};
