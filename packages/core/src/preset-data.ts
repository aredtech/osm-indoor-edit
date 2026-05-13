import { PRESET_ICON_SVGS } from "./preset-icons";
import type { PresetDefinition } from "./presets";

const nameField = { id: "name", key: "name", type: "text", label: "Name", group: "Common" } as const;
const operatorField = { id: "operator", key: "operator", type: "text", label: "Operator", group: "Common" } as const;
const wheelchairField = {
  id: "wheelchair",
  key: "wheelchair",
  type: "combo",
  label: "Wheelchair",
  group: "Access",
  options: [
    { value: "yes", label: "Yes" },
    { value: "limited", label: "Limited" },
    { value: "no", label: "No" }
  ]
} as const;

export const BUILT_IN_PRESETS: PresetDefinition[] = [
  {
    id: "indoor-room",
    name: "Room",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["polygon"],
    tags: { indoor: "room" },
    icon: "room",
    iconSvg: PRESET_ICON_SVGS.room,
    terms: ["room", "space"],
    fields: [
      nameField,
      { id: "ref", key: "ref", type: "text", label: "Reference", group: "Common" },
      { id: "room", key: "room", type: "combo", label: "Room type", group: "Indoor" },
      { id: "access", key: "access", type: "combo", label: "Access", group: "Access" }
    ]
  },
  {
    id: "indoor-area",
    name: "Area",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["polygon"],
    tags: { indoor: "area" },
    icon: "room",
    iconSvg: PRESET_ICON_SVGS.room,
    terms: ["area"],
    fields: [nameField]
  },
  {
    id: "indoor-wall",
    name: "Wall",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["line", "polygon"],
    tags: { indoor: "wall" },
    icon: "corridor",
    iconSvg: PRESET_ICON_SVGS.corridor,
    terms: ["wall"],
    fields: [
      { id: "area", key: "area", type: "check", label: "Area", group: "Geometry" },
      { id: "material", key: "material", type: "combo", label: "Material", group: "Details" }
    ]
  },
  {
    id: "indoor-door",
    name: "Door",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["point"],
    tags: { door: "yes" },
    match: { door: "key" },
    icon: "door",
    iconSvg: PRESET_ICON_SVGS.door,
    terms: ["entrance", "door"],
    fields: [
      { id: "door", key: "door", type: "combo", label: "Door type", group: "Door" },
      { id: "entrance", key: "entrance", type: "combo", label: "Entrance", group: "Door" },
      { id: "width", key: "width", type: "number", label: "Width", group: "Door" },
      { id: "automatic_door", key: "automatic_door", type: "check", label: "Automatic door", group: "Door" },
      wheelchairField
    ]
  },
  {
    id: "indoor-corridor",
    name: "Corridor",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["polygon"],
    tags: { indoor: "corridor" },
    icon: "corridor",
    iconSvg: PRESET_ICON_SVGS.corridor,
    terms: ["hallway", "passage"],
    fields: [nameField, { id: "width", key: "width", type: "number", label: "Width", group: "Details" }]
  },
  {
    id: "indoor-staircase",
    name: "Staircase",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["polygon"],
    tags: { indoor: "room", room: "stairs" },
    icon: "stairs",
    iconSvg: PRESET_ICON_SVGS.stairs,
    terms: ["staircase"],
    fields: [nameField]
  },
  {
    id: "indoor-stairs",
    name: "Stairs",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["line"],
    tags: { highway: "steps" },
    icon: "stairs",
    iconSvg: PRESET_ICON_SVGS.stairs,
    terms: ["steps", "stairs"],
    fields: [
      nameField,
      { id: "incline", key: "incline", type: "combo", label: "Incline", group: "Details" },
      { id: "conveying", key: "conveying", type: "check", label: "Conveying", group: "Details" }
    ]
  },
  {
    id: "indoor-elevator",
    name: "Elevator",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["point", "polygon"],
    tags: { highway: "elevator" },
    match: { highway: "keyvalue", indoor: "none", room: "none" },
    icon: "elevator",
    iconSvg: PRESET_ICON_SVGS.elevator,
    terms: ["lift", "elevator"],
    fields: [nameField, { id: "capacity", key: "capacity", type: "number", label: "Capacity", group: "Details" }]
  },
  {
    id: "indoor-footway",
    name: "Footway",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["line"],
    tags: { highway: "footway" },
    icon: "corridor",
    iconSvg: PRESET_ICON_SVGS.corridor,
    terms: ["footway", "walkway"],
    fields: [nameField]
  },
  {
    id: "indoor-service-road",
    name: "Service road",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["line"],
    tags: { highway: "service" },
    icon: "corridor",
    iconSvg: PRESET_ICON_SVGS.corridor,
    terms: ["service", "road"],
    fields: [nameField]
  },
  {
    id: "indoor-level-connection",
    name: "Level connection",
    groupPath: ["Building structure"],
    role: "structural",
    geometry: ["point", "line", "polygon"],
    tags: { indoor: "level_connection" },
    icon: "elevator",
    iconSvg: PRESET_ICON_SVGS.elevator,
    terms: ["level", "connection"],
    fields: [nameField, { id: "level", key: "level", type: "text", label: "Levels", group: "Indoor" }]
  },
  {
    id: "furniture-table",
    name: "Table",
    groupPath: ["Furniture"],
    role: "structural",
    geometry: ["point", "polygon"],
    tags: { indoor: "table" },
    icon: "room",
    iconSvg: PRESET_ICON_SVGS.room,
    terms: ["table"],
    fields: [nameField]
  },
  {
    id: "furniture-chair",
    name: "Chair",
    groupPath: ["Furniture"],
    role: "structural",
    geometry: ["point"],
    tags: { indoor: "chair" },
    icon: "room",
    iconSvg: PRESET_ICON_SVGS.room,
    terms: ["chair", "seat"],
    fields: [nameField]
  },
  {
    id: "furniture-shelf",
    name: "Shelf",
    groupPath: ["Furniture"],
    role: "structural",
    geometry: ["line", "polygon"],
    tags: { indoor: "shelf" },
    icon: "room",
    iconSvg: PRESET_ICON_SVGS.room,
    terms: ["shelf", "rack"],
    fields: [nameField]
  },
  {
    id: "shop-motorcycle",
    name: "Motorcycle dealer",
    groupPath: ["Shops", "Vehicles"],
    role: "functional",
    geometry: ["point", "polygon"],
    tags: { shop: "motorcycle" },
    icon: "shop",
    iconSvg: PRESET_ICON_SVGS.shop,
    terms: ["motorcycle", "bike", "dealer", "showroom"],
    fields: [
      nameField,
      operatorField,
      { id: "brand", key: "brand", type: "multiselect", label: "Motorcycle brand", group: "Details" },
      {
        id: "second_hand",
        key: "second_hand",
        type: "combo",
        label: "Second hand",
        group: "Details",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "only", label: "Only" }
        ]
      },
      {
        id: "service-motorcycle-sales",
        key: "service:motorcycle:sales",
        type: "check",
        label: "Sales",
        group: "Services"
      },
      {
        id: "service-motorcycle-rental",
        key: "service:motorcycle:rental",
        type: "check",
        label: "Rental",
        group: "Services"
      },
      { id: "opening_hours", key: "opening_hours", type: "text", label: "Opening hours", group: "Details" },
      wheelchairField
    ]
  },
  {
    id: "shop-convenience",
    name: "Convenience store",
    groupPath: ["Shops", "Food"],
    role: "functional",
    geometry: ["point", "polygon"],
    tags: { shop: "convenience" },
    icon: "shop",
    iconSvg: PRESET_ICON_SVGS.shop,
    terms: ["store", "shop"],
    fields: [nameField, operatorField, { id: "opening_hours", key: "opening_hours", type: "text", label: "Opening hours" }]
  },
  {
    id: "amenity-cafe",
    name: "Cafe",
    groupPath: ["Facilities", "Food and drink"],
    role: "functional",
    geometry: ["point", "polygon"],
    tags: { amenity: "cafe" },
    icon: "amenity",
    iconSvg: PRESET_ICON_SVGS.amenity,
    terms: ["coffee", "cafe"],
    fields: [nameField, operatorField, wheelchairField]
  },
  {
    id: "amenity-toilets",
    name: "Toilets",
    groupPath: ["Facilities"],
    role: "functional",
    geometry: ["point", "polygon"],
    tags: { amenity: "toilets" },
    icon: "amenity",
    iconSvg: PRESET_ICON_SVGS.amenity,
    terms: ["restroom", "wc", "toilet"],
    fields: [wheelchairField, { id: "fee", key: "fee", type: "check", label: "Fee", group: "Details" }]
  },
  {
    id: "office-company",
    name: "Company office",
    groupPath: ["Offices"],
    role: "functional",
    geometry: ["point", "polygon"],
    tags: { office: "company" },
    icon: "office",
    iconSvg: PRESET_ICON_SVGS.office,
    terms: ["business", "company"],
    fields: [nameField, operatorField]
  },
  {
    id: "office-lawyer",
    name: "Lawyer office",
    groupPath: ["Offices"],
    role: "functional",
    geometry: ["point", "polygon"],
    tags: { office: "lawyer" },
    icon: "office",
    iconSvg: PRESET_ICON_SVGS.office,
    terms: ["law", "legal"],
    fields: [nameField, operatorField]
  },
  {
    id: "barrier-fence",
    name: "Fence",
    groupPath: ["Barriers"],
    role: "structural",
    geometry: ["line", "polygon"],
    tags: { barrier: "fence" },
    match: { barrier: "keyvalue" },
    icon: "barrier",
    iconSvg: PRESET_ICON_SVGS.barrier,
    terms: ["barrier", "fence"],
    fields: [
      { id: "fence_type", key: "fence_type", type: "combo", label: "Fence type", group: "Details" },
      { id: "height", key: "height", type: "number", label: "Height", group: "Details" }
    ]
  },
  {
    id: "barrier-gate",
    name: "Gate",
    groupPath: ["Barriers"],
    role: "structural",
    geometry: ["point", "line"],
    tags: { barrier: "gate" },
    icon: "barrier",
    iconSvg: PRESET_ICON_SVGS.barrier,
    terms: ["barrier", "gate", "entrance"],
    fields: [nameField, { id: "access", key: "access", type: "combo", label: "Access", group: "Access" }]
  },
  {
    id: "transport-platform",
    name: "Platform",
    groupPath: ["Transport", "Rail"],
    role: "functional",
    geometry: ["point", "line", "polygon"],
    tags: { public_transport: "platform" },
    icon: "transport",
    iconSvg: PRESET_ICON_SVGS.transport,
    terms: ["rail", "train", "platform", "transit"],
    fields: [
      nameField,
      { id: "ref", key: "ref", type: "text", label: "Reference", group: "Common" },
      { id: "railway", key: "railway", type: "combo", label: "Railway", group: "Transport" }
    ]
  },
  {
    id: "transport-bus-stop",
    name: "Bus stop",
    groupPath: ["Transport", "Road"],
    role: "functional",
    geometry: ["point"],
    tags: { highway: "bus_stop" },
    icon: "transport",
    iconSvg: PRESET_ICON_SVGS.transport,
    terms: ["bus", "stop", "transport"],
    fields: [nameField, { id: "ref", key: "ref", type: "text", label: "Reference", group: "Common" }]
  },
  {
    id: "facility-bench",
    name: "Bench",
    groupPath: ["Facilities"],
    role: "functional",
    geometry: ["point", "line"],
    tags: { amenity: "bench" },
    icon: "amenity",
    iconSvg: PRESET_ICON_SVGS.amenity,
    terms: ["bench", "seat", "facility"],
    fields: [nameField, { id: "backrest", key: "backrest", type: "check", label: "Backrest", group: "Details" }]
  },
  {
    id: "facility-drinking-water",
    name: "Drinking water",
    groupPath: ["Facilities"],
    role: "functional",
    geometry: ["point"],
    tags: { amenity: "drinking_water" },
    icon: "amenity",
    iconSvg: PRESET_ICON_SVGS.amenity,
    terms: ["water", "fountain", "facility"],
    fields: [nameField, wheelchairField]
  },
  {
    id: "sport-pitch",
    name: "Sports pitch",
    groupPath: ["Sports"],
    role: "functional",
    geometry: ["point", "polygon"],
    tags: { leisure: "pitch" },
    icon: "sports",
    iconSvg: PRESET_ICON_SVGS.sports,
    terms: ["sport", "pitch", "court"],
    fields: [
      nameField,
      { id: "sport", key: "sport", type: "combo", label: "Sport", group: "Sports" },
      { id: "surface", key: "surface", type: "combo", label: "Surface", group: "Details" }
    ]
  },
  {
    id: "sport-fitness-station",
    name: "Fitness station",
    groupPath: ["Sports"],
    role: "functional",
    geometry: ["point", "polygon"],
    tags: { leisure: "fitness_station" },
    icon: "sports",
    iconSvg: PRESET_ICON_SVGS.sports,
    terms: ["fitness", "gym", "exercise"],
    fields: [nameField, { id: "fee", key: "fee", type: "check", label: "Fee", group: "Details" }]
  },
  {
    id: "man-made-pier",
    name: "Pier",
    groupPath: ["Man Made", "Water"],
    role: "structural",
    geometry: ["line", "polygon"],
    tags: { man_made: "pier" },
    icon: "water",
    iconSvg: PRESET_ICON_SVGS.water,
    terms: ["pier", "dock", "man made"],
    fields: [nameField, { id: "material", key: "material", type: "combo", label: "Material", group: "Details" }]
  },
  {
    id: "man-made-bridge",
    name: "Bridge",
    groupPath: ["Man Made", "Crossing"],
    role: "structural",
    geometry: ["line", "polygon"],
    tags: { man_made: "bridge" },
    icon: "water",
    iconSvg: PRESET_ICON_SVGS.water,
    terms: ["bridge", "man made"],
    fields: [nameField, { id: "layer", key: "layer", type: "number", label: "Layer", group: "Details" }]
  },
  {
    id: "craft-electrician",
    name: "Electrician",
    groupPath: ["Craft"],
    role: "functional",
    geometry: ["point", "polygon"],
    tags: { craft: "electrician" },
    icon: "craft",
    iconSvg: PRESET_ICON_SVGS.craft,
    terms: ["craft", "electrician", "repair"],
    fields: [nameField, operatorField, { id: "phone", key: "phone", type: "text", label: "Phone", group: "Contact" }]
  },
  {
    id: "craft-plumber",
    name: "Plumber",
    groupPath: ["Craft"],
    role: "functional",
    geometry: ["point", "polygon"],
    tags: { craft: "plumber" },
    icon: "craft",
    iconSvg: PRESET_ICON_SVGS.craft,
    terms: ["craft", "plumber", "repair"],
    fields: [nameField, operatorField, { id: "phone", key: "phone", type: "text", label: "Phone", group: "Contact" }]
  }
];
