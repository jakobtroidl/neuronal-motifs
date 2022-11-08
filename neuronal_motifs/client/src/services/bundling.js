import * as THREE from "three";
import { Color } from "paper";

function getPointsByIndices(points, indices) {
  if (indices.constructor === Array) {
    let toVector3 = points.map((p, i) => {
      return new THREE.Vector3().fromArray(p);
    });

    return toVector3.filter((p, i) => {
      return indices.includes(i);
    });
  } else {
    let p = points[indices];
    return new THREE.Vector3().fromArray(p);
  }
}

function addSphere(x, y, z, color) {
  let geometry = new THREE.SphereGeometry(100, 16, 16);
  let material = new THREE.MeshPhongMaterial({ color: color });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.name = "debug-sphere";
  mesh.position.x = x;
  mesh.position.y = y;
  mesh.position.z = z;

  return mesh;
}

export function hierarchicalBundling(
  start_points,
  end_points,
  clusters_per_synapse,
  synapses_per_cluster,
  pre_id,
  post_id
) {
  let num_clusters = synapses_per_cluster.length;
  let control_points = [];
  synapses_per_cluster.forEach((hierarchy, i) => {
    let mean_lines = {};
    for (const [j, syn_indices] of Object.entries(hierarchy)) {
      let start = getPointsByIndices(start_points, syn_indices);
      let end = getPointsByIndices(end_points, syn_indices);

      let mean_start = avg(start);
      let mean_end = avg(end);
      let direction = mean_end.sub(mean_start);
      let start_control = line(
        mean_start,
        direction,
        (Math.max(num_clusters - Math.pow(i, 1), 0.0) / num_clusters) * 0.2
      );
      let end_control = line(
        mean_start,
        direction,
        1.0 -
          (Math.max(num_clusters - Math.pow(i, 1), 0.0) / num_clusters) * 0.2
      );
      mean_lines[j] = {
        start: start_control,
        end: end_control,
      };
    }
    control_points.push(mean_lines);
  });

  let lines = [];

  for (const [i, clusters] of Object.entries(clusters_per_synapse)) {
    let control_samples = [];
    let cutoff = 2.0;

    for (let hierarchy = cutoff; hierarchy < clusters.length; hierarchy++) {
      let cluster = clusters[hierarchy];
      let points = control_points[hierarchy][cluster];

      control_samples.unshift(points.start);
      control_samples.push(points.end);
    }

    control_samples.unshift(getPointsByIndices(start_points, i)); // add location of presynaptic site
    control_samples.push(getPointsByIndices(end_points, i));

    const curve = new THREE.CatmullRomCurve3(
      control_samples,
      false,
      "catmullrom",
      0.0
    );

    const points = curve.getPoints(1000);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: 0x222222,
      linewidth: 1,
    });

    // Create the final object to add to the scene
    let spline = new THREE.Line(geometry, material);
    spline.visible = false;
    spline.name = "spline";
    spline.pre = pre_id;
    spline.post = post_id;
    spline.clusters = clusters;
    lines.push(spline);
  }

  return lines;
}

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

export function clusterSynapses(positions, delta) {
  let clusters = [];
  let cluster_positions = [];

  positions.forEach((position, i) => {
    let cluster_found = false;
    cluster_positions.forEach((cp, j) => {
      if (cp.distanceTo(position) < delta) {
        clusters[j].push(i);
        cluster_found = true;
      }
    });
    if (!cluster_found) {
      clusters.push([i]);
      cluster_positions.push(position);
    }
  });

  return clusters;
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
