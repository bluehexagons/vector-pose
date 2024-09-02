// Partial copy from game codebase, MIT license

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
