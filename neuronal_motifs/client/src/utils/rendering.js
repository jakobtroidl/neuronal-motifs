import * as THREE from "three";
import _ from "lodash";

export class Color {
  static orange = new THREE.Color("rgb(255,154,0)");

  static white = new THREE.Color("rgb(255,255,255)");
  static red = new THREE.Color("rgb(227,55,55)");
  static grey = new THREE.Color("rgb(229,229,229)");
  static pink = new THREE.Color("rgb(200,0,255)");
  static blue = new THREE.Color("rgb(62,62,231)");
}

export function hexToRgbA(hex, alpha = 1) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split("");
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = "0x" + c.join("");
    return (
      "rgba(" +
      [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
      ", " +
      alpha +
      ")"
    );
  }
  throw new Error("Bad Hex");
}

/**
 * Computes uniformly distributed points on the unit sphere
 * @param count: number of points to sample
 * @return {[number,number,number][]}
 */
export function getTranslationVectors(count) {
  // Following Saff and Kuijlaars via https://discuss.dizzycoding.com/evenly-distributing-n-points-on-a-sphere/
  const indices = _.range(0.5, count + 0.5);
  const phi = indices.map((ind) => {
    return Math.acos(1 - (2 * ind) / count);
  });
  const theta = indices.map((ind) => {
    return Math.PI * (1 + Math.sqrt(5)) * ind;
  });
  let directions = _.range(count).map((i) => {
    const x = Math.cos(_.toNumber(theta[i])) * Math.sin(phi[i]);
    const y = Math.sin(_.toNumber(theta[i])) * Math.sin(phi[i]);
    const z = Math.cos(phi[i]);
    return [x, y, z];
  });
  return directions;
}
