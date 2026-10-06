import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Helper: optional area object with sq m and sq ft sub-fields */
const areaSchema = z
  .object({
    sqM: z.number().nullable().optional(),
    sqFt: z.number().nullable().optional(),
  })
  .optional();

const properties = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/properties' }),
  schema: z.object({
    // ─── Core identity ─────────────────────────────────────────────
    title: z.string(),
    status: z.enum(['For Rent', 'For Buy']),
    featured: z.boolean().default(false),
    configuration: z.string().nullable().optional(),

    // ─── Location ──────────────────────────────────────────────────
    street: z.string().optional().default(''),
    area: z.string().optional().default(''),
    city: z.string().optional().default(''),

    // ─── Pricing (₹) ───────────────────────────────────────────────
    price: z.number(),
    semiFurnishedPrice: z.number().nullable().optional(),
    fullyFurnishedPrice: z.number().nullable().optional(),

    // ─── Basic specs ───────────────────────────────────────────────
    propertyType: z.string().optional(),
    bedrooms: z.string().nullable().optional(),
    bathrooms: z.string().nullable().optional(),
    parking: z.string().nullable().optional(),
    numberOfBalconies: z.number().nullable().optional(),
    yearBuilt: z.number().nullable().optional(),

    // ─── Floors ────────────────────────────────────────────────────
    numberOfFloors: z.number().nullable().optional(),
    floors: z
      .array(
        z.object({
          label: z.string(),
          description: z.string().nullable().optional(),
        })
      )
      .optional(),

    // ─── Area fields (each with sqM + sqFt) ────────────────────────
    plotArea: areaSchema,
    netEffectiveArea: areaSchema,
    groundFloorArea: areaSchema,
    firstFloorArea: areaSchema,
    totalFloorArea: areaSchema,
    plotRoadCommonArea: areaSchema,
    builtUpArea: areaSchema,
    entranceDeckVerandahBalconies: areaSchema,
    doubleHeightArea: areaSchema,
    halfAreaOfTerrace: areaSchema,
    swimmingPool: areaSchema,
    lawnArea33Percent: areaSchema,
    totalSuperArea: areaSchema,
    carpetArea: areaSchema,
    terraceArea: areaSchema,
    poolDeckArea: areaSchema,

    // ─── Private Pool + Garden ─────────────────────────────────────
    privatePoolAndGarden: z.boolean().default(false),
    privatePoolAndGardenArea: areaSchema,

    // ─── Super built-up area ───────────────────────────────────────
    totalSuperBuiltUpArea: areaSchema,

    // ─── Proximity locations ───────────────────────────────────────
    proximityLocations: z
      .array(
        z.object({
          location: z.string(),
          distance: z.string(),
        })
      )
      .optional(),

    // ─── Media ─────────────────────────────────────────────────────
    squareArea: z.number().nullable().optional(),
    cardImage: z.string().nullable().optional(),
    gallery: z
      .array(z.string().nullable())
      .optional()
      .default([])
      .transform((arr) => arr.filter((v): v is string => v !== null)),
    galleryVideos: z
      .array(z.string().nullable())
      .optional()
      .default([])
      .transform((arr) => arr.filter((v): v is string => v !== null)),
    floorPlan: z.string().nullable().optional(),

    // ─── Amenities & description ───────────────────────────────────
    amenities: z.array(z.string()).optional().default([]),
    description: z.string().nullable().optional(),
  }),
});

export const collections = { properties };
