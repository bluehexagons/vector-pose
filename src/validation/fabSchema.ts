import {z} from 'zod';
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
    mag: z.number().finite(),
    id: z.string().optional(),
    uri: z.string().optional(),
    props: ImagePropsSchema.optional(),
    sort: z.number().finite().optional(),
    hidden: z.boolean().optional(),
    children: z.array(SkeleDataSchema).optional(),
  })
);

const FabDataSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  skele: SkeleDataSchema,
});

export function validate(data: unknown) {
  return FabDataSchema.safeParse(data);
}
