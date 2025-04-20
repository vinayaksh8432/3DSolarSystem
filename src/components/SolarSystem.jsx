import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    OrbitControls,
    Stars,
    useTexture,
    PerspectiveCamera,
} from "@react-three/drei";
import { db } from "../firebase/config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { DoubleSide } from "three";
import * as THREE from "three";
import { MdArrowBackIos, MdArrowForwardIos } from "react-icons/md";
import { FiMinus, FiPlus } from "react-icons/fi";
import {
    CubeFocus,
    FadersHorizontal,
    GearSix,
    Info,
    Mouse,
    MouseLeftClick,
    MouseScroll,
} from "@phosphor-icons/react";
import { LuCloudDownload, LuCloudUpload } from "react-icons/lu";
import { GrPowerReset } from "react-icons/gr";
import { IoMdArrowBack } from "react-icons/io";

// Default textures mapping
const defaultTextures = {
    Mercury: "mercury.jpg",
    Venus: "venus.jpg",
    Earth: "earth.jpg",
    Mars: "mars.jpg",
    Jupiter: "jupiter.jpg",
    Saturn: "saturn.jpg",
    Uranus: "uranus.jpg",
    Neptune: "neptune.jpg",
};

// Add planet descriptions
const planetDescriptions = {
    Mercury:
        "Mercury is the smallest and innermost planet in the Solar System. It has a rocky surface covered with craters similar to the Moon. With virtually no atmosphere to retain heat, it experiences extreme temperature variations.",
    Venus: "Venus is the second planet from the Sun and is similar in size to Earth. It has a thick toxic atmosphere that traps heat, making it the hottest planet in our solar system with surface temperatures that could melt lead.",
    Earth: "Earth is our home planet and the only known world where life has developed. It has liquid water on its surface and an oxygen-rich atmosphere that supports millions of species of living beings.",
    Mars: "Mars is known as the Red Planet due to its reddish appearance caused by iron oxide (rust) on its surface. It has polar ice caps, extinct volcanoes like Olympus Mons (the largest in the solar system), and evidence of ancient water flows.",
    Jupiter:
        "Jupiter is the largest planet in our solar system, primarily composed of hydrogen and helium. It's known for its Great Red Spot, a giant storm that has been raging for hundreds of years, and its many moons including the four large Galilean moons.",
    Saturn: "Saturn is famous for its spectacular ring system made mostly of ice particles with some rocky debris. Like Jupiter, it's a gas giant with a hydrogen and helium atmosphere. It has over 80 known moons, with Titan being the largest.",
    Uranus: "Uranus is unique as it rotates on its side, likely the result of a massive collision in its early history. It's an ice giant with a cold, cloudy atmosphere made of hydrogen, helium, and methane, which gives it a blue-green color.",
    Neptune:
        "Neptune is the eighth and farthest known planet from the Sun. It's an ice giant similar to Uranus with a deep blue color due to methane in its atmosphere. It has the strongest winds in the solar system, reaching speeds of over 1,200 mph.",
};

const Sun = () => {
    const sunRef = useRef();
    const props = useTexture({
        map: "/textures/sun.jpg",
    });

    useFrame(() => {
        if (sunRef.current) {
            // Rotate sun slowly on its axis
            sunRef.current.rotation.y += 0.001;
        }
    });

    return (
        <group>
            {/* Main sun sphere */}
            <mesh ref={sunRef} position={[0, 0, 0]}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshStandardMaterial
                    map={props.map}
                    emissive="#FF4500"
                    emissiveIntensity={2}
                />
            </mesh>

            {/* Stable light sources */}
            <pointLight
                intensity={10}
                distance={100}
                decay={1}
                color="#ffffff"
            />

            {/* Sun glow effect */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[2.2, 32, 32]} />
                <meshBasicMaterial color="#FF4500" transparent opacity={0.2} />
            </mesh>
        </group>
    );
};

// Add OrbitRing component for visualizing orbits
const OrbitRing = ({ radius, color = "#ffffff" }) => {
    const ringRef = useRef();

    useFrame(() => {
        if (ringRef.current) {
            // Subtle pulse effect
            ringRef.current.material.opacity =
                0.3 + Math.sin(Date.now() * 0.001) * 0.1;
        }
    });

    return (
        <>
            {/* Main orbit ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} ref={ringRef}>
                <ringGeometry args={[radius, radius + 0.05, 180]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.3}
                    side={DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Glow effect */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius - 0.01, radius + 0.06, 180]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.1}
                    side={DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </>
    );
};

// Create a separate SaturnRings component
const SaturnRings = ({ size }) => {
    // Create multiple rings with different properties for a realistic look
    return (
        <group rotation={[Math.PI / 7, 0, 0]}>
            {/* Main bright ring - A Ring */}
            <mesh>
                <ringGeometry args={[size * 1.4, size * 2.0, 128]} />
                <meshStandardMaterial
                    color="#f5f5f5"
                    transparent
                    opacity={0.9}
                    side={DoubleSide}
                    metalness={0.2}
                    roughness={0.8}
                />
            </mesh>

            {/* B Ring - brightest and most opaque */}
            <mesh>
                <ringGeometry args={[size * 1.1, size * 1.4, 128]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.95}
                    side={DoubleSide}
                    metalness={0.3}
                    roughness={0.7}
                />
            </mesh>

            {/* C Ring - inner ring, more transparent */}
            <mesh>
                <ringGeometry args={[size * 0.8, size * 1.1, 128]} />
                <meshStandardMaterial
                    color="#e0e0e0"
                    transparent
                    opacity={0.7}
                    side={DoubleSide}
                    metalness={0.1}
                    roughness={0.9}
                />
            </mesh>

            {/* Cassini Division - dark gap between A and B rings */}
            <mesh>
                <ringGeometry args={[size * 1.38, size * 1.42, 128]} />
                <meshBasicMaterial
                    color="#000000"
                    transparent
                    opacity={0.85}
                    side={DoubleSide}
                />
            </mesh>

            {/* Subtle ring shadows on planet */}
            <mesh
                rotation={[Math.PI / 2, 0, 0]}
                position={[0, -size * 0.05, 0]}
            >
                <ringGeometry args={[0, size * 0.99, 128]} />
                <meshBasicMaterial
                    color="#000000"
                    transparent
                    opacity={0.2}
                    side={DoubleSide}
                />
            </mesh>
        </group>
    );
};

const Planet = ({
    position,
    size,
    texture,
    orbitRadius,
    speed,
    ringTexture,
    name,
    onPlanetClick,
}) => {
    const meshRef = useRef();
    const planetRef = useRef();
    const [rotation, setRotation] = useState(0);
    const [textureLoaded, setTextureLoaded] = useState(false);
    const [hovered, setHovered] = useState(false);

    // Make mesh reference accessible globally for camera tracking
    useEffect(() => {
        // Add the mesh reference to a global map for camera access
        window.planetRefs = window.planetRefs || {};
        window.planetRefs[name] = meshRef;

        return () => {
            if (window.planetRefs && window.planetRefs[name]) {
                delete window.planetRefs[name];
            }
        };
    }, [name]);

    // Calculate texture paths
    const textureToUse = texture || defaultTextures[name] || "earth.jpg";
    const ringTextureToUse =
        name === "Saturn" ? ringTexture || "saturn-ring.png" : null;

    // Set rotation speeds based on planet
    const rotationSpeed = useMemo(() => {
        const speeds = {
            Mercury: 0.002,
            Venus: -0.0018, // Venus rotates backwards!
            Earth: 0.002,
            Mars: 0.0018,
            Jupiter: 0.004, // Gas giants rotate faster
            Saturn: 0.0038,
            Uranus: 0.003,
            Neptune: 0.003,
        };
        return speeds[name] || 0.002;
    }, [name]);

    // Define orbit colors for each planet
    const orbitColor = useMemo(() => {
        const colors = {
            Mercury: "#A9A9A9", // Brighter gray
            Venus: "#FFD700", // Brighter gold
            Earth: "#4169E1", // Royal blue
            Mars: "#FF6347", // Brighter red-orange
            Jupiter: "#F4A460", // Brighter brown
            Saturn: "#FFD700", // Bright gold
            Uranus: "#00CED1", // Bright turquoise
            Neptune: "#1E90FF", // Brighter blue
        };
        return colors[name] || "#ffffff";
    }, [name]);

    // Load textures at the top level
    const props = useTexture(
        {
            map: `/textures/${textureToUse}`,
            ...(ringTextureToUse
                ? { ringMap: `/textures/${ringTextureToUse}` }
                : {}),
        },
        // Success callback
        () => {
            setTextureLoaded(true);
        }
    );

    useFrame(() => {
        // Update orbit position
        const newRotation = rotation + speed;
        setRotation(newRotation);

        if (meshRef.current) {
            // Update orbit position
            meshRef.current.position.x = Math.cos(newRotation) * orbitRadius;
            meshRef.current.position.z = Math.sin(newRotation) * orbitRadius;
        }

        if (planetRef.current) {
            // Rotate planet on its axis
            planetRef.current.rotation.y += rotationSpeed;

            // Tilt the planet (especially for Earth-like planets)
            if (name === "Earth") {
                planetRef.current.rotation.x = 0.41; // 23.5 degrees axial tilt
            } else if (name === "Mars") {
                planetRef.current.rotation.x = 0.44; // 25 degrees axial tilt
            } else if (name === "Saturn") {
                planetRef.current.rotation.x = 0.47; // 27 degrees axial tilt
            }
        }
    });

    if (!textureLoaded) {
        return (
            <mesh position={position}>
                <sphereGeometry args={[size, 16, 16]} />
                <meshStandardMaterial color="#666666" />
            </mesh>
        );
    }

    return (
        <>
            {/* Orbit Ring */}
            <OrbitRing radius={orbitRadius} color={orbitColor} />

            {/* Planet Group */}
            <group ref={meshRef} position={position}>
                <group ref={planetRef}>
                    <mesh
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlanetClick(name);
                        }}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                    >
                        <sphereGeometry args={[size, 32, 32]} />
                        <meshStandardMaterial
                            map={props.map}
                            metalness={0.3}
                            roughness={0.7}
                            emissive={hovered ? "#555555" : "#000000"}
                            emissiveIntensity={hovered ? 0.5 : 0}
                        />
                    </mesh>

                    {hovered && (
                        <mesh position={[0, size * 1.5, 0]}>
                            <sphereGeometry args={[size * 0.1, 16, 16]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                    )}

                    {/* Replace the old Saturn rings with our new component */}
                    {name === "Saturn" && <SaturnRings size={size} />}
                </group>
            </group>
        </>
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

// Add CameraController component for zooming to planets
const CameraController = ({ selectedPlanet, planets }) => {
    const { camera } = useThree();
    const orbitControlsRef = useRef();
    const [isAnimating, setIsAnimating] = useState(false);
    const prevPlanetRef = useRef(null);
    const animationRef = useRef(null);
    const lastTargetRef = useRef(new THREE.Vector3());
    const lastCameraPositionRef = useRef(new THREE.Vector3());
    const seamlessTransitionTimeoutRef = useRef(null);
    const trackingInterpolatorRef = useRef({
        active: false,
        startTime: 0,
        duration: 0.3, // Smooth interpolation duration in seconds
        startPos: new THREE.Vector3(),
        startTarget: new THREE.Vector3(),
        endPos: new THREE.Vector3(),
        endTarget: new THREE.Vector3(),
    });

    // Cancel any ongoing animation when component unmounts
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (seamlessTransitionTimeoutRef.current) {
                clearTimeout(seamlessTransitionTimeoutRef.current);
            }
        };
    }, []);

    // Handle switching between planets with smooth transition
    useEffect(() => {
        // Stop any ongoing animation
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        // Reset tracking interpolator
        trackingInterpolatorRef.current.active = false;

        // Clear any pending timeouts
        if (seamlessTransitionTimeoutRef.current) {
            clearTimeout(seamlessTransitionTimeoutRef.current);
            seamlessTransitionTimeoutRef.current = null;
        }

        // If we have a previous planet and a new selection, animate between them
        if (
            prevPlanetRef.current &&
            selectedPlanet &&
            prevPlanetRef.current !== selectedPlanet
        ) {
            animateBetweenPlanets(prevPlanetRef.current, selectedPlanet);
        }
        // If we're selecting a planet from no selection
        else if (selectedPlanet && !prevPlanetRef.current) {
            animateToNewPlanet(selectedPlanet);
        }
        // If we're resetting the view (deselecting a planet)
        else if (!selectedPlanet && prevPlanetRef.current) {
            animateToDefaultView();
        }

        // Update the previous planet reference
        prevPlanetRef.current = selectedPlanet;
    }, [selectedPlanet, planets]);

    // Helper function to calculate and store the last stable position
    const saveLastStablePosition = (planetRef, planet) => {
        if (planetRef?.current && planet) {
            const planetPosition = new THREE.Vector3();
            planetRef.current.getWorldPosition(planetPosition);

            // Save the target position
            lastTargetRef.current.copy(planetPosition);

            // Calculate camera position
            const viewDistance = planet.size * 5 + 1;
            const viewAngle =
                Math.atan2(planetPosition.z, planetPosition.x) + Math.PI / 4;

            const cameraX =
                planetPosition.x - Math.cos(viewAngle) * viewDistance;
            const cameraY = planet.size * 2 + 0.5;
            const cameraZ =
                planetPosition.z - Math.sin(viewAngle) * viewDistance;

            // Save the camera position
            lastCameraPositionRef.current.set(cameraX, cameraY, cameraZ);
        }
    };

    // Calculate planet velocity over time to predict its future position
    const calculatePlanetVelocity = (planetRef, prevPosition, deltaTime) => {
        if (!planetRef?.current || deltaTime <= 0) return new THREE.Vector3();

        const currentPosition = new THREE.Vector3();
        planetRef.current.getWorldPosition(currentPosition);

        return new THREE.Vector3()
            .subVectors(currentPosition, prevPosition)
            .divideScalar(deltaTime);
    };

    // Advanced prediction of future position based on orbital movement
    const predictFuturePosition = (planetRef, planet, lookAheadTime = 0.05) => {
        if (!planetRef?.current) return null;

        const currentPos = new THREE.Vector3();
        planetRef.current.getWorldPosition(currentPos);

        // For circular orbits, we can use the angular velocity to predict future position
        // Get orbital parameters
        const orbitRadius = planet.orbitRadius;
        const orbitSpeed = planet.speed;

        // Current angle in orbit
        const currentAngle = Math.atan2(currentPos.z, currentPos.x);

        // Angle after lookAheadTime
        const futureAngle = currentAngle + orbitSpeed * lookAheadTime;

        // Calculate future position
        const futurePos = new THREE.Vector3(
            Math.cos(futureAngle) * orbitRadius,
            currentPos.y, // Preserve y-position
            Math.sin(futureAngle) * orbitRadius
        );

        return futurePos;
    };

    // Start seamless tracking mode with interpolation
    const startSeamlessTracking = (finalCamera, finalTarget) => {
        // Set up tracking interpolator
        trackingInterpolatorRef.current = {
            active: true,
            startTime: Date.now(),
            duration: 0.3, // Duration in seconds
            startPos: camera.position.clone(),
            startTarget: orbitControlsRef.current
                ? orbitControlsRef.current.target.clone()
                : new THREE.Vector3(),
            endPos: finalCamera.clone(),
            endTarget: finalTarget.clone(),
        };
    };

    // Function to animate between two planets with a smoothed arc
    const animateBetweenPlanets = (fromPlanetName, toPlanetName) => {
        setIsAnimating(true);

        const fromPlanetRef =
            window.planetRefs && window.planetRefs[fromPlanetName];
        const toPlanetRef =
            window.planetRefs && window.planetRefs[toPlanetName];

        if (!fromPlanetRef?.current || !toPlanetRef?.current) {
            setIsAnimating(false);
            return;
        }

        const fromPlanet = planets.find((p) => p.name === fromPlanetName);
        const toPlanet = planets.find((p) => p.name === toPlanetName);

        if (!fromPlanet || !toPlanet) {
            setIsAnimating(false);
            return;
        }

        // Get current positions of both planets
        const fromPosition = new THREE.Vector3();
        const toPosition = new THREE.Vector3();
        fromPlanetRef.current.getWorldPosition(fromPosition);
        toPlanetRef.current.getWorldPosition(toPosition);

        // Calculate current and target camera positions
        const fromViewDistance = fromPlanet.size * 5 + 1;
        const toViewDistance = toPlanet.size * 5 + 1;

        const fromAngle =
            Math.atan2(fromPosition.z, fromPosition.x) + Math.PI / 4;
        const toAngle = Math.atan2(toPosition.z, toPosition.x) + Math.PI / 4;

        // Starting camera position is the current position
        const startCameraPos = camera.position.clone();
        const startTargetPos = orbitControlsRef.current
            ? orbitControlsRef.current.target.clone()
            : new THREE.Vector3();

        // Animation parameters
        const duration = 2.0; // 2 seconds for a smooth transition
        const startTime = Date.now();

        // Variables to track planet positions over time
        let prevToPosition = toPosition.clone();
        let prevTime = startTime;
        let toVelocity = new THREE.Vector3();

        // Pre-calculate orbital parameters for more accurate future prediction
        const orbitRadiusTo = toPlanet.orbitRadius;
        const orbitSpeedTo = toPlanet.speed;

        // Animation function
        const animate = () => {
            const now = Date.now();
            const elapsed = (now - startTime) / 1000;

            // Update target planet position in real-time during animation
            const currentToPosition = new THREE.Vector3();
            toPlanetRef.current.getWorldPosition(currentToPosition);

            // Update planet velocity calculation (used for prediction)
            const deltaTime = (now - prevTime) / 1000;
            if (deltaTime > 0) {
                toVelocity = calculatePlanetVelocity(
                    toPlanetRef,
                    prevToPosition,
                    deltaTime
                );
                prevToPosition.copy(currentToPosition);
                prevTime = now;
            }

            if (elapsed < duration) {
                // Predict future position at animation end for seamless transition
                // This prediction gets better as we get closer to the end
                if (elapsed > duration * 0.8) {
                    // Use orbital prediction instead of linear velocity
                    const futurePosition = predictFuturePosition(
                        toPlanetRef,
                        toPlanet,
                        0.2
                    );

                    if (futurePosition) {
                        // Calculate predicted camera position
                        const predictedAngle =
                            Math.atan2(futurePosition.z, futurePosition.x) +
                            Math.PI / 4;
                        const predictedCameraX =
                            futurePosition.x -
                            Math.cos(predictedAngle) * toViewDistance;
                        const predictedCameraY = toPlanet.size * 2 + 0.5;
                        const predictedCameraZ =
                            futurePosition.z -
                            Math.sin(predictedAngle) * toViewDistance;

                        // Save these values for the seamless transition
                        lastTargetRef.current.copy(futurePosition);
                        lastCameraPositionRef.current.set(
                            predictedCameraX,
                            predictedCameraY,
                            predictedCameraZ
                        );
                    }
                }

                // Smooth easing function - custom curve for natural movement
                let t;
                if (elapsed / duration < 0.5) {
                    // Ease out of starting position (smoother acceleration)
                    t = 2 * Math.pow(elapsed / duration, 2);
                } else {
                    // Ease into ending position (smoother deceleration)
                    t = 1 - Math.pow((-2 * elapsed) / duration + 2, 2) / 2;
                }

                // Calculate path progression with separate timing
                const pathT =
                    1 - Math.pow(1 - Math.min(elapsed / duration, 1), 2.5);
                const directDistance =
                    fromPosition.distanceTo(currentToPosition);

                // Calculate arc height based on distance and path progress
                const arcHeight =
                    Math.min(directDistance * 0.25, 8) *
                    Math.sin(Math.PI * pathT);

                // Calculate a curved path between planets
                const intermediate = new THREE.Vector3();
                intermediate.x =
                    fromPosition.x +
                    (currentToPosition.x - fromPosition.x) * pathT;
                intermediate.z =
                    fromPosition.z +
                    (currentToPosition.z - fromPosition.z) * pathT;
                intermediate.y =
                    Math.max(fromPosition.y, currentToPosition.y) + arcHeight;

                // Smoothly interpolate view distance
                const lerpViewDistance =
                    fromViewDistance + (toViewDistance - fromViewDistance) * t;

                // Calculate camera angle with smooth rotation
                const lerpAngle = fromAngle + (toAngle - fromAngle) * pathT;

                // Position camera along the path
                const cameraX =
                    intermediate.x - Math.cos(lerpAngle) * lerpViewDistance;
                const cameraZ =
                    intermediate.z - Math.sin(lerpAngle) * lerpViewDistance;
                const cameraY = intermediate.y + toPlanet.size * 0.5;

                // Update camera and controls
                camera.position.set(cameraX, cameraY, cameraZ);

                if (orbitControlsRef.current) {
                    orbitControlsRef.current.target.copy(intermediate);
                }

                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Animation complete - transition to predictive tracking mode
                if (orbitControlsRef.current) {
                    // Use our pre-calculated positions for a perfect handoff
                    orbitControlsRef.current.target.copy(lastTargetRef.current);
                    camera.position.copy(lastCameraPositionRef.current);

                    // Start seamless tracking interpolation
                    startSeamlessTracking(
                        lastCameraPositionRef.current,
                        lastTargetRef.current
                    );

                    // Delay disabling animation flag to allow smooth transition
                    seamlessTransitionTimeoutRef.current = setTimeout(() => {
                        setIsAnimating(false);
                        animationRef.current = null;
                        seamlessTransitionTimeoutRef.current = null;
                    }, 200); // Longer delay for smoother transition
                } else {
                    setIsAnimating(false);
                    animationRef.current = null;
                }
            }
        };

        // Start the animation
        animationRef.current = requestAnimationFrame(animate);
    };

    // Function to animate to a newly selected planet
    const animateToNewPlanet = (planetName) => {
        setIsAnimating(true);

        const planetRef = window.planetRefs && window.planetRefs[planetName];

        if (!planetRef?.current) {
            setIsAnimating(false);
            return;
        }

        const planet = planets.find((p) => p.name === planetName);

        if (!planet) {
            setIsAnimating(false);
            return;
        }

        // Get current planet position
        const planetPosition = new THREE.Vector3();
        planetRef.current.getWorldPosition(planetPosition);

        // Calculate target camera position
        const viewDistance = planet.size * 5 + 1;
        const viewAngle =
            Math.atan2(planetPosition.z, planetPosition.x) + Math.PI / 4;

        const targetCameraX =
            planetPosition.x - Math.cos(viewAngle) * viewDistance;
        const targetCameraY = planet.size * 2 + 0.5;
        const targetCameraZ =
            planetPosition.z - Math.sin(viewAngle) * viewDistance;

        // Starting positions
        const startCameraPos = camera.position.clone();
        const startTargetPos = orbitControlsRef.current
            ? orbitControlsRef.current.target.clone()
            : new THREE.Vector3();

        // Animation parameters
        const duration = 1.5;
        const startTime = Date.now();

        // Save initial orbital velocity data
        let prevPlanetPosition = planetPosition.clone();
        let prevTime = startTime;

        // Animation function
        const animate = () => {
            const now = Date.now();
            const elapsed = (now - startTime) / 1000;

            // Update planet position in real-time
            const currentPlanetPosition = new THREE.Vector3();
            planetRef.current.getWorldPosition(currentPlanetPosition);

            // Calculate future position for seamless transition
            if (elapsed > duration * 0.8) {
                const futurePosition = predictFuturePosition(
                    planetRef,
                    planet,
                    0.2
                );

                if (futurePosition) {
                    // Calculate predicted camera position
                    const predictedAngle =
                        Math.atan2(futurePosition.z, futurePosition.x) +
                        Math.PI / 4;
                    const predictedCameraX =
                        futurePosition.x -
                        Math.cos(predictedAngle) * viewDistance;
                    const predictedCameraY = planet.size * 2 + 0.5;
                    const predictedCameraZ =
                        futurePosition.z -
                        Math.sin(predictedAngle) * viewDistance;

                    // Save for seamless transition
                    lastTargetRef.current.copy(futurePosition);
                    lastCameraPositionRef.current.set(
                        predictedCameraX,
                        predictedCameraY,
                        predictedCameraZ
                    );
                }
            }

            prevPlanetPosition.copy(currentPlanetPosition);

            // Recalculate target based on current planet position
            const currentViewAngle =
                Math.atan2(currentPlanetPosition.z, currentPlanetPosition.x) +
                Math.PI / 4;
            const currentTargetX =
                currentPlanetPosition.x -
                Math.cos(currentViewAngle) * viewDistance;
            const currentTargetZ =
                currentPlanetPosition.z -
                Math.sin(currentViewAngle) * viewDistance;

            if (elapsed < duration) {
                // Improved easing function - natural motion curve
                let t;
                if (elapsed / duration < 0.5) {
                    // Slower start, faster middle (accelerate)
                    t = 2 * Math.pow(elapsed / duration, 2);
                } else {
                    // Slower end (decelerate)
                    t = 1 - Math.pow((-2 * elapsed) / duration + 2, 2) / 2;
                }

                // Enhanced cinematic arc with variable height
                const arcHeight =
                    Math.sin(Math.PI * (elapsed / duration)) *
                    (5 * Math.sin(elapsed * 2)); // Slightly wavy arc

                // Enhanced y-position calculation
                const yPosition =
                    startCameraPos.y +
                    (targetCameraY - startCameraPos.y) * t +
                    arcHeight;

                // Update camera position with enhanced interpolation
                camera.position.x =
                    startCameraPos.x + (currentTargetX - startCameraPos.x) * t;
                camera.position.y = yPosition;
                camera.position.z =
                    startCameraPos.z + (currentTargetZ - startCameraPos.z) * t;

                // Update camera target with enhanced smoothing
                if (orbitControlsRef.current) {
                    // Enhanced target interpolation with slight lead
                    orbitControlsRef.current.target.x =
                        startTargetPos.x +
                        (currentPlanetPosition.x - startTargetPos.x) *
                            (t * 1.05);
                    orbitControlsRef.current.target.y =
                        startTargetPos.y +
                        (currentPlanetPosition.y - startTargetPos.y) * t;
                    orbitControlsRef.current.target.z =
                        startTargetPos.z +
                        (currentPlanetPosition.z - startTargetPos.z) *
                            (t * 1.05);
                }

                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Use pre-calculated position for seamless transition
                camera.position.copy(lastCameraPositionRef.current);

                if (orbitControlsRef.current) {
                    orbitControlsRef.current.target.copy(lastTargetRef.current);

                    // Activate seamless tracking for smooth transition
                    startSeamlessTracking(
                        lastCameraPositionRef.current,
                        lastTargetRef.current
                    );
                }

                // Delay disabling animation flag for smoother transition
                seamlessTransitionTimeoutRef.current = setTimeout(() => {
                    setIsAnimating(false);
                    animationRef.current = null;
                    seamlessTransitionTimeoutRef.current = null;
                }, 200); // Longer delay to ensure smoothness
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    // Function to animate back to default view
    const animateToDefaultView = () => {
        setIsAnimating(true);

        // Default view position
        const defaultPosition = new THREE.Vector3(0, 20, 25);
        const defaultTarget = new THREE.Vector3(0, 0, 0);

        // Starting positions
        const startCameraPos = camera.position.clone();
        const startTargetPos = orbitControlsRef.current
            ? orbitControlsRef.current.target.clone()
            : new THREE.Vector3();

        // Animation parameters
        const duration = 1.8; // Slightly longer duration for smoother motion
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = (now - startTime) / 1000;

            if (elapsed < duration) {
                // Refined easing with natural acceleration/deceleration
                let t;
                if (elapsed / duration < 0.5) {
                    // More gradual acceleration
                    t = 2 * Math.pow(elapsed / duration, 2.2); // Higher power = more gradual
                } else {
                    // Smoother deceleration
                    t = 1 - Math.pow((-2 * elapsed) / duration + 2, 1.8) / 2;
                }

                // Enhanced arc with subtle oscillation
                const arcBase = Math.sin(Math.PI * (elapsed / duration));
                const oscillation = Math.sin(elapsed * 2) * 0.2; // Subtle oscillation
                const arcHeight = (arcBase + oscillation) * 4; // Larger, more dynamic arc

                // Enhanced camera position interpolation
                camera.position.x =
                    startCameraPos.x +
                    (defaultPosition.x - startCameraPos.x) * t;
                camera.position.y =
                    startCameraPos.y +
                    (defaultPosition.y - startCameraPos.y) * t +
                    arcHeight;
                camera.position.z =
                    startCameraPos.z +
                    (defaultPosition.z - startCameraPos.z) * t;

                // Enhanced target interpolation
                if (orbitControlsRef.current) {
                    // Slightly advanced target movement for more natural feel
                    const targetT = Math.min(t * 1.1, 1.0); // Target moves slightly ahead

                    orbitControlsRef.current.target.x =
                        startTargetPos.x +
                        (defaultTarget.x - startTargetPos.x) * targetT;
                    orbitControlsRef.current.target.y =
                        startTargetPos.y +
                        (defaultTarget.y - startTargetPos.y) * t;
                    orbitControlsRef.current.target.z =
                        startTargetPos.z +
                        (defaultTarget.z - startTargetPos.z) * targetT;
                }

                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Perfect final position
                camera.position.copy(defaultPosition);
                if (orbitControlsRef.current) {
                    orbitControlsRef.current.target.copy(defaultTarget);
                }

                setIsAnimating(false);
                animationRef.current = null;
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    // This useFrame handles both real-time tracking when not animating
    // and the seamless transition between animated and tracked states
    useFrame(() => {
        // Handle the seamless tracking interpolation if active
        if (trackingInterpolatorRef.current.active) {
            const interp = trackingInterpolatorRef.current;
            const elapsed = (Date.now() - interp.startTime) / 1000;

            if (elapsed < interp.duration) {
                // Smooth interpolation between animation end and tracking
                const t =
                    1 - Math.pow(1 - Math.min(elapsed / interp.duration, 1), 2);

                // Get current target planet position
                if (selectedPlanet) {
                    const planetRef =
                        window.planetRefs && window.planetRefs[selectedPlanet];
                    const planet = planets.find(
                        (p) => p.name === selectedPlanet
                    );

                    if (planetRef?.current && planet) {
                        // Get current planet position
                        const planetPosition = new THREE.Vector3();
                        planetRef.current.getWorldPosition(planetPosition);

                        // Calculate ideal camera position
                        const viewDistance = planet.size * 5 + 1;
                        const viewAngle =
                            Math.atan2(planetPosition.z, planetPosition.x) +
                            Math.PI / 4;
                        const idealCameraX =
                            planetPosition.x -
                            Math.cos(viewAngle) * viewDistance;
                        const idealCameraY = planet.size * 2 + 0.5;
                        const idealCameraZ =
                            planetPosition.z -
                            Math.sin(viewAngle) * viewDistance;

                        // Blend between the end of animation and the ideal tracking position
                        camera.position.x =
                            interp.startPos.x +
                            (idealCameraX - interp.startPos.x) * t;
                        camera.position.y =
                            interp.startPos.y +
                            (idealCameraY - interp.startPos.y) * t;
                        camera.position.z =
                            interp.startPos.z +
                            (idealCameraZ - interp.startPos.z) * t;

                        if (orbitControlsRef.current) {
                            orbitControlsRef.current.target.x =
                                interp.startTarget.x +
                                (planetPosition.x - interp.startTarget.x) * t;
                            orbitControlsRef.current.target.y =
                                interp.startTarget.y +
                                (planetPosition.y - interp.startTarget.y) * t;
                            orbitControlsRef.current.target.z =
                                interp.startTarget.z +
                                (planetPosition.z - interp.startTarget.z) * t;
                        }
                    }
                }
            } else {
                // Transition complete, disable interpolation
                trackingInterpolatorRef.current.active = false;
            }

            // Return early to avoid concurrent tracking methods
            return;
        }

        // Standard tracking when not animating and not in transition
        if (
            selectedPlanet &&
            !isAnimating &&
            !trackingInterpolatorRef.current.active
        ) {
            const planetRef =
                window.planetRefs && window.planetRefs[selectedPlanet];
            if (planetRef && planetRef.current) {
                // Get the current world position of the planet
                const planetPosition = new THREE.Vector3();
                planetRef.current.getWorldPosition(planetPosition);

                // Get the selected planet data
                const planet = planets.find((p) => p.name === selectedPlanet);
                if (!planet) return;

                // Calculate optimal viewing distance based on planet size
                const viewDistance = planet.size * 5 + 1;

                // Calculate the viewing angle
                const planetAngle = Math.atan2(
                    planetPosition.z,
                    planetPosition.x
                );
                const viewAngle = planetAngle + Math.PI / 4;

                // Calculate camera position
                const cameraX =
                    planetPosition.x - Math.cos(viewAngle) * viewDistance;
                const cameraY = planet.size * 2 + 0.5;
                const cameraZ =
                    planetPosition.z - Math.sin(viewAngle) * viewDistance;

                // Set camera position
                camera.position.set(cameraX, cameraY, cameraZ);

                // Look at the planet
                if (orbitControlsRef.current) {
                    orbitControlsRef.current.target.copy(planetPosition);
                }

                // Save stable positions for future transitions
                saveLastStablePosition(planetRef, planet);
            }
        }
    });

    return (
        <OrbitControls
            ref={orbitControlsRef}
            enableDamping
            dampingFactor={0.25}
            minDistance={3}
            maxDistance={100}
        />
    );
};

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
    const [showDescription, setShowDescription] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [globalSpeedMultiplier, setGlobalSpeedMultiplier] = useState(1);
    const actualMonthsPerSecond = 3; // Base speed: 3 months per second at multiplier 1 (changed from years)

    // Reset function to restore defaults for planets and speed
    const resetToDefaults = () => {
        setPlanets(defaultPlanets);
        setGlobalSpeedMultiplier(1);
    };

    const savePlanetConfig = async () => {
        try {
            // Clean and validate planet data before saving
            const cleanPlanets = planets.map((planet) => ({
                name: planet.name,
                size: Number(planet.size) || 1,
                texture: planet.texture || defaultTextures[planet.name],
                orbitRadius: Number(planet.orbitRadius) || 10,
                speed: Number(planet.speed) || 0.01,
                // Only include ringTexture for Saturn
                ...(planet.name === "Saturn"
                    ? { ringTexture: "saturn-ring.png" }
                    : {}),
            }));

            const configData = {
                planets: cleanPlanets,
                timestamp: new Date(),
                name: `Solar System Configuration ${new Date().toLocaleString()}`,
            };

            const docRef = await addDoc(
                collection(db, "configurations"),
                configData
            );
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
                const data = doc.data();
                // Ensure all required properties are present and valid
                const validPlanets = data.planets.map((planet) => ({
                    name: planet.name,
                    size: Number(planet.size) || 1,
                    texture: planet.texture || defaultTextures[planet.name],
                    orbitRadius: Number(planet.orbitRadius) || 10,
                    speed: Number(planet.speed) || 0.01,
                    // Only include ringTexture for Saturn
                    ...(planet.name === "Saturn"
                        ? { ringTexture: "saturn-ring.png" }
                        : {}),
                }));

                configs.push({
                    id: doc.id,
                    name: data.name || `Configuration ${doc.id}`,
                    timestamp: data.timestamp,
                    planets: validPlanets,
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

    const adjustGlobalSpeed = (increment) => {
        setGlobalSpeedMultiplier((prev) => {
            // Only allow integer values from 1 to 12
            const newValue = prev + increment;
            return Math.max(1, Math.min(12, Math.round(newValue)));
        });
    };

    useEffect(() => {
        // Apply global speed multiplier to all planets
        const updatedPlanets = defaultPlanets.map((planet) => ({
            ...planet,
            speed: planet.speed * globalSpeedMultiplier,
        }));
        setPlanets(updatedPlanets);
    }, [globalSpeedMultiplier]);

    const handlePlanetClick = (planetName) => {
        const index = planets.findIndex((p) => p.name === planetName);
        setSelectedPlanet(planetName);
        setSelectedIndex(index);
        setShowDescription(true);
        setInfo(true); // Set info to true by default when a planet is selected
        setConfig(false); // Ensure config is off

        setShowDescription(true);
    };
    const navigatePlanet = (direction) => {
        // If no planet is selected, select the first one when moving forward
        // or the last one when moving backward
        if (selectedIndex === -1) {
            const newIndex = direction === "next" ? 0 : planets.length - 1;
            setSelectedIndex(newIndex);
            setSelectedPlanet(planets[newIndex].name);
            setShowDescription(true);
            setInfo(true); // Set info to true by default
            setConfig(false); // Ensure config is off
            return;
        }

        let newIndex;
        if (direction === "next") {
            newIndex = (selectedIndex + 1) % planets.length;
        } else {
            newIndex = (selectedIndex - 1 + planets.length) % planets.length;
        }

        setSelectedIndex(newIndex);
        setSelectedPlanet(planets[newIndex].name);
        setShowDescription(true);
        // Keep current tab selection when navigating between planets
    };
    const [settings, setSettings] = useState(false);
    const [info, setInfo] = useState(false);
    const [config, setConfig] = useState(false);

    return (
        <div className="w-screen h-screen overflow-hidden relative">
            <div className="absolute z-10 top-8 left-10 text-white">
                {[
                    {
                        icon: <Mouse size={25} />,
                        text: "Hold and move with",
                    },
                    {
                        icon: <MouseLeftClick size={25} />,
                        text: "Click to select a planet",
                    },
                    {
                        icon: <MouseScroll size={25} />,
                        text: "Scroll to zoom in/out",
                    },
                ].map((_, index) => (
                    <div key={index} className="flex items-center pb-2 gap-2">
                        {_.icon}
                        <span>{_.text}</span>
                    </div>
                ))}
            </div>
            <div className="absolute z-10 bottom-8 text-white right-10 hover:rotate-90 transition-all duration-75 cursor-pointer">
                <GearSix size={35} onClick={() => setSettings(!settings)} />
            </div>
            {settings && (
                <div className="absolute z-10 bottom-20 right-11 px-2 bg-black/80 rounded-md border border-gray-800 py-2 flex flex-col gap-2">
                    <div className="flex flex-col justify-between gap-2 text-white">
                        {[
                            {
                                text: "Save Configuration",
                                icon: <LuCloudUpload size={25} />,
                                onClick: savePlanetConfig,
                            },
                            {
                                text: "Load Configuration",
                                icon: <LuCloudDownload size={25} />,
                                onClick: loadConfigurations,
                            },
                            {
                                text: "Reset",
                                icon: <GrPowerReset size={23} />,
                                onClick: resetToDefaults,
                            },
                        ].map((button, index) => (
                            <div className="cursor-pointer flex items-center justify-between hover:bg-gray-800 px-2 py-1 rounded-lg">
                                <button
                                    key={index}
                                    onClick={button.onClick}
                                    className="text-left flex-1 cursor-pointer"
                                >
                                    {button.text}
                                </button>
                                {button.icon}
                            </div>
                        ))}
                    </div>
                    <hr className="border border-gray-800 rounded mx-1" />
                    <div className="flex items-center gap-4 text-white px-2 py-2">
                        <button
                            onClick={() => adjustGlobalSpeed(-1)}
                            className="border rounded-full cursor-pointer"
                        >
                            <FiMinus />
                        </button>
                        <span className="text-center">
                            {Math.round(
                                actualMonthsPerSecond * globalSpeedMultiplier
                            )}{" "}
                            months/second
                        </span>
                        <button
                            onClick={() => adjustGlobalSpeed(1)}
                            className="border rounded-full cursor-pointer"
                        >
                            <FiPlus />
                        </button>
                    </div>
                </div>
            )}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 text-white flex items-center gap-6 text-2xl">
                <button
                    onClick={() => navigatePlanet("prev")}
                    className="cursor-pointer"
                >
                    <MdArrowBackIos />
                </button>

                <div className="text-center px-2 font-mono tracking-wide">
                    {selectedPlanet || "Select Planet"}
                </div>

                <button
                    onClick={() => navigatePlanet("next")}
                    className="cursor-pointer"
                >
                    <MdArrowForwardIos />
                </button>
            </div>
            <div className="absolute top-1/2 transform -translate-y-1/2 right-25 z-10 bg-black/80 text-white w-md ">
                {selectedPlanet && (
                    <div className="bg-black/80 border border-gray-800 flex flex-col gap-2 rounded-xl">
                        <div className="border-b px-4 py-3 text-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    className="hover:bg-gray-900 rounded p-1 cursor-pointer"
                                    onClick={() => {
                                        setSelectedPlanet(null);
                                        setSelectedIndex(-1);
                                    }}
                                >
                                    <IoMdArrowBack />
                                </button>
                                <h1>{selectedPlanet}</h1>
                            </div>

                            <span className="flex gap-2 items-center">
                                <Info
                                    size={33}
                                    className={`hover:bg-gray-900 rounded p-1 cursor-pointer ${
                                        info ? "bg-gray-900" : ""
                                    }`}
                                    onClick={() => {
                                        setInfo(true);
                                        setConfig(false);
                                    }}
                                />
                                <FadersHorizontal
                                    size={33}
                                    className={`hover:bg-gray-900 rounded p-1 cursor-pointer ${
                                        config ? "bg-gray-900" : ""
                                    }`}
                                    onClick={() => {
                                        setConfig(true);
                                        setInfo(false);
                                    }}
                                />
                            </span>
                        </div>
                        <div className="overflow-hidden px-4 py-2">
                            {info && (
                                <div className="animate-fadeIn">
                                    <p>{planetDescriptions[selectedPlanet]}</p>
                                </div>
                            )}
                            {config && (
                                <div className="animate-fadeIn">
                                    {[
                                        {
                                            name: "Size",
                                            property: "size",
                                            min: "0.1",
                                            max: "2",
                                            step: "0.1",
                                            format: (val) =>
                                                `${val.toFixed(1)}x`,
                                            className: "text-xs",
                                        },
                                        {
                                            name: "Speed",
                                            property: "speed",
                                            min: "0.001",
                                            max: "0.02",
                                            step: "0.001",
                                            format: (val) => val.toFixed(4),
                                            className: "text-xs mb-1 font-mono",
                                        },
                                        {
                                            name: "Orbit Radius",
                                            property: "orbitRadius",
                                            min: "3",
                                            max: "20",
                                            step: "0.5",
                                            format: (val) => val.toFixed(1),
                                            className: "text-xs mb-1 font-mono",
                                        },
                                    ].map((setting, index) => {
                                        // Get the selected planet object once
                                        const selectedPlanetData = planets.find(
                                            (p) => p.name === selectedPlanet
                                        );
                                        const value =
                                            selectedPlanetData[
                                                setting.property
                                            ];

                                        return (
                                            <div
                                                className="my-2 grid grid-cols-2 gap-4"
                                                key={index}
                                            >
                                                <div className="flex justify-between">
                                                    <label>
                                                        {setting.name}
                                                    </label>

                                                    {setting.format(value)}
                                                </div>
                                                <input
                                                    type="range"
                                                    min={setting.min}
                                                    max={setting.max}
                                                    step={setting.step}
                                                    value={value}
                                                    onChange={(e) =>
                                                        updatePlanetProperty(
                                                            selectedPlanet,
                                                            setting.property,
                                                            parseFloat(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                    className="w-full bg-gray-700"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Canvas camera={{ position: [0, 20, 25], fov: 60 }}>
                <color attach="background" args={["#000010"]} />
                <fog attach="fog" args={["#000010", 30, 100]} />

                {/* Basic lighting setup */}
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={0.5} />

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
                                onPlanetClick={handlePlanetClick}
                            />
                        </Suspense>
                    ))}
                </Suspense>
                <CameraController
                    selectedPlanet={selectedPlanet}
                    planets={planets}
                />
            </Canvas>
        </div>
    );
};
