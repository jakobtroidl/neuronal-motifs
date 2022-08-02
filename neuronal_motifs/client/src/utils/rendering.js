import * as THREE from "three";

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
