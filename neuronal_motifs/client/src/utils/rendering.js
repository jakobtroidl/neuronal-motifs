import * as THREE from 'three';

export function getRandomColor()
{
    let color = new THREE.Color( 0xffffff );
    color.setHex( Math.random() * 0xffffff );
    return color
}