import type {ImagePropsRef} from '../utils/Renderer';
import {SafeParseReturnType, z} from 'zod';
import type {FabData} from '../shared/types';

interface SkeleDataType {
  angle?: number;
  mag?: number;
  id?: string;
  uri?: string;
  props?: ImagePropsRef;
  sort?: number;
  hidden?: boolean;
  children?: SkeleDataType[];
}

const SkeleDataSchema: z.ZodType<SkeleDataType> = z.lazy(() =>
  z.object({
    angle: z.number(),
    mag: z.number(),
    id: z.string().optional(),
    uri: z.string().optional(),
    props: z.any().optional(),
    sort: z.number().optional(),
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
