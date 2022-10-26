import * as THREE from "three";

export function bundle(start_points, end_points, strength, color) {
  /**
   * @param start_points: array of Vector3 holding all start points of the lines [start_1, start_2, ..., start_n]
   * @param end_points: array of Vector3 holding all end points of the lines [end_1, end_2, ..., end_n]
   * @param strength: bundling strength, must be in [0.0, 1.0]
   * @param color: line color
   * @return list of splines that in conjunction represent a bundles version of the lines
   */
  // compute mean edge
  // let start = group["start"];
  // let end = group["end"];

  let mean_start = avg(start_points);
  let mean_end = avg(end_points);
  let direction = mean_end.sub(mean_start);

  let mean_samples = [];
  for (let x = strength; x < 1 - strength; x = x + 0.05) {
    let point = line(mean_start, direction, x);
    mean_samples.push(point);
  }

  let splines = [];
  start_points.forEach((start_point, i) => {
    let samples = [...mean_samples];
    samples.unshift(start_point);
    samples.push(end_points[i]);

    const curve = new THREE.CatmullRomCurve3(samples, false, "chordal");

    const points = curve.getPoints(1000);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 20.0,
    });

    // Create the final object to add to the scene
    let spline = new THREE.Line(geometry, material);
    spline.visible = true;
    spline.name = getClusterLineName(start_point, end_points[i]);
    splines.push(spline);
  });

  return splines;
}

export function getClusterLineName(start, end) {
  return (
    "cluster-line-" +
    start.x +
    "-" +
    start.y +
    "-" +
    start.z +
    "-" +
    end.x +
    "-" +
    end.y +
    "-" +
    end.z
  );
}

function scale(x) {
  return -Math.pow(2 * x - 1, 2) + 1;
}

function line(start, direction, x) {
  let dir = new THREE.Vector3();
  dir.copy(direction);

  let s = new THREE.Vector3();
  s.copy(start);

  //console.log('----------------');
  return s.add(dir.multiplyScalar(x));
}

function avg(points) {
  /**
   * @param points: array of Vector3 points
   * @return average point
   */
  let avg = new THREE.Vector3(0.0, 0.0, 0.0);
  points.forEach((point) => {
    avg = avg.add(point);
  });
  avg = avg.divideScalar(points.length);
  return avg;
}
