// Three.js 3D Star Background Script for WanderLust
// Production-ready, optimized for performance, and isolated from UI logic.

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded. Skipping 3D background initialization.');
        return;
    }

    // 2. Setup Container
    // We create a fixed canvas that sits behind everything
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    // Styling to ensure it stays in the background and covers the screen
    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '0', // Sit on top of body bg, but below content (which is z-index 10)
        pointerEvents: 'none', // Allow clicks to pass through to UI
        background: 'transparent' // Let CSS gradient show through if needed, or set base color here
    });
    document.body.appendChild(canvas);

    // 3. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    // Use a fog to soften the distance (optional, matches "space" feel)
    // scene.fog = new THREE.FogExp2(0x000000, 0.0005); 

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Allow transparency so CSS body background works if needed
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize for high DPI but limit to 2x

    // 4. Create Stars (Points)
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3500; // Balanced count for aesthetics and performance
    const posArray = new Float32Array(starCount * 3); // x, y, z for each star

    // Spread stars in a sphere/cloud around the camera
    for (let i = 0; i < starCount * 3; i++) {
        // Random position between -15 and 15
        posArray[i] = (Math.random() - 0.5) * 35;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Star Material
    const starMaterial = new THREE.PointsMaterial({
        size: 0.06, // Slightly larger for visibility
        color: 0x1F2937, // Dark Navy/Grey to contrast with light background
        transparent: true,
        opacity: 0.6, // Subtle
        sizeAttenuation: true
    });

    // Create the mesh
    const starsMesh = new THREE.Points(starGeometry, starMaterial);
    scene.add(starsMesh);

    // 5. Animation Loop
    let frameId;

    // Slow rotation parameters
    const rotationSpeedX = 0.0003;
    const rotationSpeedY = 0.0005;

    const animate = () => {
        starsMesh.rotation.x += rotationSpeedX;
        starsMesh.rotation.y += rotationSpeedY;

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // 6. Handle Window Resize
    window.addEventListener('resize', () => {
        // Update camera
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        // Update renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Clean up if the script is ever re-run or component unmounted (good practice)
    // In a standard multi-page app, this runs once per page load, which is fine.
});
