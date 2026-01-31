import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

let scene, camera, renderer, stars;

export function initThreeBackground() {
    // 1. Configuração da Cena e Câmera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // 2. Renderer com suporte a transparência (Alpha)
    const canvasElement = document.getElementById('three-canvas');
    if (!canvasElement) {
        console.warn("Canvas 'three-canvas' não encontrado.");
        return;
    }

    renderer = new THREE.WebGLRenderer({ 
        canvas: canvasElement, 
        alpha: true, 
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // 3. Sistema de Estrelas (Fundo Animado)
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const posArray = new Float32Array(starCount * 3);

    for(let i = 0; i < starCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 800;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMaterial = new THREE.PointsMaterial({ 
        size: 0.8, 
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    camera.position.z = 5;

    // 4. Loop de Animação
    function animate() {
        requestAnimationFrame(animate);
        if (stars) {
            stars.rotation.y += 0.0003;
            stars.rotation.x += 0.0001;
        }
        renderer.render(scene, camera);
    }
    animate();

    // Ajuste de redimensionamento da tela
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Função para adicionar itens ao Jardim Sensorial 3D
export function add3DPlant(emoji) {
    if (!scene) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;
    ctx.font = '50px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);

    // Posicionamento orbital
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 2;
    sprite.position.set(
        Math.cos(angle) * radius, 
        Math.sin(angle) * radius, 
        (Math.random() - 0.5) * 3
    );
    
    sprite.scale.set(0.8, 0.8, 0.8);
    scene.add(sprite);
}

