import {z} from 'zod';
import type {VectorDrawing, VectorPathCommand} from '../shared/types';
import type {ImagePropsRef} from '../utils/Renderer';

const ImagePropsSchema: z.ZodType<ImagePropsRef> = z
  .unknown()
  .refine(
    (value): value is ImagePropsRef =>
      value === null || (typeof value === 'object' && !Array.isArray(value)),
    {message: 'Expected an image properties object or null'}
  );

interface SkeleDataType {
  angle: number;
  mag: number;
  id?: string;
  uri?: string;
  props?: ImagePropsRef;
  sort?: number;
  hidden?: boolean;
  children?: SkeleDataType[];
}

const SkeleDataSchema: z.ZodType<SkeleDataType> = z.lazy(() =>
  z.object({
    angle: z.number().finite(),
    mag: z.number().finite().nonnegative(),
    id: z.string().optional(),
    uri: z.string().optional(),
    props: ImagePropsSchema.optional(),
    sort: z.number().finite().optional(),
    hidden: z.boolean().optional(),
    children: z.array(SkeleDataSchema).optional(),
  })
);

const PointIdSchema = z.string().min(1);

const VectorPathCommandSchema: z.ZodType<VectorPathCommand> =
  z.discriminatedUnion('type', [
    z.object({type: z.literal('move'), point: PointIdSchema}),
    z.object({type: z.literal('line'), point: PointIdSchema}),
    z.object({
      type: z.literal('quadratic'),
      control: PointIdSchema,
      point: PointIdSchema,
    }),
    z.object({
      type: z.literal('cubic'),
      control1: PointIdSchema,
      control2: PointIdSchema,
      point: PointIdSchema,
    }),
    z.object({type: z.literal('close')}),
  ]);

const UnitIntervalSchema = z.number().finite().min(0).max(1);

const VectorDrawingSchema: z.ZodType<VectorDrawing> = z.object({
  id: z.string().optional(),
  commands: z.array(VectorPathCommandSchema).min(1),
  fill: z.string().min(1).optional(),
  fillRule: z.enum(['nonzero', 'evenodd']).optional(),
  fillOpacity: UnitIntervalSchema.optional(),
  stroke: z.string().min(1).optional(),
  strokeWidth: z.number().finite().nonnegative().optional(),
  strokeOpacity: UnitIntervalSchema.optional(),
  strokeLinecap: z.enum(['butt', 'round', 'square']).optional(),
  strokeLinejoin: z.enum(['miter', 'round', 'bevel']).optional(),
  strokeMiterlimit: z.number().finite().positive().optional(),
  strokeDasharray: z.array(z.number().finite().nonnegative()).optional(),
  strokeDashoffset: z.number().finite().optional(),
  opacity: UnitIntervalSchema.optional(),
  sort: z.number().finite().optional(),
  hidden: z.boolean().optional(),
});

const FabDataSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  drawings: z.array(VectorDrawingSchema).optional(),
  skele: SkeleDataSchema,
});

export function validate(data: unknown) {
  return FabDataSchema.safeParse(data);
}
