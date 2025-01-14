import type {vec3} from 'gl-matrix';

export interface ImageProps {
  /** File name (by default, uses the string) */
  file?: string;
  /** Start angle */
  angle?: number;
  /** Number of angles to render */
  angles?: number;
  /** Rotates hue (HSL) of all pixels */
  hueRot?: number;
  /** Normal map file */
  normal?: string;
  /** Roughness map file */
  roughness?: string;
  /** Multiplies saturation (HSL) of all pixels */
  saturate?: number;
  /** Increases lightness of all pixels (HSL) */
  lighten?: number;
  lightness?: number;
  size?: number;
  pointLights?: PointLight[];
  lighting?: string;
}

export type ImagePropsRef = ImageProps | null;

export type ImageKey = string;

export interface SceneLight {
  color: vec3;
  intensity: number;
  normal: vec3;
}

export interface PointLight {
  position: vec3;
  intensity: number;
  emissionCubeSize: number;
  color: vec3;
}
