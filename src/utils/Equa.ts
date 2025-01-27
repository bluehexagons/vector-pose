// Partial copy from game codebase, MIT license

import {vec2} from 'gl-matrix';

export const TAU = Math.PI * 2;

export const toDegrees = (radians: number) => radians * (180 / Math.PI);
export const toRadians = (degrees: number) => degrees * (Math.PI / 180);

export const angleDifferenceRad = (p_from: number, p_to: number) => {
  const difference = (p_to - p_from) % TAU;
  return ((2.0 * difference) % TAU) - difference;
};

// MIT license, ported from Godot's C++ lerp_angle https://github.com/godotengine/godot/blob/fe01776f05b1787b28b4a270d53037a3c25f4ca2/core/math/math_funcs.h#L427
export const lerpAngleRad = (p_weight: number, p_from: number, p_to: number) =>
  p_from + angleDifferenceRad(p_from, p_to) * p_weight;

export function rotateVec2(out: vec2, v: vec2, angleRad: number): vec2 {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  const x = v[0];
  const y = v[1];
  out[0] = x * c - y * s;
  out[1] = x * s + y * c;
  return out;
}

export function rotateVec2Around(
  out: vec2,
  v: vec2,
  center: vec2,
  angleRad: number
): vec2 {
  const x = v[0] - center[0];
  const y = v[1] - center[1];
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  out[0] = x * c - y * s + center[0];
  out[1] = x * s + y * c + center[1];
  return out;
}
