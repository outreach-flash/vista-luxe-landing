import { config, fields, collection } from '@keystatic/core';

const imgOpts = {
  directory: 'public/assets/img',
  publicPath: '/assets/img/',
} as const;

/** Reusable area object: sq m + sq ft, both optional */
const areaField = (label: string) =>
  fields.object(
    {
      sqM: fields.number({
        label: `${label} (sq m)`,
        validation: { isRequired: false },
      }),
      sqFt: fields.number({
        label: `${label} (sq ft)`,
        validation: { isRequired: false },
      }),
    },
    { label }
  );

export default config({
  storage: {
    kind: 'local',
  },
  ui: {
    brand: { name: 'Vista Luxe CMS' },
  },
  collections: {
    properties: collection({
      label: 'Properties',
      slugField: 'title',
      path: 'src/content/properties/*',
      format: 'yaml',
      entryLayout: 'content',
      schema: {
        // ─── Core identity ────────────────────────────────────────────────
        title: fields.slug({
          name: { label: 'Property Name', validation: { isRequired: true } },
        }),
        status: fields.select({
          label: 'Property Status',
          options: [
            { label: 'For Rent', value: 'For Rent' },
            { label: 'For Buy', value: 'For Buy' },
          ],
          defaultValue: 'For Rent',
        }),
        featured: fields.checkbox({
          label: 'Featured (Top Properties on home page)',
          defaultValue: false,
        }),
        configuration: fields.text({
          label: 'Configuration',
          description: 'e.g. "4 BHK + Study Room". Leave blank to hide.',
        }),

        // ─── Location ─────────────────────────────────────────────────────
        street: fields.text({ label: 'Street Address' }),
        area: fields.text({ label: 'Area / Neighbourhood' }),
        city: fields.text({ label: 'City' }),

        // ─── Pricing (₹) ─────────────────────────────────────────────────
        price: fields.integer({
          label: 'Base Price (₹)',
          validation: { isRequired: true },
        }),
        semiFurnishedPrice: fields.integer({
          label: 'Semi-Furnished Price (₹)',
          description: 'Leave blank to hide.',
          validation: { isRequired: false },
        }),
        fullyFurnishedPrice: fields.integer({
          label: 'Fully Furnished Price (₹)',
          description: 'Leave blank to hide.',
          validation: { isRequired: false },
        }),

        // ─── Basic specs ─────────────────────────────────────────────────
        propertyType: fields.select({
          label: 'Property Type',
          options: [
            { label: 'Apartment', value: 'Apartment' },
            { label: 'House', value: 'House' },
            { label: 'Condo', value: 'Condo' },
            { label: 'Villa', value: 'Villa' },
            { label: 'Townhouse', value: 'Townhouse' },
          ],
          defaultValue: 'House',
        }),
        bedrooms: fields.text({
          label: 'Bedrooms',
          description: 'Shown as-is on the card, e.g. "3" or "4+". Leave blank to hide.',
          defaultValue: '3',
        }),
        bathrooms: fields.text({
          label: 'Bathrooms',
          description: 'Leave blank to hide.',
          defaultValue: '2',
        }),
        parking: fields.text({
          label: 'Parking',
          description: 'e.g. "2 covered + 1 open". Leave blank to hide.',
        }),
        numberOfBalconies: fields.integer({
          label: 'Number of Balconies',
          description: 'Leave blank to hide.',
          validation: { isRequired: false },
        }),
        yearBuilt: fields.integer({
          label: 'Year Built',
          description: 'Leave blank to hide.',
        }),

        // ─── Floors ───────────────────────────────────────────────────────
        numberOfFloors: fields.integer({
          label: 'Number of Floors',
          description: 'Total count of floors. Leave blank to hide.',
          validation: { isRequired: false },
        }),
        floors: fields.array(
          fields.object({
            label: fields.text({
              label: 'Floor Label',
              description: 'e.g. "Ground Floor", "First Floor"',
              validation: { isRequired: true },
            }),
            description: fields.text({
              label: 'Floor Description (optional)',
              multiline: true,
            }),
          }),
          {
            label: 'Floor Details',
            description: 'Optional descriptions for each floor.',
            itemLabel: (props) => props.fields.label.value || 'Floor',
          }
        ),

        // ─── Area fields (sq m + sq ft each) ─────────────────────────────
        plotArea: areaField('Plot Area'),
        netEffectiveArea: areaField('Net Effective Area'),
        groundFloorArea: areaField('Ground Floor Area'),
        firstFloorArea: areaField('First Floor Area'),
        totalFloorArea: areaField('Total Floor Area'),
        plotRoadCommonArea: areaField('Plot + Road & Common Area'),
        builtUpArea: areaField('Built-up Area'),
        entranceDeckVerandahBalconies: areaField('Entrance + Deck + Verandah + Balconies'),
        doubleHeightArea: areaField('Double Height Area'),
        halfAreaOfTerrace: areaField('Half Area of Terrace'),
        swimmingPool: areaField('Swimming Pool'),
        lawnArea33Percent: areaField('33% Lawn Area'),
        totalSuperArea: areaField('Total Super Area'),
        carpetArea: areaField('Carpet Area'),
        terraceArea: areaField('Terrace Area'),
        poolDeckArea: areaField('Pool Deck Area'),

        // ─── Private Pool + Garden ────────────────────────────────────────
        privatePoolAndGarden: fields.checkbox({
          label: 'Private Pool + Garden',
          defaultValue: false,
        }),
        privatePoolAndGardenArea: areaField('Private Pool & Garden Area'),

        // ─── Super built-up area ──────────────────────────────────────────
        totalSuperBuiltUpArea: areaField('Total Super Built-up Area'),

        // ─── Proximity locations ──────────────────────────────────────────
        proximityLocations: fields.array(
          fields.object({
            location: fields.text({
              label: 'Location Name',
              description: 'e.g. "Airport", "City Centre"',
              validation: { isRequired: true },
            }),
            distance: fields.text({
              label: 'Distance',
              description: 'e.g. "2.5 km / 10 min drive"',
              validation: { isRequired: true },
            }),
          }),
          {
            label: 'Proximity Locations',
            description: 'Nearby landmarks with distances.',
            itemLabel: (props) =>
              props.fields.location.value
                ? `${props.fields.location.value} — ${props.fields.distance.value}`
                : 'Location',
          }
        ),

        // ─── Media ────────────────────────────────────────────────────────
        squareArea: fields.integer({
          label: 'Square Area (sq ft) — Legacy / Card display',
          description: 'Used on listing cards. Leave blank to hide.',
        }),
        cardImage: fields.image({
          label: 'Card Image (listing grid)',
          ...imgOpts,
        }),
        gallery: fields.array(
          fields.image({ label: 'Gallery Image', ...imgOpts }),
          {
            label: 'Gallery (detail page)',
            itemLabel: (props) => props.value ?? 'Image',
          }
        ),
        floorPlan: fields.image({ label: 'Floor Plan Image', ...imgOpts }),

        // ─── Amenities & description ───────────────────────────────────────
        amenities: fields.array(fields.text({ label: 'Amenity' }), {
          label: 'Amenities & Features',
          itemLabel: (props) => props.value ?? 'Amenity',
        }),
        description: fields.text({
          label: 'Description',
          multiline: true,
        }),
      },
    }),
  },
});
