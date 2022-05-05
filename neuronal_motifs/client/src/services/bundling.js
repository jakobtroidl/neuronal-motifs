import * as THREE from 'three';
import {Vector3} from "three";
import {Color} from "../utils/rendering";

export function bundle(start, end, strength){
    /**
     * @param start: array of Vector3 holding all start points of the lines [start_1, start_2, ..., start_n]
     * @param end: array of Vector3 holding all end points of the lines [end_1, end_2, ..., end_n]
     * @param strength: bundling strength, must be in [0.0, 1.0]
     * @return list of splines that in conjunction represent a bundles version of the lines
     */
    // compute mean edge
    let mean_start = avg(start);
    let mean_end = avg(end);
    let direction = mean_end.sub(mean_start);

    console.log(direction);

    let mean_samples = [];
    for (let x = strength; x < 1 - strength; x = x + 0.05) {
        //console.log(x);
        //console.log(x);
        //console.log('------------------');
        let point = line(mean_start, direction, x);
        mean_samples.push(point);
    }

    let splines = [];
    start.forEach((start_point, i) => {

        let samples = [...mean_samples];
        samples.unshift(start_point);
        samples.push(end[i]);

        const curve = new THREE.CatmullRomCurve3(samples, false, 'chordal');

        //curve.name = "line";
        //curve.visible = true;

        const points = curve.getPoints( 1000 );
        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        const material = new THREE.LineBasicMaterial({color: Color.orange, linewidth: 20});

        // Create the final object to add to the scene
        let spline = new THREE.Line( geometry, material );
        splines.push(spline);
    });
    return splines;

    // sample points on mean edge

    // draw splines with point samples on mean edge and start and end point

    // return list of splines

}

function scale(x){
    return - Math.pow(2*x - 1, 2) + 1;
}

function line(start, direction, x){
    let dir = new THREE.Vector3();
    dir.copy(direction);

    let s = new THREE.Vector3();
    s.copy(start);

    //console.log('----------------');
    return s.add(dir.multiplyScalar(x));
}


function avg(points){
    /**
     * @param points: array of Vector3 points
     * @return average point
     */
    let avg = new THREE.Vector3(0.0, 0.0, 0.0);
    points.forEach(point => {
        avg = avg.add(point);
    })
    avg = avg.divideScalar(points.length);
    return avg;
}